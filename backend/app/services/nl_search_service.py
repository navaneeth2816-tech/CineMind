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

COMMON_STOPWORDS = {
    'find', 'me', 'a', 'an', 'the', 'movie', 'movies', 'film', 'films',
    'show', 'watch', 'good', 'best', 'top', 'recommend', 'please',
    'with', 'having', 'about', 'like', 'in', 'of', 'for'
}

def normalize_text(text: str) -> str:
    """Removes special characters and lowercases text for fuzzy matching"""
    return re.sub(r'[^a-z0-9\s]', ' ', text.lower()).strip()

def parse_natural_language_query(query_text: str, language_filter: str = None):
    """
    Parses natural language requests into structured catalogue filters (PRD Section 6.9).
    Respects language filters from UI or query, matches genres, runtimes, ratings,
    and supports title/keyword search.
    """
    if not query_text or not query_text.strip():
        return {
            'original_query': query_text or '',
            'parsed_entities': {
                'language': language_filter,
                'genres': [],
                'matched_title': None,
                'search_keyword': None,
                'max_runtime': None,
                'min_rating': None,
                'min_year': None,
                'max_year': None
            },
            'filter_summary': f"Language: {language_filter}" if language_filter else 'No query provided',
            'match_count': 0,
            'clarifications': ['Please enter a query (e.g. "Telugu thrillers under 2 hours", "RRR", "Drishyam").'],
            'results': []
        }

    q_lower = query_text.lower()
    # Normalize common word numbers (e.g. 'two hours' -> '2 hours')
    word_to_num = {'one': '1', 'two': '2', 'three': '3', 'four': '4'}
    for word, num in word_to_num.items():
        q_lower = re.sub(r'\b' + word + r'\s+hour', f'{num} hour', q_lower)

    extracted = {
        'language': None,
        'genres': [],
        'matched_title': None,
        'search_keyword': None,
        'max_runtime': None,
        'min_rating': None,
        'min_year': None,
        'max_year': None
    }
    clarifications = []

    # 1. Language detection
    if language_filter:
        extracted['language'] = language_filter
    else:
        for key, lang in LANGUAGES.items():
            if re.search(r'\b' + key + r'\b', q_lower):
                extracted['language'] = lang
                break

    # 2. Genre detection
    for g in GENRES:
        pattern = r'\b' + re.escape(g.lower()) + r'(s)?\b'
        if g.lower() == 'sci-fi':
            pattern = r'\b(sci-fi|scifi|science\s+fiction)\b'
        elif g.lower() == 'thriller':
            pattern = r'\b(thriller|thrillers|suspense)\b'
        
        if re.search(pattern, q_lower):
            extracted['genres'].append(g)

    # 3. Runtime extraction (e.g. 'under 2 hours', 'less than 120 mins')
    runtime_hour_match = re.search(r'(?:under|less\s+than|within|below)\s+(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)', q_lower)
    if runtime_hour_match:
        hours = float(runtime_hour_match.group(1))
        extracted['max_runtime'] = int(hours * 60)
    else:
        runtime_min_match = re.search(r'(?:under|less\s+than|within|below)\s+(\d+)\s*(?:minute|minutes|min|mins)', q_lower)
        if runtime_min_match:
            extracted['max_runtime'] = int(runtime_min_match.group(1))

    # 4. Rating threshold extraction ('high rating', 'above 4 stars')
    if re.search(r'\b(high(?:est)?\s+rating|top\s+rated|critically\s+acclaimed|great|best)\b', q_lower):
        extracted['min_rating'] = 3.8
    
    rating_num_match = re.search(r'(?:above|over|at\s+least|min(?:imum)?)\s+(\d+(?:\.\d+)?)\s*(?:stars?|/10|/5)?', q_lower)
    if rating_num_match:
        val = float(rating_num_match.group(1))
        if 5.0 < val <= 10.0:
            extracted['min_rating'] = round(val / 2.0, 1)
        elif val <= 5.0:
            extracted['min_rating'] = val

    # 5. Era / Year extraction
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

    # 6. Title / Free-text keyword search
    q_norm = normalize_text(query_text)
    all_movies = Movie.query.all()
    matched_movie = None

    for m in all_movies:
        m_norm = normalize_text(m.title)
        # Check if title is in query or query is title
        if m_norm and (m_norm in q_norm or q_norm == m_norm):
            matched_movie = m
            break
        # Also check significant title parts (e.g. 'dark knight' in 'the dark knight')
        m_parts = [p for p in m_norm.split() if p not in {'the', 'a', 'an', 'part', 'chapter', '2', '1'}]
        if m_parts and len(' '.join(m_parts)) >= 3 and ' '.join(m_parts) in q_norm:
            matched_movie = m
            break

    if matched_movie:
        extracted['matched_title'] = matched_movie.title
    else:
        # Extract remaining search keywords by stripping out detected parameters and stopwords
        tokens = [w for w in q_norm.split() if w not in COMMON_STOPWORDS]
        # Remove language words
        tokens = [w for w in tokens if w not in LANGUAGES]
        # Remove genre words
        tokens = [w for w in tokens if w not in {g.lower() for g in GENRES}]
        # Remove number words
        tokens = [w for w in tokens if not w.isdigit()]
        if tokens:
            extracted['search_keyword'] = " ".join(tokens)

    # Build human summary of applied filters
    summary_parts = []
    if extracted['language']:
        summary_parts.append(f"Language: {extracted['language']}")
    if extracted['matched_title']:
        summary_parts.append(f"Title: '{extracted['matched_title']}'")
    elif extracted['search_keyword']:
        summary_parts.append(f"Keyword: '{extracted['search_keyword']}'")
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

    summary = " | ".join(summary_parts) if summary_parts else f"Search: '{query_text}'"

    # Query database
    query = Movie.query
    if extracted['language']:
        query = query.filter(Movie.language == extracted['language'])
    
    if extracted['genres']:
        for g_name in extracted['genres']:
            query = query.filter(Movie.genres.any(Genre.name == g_name))

    if extracted['matched_title']:
        query = query.filter(Movie.title == extracted['matched_title'])
    elif extracted['search_keyword']:
        kw = extracted['search_keyword']
        query = query.filter(
            db.or_(
                Movie.title.ilike(f"%{kw}%"),
                Movie.overview.ilike(f"%{kw}%")
            )
        )
            
    if extracted['max_runtime']:
        query = query.filter(Movie.runtime_minutes <= extracted['max_runtime'])
        
    if extracted['min_rating']:
        query = query.filter(Movie.bayesian_score >= extracted['min_rating'])
        
    if extracted['min_year']:
        query = query.filter(Movie.release_year >= extracted['min_year'])
        
    if extracted['max_year']:
        query = query.filter(Movie.release_year <= extracted['max_year'])

    results = query.order_by(Movie.bayesian_score.desc()).all()

    # Intelligent explanations when 0 results found
    if not results:
        if extracted['matched_title'] and extracted['language']:
            # Check if this title exists in another language
            cross_lang_movie = Movie.query.filter(Movie.title == extracted['matched_title']).first()
            if cross_lang_movie and cross_lang_movie.language != extracted['language']:
                clarifications.append(
                    f"'{cross_lang_movie.title}' is a {cross_lang_movie.language} cinema film, so it does not match your active '{extracted['language']}' language filter."
                )
        if not clarifications:
            clarifications.append("No exact matches found for these filters. Try clearing the language filter or relaxing runtime/rating constraints.")

    return {
        'original_query': query_text,
        'parsed_entities': extracted,
        'filter_summary': summary,
        'match_count': len(results),
        'clarifications': clarifications,
        'results': [m.to_dict() for m in results]
    }
