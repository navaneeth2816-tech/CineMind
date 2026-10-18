from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db, Movie, User, Rating, Genre, AdminAuditLog
from app.services.auth_service import admin_required
from app.services.trust_service import update_movie_cached_ratings

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/overview', methods=['GET'])
@admin_required
def admin_overview(user):
    """
    Catalogue, user, and rating audit statistics (PRD Section 6.18)
    Admin privileges strictly enforced on backend.
    """
    total_movies = Movie.query.count()
    total_users = User.query.count()
    total_ratings = Rating.query.count()

    # Data quality / missing metadata audit
    missing_posters = Movie.query.filter(Movie.poster_url.is_(None)).count()
    missing_runtimes = Movie.query.filter(Movie.runtime_minutes.is_(None)).count()
    missing_overviews = Movie.query.filter(Movie.overview.is_(None)).count()

    # Source breakdown
    sources = db.session.query(Movie.metadata_source, db.func.count(Movie.id)).group_by(Movie.metadata_source).all()

    recent_logs = AdminAuditLog.query.order_by(AdminAuditLog.timestamp.desc()).limit(15).all()

    return jsonify({
        'metrics': {
            'total_movies': total_movies,
            'total_users': total_users,
            'total_ratings': total_ratings,
            'missing_metadata': {
                'missing_posters': missing_posters,
                'missing_runtimes': missing_runtimes,
                'missing_overviews': missing_overviews
            },
            'source_coverage': [{'source': s[0], 'count': s[1]} for s in sources]
        },
        'audit_logs': [l.to_dict() for l in recent_logs]
    }), 200

@admin_bp.route('/movies', methods=['POST'])
@admin_required
def create_movie(user):
    """Creates a new movie in catalogue (admin only)"""
    data = request.get_json() or {}
    title = (data.get('title') or "").strip()
    year = data.get('release_year')
    language = (data.get('language') or "English").strip()
    runtime = data.get('runtime_minutes')
    overview = (data.get('overview') or "").strip()
    poster_url = (data.get('poster_url') or "").strip()
    genres_list = data.get('genres', [])

    if not title or not year:
        return jsonify({'error': 'Title and release year are required.'}), 400

    movie = Movie(
        title=title,
        release_year=int(year),
        language=language,
        runtime_minutes=int(runtime) if runtime else None,
        overview=overview,
        poster_url=poster_url,
        metadata_source='Admin manual entry'
    )

    for g_name in genres_list:
        genre = Genre.query.filter_by(name=g_name).first()
        if not genre:
            genre = Genre(name=g_name)
            db.session.add(genre)
        movie.genres.append(genre)

    db.session.add(movie)
    db.session.commit()

    # Log action
    log = AdminAuditLog(
        admin_user_id=user.id,
        action='CREATE_MOVIE',
        target_id=str(movie.id),
        details=f"Created movie '{movie.title}' ({movie.release_year}, {movie.language})"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f"Movie '{movie.title}' created successfully.",
        'movie': movie.to_dict()
    }), 201

@admin_bp.route('/movies/<int:movie_id>', methods=['PUT'])
@admin_required
def update_movie(movie_id, user):
    """Updates an existing movie (admin only)"""
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found.'}), 404

    data = request.get_json() or {}
    if 'title' in data: movie.title = data['title']
    if 'release_year' in data: movie.release_year = int(data['release_year'])
    if 'language' in data: movie.language = data['language']
    if 'runtime_minutes' in data: movie.runtime_minutes = int(data['runtime_minutes']) if data['runtime_minutes'] else None
    if 'overview' in data: movie.overview = data['overview']
    if 'poster_url' in data: movie.poster_url = data['poster_url']

    if 'genres' in data:
        movie.genres = []
        for g_name in data['genres']:
            genre = Genre.query.filter_by(name=g_name).first()
            if not genre:
                genre = Genre(name=g_name)
                db.session.add(genre)
            movie.genres.append(genre)

    log = AdminAuditLog(
        admin_user_id=user.id,
        action='UPDATE_MOVIE',
        target_id=str(movie.id),
        details=f"Updated movie attributes for '{movie.title}'"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f"Movie '{movie.title}' updated successfully.",
        'movie': movie.to_dict()
    }), 200

@admin_bp.route('/movies/<int:movie_id>', methods=['DELETE'])
@admin_required
def delete_movie(movie_id, user):
    """Deletes/archives a movie from catalogue (admin only)"""
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found.'}), 404

    title = movie.title
    db.session.delete(movie)

    log = AdminAuditLog(
        admin_user_id=user.id,
        action='DELETE_MOVIE',
        target_id=str(movie_id),
        details=f"Deleted movie '{title}'"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': f"Movie '{title}' deleted from catalogue."}), 200
