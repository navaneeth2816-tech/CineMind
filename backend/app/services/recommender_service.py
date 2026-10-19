import math
from collections import defaultdict
from app.models import db, Movie, Rating, Genre, User, UserPreference

def get_all_genres():
    """Retrieves sorted list of all genre names"""
    return [g.name for g in Genre.query.order_by(Genre.name).all()]

def build_movie_feature_vector(movie: Movie, all_genres: list):
    """
    Constructs normalized feature vector for a movie based on:
    - Genres (binary weights)
    - Language (one-hot weight)
    - Runtime category
    """
    movie_genre_names = {g.name for g in movie.genres}
    vector = {}
    
    # Genre features (weight: 1.0)
    for g in all_genres:
        vector[f"genre_{g}"] = 1.0 if g in movie_genre_names else 0.0
        
    # Language feature (weight: 0.8)
    vector[f"lang_{movie.language.lower()}"] = 0.8
    
    # Runtime bucket feature (weight: 0.5)
    rt = movie.runtime_minutes or 120
    if rt < 105:
        vector["rt_short"] = 0.5
    elif rt <= 145:
        vector["rt_medium"] = 0.5
    else:
        vector["rt_long"] = 0.5

    return vector

def compute_cosine_similarity(vec_a: dict, vec_b: dict) -> float:
    """Computes cosine similarity between two sparse feature dictionaries"""
    all_keys = set(vec_a.keys()).union(set(vec_b.keys()))
    dot_product = sum(vec_a.get(k, 0.0) * vec_b.get(k, 0.0) for k in all_keys)
    
    norm_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
    norm_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def build_user_taste_dna(user_id: int):
    """
    Generates Movie Taste DNA profile (PRD Section 6.6):
    - Genre preference scores (-1.0 to +1.0)
    - Counts and supporting evidence per genre
    - Average rating per genre
    - Language preferences
    """
    user = User.query.get(user_id)
    if not user:
        return None

    ratings = Rating.query.filter_by(user_id=user_id).all()
    user_prefs = UserPreference.query.filter_by(user_id=user_id).all()

    all_genres = get_all_genres()
    genre_ratings = defaultdict(list)
    language_counts = defaultdict(int)

    for r in ratings:
        movie = Movie.query.get(r.movie_id)
        if not movie:
            continue
        for g in movie.genres:
            genre_ratings[g.name].append(r.rating)
        language_counts[movie.language] += 1

    # Explicit preferences
    explicit_genres = {p.preference_value: p.weight for p in user_prefs if p.preference_type == 'genre'}

    genre_profiles = []
    for g in all_genres:
        r_list = genre_ratings.get(g, [])
        count = len(r_list)
        avg_r = (sum(r_list) / count) if count > 0 else 0.0
        
        # Calculate preference score:
        # If user rated items: centered around 3.0 scale: (avg - 3.0) / 2.0
        # Incorporate explicit onboarding choices
        if count > 0:
            score = (avg_r - 3.0) / 2.0  # Range -1.0 to 1.0
            # Blend with explicit weight if present
            if g in explicit_genres:
                score = (score * 0.7) + (explicit_genres[g] * 0.3)
        elif g in explicit_genres:
            score = explicit_genres[g]
            avg_r = 4.0 if explicit_genres[g] > 0 else 2.0
        else:
            score = 0.0

        # Confidence based on count
        confidence = 'High (5+ ratings)' if count >= 5 else ('Moderate (2-4 ratings)' if count >= 2 else ('Low (1 rating)' if count == 1 else 'Prior baseline / Unrated'))

        genre_profiles.append({
            'genre': g,
            'preference_score': round(score, 2),
            'rating_count': count,
            'average_rating': round(avg_r, 1),
            'confidence': confidence,
            'affinity_label': 'Favorite' if score >= 0.4 else ('Liked' if score > 0.1 else ('Neutral' if score >= -0.1 else 'Avoided'))
        })

    # Sort genres by highest affinity
    genre_profiles.sort(key=lambda x: (x['preference_score'], x['rating_count']), reverse=True)

    return {
        'user_id': user_id,
        'user_name': user.name,
        'total_ratings': len(ratings),
        'top_genres': [g['genre'] for g in genre_profiles if g['preference_score'] > 0.2][:5],
        'avoided_genres': [g['genre'] for g in genre_profiles if g['preference_score'] < -0.2],
        'genre_dna': genre_profiles,
        'favorite_languages': sorted(language_counts.keys(), key=lambda k: language_counts[k], reverse=True)[:3],
        'runtime_preference_minutes': user.runtime_limit or 140
    }

