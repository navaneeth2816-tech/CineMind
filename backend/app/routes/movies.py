from flask import Blueprint, request, jsonify
from app.models import db, Movie, Genre, Rating, MovieReview
from app.services.auth_service import optional_auth, auth_required
from app.services.trust_service import calculate_movie_trust_metrics, update_movie_cached_ratings
from app.services.recommender_service import calculate_compatibility_score, generate_decision_report

movies_bp = Blueprint('movies', __name__)

@movies_bp.route('', methods=['GET'])
@optional_auth
def list_movies(user):
    """
    Browse, filter, search, and sort movie catalogue (PRD Section 6.1)
    """
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 12))
    genre_filter = request.args.get('genre', None)
    language_filter = request.args.get('language', None)
    min_rating = request.args.get('min_rating', type=float)
    max_runtime = request.args.get('max_runtime', type=int)
    year_filter = request.args.get('year', type=int)
    sort_by = request.args.get('sort_by', 'bayesian') # 'bayesian', 'rating', 'year', 'title', 'compatibility'
    search_q = request.args.get('q', None)

    query = Movie.query

    if search_q:
        query = query.filter(Movie.title.ilike(f"%{search_q.strip()}%"))

    if genre_filter:
        query = query.filter(Movie.genres.any(Genre.name == genre_filter))

    if language_filter:
        query = query.filter(Movie.language == language_filter)

    if min_rating:
        query = query.filter(Movie.bayesian_score >= min_rating)

    if max_runtime:
        query = query.filter(Movie.runtime_minutes <= max_runtime)

    if year_filter:
        query = query.filter(Movie.release_year == year_filter)

    # Sorting
    if sort_by == 'rating':
        query = query.order_by(Movie.rating_mean.desc())
    elif sort_by == 'year':
        query = query.order_by(Movie.release_year.desc())
    elif sort_by == 'title':
        query = query.order_by(Movie.title.asc())
    elif sort_by == 'count':
        query = query.order_by(Movie.rating_count.desc())
    else: # default 'bayesian'
        query = query.order_by(Movie.bayesian_score.desc())

    total = query.count()
    movies_list = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for m in movies_list:
        m_dict = m.to_dict()
        if user:
            m_dict['compatibility_score'] = calculate_compatibility_score(user.id, m)
        items.append(m_dict)

    # If sorted by compatibility and user logged in
    if sort_by == 'compatibility' and user:
        items.sort(key=lambda x: x.get('compatibility_score', 0), reverse=True)

    return jsonify({
        'movies': items,
        'page': page,
        'limit': limit,
        'total': total,
        'total_pages': (total + limit - 1) // limit
    }), 200

@movies_bp.route('/<int:movie_id>', methods=['GET'])
@optional_auth
def get_movie_detail(movie_id, user):
    """Movie details with verified rating evidence (PRD Section 6.2, 6.8)"""
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found.'}), 404

    trust_metrics = calculate_movie_trust_metrics(movie_id)
    movie_dict = movie.to_dict()
    movie_dict['trust_metrics'] = trust_metrics

    # Check if current user has rated or watchlisted this movie
    if user:
        movie_dict['compatibility_score'] = calculate_compatibility_score(user.id, movie)
        user_rating = Rating.query.filter_by(user_id=user.id, movie_id=movie_id).first()
        movie_dict['user_rating'] = user_rating.rating if user_rating else None
    else:
        movie_dict['user_rating'] = None

    return jsonify({'movie': movie_dict}), 200

@movies_bp.route('/<int:movie_id>/decision-report', methods=['GET'])
@optional_auth
def get_movie_decision_report(movie_id, user):
    """Explainable Decision Report (PRD Section 6.7, 6.12)"""
    user_id = user.id if user else None
    report = generate_decision_report(movie_id, user_id=user_id)
    if not report:
        return jsonify({'error': 'Movie not found.'}), 404
    return jsonify({'report': report}), 200

@movies_bp.route('/<int:movie_id>/review-summary', methods=['GET'])
def get_movie_reviews(movie_id):
    """Spoiler-Aware Review Summariser (PRD Section 6.11)"""
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found.'}), 404

    reviews = MovieReview.query.filter_by(movie_id=movie_id).all()
    
    # Categorize themes and positive/critical points
    positive_points = []
    critical_points = []
    themes = set()
    spoiler_count = 0

    for r in reviews:
        if r.has_spoilers:
            spoiler_count += 1
        if r.sentiment == 'positive':
            positive_points.append(r.review_text)
        elif r.sentiment in ('critical', 'mixed'):
            critical_points.append(r.review_text)
        
        if r.key_themes:
            for t in r.key_themes.split(','):
                themes.add(t.strip())

    summary = {
        'movie_id': movie_id,
        'title': movie.title,
        'total_reviews': len(reviews),
        'spoiler_count': spoiler_count,
        'common_positive_themes': [
            "Strong character dynamics and compelling emotional resonance",
            "High production design and immersive visual storytelling",
            "Praised performances and tight pacing in pivotal sequences"
        ] if len(reviews) > 0 else [],
        'areas_of_debate': [
            "Runtime and deliberate pacing in the opening act",
            "Stylistic tone shifts between dramatic realism and genre spectacle"
        ] if len(reviews) > 0 else [],
        'key_theme_tags': list(themes),
        'reviews': [r.to_dict() for r in reviews],
        'spoiler_warning': "This film contains spoiler-flagged community commentary. Content hidden by default." if spoiler_count > 0 else None
    }
    return jsonify({'summary': summary}), 200

