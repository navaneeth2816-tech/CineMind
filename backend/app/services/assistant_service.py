import re
from app.models import Movie, User, Rating, Genre
from app.services.trust_service import calculate_movie_trust_metrics
from app.services.recommender_service import build_user_taste_dna, calculate_compatibility_score, generate_decision_report

def find_movie_by_flexible_title(name: str):
    """Finds a movie even with punctuation differences like K.G.F -> KGF"""
    if not name:
        return None
    name_stripped = name.strip()
    direct = Movie.query.filter(Movie.title.ilike(f"%{name_stripped}%")).first()
    if direct:
        return direct
    clean_target = re.sub(r'[^a-zA-Z0-9]', '', name_stripped).lower()
    if not clean_target:
        return None
    all_movies = Movie.query.all()
    for m in all_movies:
        clean_title = re.sub(r'[^a-zA-Z0-9]', '', m.title).lower()
        if clean_target in clean_title or clean_title in clean_target:
            return m
    return None

def run_smart_assistant(user_message: str, user_id: int = None, movie_context_id: int = None):
    """
    CineMind Smart Assistant (PRD Section 6.10):
    Grounded conversational assistant querying database facts, Bayesian ratings, and user Taste DNA.
    Never hallucinates unverified facts or exposes private user accounts.
    """
    msg = user_message.lower().strip()
    
    # Check if user has active context or user object
    user = User.query.get(user_id) if user_id else None
    taste_dna = build_user_taste_dna(user_id) if user_id else None

    # 1. Comparison intent (e.g. "compare X and Y", "which is better X or Y")
    compare_match = re.search(r'(?:compare|difference\s+between|which\s+(?:is\s+)?better)\s+([A-Za-z0-9\s:,\'.-]+?)(?:\s+(?:and|or|vs|versus)\s+)([A-Za-z0-9\s:,\'.-]+)', msg)
    if compare_match:
        title1 = compare_match.group(1).strip()
        title2 = compare_match.group(2).strip()
        
        m1 = find_movie_by_flexible_title(title1)
        m2 = find_movie_by_flexible_title(title2)
        
        if m1 and m2:
            t1 = calculate_movie_trust_metrics(m1.id)
            t2 = calculate_movie_trust_metrics(m2.id)
            
            c1_text = ""
            c2_text = ""
            if user:
                c1 = calculate_compatibility_score(user.id, m1)
                c2 = calculate_compatibility_score(user.id, m2)
                c1_text = f" (Your Personal Match: {c1}%)"
                c2_text = f" (Your Personal Match: {c2}%)"

            # Determine higher Bayesian score
            better = m1.title if m1.bayesian_score >= m2.bayesian_score else m2.title
            
            content = (
                f"### Comparison: **{m1.title}** vs **{m2.title}**\n\n"
                f"- **{m1.title}** ({m1.release_year}, {m1.language}):\n"
                f"  - General Rating: {m1.rating_mean:.2f}★ from {m1.rating_count} reviews\n"
                f"  - Bayesian Evidence Score: **{m1.bayesian_score:.2f}★** ({t1['evidence_label']}){c1_text}\n"
                f"  - Runtime: {m1.runtime_minutes or 'Unknown'} mins | Genres: {', '.join([g.name for g in m1.genres])}\n\n"
                f"- **{m2.title}** ({m2.release_year}, {m2.language}):\n"
                f"  - General Rating: {m2.rating_mean:.2f}★ from {m2.rating_count} reviews\n"
                f"  - Bayesian Evidence Score: **{m2.bayesian_score:.2f}★** ({t2['evidence_label']}){c2_text}\n"
                f"  - Runtime: {m2.runtime_minutes or 'Unknown'} mins | Genres: {', '.join([g.name for g in m2.genres])}\n\n"
                f"**Evidence Assessment**: Taking sample size uncertainty and Bayesian smoothing into account, **{better}** has the stronger empirical rating evidence."
            )
            return {
                'response': content,
                'related_movie_ids': [m1.id, m2.id],
                'type': 'comparison'
            }

    # 2. Rating Evidence Inquiry for a specific movie
    rating_query = re.search(r'(?:rating|evidence|trust|score|reviews?|reliable|stats?)\s+(?:for|of|on|about)?\s*([A-Za-z0-9\s:,\'-]+)', msg)
    if rating_query or movie_context_id:
        title_candidate = rating_query.group(1).strip() if rating_query else ""
        movie = None
        if title_candidate:
            movie = Movie.query.filter(Movie.title.ilike(f"%{title_candidate}%")).first()
        if not movie and movie_context_id:
            movie = Movie.query.get(movie_context_id)
            
        if movie:
            trust = calculate_movie_trust_metrics(movie.id)
            src = trust['source_breakdown']
            comp_text = ""
            if user:
                comp = calculate_compatibility_score(user.id, movie)
                comp_text = f"\n- **Your Personal Compatibility**: {comp}%"

            content = (
                f"### Rating Evidence Analysis for **{movie.title}**\n\n"
                f"- **Average Raw Rating**: {movie.rating_mean:.2f} / 5.0\n"
                f"- **Total Review Count**: {movie.rating_count} recorded ratings\n"
                f"- **Bayesian Weighted Score**: **{movie.bayesian_score:.2f}★**\n"
                f"- **Evidence Reliability**: {trust['evidence_label']} (Margin of error: ±{trust['confidence_interval_95']}★ at 95% CI)\n"
                f"- **Source Provenance**: {src.get('movielens', 0)} from MovieLens benchmark, {src.get('cinemind', 0)} from CineMind community.{comp_text}\n\n"
                f"*Note: CineMind Bayesian smoothing prevents small-sample skew by pulling low-count scores towards the catalogue mean.*"
            )
            return {
                'response': content,
                'related_movie_ids': [movie.id],
                'type': 'trust_analysis'
            }

    # 3. User Taste Profile Inquiry ("what are my top genres", "my taste dna", "what do i like")
    if 'my taste' in msg or 'my profile' in msg or 'top genre' in msg or 'preferences' in msg:
        if not user:
            return {
                'response': "You are currently browsing as a guest. Please sign in to view your personalized Movie Taste DNA and genre affinities!",
                'type': 'auth_prompt'
            }
        
        top_g = ", ".join(taste_dna['top_genres']) if taste_dna['top_genres'] else "No strong favorites yet (rate a few movies to build your DNA)"
        fav_l = ", ".join(taste_dna['favorite_languages']) if taste_dna['favorite_languages'] else "Any supported language"
        avoided = ", ".join(taste_dna['avoided_genres']) if taste_dna['avoided_genres'] else "None currently"
        
        content = (
            f"### Your Movie Taste DNA Profile\n\n"
            f"- **Top Preferred Genres**: {top_g}\n"
            f"- **Frequent Languages**: {fav_l}\n"
            f"- **Genres with Lower Affinity**: {avoided}\n"
            f"- **Runtime Preference**: ~{taste_dna['runtime_preference_minutes']} minutes\n"
            f"- **Ratings Logged**: {taste_dna['total_ratings']} movies evaluated\n\n"
            f"Your Taste DNA automatically updates every time you rate a movie or tweak your settings."
        )
        return {
            'response': content,
            'type': 'taste_dna'
        }

    # 4. Recommendation query ("what should i watch", "recommend me", "suggest")
    if 'recommend' in msg or 'suggest' in msg or 'what should i watch' in msg or 'find me a' in msg:
        from app.services.nl_search_service import parse_natural_language_query
        parsed = parse_natural_language_query(user_message)
        results = parsed['results'][:4]
        
        if results:
            lines = [f"Here are top-grounded recommendations matching your query (**{parsed['filter_summary']}**):\n"]
            rel_ids = []
            for r in results:
                rel_ids.append(r['id'])
                comp_str = ""
                if user:
                    m_obj = Movie.query.get(r['id'])
                    c_score = calculate_compatibility_score(user.id, m_obj)
                    comp_str = f" | **Compatibility**: {c_score}%"
                lines.append(f"1. **{r['title']}** ({r['release_year']}) - {r['language']} | {r['bayesian_score']:.1f}★ Bayesian ({r['rating_count']} reviews){comp_str}\n   *Overview*: {r['overview'][:120]}...")
            
            return {
                'response': "\n".join(lines),
                'related_movie_ids': rel_ids,
                'type': 'recommendation_list'
            }
        else:
            return {
                'response': "I searched the catalogue but couldn't find an exact match matching all those specific filters. Try expanding the runtime or choosing another genre!",
                'type': 'no_results'
            }

    # 5. Default Helpful Knowledge Answer
    return {
        'response': (
            "Hello! I am **CineMind Assistant**, your movie decision intelligence copilot.\n\n"
            "I can assist you with:\n"
            "- **Comparing movies head-to-head**: *\"Compare RRR and KGF\"* or *\"Which has better ratings between Inception and Interstellar?\"*\n"
            "- **Verifying rating evidence**: *\"Is Kantara's rating reliable?\"* or *\"Show evidence for Drishyam\"*\n"
            "- **Constrained natural searches**: *\"Find a Malayalam mystery under 2 hours\"*\n"
            "- **Your personalized Taste DNA**: *\"What are my top genres?\"*\n\n"
            "What would you like to explore?"
        ),
        'type': 'greeting'
    }