def build_user_vector(user_id: int, all_genres: list):
    """Builds a continuous preference vector for a user"""
    taste_dna = build_user_taste_dna(user_id)
    if not taste_dna or taste_dna['total_ratings'] == 0:
        # Check explicit preferences
        prefs = UserPreference.query.filter_by(user_id=user_id).all()
        if not prefs:
            return None
        vec = {}
        for p in prefs:
            if p.preference_type == 'genre':
                vec[f"genre_{p.preference_value}"] = p.weight
            elif p.preference_type == 'language':
                vec[f"lang_{p.preference_value.lower()}"] = 0.8
        return vec

    vec = {}
    for g_info in taste_dna['genre_dna']:
        # Only include non-zero affinities
        if abs(g_info['preference_score']) > 0.05:
            vec[f"genre_{g_info['genre']}"] = g_info['preference_score']

    for lang in taste_dna['favorite_languages']:
        vec[f"lang_{lang.lower()}"] = 0.6

    return vec

def calculate_compatibility_score(user_id: int, movie: Movie) -> int:
    """
    Computes Personal Movie Compatibility Score (0 - 100%) (PRD 6.5)
    Distinct from general rating.
    """
    all_genres = get_all_genres()
    user_vec = build_user_vector(user_id, all_genres)
    
    # Cold start baseline if no user history
    if not user_vec:
        # Base on Bayesian score and popularity
        base = (movie.bayesian_score / 5.0) * 80.0
        return int(max(40, min(85, base)))

    movie_vec = build_movie_feature_vector(movie, all_genres)
    sim = compute_cosine_similarity(user_vec, movie_vec)
    
    # Scale cosine similarity (-1 to 1) into clean 0 - 100% score
    # Most positive vectors yield sim between 0.1 and 0.85
    scaled = int(round(50 + (sim * 50)))
    return max(15, min(99, scaled))

def get_personal_recommendations(user_id: int, limit: int = 12, exclude_rated: bool = True):
    """
    Generates explainable personalized movie recommendations (PRD Section 6.5, 6.7)
    """
    user = User.query.get(user_id)
    if not user:
        return []

    rated_ids = set()
    if exclude_rated:
        rated_ids = {r.movie_id for r in Rating.query.filter_by(user_id=user_id).all()}

    all_genres = get_all_genres()
    user_vec = build_user_vector(user_id, all_genres)
    taste_dna = build_user_taste_dna(user_id)
    top_user_genres = set(taste_dna['top_genres']) if taste_dna else set()

    preferred_languages = set()
    if taste_dna and taste_dna.get('favorite_languages'):
        preferred_languages.update(taste_dna['favorite_languages'])
    for pl in UserPreference.query.filter_by(user_id=user_id, preference_type='language').all():
        preferred_languages.add(pl.preference_value)

    movies = Movie.query.all()
    candidates = []

    for m in movies:
        if m.id in rated_ids:
            continue
        
        # Check user excluded genres
        if user.excluded_genres:
            user_ex = {x.strip().lower() for x in user.excluded_genres.split(',')}
            movie_genres = {g.name.lower() for g in m.genres}
            if movie_genres.intersection(user_ex):
                continue

        compatibility = calculate_compatibility_score(user_id, m)
        
        # Determine explainable reasons
        matched_genres = [g.name for g in m.genres if g.name in top_user_genres]
        reasons = []
        if matched_genres:
            reasons.append(f"Matches your high affinity for {', '.join(matched_genres)}")
        if m.language in preferred_languages:
            reasons.append(f"In your preferred language ({m.language})")
        if m.bayesian_score >= 4.0:
            reasons.append(f"Highly validated general audience score ({m.bayesian_score:.1f}★ with {m.rating_count} ratings)")
        if user.runtime_limit and m.runtime_minutes and m.runtime_minutes <= user.runtime_limit:
            reasons.append(f"Comfortably within your {user.runtime_limit}m runtime preference ({m.runtime_minutes}m)")
        elif not reasons:
            reasons.append("Trending title aligned with catalogue popularity baseline")

        candidates.append({
            'movie': m.to_dict(),
            'compatibility_score': compatibility,
            'primary_reason': reasons[0] if reasons else "Recommended title",
            'all_reasons': reasons
        })

    # Sort by compatibility score descending, then by Bayesian score
    candidates.sort(key=lambda x: (x['compatibility_score'], x['movie']['bayesian_score']), reverse=True)
    return candidates[:limit]

