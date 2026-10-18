from collections import defaultdict
from flask import Blueprint, jsonify
from app.models import db, Movie, Rating, Genre

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/ratings', methods=['GET'])
def get_rating_analytics():
    """
    Global rating analytics and distribution (PRD Section 6.15)
    Uses actual database records for all statistics.
    """
    total_ratings = Rating.query.count()
    total_movies = Movie.query.count()

    # Star distribution
    ratings = Rating.query.all()
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    sources = defaultdict(int)

    for r in ratings:
        b = max(1, min(5, round(r.rating)))
        dist[b] += 1
        sources[r.source.lower() if r.source else 'cinemind'] += 1

    # Top 5 highest Bayesian score vs highest raw mean
    top_bayesian = Movie.query.order_by(Movie.bayesian_score.desc()).limit(5).all()
    most_rated = Movie.query.order_by(Movie.rating_count.desc()).limit(5).all()

    return jsonify({
        'overview': {
            'total_movies': total_movies,
            'total_ratings': total_ratings,
            'average_rating': round(sum(r.rating for r in ratings) / max(1, len(ratings)), 2),
            'sources_breakdown': dict(sources)
        },
        'star_distribution': dist,
        'star_distribution_pct': {
            k: round((v / max(1, total_ratings)) * 100, 1) for k, v in dist.items()
        },
        'top_bayesian_movies': [
            {
                'id': m.id,
                'title': m.title,
                'bayesian_score': m.bayesian_score,
                'rating_mean': m.rating_mean,
                'rating_count': m.rating_count,
                'language': m.language
            }
            for m in top_bayesian
        ],
        'most_rated_movies': [
            {
                'id': m.id,
                'title': m.title,
                'rating_count': m.rating_count,
                'rating_mean': m.rating_mean,
                'bayesian_score': m.bayesian_score,
                'language': m.language
            }
            for m in most_rated
        ]
    }), 200

@analytics_bp.route('/regional', methods=['GET'])
def get_regional_analytics():
    """
    Regional cinema analytics (PRD Section 6.14):
    Compares Telugu, Tamil, Malayalam, Kannada, Hindi, and English cinema
    on rating distribution, titles count, average runtime, and top genres.
    """
    movies = Movie.query.all()
    regional_data = defaultdict(lambda: {
        'count': 0,
        'total_rating': 0.0,
        'rating_count_sum': 0,
        'total_runtime': 0,
        'runtime_count': 0,
        'genres': defaultdict(int)
    })

    for m in movies:
        lang = m.language
        regional_data[lang]['count'] += 1
        regional_data[lang]['total_rating'] += m.bayesian_score
        regional_data[lang]['rating_count_sum'] += m.rating_count
        if m.runtime_minutes:
            regional_data[lang]['total_runtime'] += m.runtime_minutes
            regional_data[lang]['runtime_count'] += 1
        for g in m.genres:
            regional_data[lang]['genres'][g.name] += 1

    comparison = []
    for lang, stats in regional_data.items():
        cnt = stats['count']
        avg_score = stats['total_rating'] / cnt if cnt > 0 else 0
        avg_rt = stats['total_runtime'] / stats['runtime_count'] if stats['runtime_count'] > 0 else 0
        top_g = sorted(stats['genres'].keys(), key=lambda k: stats['genres'][k], reverse=True)[:3]
        
        comparison.append({
            'language': lang,
            'titles_count': cnt,
            'average_bayesian_score': round(avg_score, 2),
            'total_ratings_sample': stats['rating_count_sum'],
            'average_runtime_minutes': int(round(avg_rt)),
            'top_genres': top_g
        })

    # Sort by titles count
    comparison.sort(key=lambda x: x['titles_count'], reverse=True)

    return jsonify({
        'regional_comparison': comparison,
        'dataset_disclaimer': 'Sourced from MovieLens benchmarks and curated regional film metadata. Sample reflects verified records in current catalogue.'
    }), 200
