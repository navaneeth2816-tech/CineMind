from flask import Blueprint, request, jsonify
from app.models import db, User, Rating, Watchlist, ViewHistory, Movie
from app.services.auth_service import auth_required
from app.services.recommender_service import build_user_taste_dna

user_bp = Blueprint('user', __name__)

@user_bp.route('/me/ratings', methods=['GET'])
@auth_required
def get_user_ratings(user):
    """User rating history with movie details (PRD Section 6.15, 6.16)"""
    ratings = Rating.query.filter_by(user_id=user.id).order_by(Rating.rated_at.desc()).all()
    results = []
    for r in ratings:
        m = Movie.query.get(r.movie_id)
        if m:
            results.append({
                'rating_id': r.id,
                'rating': r.rating,
                'rated_at': r.rated_at.isoformat() if r.rated_at else None,
                'movie': m.to_dict()
            })
    return jsonify({'ratings': results, 'count': len(results)}), 200

@user_bp.route('/me/watchlist', methods=['GET'])
@auth_required
def get_watchlist(user):
    """Returns all movies in current user's watchlist"""
    entries = Watchlist.query.filter_by(user_id=user.id).order_by(Watchlist.added_at.desc()).all()
    movies = [e.movie.to_dict() for e in entries if e.movie]
    return jsonify({'watchlist': movies, 'count': len(movies)}), 200

@user_bp.route('/me/watchlist/<int:movie_id>', methods=['POST'])
@auth_required
def add_to_watchlist(movie_id, user):
    """Adds a movie to watchlist (prevents duplicates) (PRD 6.16)"""
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found.'}), 404

    existing = Watchlist.query.filter_by(user_id=user.id, movie_id=movie_id).first()
    if not existing:
        entry = Watchlist(user_id=user.id, movie_id=movie_id)
        db.session.add(entry)
        db.session.commit()

    return jsonify({'message': 'Added to watchlist.', 'movie_id': movie_id}), 200

@user_bp.route('/me/watchlist/<int:movie_id>', methods=['DELETE'])
@auth_required
def remove_from_watchlist(movie_id, user):
    """Removes a movie from watchlist"""
    entry = Watchlist.query.filter_by(user_id=user.id, movie_id=movie_id).first()
    if entry:
        db.session.delete(entry)
        db.session.commit()

    return jsonify({'message': 'Removed from watchlist.', 'movie_id': movie_id}), 200

@user_bp.route('/me/taste-profile', methods=['GET'])
@auth_required
def get_taste_profile(user):
    """Returns Movie Taste DNA with radar chart coordinates and genre confidence (PRD 6.6)"""
    dna = build_user_taste_dna(user.id)
    return jsonify({'taste_dna': dna}), 200

@user_bp.route('/me/history', methods=['GET'])
@auth_required
def get_view_history(user):
    """Returns user recently viewed movies (PRD 6.15)"""
    history = ViewHistory.query.filter_by(user_id=user.id).order_by(ViewHistory.viewed_at.desc()).limit(10).all()
    return jsonify({
        'history': [
            {
                'id': h.id,
                'viewed_at': h.viewed_at.isoformat() if h.viewed_at else None,
                'movie': h.movie.to_dict() if h.movie else None
            }
            for h in history if h.movie
        ]
    }), 200

@user_bp.route('/me/history/<int:movie_id>', methods=['POST'])
@auth_required
def add_view_history(movie_id, user):
    """Records movie view in history"""
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found.'}), 404

    entry = ViewHistory(user_id=user.id, movie_id=movie_id)
    db.session.add(entry)
    db.session.commit()
    return jsonify({'message': 'View history recorded.'}), 200

@user_bp.route('/me/history', methods=['DELETE'])
@auth_required
def clear_view_history(user):
    """Allows user to delete/clear their viewing history (PRD 6.15)"""
    ViewHistory.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return jsonify({'message': 'Viewing history cleared.'}), 200