def generate_decision_report(movie_id: int, user_id: int = None):
    """
    Comprehensive Explainable Decision Report (PRD Section 6.7, 6.12)
    Sections:
    - Personal Match
    - Rating Evidence
    - Why It Fits
    - Possible Mismatches (Watch Risk)
    - Similar Alternatives
    """
    from app.services.trust_service import calculate_movie_trust_metrics
    
    movie = Movie.query.get(movie_id)
    if not movie:
        return None

    trust_metrics = calculate_movie_trust_metrics(movie_id)
    movie_genre_names = [g.name for g in movie.genres]

    # Calculate user compatibility
    compatibility = None
    why_it_fits = []
    possible_mismatches = []
    user_context = False

    if user_id:
        user = User.query.get(user_id)
        if user:
            user_context = True
            compatibility = calculate_compatibility_score(user_id, movie)
            taste = build_user_taste_dna(user_id)
            
            # Why it fits
            top_matching = [g for g in movie_genre_names if g in taste['top_genres']]
            if top_matching:
                why_it_fits.append({
                    'factor': 'Genre Alignment',
                    'detail': f"Features your favorite genre(s): {', '.join(top_matching)}",
                    'strength': 'High'
                })
            
            if movie.language in taste['favorite_languages']:
                why_it_fits.append({
                    'factor': 'Language Preference',
                    'detail': f"{movie.language} cinema is frequent in your viewing history",
                    'strength': 'Moderate'
                })

            if movie.bayesian_score >= 4.0:
                why_it_fits.append({
                    'factor': 'Rating Evidence',
                    'detail': f"Strong general consensus ({movie.bayesian_score:.1f} Bayesian rating across {movie.rating_count} reviews)",
                    'strength': 'High'
                })

            # Possible mismatches / Watch Risk
            if user.runtime_limit and movie.runtime_minutes and movie.runtime_minutes > user.runtime_limit:
                possible_mismatches.append({
                    'factor': 'Runtime Exceeded',
                    'detail': f"Runtime of {movie.runtime_minutes} mins exceeds your limit of {user.runtime_limit} mins",
                    'severity': 'Moderate'
                })
            
            avoided = [g for g in movie_genre_names if g in taste['avoided_genres']]
            if avoided:
                possible_mismatches.append({
                    'factor': 'Genre Dislike',
                    'detail': f"Contains {', '.join(avoided)}, which you have historically rated lower",
                    'severity': 'Caution'
                })

            if user.excluded_genres:
                user_ex = [x.strip() for x in user.excluded_genres.split(',')]
                conflicts = [g for g in movie_genre_names if g in user_ex]
                if conflicts:
                    possible_mismatches.append({
                        'factor': 'Explicitly Excluded Genre',
                        'detail': f"Matches your excluded filter for: {', '.join(conflicts)}",
                        'severity': 'Warning'
                    })

    if not why_it_fits:
        why_it_fits.append({
            'factor': 'Broad Audience Appeal',
            'detail': f"Consensus score of {movie.rating_mean:.1f} / 5.0 with {trust_metrics['evidence_label']}",
            'strength': 'Neutral'
        })

    # Similar alternatives
    all_genres = get_all_genres()
    target_vec = build_movie_feature_vector(movie, all_genres)
    all_movies = Movie.query.filter(Movie.id != movie_id).all()
    
    similar = []
    for other in all_movies:
        sim_vec = build_movie_feature_vector(other, all_genres)
        sim_score = compute_cosine_similarity(target_vec, sim_vec)
        similar.append({
            'movie': other.to_dict(),
            'similarity_score': round(sim_score * 100, 1)
        })
    similar.sort(key=lambda x: x['similarity_score'], reverse=True)

    return {
        'movie': movie.to_dict(),
        'has_user_context': user_context,
        'compatibility_score': compatibility,
        'compatibility_label': 'High Match' if (compatibility and compatibility >= 75) else ('Moderate Match' if (compatibility and compatibility >= 55) else 'Niche/Alternative Match'),
        'trust_metrics': trust_metrics,
        'why_it_fits': why_it_fits,
        'possible_mismatches': possible_mismatches,
        'similar_alternatives': similar[:3]
    }
