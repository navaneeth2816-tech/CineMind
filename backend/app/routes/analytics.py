from flask import Blueprint, request, jsonify, Response
from app.models import db, Movie, Rating, Genre
from app.services.data_analysis_service import (
    generate_complete_analytics_report,
    get_ratings_dataframe,
    get_movies_dataframe,
    get_genres_dataframe,
    calculate_numpy_rating_statistics,
    analyze_ratings_with_pandas,
    create_genre_analysis_chart,
    create_rating_distribution_chart,
    create_top_rated_movies_chart,
    create_regional_comparison_chart
)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/ratings', methods=['GET'])
def get_rating_analytics():
    """
    Global rating analytics and distribution powered genuinely by Pandas and NumPy.
    Renders 4 dark-themed Matplotlib charts returned as Base64 data URLs.
    Includes top-rated movies adhering to the minimum-rating-count rule (configurable via min_ratings param).
    Privacy Guarantee: Never exposes user IDs, usernames, or individual private ratings.
    """
    try:
        min_ratings = request.args.get('min_ratings', 5, type=int)
        min_ratings = max(1, min(500, min_ratings))
    except (ValueError, TypeError):
        min_ratings = 5

    report = generate_complete_analytics_report(min_ratings=min_ratings)
    stats = report['statistics']
    analysis = report['analysis']
    charts = report['charts']

    # Backwards compatibility and rich analytics payload
    top_bayesian = Movie.query.order_by(Movie.bayesian_score.desc()).limit(5).all()
    most_rated = Movie.query.order_by(Movie.rating_count.desc()).limit(5).all()

    return jsonify({
        # High-level overview
        'overview': {
            'total_movies': analysis['movies_evaluated'],
            'total_ratings': stats['total_ratings'],
            'average_rating': stats['mean'],
            'median_rating': stats['median'],
            'std_deviation': stats['std_dev'],
            'variance': stats['variance'],
            'min_rating': stats['min'],
            'max_rating': stats['max'],
            'percentile_25': stats['percentile_25'],
            'percentile_75': stats['percentile_75'],
            'min_ratings_threshold': min_ratings,
            'qualified_top_rated_count': analysis['movies_qualified']
        },
        # NumPy Rating Statistics (Requirement 3)
        'numpy_statistics': stats,
        # Star distributions
        'star_distribution': stats['star_distribution'],
        'star_distribution_pct': stats['star_percentages'],
        # Pandas Genre Analysis (Requirement 2)
        'genre_analysis': analysis['genre_aggregations'],
        # Pandas Regional Aggregations
        'regional_analysis': analysis['regional_aggregations'],
        # Pandas Verified Top-Rated Movies with Minimum Threshold Rule (Requirement 5)
        'top_rated_movies': analysis['top_rated_movies'],
        'min_ratings_threshold': min_ratings,
        'movies_evaluated': analysis['movies_evaluated'],
        'movies_qualified': analysis['movies_qualified'],
        # Legacy lists preserved
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
        ],
        # Matplotlib Charts (Requirement 4)
        'charts': {
            'genre_analysis': charts['genre_analysis'],
            'rating_distribution': charts['rating_distribution'],
            'top_rated_movies': charts['top_rated_movies'],
            'regional_comparison': charts['regional_comparison']
        }
    }), 200

@analytics_bp.route('/charts/<chart_name>', methods=['GET'])
def get_chart_image(chart_name):
    """
    Renders and streams raw PNG charts generated with Matplotlib on demand.
    Accepts: 'genre-analysis', 'rating-distribution', 'top-rated', 'regional-comparison'
    """
    try:
        min_ratings = request.args.get('min_ratings', 5, type=int)
        min_ratings = max(1, min(500, min_ratings))
    except (ValueError, TypeError):
        min_ratings = 5

    df_ratings = get_ratings_dataframe()
    df_movies = get_movies_dataframe()
    df_genres = get_genres_dataframe()
    stats = calculate_numpy_rating_statistics(df_ratings)
    analysis = analyze_ratings_with_pandas(df_ratings, df_movies, df_genres, min_ratings=min_ratings)

    if chart_name in ('genre-analysis', 'genre_analysis'):
        _, raw_bytes = create_genre_analysis_chart(analysis['genre_aggregations'])
    elif chart_name in ('rating-distribution', 'rating_distribution'):
        _, raw_bytes = create_rating_distribution_chart(stats)
    elif chart_name in ('top-rated', 'top_rated', 'top-rated-movies'):
        _, raw_bytes = create_top_rated_movies_chart(analysis['top_rated_movies'], min_threshold=min_ratings)
    elif chart_name in ('regional-comparison', 'regional_comparison'):
        _, raw_bytes = create_regional_comparison_chart(analysis['regional_aggregations'])
    else:
        return jsonify({'error': 'Chart not found. Valid options: genre-analysis, rating-distribution, top-rated, regional-comparison'}), 404

    return Response(raw_bytes, mimetype='image/png')

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
