from flask import Blueprint, request, jsonify
from app.models import db, UserPreference, User, Movie
from app.services.auth_service import auth_required, optional_auth
from app.services.recommender_service import get_personal_recommendations

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('', methods=['GET'])
@optional_auth
def get_recommendations(user):
    """
    Returns explainable personal recommendations (PRD Section 6.5, 6.7)
    Falls back to high Bayesian score titles for guests/cold start.
    """
    limit = int(request.args.get('limit', 10))
    exclude_rated = request.args.get('exclude_rated', 'true').lower() == 'true'

    if user:
        recommendations = get_personal_recommendations(user.id, limit=limit, exclude_rated=exclude_rated)
        return jsonify({
            'recommendations': recommendations,
            'is_personalized': True,
            'count': len(recommendations)
        }), 200

    # Guest / Baseline recommendations based on Bayesian weighted score
    top_movies = Movie.query.order_by(Movie.bayesian_score.desc()).limit(limit).all()
    baseline = []
    for m in top_movies:
        baseline.append({
            'movie': m.to_dict(),
            'compatibility_score': 75,
            'primary_reason': f"Consensus favorite ({m.bayesian_score:.1f}★ Bayesian score with {m.rating_count} reviews)",
            'all_reasons': [f"Rated {m.rating_mean:.1f}/5.0 by general audience"]
        })

    return jsonify({
        'recommendations': baseline,
        'is_personalized': False,
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
