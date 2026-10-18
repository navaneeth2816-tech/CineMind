from flask import Blueprint, request, jsonify
from app.models import Movie
from app.services.nl_search_service import parse_natural_language_query

search_bp = Blueprint('search', __name__)

@search_bp.route('/movies/search', methods=['GET'])
def search_movies():
    """Live search and autocomplete suggestions (PRD Section 6.1)"""
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'results': []}), 200

    movies = Movie.query.filter(
        Movie.title.ilike(f"%{q}%")
    ).order_by(Movie.bayesian_score.desc()).limit(8).all()

    return jsonify({
        'results': [
            {
                'id': m.id,
                'title': m.title,
                'release_year': m.release_year,
                'language': m.language,
                'poster_url': m.poster_url,
                'bayesian_score': m.bayesian_score,
                'genres': [g.name for g in m.genres]
            }
            for m in movies
        ]
    }), 200

@search_bp.route('/search/natural-language', methods=['POST'])
def natural_language_search():
    """
    Parses requests like 'Find a Telugu thriller under two hours with a high audience rating' (PRD 6.9)
    """
    data = request.get_json() or {}
    query = data.get('query', '').strip()

    if not query:
        return jsonify({'error': 'Query text is required.'}), 400

    parsed_result = parse_natural_language_query(query)
    return jsonify(parsed_result), 200
