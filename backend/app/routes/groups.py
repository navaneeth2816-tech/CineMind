import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db, GroupSession, GroupMember, GroupVote, Movie
from app.services.auth_service import optional_auth
from app.services.group_decision_service import (
    create_group_session,
    join_group_session,
    rank_group_movies
)

groups_bp = Blueprint('groups', __name__)

@groups_bp.route('', methods=['POST'])
@optional_auth
def create_group(user):
    """
    Creates a new Group Movie Decision session (PRD Section 6.13)
    """
    data = request.get_json() or {}
    objective = data.get('objective', 'best_average') # 'best_average' or 'avoid_mismatch'
    constraints = data.get('constraints', {}) # max_runtime, languages, genres
    duration_hours = int(data.get('duration_hours', 2))
    user_id = user.id if user else None

    session = create_group_session(
        creator_user_id=user_id,
        objective=objective,
        constraints=constraints,
        duration_hours=duration_hours
    )

    # Automatically add creator as first member if participant_name given
    creator_name = data.get('creator_name', (user.name if user else 'Organizer'))
    creator_member, _ = join_group_session(
        code=session.code,
        participant_name=creator_name,
        user_id=user_id,
        preferences=data.get('preferences', {})
    )

    return jsonify({
        'message': 'Group session created successfully',
        'code': session.code,
        'session_id': session.id,
        'expires_at': session.expires_at.isoformat(),
        'objective': session.objective,
        'member_id': creator_member.id if creator_member else None
    }), 201

@groups_bp.route('/<code>', methods=['GET'])
def get_group(code):
    """Returns group session details, participants, and remaining time"""
    session = GroupSession.query.filter_by(code=code.upper()).first()
    if not session:
        return jsonify({'error': 'Group session not found.'}), 404

    is_expired = datetime.utcnow() > session.expires_at or session.status == 'closed'
    if is_expired and session.status == 'active':
        session.status = 'closed'
        db.session.commit()

    members = session.members.all()
    remaining_seconds = max(0, int((session.expires_at - datetime.utcnow()).total_seconds()))

    return jsonify({
        'code': session.code,
        'session_id': session.id,
        'objective': session.objective,
        'constraints': json.loads(session.constraints_json or "{}"),
        'status': session.status,
        'expires_at': session.expires_at.isoformat(),
        'remaining_seconds': remaining_seconds,
        'members_count': len(members),
        'members': [
            {
                'id': m.id,
                'name': m.participant_name,
                'joined_at': m.joined_at.isoformat()
            }
            for m in members
        ]
    }), 200

@groups_bp.route('/<code>/join', methods=['POST'])
@optional_auth
def join_group(code, user):
    """Joins an existing group session with constraints and preferences"""
    data = request.get_json() or {}
    participant_name = (data.get('name') or (user.name if user else "Friend")).strip()
    preferences = data.get('preferences', {})
    user_id = user.id if user else None

    member, error = join_group_session(
        code=code,
        participant_name=participant_name,
        user_id=user_id,
        preferences=preferences
    )

    if error:
        return jsonify({'error': error}), 400

    return jsonify({
        'message': f"Joined session {code.upper()} successfully!",
        'member_id': member.id,
        'name': member.participant_name
    }), 200

@groups_bp.route('/<code>/vote', methods=['POST'])
def vote_candidate(code):
    """Submits a member's vote (+1 like, -1 veto) for a movie"""
    session = GroupSession.query.filter_by(code=code.upper()).first()
    if not session:
        return jsonify({'error': 'Group session not found.'}), 404

    if session.status != 'active' or datetime.utcnow() > session.expires_at:
        return jsonify({'error': 'Voting has closed for this session.'}), 400

    data = request.get_json() or {}
    member_id = data.get('member_id')
    movie_id = data.get('movie_id')
    
    try:
        raw_vote = int(data.get('vote', 1))
        vote_val = 1 if raw_vote >= 1 else -1
    except (ValueError, TypeError):
        vote_val = 1

    if not member_id or not movie_id:
        return jsonify({'error': 'member_id and movie_id are required.'}), 400

    # Verify member belongs to this session
    member = GroupMember.query.filter_by(id=member_id, group_id=session.id).first()
    if not member:
        return jsonify({'error': 'Participant is not registered in this group session.'}), 404

    # Verify movie exists
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found in catalogue.'}), 404

    # Check for existing vote by this member on this movie
    vote = GroupVote.query.filter_by(
        group_id=session.id,
        member_id=member_id,
        movie_id=movie_id
    ).first()

    status_message = "Vote recorded."
    if vote:
        if vote.vote_score == vote_val:
            # Clicking the same vote again does not duplicate or increase counts
            status_message = "Vote already recorded."
        else:
            # Switching vote: decrease previous vote count and increase new vote count
            vote.vote_score = vote_val
            vote.submitted_at = datetime.utcnow()
            status_message = "Vote updated."
    else:
        vote = GroupVote(
            group_id=session.id,
            member_id=member_id,
            movie_id=movie_id,
            vote_score=vote_val
        )
        db.session.add(vote)
        status_message = "Vote recorded."

    db.session.commit()

    # Get updated live counts for this movie in the room
    all_votes = GroupVote.query.filter_by(group_id=session.id, movie_id=movie_id).all()
    upvotes = sum(1 for v in all_votes if v.vote_score == 1)
    vetoes = sum(1 for v in all_votes if v.vote_score == -1)

    return jsonify({
        'message': status_message,
        'movie_id': movie_id,
        'user_vote': vote_val,
        'upvotes_count': upvotes,
        'vetoes_count': vetoes,
        'votes_count': len(all_votes),
        'votes_score': upvotes - vetoes
    }), 200

@groups_bp.route('/<code>/recommendations', methods=['GET'])
def get_group_recommendations(code):
    """
    Returns consensus ranked candidates for the group with fairness calculation (PRD 6.13)
    """
    session = GroupSession.query.filter_by(code=code.upper()).first()
    if not session:
        return jsonify({'error': 'Group session not found.'}), 404

    member_id = request.args.get('member_id', type=int)
    ranked = rank_group_movies(session.id, limit=6, current_member_id=member_id)
    return jsonify({
        'code': session.code,
        'objective': session.objective,
        'candidates': ranked
    }), 200
