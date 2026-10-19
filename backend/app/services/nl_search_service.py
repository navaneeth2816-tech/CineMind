import re
from app.models import Movie, Genre, db

LANGUAGES = {
    'telugu': 'Telugu',
    'tamil': 'Tamil',
    'malayalam': 'Malayalam',
    'kannada': 'Kannada',
    'hindi': 'Hindi',
    'english': 'English'
}

GENRES = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance',
    'Sci-Fi', 'Thriller', 'Biography', 'History'
]

def parse_natural_language_query(query_text: str):
    """
    Parses natural language requests into structured catalogue filters (PRD Section 6.9):
    Example: 'Find a Telugu thriller under two hours with a high audience rating'
    """
    if not query_text or not query_text.strip():
        return {
            'original_query': query_text or '',
            'parsed_entities': {
                'language': None,
                'genres': [],
                'max_runtime': None,
                'min_rating': None,
                'min_year': None,
                'max_year': None
            },
            'filter_summary': 'No query provided',
            'match_count': 0,
            'clarifications': ['Please enter a query (e.g. "Telugu thrillers under 2 hours").'],
            'results': []
        }

    q_lower = query_text.lower()
    # Normalize common word numbers
    word_to_num = {'one': '1', 'two': '2', 'three': '3', 'four': '4'}
    for word, num in word_to_num.items():
        q_lower = re.sub(r'\b' + word + r'\s+hour', f'{num} hour', q_lower)

    extracted = {
        'language': None,
        'genres': [],
        'max_runtime': None,
        'min_rating': None,
        'min_year': None,
        'max_year': None
    }
    clarifications = []

    # 1. Language detection
    for key, lang in LANGUAGES.items():
        if re.search(r'\b' + key + r'\b', q_lower):
            extracted['language'] = lang
            break

    # 2. Genre detection
    for g in GENRES:
        # Match singular or plural or variations
        pattern = r'\b' + re.escape(g.lower()) + r'(s)?\b'
        if g.lower() == 'sci-fi':
            pattern = r'\b(sci-fi|scifi|science\s+fiction)\b'
        elif g.lower() == 'thriller':
            pattern = r'\b(thriller|thrillers|suspense)\b'
        
        if re.search(pattern, q_lower):
            extracted['genres'].append(g)

    # 3. Runtime extraction
    # Patterns: 'under 2 hours', 'less than 120 minutes', 'under 90 mins', 'within 2.5 hours'
    runtime_hour_match = re.search(r'(?:under|less\s+than|within|below)\s+(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)', q_lower)
    if runtime_hour_match:
        hours = float(runtime_hour_match.group(1))
        extracted['max_runtime'] = int(hours * 60)
    else:
        runtime_min_match = re.search(r'(?:under|less\s+than|within|below)\s+(\d+)\s*(?:minute|minutes|min|mins)', q_lower)
        if runtime_min_match:
            extracted['max_runtime'] = int(runtime_min_match.group(1))

    # 4. Rating threshold extraction
    # "high rating", "top rated", "critically acclaimed", "above 4 stars", "above 8/10", "above 8"
    if re.search(r'\b(high(?:est)?\s+rating|top\s+rated|critically\s+acclaimed|great|best)\b', q_lower):
        extracted['min_rating'] = 3.8
    
    rating_num_match = re.search(r'(?:above|over|at\s+least|min(?:imum)?)\s+(\d+(?:\.\d+)?)\s*(?:stars?|/10|/5)?', q_lower)
    if rating_num_match:
        val = float(rating_num_match.group(1))
        if val > 5.0 and val <= 10.0:
            extracted['min_rating'] = round(val / 2.0, 1) # scale 10 to 5
        elif val <= 5.0:
            extracted['min_rating'] = val

    # 5. Era / Year extraction
    # "after 2020", "since 2018", "classic", "90s"
    year_match = re.search(r'(?:after|since|from|newer\s+than)\s+(\d{4})', q_lower)
    if year_match:
        extracted['min_year'] = int(year_match.group(1))
    
    before_year_match = re.search(r'(?:before|prior\s+to|older\s+than)\s+(\d{4})', q_lower)
    if before_year_match:
        extracted['max_year'] = int(before_year_match.group(1))

    if 'classic' in q_lower or 'vintage' in q_lower:
        extracted['max_year'] = 2005

    if '90s' in q_lower or 'nineties' in q_lower:
        extracted['min_year'] = 1990
        extracted['max_year'] = 1999

    # Build human summary of applied filters
    summary_parts = []
    if extracted['language']:
        summary_parts.append(f"Language: {extracted['language']}")
    if extracted['genres']:
        summary_parts.append(f"Genre(s): {', '.join(extracted['genres'])}")
    if extracted['max_runtime']:
        summary_parts.append(f"Runtime: ≤ {extracted['max_runtime']} mins")
    if extracted['min_rating']:
        summary_parts.append(f"Rating: ≥ {extracted['min_rating']}★")
    if extracted['min_year']:
        summary_parts.append(f"Released: ≥ {extracted['min_year']}")
    if extracted['max_year']:
        summary_parts.append(f"Released: ≤ {extracted['max_year']}")

    summary = " | ".join(summary_parts) if summary_parts else "General search (no strict constraint detected)"

    # Query database
    query = Movie.query
    if extracted['language']:
        query = query.filter(Movie.language == extracted['language'])
    
    if extracted['genres']:
        for g_name in extracted['genres']:
            query = query.filter(Movie.genres.any(Genre.name == g_name))
            
    if extracted['max_runtime']:
        query = query.filter(Movie.runtime_minutes <= extracted['max_runtime'])
        
    if extracted['min_rating']:
        query = query.filter(Movie.bayesian_score >= extracted['min_rating'])
        
    if extracted['min_year']:
        query = query.filter(Movie.release_year >= extracted['min_year'])
        
    if extracted['max_year']:
        query = query.filter(Movie.release_year <= extracted['max_year'])

    results = query.order_by(Movie.bayesian_score.desc()).all()

    if not results:
        clarifications.append("No exact matches found. You could try removing the runtime limit or relaxing the rating threshold.")

    return {
        'original_query': query_text,
        'parsed_entities': extracted,
        'filter_summary': summary,
        'match_count': len(results),
        'clarifications': clarifications,
        'results': [m.to_dict() for m in results]
    }
