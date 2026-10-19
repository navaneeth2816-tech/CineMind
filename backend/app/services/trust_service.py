import math
from app.models import db, Movie, Rating
from app.config import Config

def calculate_movie_trust_metrics(movie_id: int):
    """
    Computes Rating Trust Analyzer metrics (PRD Section 6.8):
    - Average score (R)
    - Rating count (v)
    - Bayesian smoothed score: (v / (v + m)) * R + (m / (v + m)) * C
    - 1-5 star distribution
    - Source breakdown (MovieLens vs CineMind)
    - Uncertainty / confidence interval
    - Evidence label
    """
    movie = Movie.query.get(movie_id)
    if not movie:
        return None

    ratings = Rating.query.filter_by(movie_id=movie_id).all()
    v = len(ratings)
    
    # Catalogue overall mean (C)
    overall_mean = db.session.query(db.func.avg(Rating.rating)).scalar() or 3.5
    m = Config.BAYESIAN_EVIDENCE_M

    # Initialize star distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    sources = {'movielens': 0, 'cinemind': 0}
    
    if v == 0:
        return {
            'movie_id': movie_id,
            'title': movie.title,
            'rating_mean': 0.0,
            'rating_count': 0,
            'bayesian_score': round(overall_mean, 2),
            'evidence_constant_m': m,
            'catalogue_mean_c': round(overall_mean, 2),
            'evidence_label': 'No ratings recorded (catalogue baseline)',
            'distribution': distribution,
            'distribution_pct': {k: 0.0 for k in distribution},
            'source_breakdown': sources,
            'standard_deviation': 0.0,
            'confidence_interval_95': 0.0,
            'ci_lower': round(overall_mean, 2),
            'ci_upper': round(overall_mean, 2),
            'is_estimate_only': True,
            'formula': 'weighted_score = (v/(v+m)) * R + (m/(v+m)) * C'
        }

    sum_ratings = 0.0
    for r in ratings:
        sum_ratings += r.rating
        star_bucket = max(1, min(5, round(r.rating)))
        distribution[star_bucket] = distribution.get(star_bucket, 0) + 1
        
        src = r.source.lower() if r.source else 'cinemind'
        sources[src] = sources.get(src, 0) + 1

    R = sum_ratings / v
    # Bayesian formula: (v / (v + m)) * R + (m / (v + m)) * C
    weighted_score = (v / (v + m)) * R + (m / (v + m)) * overall_mean

    # Sample standard deviation & 95% Confidence Interval
    if v > 1:
        sample_variance = sum((r.rating - R) ** 2 for r in ratings) / (v - 1)
        std_dev = math.sqrt(max(0.0, sample_variance))
        margin_of_error = 1.96 * (std_dev / math.sqrt(v))
    else:
        std_dev = 0.0
        margin_of_error = 1.0  # High uncertainty for single observation

    # Evidence label according to sample strength
    if v >= 50:
        evidence_label = 'Broader rating sample'
    elif v >= 15:
        evidence_label = 'Moderate rating sample'
    elif v >= 2:
        evidence_label = 'Limited rating evidence'
    else:
        evidence_label = 'Single rating (high uncertainty)'

    distribution_pct = {
        star: round((count / v) * 100, 1)
        for star, count in distribution.items()
    }

    ci_lower = max(1.0, round(R - margin_of_error, 2))
    ci_upper = min(5.0, round(R + margin_of_error, 2))

    return {
        'movie_id': movie_id,
        'title': movie.title,
        'rating_mean': round(R, 2),
        'rating_count': v,
        'bayesian_score': round(weighted_score, 2),
        'evidence_constant_m': m,
        'catalogue_mean_c': round(overall_mean, 2),
        'evidence_label': evidence_label,
        'distribution': distribution,
        'distribution_pct': distribution_pct,
        'source_breakdown': sources,
        'standard_deviation': round(std_dev, 2),
        'confidence_interval_95': round(margin_of_error, 2),
        'ci_lower': ci_lower,
        'ci_upper': ci_upper,
        'is_estimate_only': False,
        'formula': 'weighted_score = (v/(v+m)) * R + (m/(v+m)) * C'
    }

def update_movie_cached_ratings(movie_id: int):
    """Refreshes movie cached rating_mean, rating_count, and bayesian_score"""
    metrics = calculate_movie_trust_metrics(movie_id)
    if not metrics:
        return
    movie = Movie.query.get(movie_id)
    if movie:
        movie.rating_mean = metrics['rating_mean']
        movie.rating_count = metrics['rating_count']
        movie.bayesian_score = metrics['bayesian_score']
        db.session.commit()
