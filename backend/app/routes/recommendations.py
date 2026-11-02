from flask import Blueprint, request, jsonify
from app.models import db, UserPreference, User, Movie, Rating
from app.services.auth_service import auth_required, optional_auth
from app.services.recommender_service import get_personal_recommendations

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('', methods=['GET'])
@optional_auth
def get_recommendations(user):
    """
    Returns explainable personal recommendations (PRD Section 6.5, 6.7)
    Respects language filters, user Taste DNA, and excluded genres.
    Falls back to high Bayesian score titles for guests or zero-rating users.
    """
    limit = int(request.args.get('limit', 10))
    exclude_rated = request.args.get('exclude_rated', 'true').lower() == 'true'
    language = request.args.get('language', None)
    if language:
        language = language.strip()
        if language.lower() in ('', 'all', 'all cinema'):
            language = None

    if user:
        rating_count = Rating.query.filter_by(user_id=user.id).count()
        pref_count = UserPreference.query.filter_by(user_id=user.id).count()
        has_ratings = rating_count > 0

        recommendations = get_personal_recommendations(
            user.id,
            limit=limit,
            exclude_rated=exclude_rated,
            language=language
        )
        return jsonify({
            'recommendations': recommendations,
            'is_personalized': has_ratings or (pref_count > 0),
            'has_ratings': has_ratings,
            'total_ratings': rating_count,
            'source': 'taste_dna' if has_ratings else ('onboarding_preferences' if pref_count > 0 else 'default_preferences'),
            'notice': None if has_ratings else 'Using default preferences (0 ratings recorded)',
            'count': len(recommendations)
        }), 200

    # Guest / Baseline recommendations based on Bayesian weighted score
    query = Movie.query
    if language:
        query = query.filter(Movie.language == language)
    top_movies = query.order_by(Movie.bayesian_score.desc()).limit(limit).all()
    baseline = []
    for m in top_movies:
        # Dynamic baseline compatibility score grounded in Bayesian score
        guest_score = int(round((m.bayesian_score / 5.0) * 88))
        baseline.append({
            'movie': m.to_dict(),
            'compatibility_score': max(50, min(95, guest_score)),
            'primary_reason': f"Consensus favorite ({m.bayesian_score:.1f}★ Bayesian score with {m.rating_count} reviews)",
            'all_reasons': [f"Rated {m.rating_mean:.1f}/5.0 by general audience"]
        })

    return jsonify({
        'recommendations': baseline,
        'is_personalized': False,
        'has_ratings': False,
        'total_ratings': 0,
        'source': 'audience_favorites',
        'notice': 'Showing top audience favorites',
        'count': len(baseline)
    }), 200

@recommendations_bp.route('/onboarding/preferences', methods=['POST'])
@auth_required
def submit_onboarding_preferences(user):
    """
    Cold-start onboarding quiz to choose initial favorite genres and languages (PRD Section 6.5, 7.1)
    """
    data = request.get_json() or {}
    genres = data.get('genres', [])
    languages = data.get('languages', [])
    runtime_limit = data.get('runtime_limit')

    # Clear previous preferences
    UserPreference.query.filter_by(user_id=user.id).delete()

    for g in genres:
        db.session.add(UserPreference(
            user_id=user.id,
            preference_type='genre',
            preference_value=g,
            weight=1.0
        ))

    for lang in languages:
        db.session.add(UserPreference(
            user_id=user.id,
            preference_type='language',
            preference_value=lang,
            weight=0.9
        ))

    if runtime_limit:
        user.runtime_limit = int(runtime_limit)

    db.session.commit()

    return jsonify({
        'message': 'Onboarding preferences saved! Your Taste DNA is now initialized.',
        'user': user.to_dict()
    }), 200
