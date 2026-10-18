import json
import random
import string
from datetime import datetime, timedelta
from app.models import db, GroupSession, GroupMember, GroupVote, Movie, Genre, User
from app.services.recommender_service import calculate_compatibility_score, get_all_genres

def generate_room_code(length=6) -> str:
    """Generates an uppercase alphanumeric room code like 'CM8942'"""
    chars = string.ascii_uppercase + string.digits
    return "CM" + ''.join(random.choices(chars, k=length - 2))

def create_group_session(creator_user_id: int, objective: str = 'best_average', constraints: dict = None, duration_hours: int = 2):
    """Creates a new group movie decision room (PRD 6.13)"""
    code = generate_room_code()
    # Ensure uniqueness
    while GroupSession.query.filter_by(code=code).first():
        code = generate_room_code()

    session = GroupSession(
        code=code,
        creator_user_id=creator_user_id,
        objective=objective,
        constraints_json=json.dumps(constraints or {}),
        expires_at=datetime.utcnow() + timedelta(hours=duration_hours),
        status='active'
    )
    db.session.add(session)
    db.session.commit()
    return session

def join_group_session(code: str, participant_name: str, user_id: int = None, preferences: dict = None):
    """Adds a participant to the group session"""
    session = GroupSession.query.filter_by(code=code.upper()).first()
    if not session:
        return None, "Room not found"
        
    if session.status != 'active' or datetime.utcnow() > session.expires_at:
        session.status = 'closed'
        db.session.commit()
        return None, "Room session has expired or is closed"

    member = GroupMember(
        group_id=session.id,
        user_id=user_id,
        participant_name=participant_name,
        preferences_json=json.dumps(preferences or {})
    )
    db.session.add(member)
    db.session.commit()
    return member, None

def rank_group_movies(group_id: int, limit: int = 6):
    """
    Ranks movie candidates for the group using the configured objective (PRD Section 6.13):
    - 'best_average': maximizes average member satisfaction
    - 'avoid_mismatch': maximizes satisfaction while heavily penalizing low minimum match
    """
    session = GroupSession.query.get(group_id)
    if not session:
        return []

    constraints = json.loads(session.constraints_json or "{}")
    max_runtime = constraints.get('max_runtime')
    allowed_languages = constraints.get('languages', [])
    allowed_genres = constraints.get('genres', [])

    members = session.members.all()
    if not members:
        return []

    # Filter candidate movies
    query = Movie.query
    if max_runtime:
        query = query.filter(Movie.runtime_minutes <= max_runtime)
    if allowed_languages:
        query = query.filter(Movie.language.in_(allowed_languages))
    if allowed_genres:
        for g in allowed_genres:
            query = query.filter(Movie.genres.any(Genre.name == g))

    candidates = query.order_by(Movie.bayesian_score.desc()).limit(30).all()

    ranked_results = []
    for m in candidates:
        member_scores = []
        movie_genres = {g.name for g in m.genres}

        for mem in members:
            mem_prefs = json.loads(mem.preferences_json or "{}")
            
            # If member has registered user_id, use personal model
            if mem.user_id:
                score = calculate_compatibility_score(mem.user_id, m)
            else:
                # Estimate from session preferences
                preferred = set(mem_prefs.get('genres', []))
                overlap = len(movie_genres.intersection(preferred))
                base = 50 + (overlap * 18)
                if mem_prefs.get('language') == m.language:
                    base += 10
                score = min(98, max(25, base))

            member_scores.append(score)

        avg_score = sum(member_scores) / len(member_scores)
        min_score = min(member_scores)
        
        # Apply group objective formula
        if session.objective == 'avoid_mismatch':
            # Penalize disparity: average score minus gap to lowest member
            group_composite = avg_score - (1.2 * (avg_score - min_score))
        else:
            # Best average
            group_composite = avg_score

        # Check votes submitted for this movie
        votes = GroupVote.query.filter_by(group_id=group_id, movie_id=m.id).all()
        vote_total = sum(v.vote_score for v in votes)

        ranked_results.append({
            'movie': m.to_dict(),
            'composite_score': round(group_composite, 1),
            'average_match': round(avg_score, 1),
            'lowest_individual_match': round(min_score, 1),
            'votes_count': len(votes),
            'votes_score': vote_total,
            'explanation': (
                f"Balances {len(members)} participants. "
                f"Average match: {avg_score:.0f}%, Lowest: {min_score:.0f}%. "
                f"{'Prioritizes consensus (no member left behind).' if session.objective == 'avoid_mismatch' else 'Prioritizes highest group synergy.'}"
            )
        })

    # Sort primarily by composite score, boosted by live votes
    ranked_results.sort(key=lambda x: (x['composite_score'] + (x['votes_score'] * 5)), reverse=True)
    return ranked_results[:limit]