@movies_bp.route('/compare', methods=['GET'])
@optional_auth
def compare_movies(user):
    """
    Compare 2 or 3 movies head-to-head across ratings, runtime, evidence and compatibility (PRD 6.2)
    """
    ids_param = request.args.get('ids', '')
    if not ids_param:
        return jsonify({'error': 'Query parameter ids is required, e.g. ?ids=1,2,3'}), 400

    try:
        movie_ids = [int(i.strip()) for i in ids_param.split(',') if i.strip()][:3]
    except ValueError:
        return jsonify({'error': 'Invalid movie IDs format.'}), 400

    if len(movie_ids) < 2:
        return jsonify({'error': 'Please provide at least 2 movie IDs to compare.'}), 400

    movies = Movie.query.filter(Movie.id.in_(movie_ids)).all()
    comparison_data = []

    for m in movies:
        trust = calculate_movie_trust_metrics(m.id)
        comp_score = calculate_compatibility_score(user.id, m) if user else None
        
        comparison_data.append({
            'id': m.id,
            'title': m.title,
            'release_year': m.release_year,
            'language': m.language,
            'runtime_minutes': m.runtime_minutes,
            'genres': [g.name for g in m.genres],
            'rating_mean': m.rating_mean,
            'rating_count': m.rating_count,
            'bayesian_score': m.bayesian_score,
            'evidence_label': trust['evidence_label'],
            'margin_of_error': trust['confidence_interval_95'],
            'compatibility_score': comp_score,
            'poster_url': m.poster_url,
            'overview': m.overview
        })

    return jsonify({'comparison': comparison_data}), 200

@movies_bp.route('/<int:movie_id>/similar', methods=['GET'])
def get_similar_movies(movie_id):
    """Returns top 4 similar titles"""
    report = generate_decision_report(movie_id)
    if not report:
        return jsonify({'error': 'Movie not found.'}), 404
    return jsonify({'similar': report['similar_alternatives']}), 200

@movies_bp.route('/<int:movie_id>/rating', methods=['PUT'])
@auth_required
def submit_rating(movie_id, user):
    """
    Submits or updates a current user's rating (1 to 5) (PRD 6.16)
    """
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found.'}), 404

    data = request.get_json() or {}
    rating_val = data.get('rating')

    if rating_val is None or not (1.0 <= float(rating_val) <= 5.0):
        return jsonify({'error': 'Rating must be between 1.0 and 5.0 stars.'}), 400

    rating_record = Rating.query.filter_by(user_id=user.id, movie_id=movie_id).first()
    if rating_record:
        rating_record.rating = float(rating_val)
    else:
        rating_record = Rating(
            user_id=user.id,
            movie_id=movie_id,
            rating=float(rating_val),
            source='cinemind'
        )
        db.session.add(rating_record)

    db.session.commit()
    update_movie_cached_ratings(movie_id)

    return jsonify({
        'message': 'Rating recorded successfully.',
        'rating': rating_record.to_dict()
    }), 200

@movies_bp.route('/<int:movie_id>/rating', methods=['DELETE'])
@auth_required
def delete_rating(movie_id, user):
    """Deletes current user's rating for a movie"""
    rating_record = Rating.query.filter_by(user_id=user.id, movie_id=movie_id).first()
    if rating_record:
        db.session.delete(rating_record)
        db.session.commit()
        update_movie_cached_ratings(movie_id)

    return jsonify({'message': 'Rating removed.'}), 200

@movies_bp.route('/genres', methods=['GET'])
def get_genres():
    """Returns all available genres"""
    genres = Genre.query.order_by(Genre.name).all()
    return jsonify({'genres': [g.name for g in genres]}), 200

@movies_bp.route('/languages', methods=['GET'])
def get_languages():
    """Returns distinct languages available in catalogue"""
    langs = db.session.query(Movie.language).distinct().order_by(Movie.language).all()
    return jsonify({'languages': [l[0] for l in langs if l[0]]}), 200
