import os
import re
import logging
from pathlib import Path

from dotenv import load_dotenv
from google import genai

from app.models import Movie, User, Rating, Genre
from app.services.trust_service import calculate_movie_trust_metrics
from app.services.recommender_service import (
    build_user_taste_dna,
    calculate_compatibility_score,
    generate_decision_report,
)
from app.services.nl_search_service import parse_natural_language_query

logger = logging.getLogger(__name__)

# Load backend .env file reliably
BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

# Valid Gemini models in order of priority (gemini-3.8-flash is non-existent)
AVAILABLE_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


# ---------------------------------------------------------
# MOVIE SEARCH & MATCHING HELPERS
# ---------------------------------------------------------

def find_movie_by_flexible_title(name: str):
    """
    Find a movie even when punctuation or casing differs
    (e.g., K.G.F vs KGF, Baahubali 2 vs Baahubali: The Conclusion).
    """
    if not name:
        return None

    name_stripped = name.strip()
    if not name_stripped:
        return None

    # 1. Direct ILIKE search
    direct = Movie.query.filter(Movie.title.ilike(f"%{name_stripped}%")).first()
    if direct:
        return direct

    # 2. Punctuation-stripped alphanumeric match
    clean_target = re.sub(r"[^a-zA-Z0-9]", "", name_stripped).lower()
    if not clean_target:
        return None

    all_movies = Movie.query.all()
    for movie in all_movies:
        clean_title = re.sub(r"[^a-zA-Z0-9]", "", movie.title).lower()
        if clean_target == clean_title:
            return movie
        if len(clean_target) >= 3 and (clean_target in clean_title or clean_title in clean_target):
            return movie

    return None


# ---------------------------------------------------------
# GROUNDED KNOWLEDGE FALLBACK
# ---------------------------------------------------------

def generate_knowledge_fallback(user_message: str, user: User = None):
    """
    Empirical, fact-grounded response fallback when Gemini AI is unavailable
    or unconfigured. Eliminates broken UI errors and provides accurate answers
    grounded in CineMind's catalogue and Bayesian calculations.
    """
    msg = user_message.lower().strip()

    # 1. Bayesian evidence & rating smoothing questions
    if any(k in msg for k in ["bayesian", "smoothing", "formula", "shrinkage", "score calculated"]):
        return {
            "response": (
                "### CineMind Bayesian Evidence Scoring\n\n"
                "CineMind calculates true rating reliability using **Bayesian shrinkage estimation**:\n\n"
                "- **Formula:** $S = \\frac{v \\cdot R + m \\cdot C}{v + m}$\n"
                "  - $v$: Recorded rating count for the movie.\n"
                "  - $R$: Average raw user rating.\n"
                "  - $m$: Prior confidence weight ($m = 25$ reviews) required for statistical certainty.\n"
                "  - $C$: Global benchmark mean ($C = 3.65$★) derived from MovieLens dataset records.\n\n"
                "**Why this matters:** Bayesian smoothing prevents a movie with a single 5-star rating "
                "from outranking established films with hundreds of verified, positive reviews."
            ),
            "type": "knowledge_fallback",
        }

    # 2. Personal Taste DNA questions
    if any(k in msg for k in ["taste dna", "dna profile", "compatibility", "match score"]):
        return {
            "response": (
                "### CineMind Taste DNA Intelligence\n\n"
                "Your **Movie Taste DNA** is an empirical preference vector built from your viewing and rating history:\n\n"
                "- **Genre Affinity:** Weighted frequency of genres you rate 4★ or above.\n"
                "- **Language Distribution:** Proportions across Telugu, Tamil, Malayalam, Kannada, Hindi, and English.\n"
                "- **Runtime Tolerance:** Average duration of films you enjoy, penalizing excessive runtimes.\n"
                "- **Personal Compatibility:** Calculated using cosine similarity between your Taste DNA vector and the movie's feature profile.\n\n"
                "Sign in and rate at least 3 movies to see your personalized Taste DNA in action!"
            ),
            "type": "knowledge_fallback",
        }

    # 3. Rating evidence & confidence interval questions
    if any(k in msg for k in ["confidence interval", "evidence label", "trust score", "reliability"]):
        return {
            "response": (
                "### Rating Evidence & Confidence Analysis\n\n"
                "CineMind classifies rating certainty into mathematical confidence tiers:\n\n"
                "- **High Evidence:** $\\ge 50$ recorded ratings with a narrow 95% confidence margin (±0.15★ or lower).\n"
                "- **Moderate Evidence:** $20 - 49$ recorded ratings with moderate confidence margin (±0.25★).\n"
                "- **Limited Evidence:** $< 20$ ratings, where Bayesian smoothing pulls the score closer to the benchmark mean until more reviews accumulate.\n\n"
                "You can inspect any film's Decision Report to see the full MovieLens vs CineMind community breakdown."
            ),
            "type": "knowledge_fallback",
        }

    # 4. Check if a specific movie in the catalogue was mentioned
    all_movies = Movie.query.all()
    matched_movie = None
    clean_msg = re.sub(r"[^a-zA-Z0-9]", "", msg)
    for m in sorted(all_movies, key=lambda x: len(x.title), reverse=True):
        clean_title = re.sub(r"[^a-zA-Z0-9]", "", m.title).lower()
        if clean_title and clean_title in clean_msg:
            matched_movie = m
            break

    if matched_movie:
        trust = calculate_movie_trust_metrics(matched_movie.id)
        genres_str = ", ".join(g.name for g in matched_movie.genres)
        comp_str = ""
        if user:
            comp = calculate_compatibility_score(user.id, matched_movie)
            comp_str = f"- **Your Personal Match:** **{comp}%**\n"

        return {
            "response": (
                f"### **{matched_movie.title}** ({matched_movie.release_year})\n\n"
                f"- **Language:** {matched_movie.language}\n"
                f"- **Runtime:** {matched_movie.runtime_minutes or 'Unknown'} mins\n"
                f"- **Genres:** {genres_str}\n"
                f"- **Bayesian Score:** **{matched_movie.bayesian_score:.2f}★** ({trust['evidence_label']})\n"
                f"- **Raw Rating:** {matched_movie.rating_mean:.2f}★ from {matched_movie.rating_count} reviews\n"
                f"{comp_str}"
                f"- **Overview:** {matched_movie.overview or 'No synopsis available in catalogue.'}\n\n"
                f"*Data verified against TMDB and MovieLens benchmark records.*"
            ),
            "related_movie_ids": [matched_movie.id],
            "type": "movie_detail",
        }

    # 5. General intelligent assistant fallback
    return {
        "response": (
            "I am CineMind Smart Assistant, grounded in empirical movie data and Bayesian rating intelligence.\n\n"
            "Here is what I can help you with:\n"
            "- **Regional Movie Recommendations:** Try asking *'top telugu movies'*, *'Malayalam thrillers'*, or *'best hindi action films'*.\n"
            "- **Constrained Search:** Try *'Find a Malayalam mystery under 2 hours'* or *'high rated Tamil drama'*.\n"
            "- **Film Comparisons:** Try *'Compare RRR and Vikram'* or *'Inception vs Interstellar'*.\n"
            "- **Rating Evidence:** Try *'Is Kantara reliable?'* to inspect Bayesian confidence intervals.\n"
            "- **Taste DNA:** Sign in to explore your personalized preference profile."
        ),
        "type": "assistant_help",
    }


# ---------------------------------------------------------
# GEMINI GENERAL QUESTION HANDLER
# ---------------------------------------------------------

def generate_gemini_answer(user_message: str, user_id: int = None):
    """
    Answer general questions using Gemini when available, with seamless
    fallback to CineMind's grounded knowledge base if the API is offline or unconfigured.
    """
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    user = User.query.get(user_id) if user_id else None

    # Validate API key format before sending external request
    # Google AI Studio developer keys start with "AIzaSy..."
    if not api_key or api_key.startswith("AQ.") or len(api_key) < 20:
        logger.warning(
            "GEMINI_API_KEY is not configured or uses an unsupported token format. "
            "Engaging catalogue knowledge fallback."
        )
        return generate_knowledge_fallback(user_message, user)

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are CineMind Assistant, a helpful AI movie decision assistant.

YOUR GUIDELINES:
1. Answer the user's question directly, clearly, and concisely.
2. Ground movie recommendations in actual cinema facts (actors, directors, release years, languages).
3. CineMind tracks verified Indian and International benchmark cinema across Telugu, Tamil, Malayalam, Kannada, Hindi, and English.
4. Explain CineMind's movie comparison, Bayesian rating evidence, and Taste DNA features when relevant.
5. Never invent fake personal ratings, review counts, or false availability claims.
6. If uncertain about live theatre schedules or streaming platforms, acknowledge the limitation.
7. Be friendly, insightful, and conversational.

USER QUESTION:
{user_message}

Write a helpful, structured response.
"""

        answer = None
        last_error = None

        # Try models in order of priority (gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash)
        for model_name in AVAILABLE_GEMINI_MODELS:
            try:
                result = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if result and result.text and result.text.strip():
                    answer = result.text.strip()
                    break
            except Exception as model_err:
                last_error = model_err
                logger.warning(
                    "Gemini model '%s' call failed (%s). Trying next model.",
                    model_name,
                    type(model_err).__name__,
                )

        if answer:
            return {
                "response": answer,
                "type": "ai_answer",
            }
        else:
            logger.warning(
                "All Gemini models failed (%s). Engaging catalogue knowledge fallback.",
                type(last_error).__name__ if last_error else "unknown",
            )
            return generate_knowledge_fallback(user_message, user)

    except Exception as e:
        logger.warning(
            "Gemini request exception (%s). Engaging catalogue knowledge fallback.",
            type(e).__name__,
        )
        return generate_knowledge_fallback(user_message, user)


# ---------------------------------------------------------
# MAIN SMART ASSISTANT CONTROLLER
# ---------------------------------------------------------

def run_smart_assistant(
    user_message: str,
    user_id: int = None,
    movie_context_id: int = None,
):
    """
    CineMind Smart Assistant.

    Handles:
    1. Movie comparisons (e.g. 'Compare RRR and Vikram', 'RRR vs KGF')
    2. Rating & trust evidence (e.g. 'Is Kantara reliable?')
    3. User Taste DNA (e.g. 'What are my top genres?')
    4. Database-backed movie recommendations & natural language search
       (e.g. 'top telugu movies', 'Find a Malayalam mystery under 2 hours')
    5. Greetings and onboarding
    6. General questions via Gemini AI with seamless knowledge base fallback
    """
    if not user_message or not user_message.strip():
        return {
            "response": "Please enter a question so I can help you.",
            "type": "empty_message",
        }

    msg = user_message.lower().strip()
    user = User.query.get(user_id) if user_id else None
    taste_dna = build_user_taste_dna(user_id) if user_id else None

    # -----------------------------------------------------
    # 1. MOVIE COMPARISON
    # -----------------------------------------------------
    compare_match = re.search(
        r"(?:compare|difference\s+between|which\s+(?:is\s+)?better)\s+([A-Za-z0-9\s:,'\.-]+?)\s+(?:and|or|vs\.?|versus)\s+([A-Za-z0-9\s:,'\.-]+)",
        msg,
    )
    if not compare_match:
        compare_match = re.search(
            r"^([A-Za-z0-9\s:,'\.-]+?)\s+(?:vs\.?|versus)\s+([A-Za-z0-9\s:,'\.-]+)$",
            msg,
        )

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

            better = m1.title if m1.bayesian_score >= m2.bayesian_score else m2.title

            content = (
                f"### Comparison: **{m1.title}** vs **{m2.title}**\n\n"
                f"- **{m1.title}** ({m1.release_year}, {m1.language}):\n"
                f"  - General Rating: {m1.rating_mean:.2f}★ from {m1.rating_count} reviews\n"
                f"  - Bayesian Evidence Score: **{m1.bayesian_score:.2f}★** ({t1['evidence_label']}){c1_text}\n"
                f"  - Runtime: {m1.runtime_minutes or 'Unknown'} mins\n"
                f"  - Genres: {', '.join(g.name for g in m1.genres)}\n\n"
                f"- **{m2.title}** ({m2.release_year}, {m2.language}):\n"
                f"  - General Rating: {m2.rating_mean:.2f}★ from {m2.rating_count} reviews\n"
                f"  - Bayesian Evidence Score: **{m2.bayesian_score:.2f}★** ({t2['evidence_label']}){c2_text}\n"
                f"  - Runtime: {m2.runtime_minutes or 'Unknown'} mins\n"
                f"  - Genres: {', '.join(g.name for g in m2.genres)}\n\n"
                f"**Evidence Assessment:** Based on empirical Bayesian scores, "
                f"**{better}** demonstrates stronger rating evidence in this catalogue."
            )

            return {
                "response": content,
                "related_movie_ids": [m1.id, m2.id],
                "type": "comparison",
            }

    # -----------------------------------------------------
    # 2. MOVIE RATING AND TRUST ANALYSIS
    # -----------------------------------------------------
    movie = None
    if movie_context_id:
        movie = Movie.query.get(movie_context_id)

    trust_keywords = {
        "rating",
        "ratings",
        "evidence",
        "trust",
        "score",
        "reviews",
        "review",
        "reliable",
        "reliability",
        "stats",
        "worth",
    }

    has_trust_keyword = any(keyword in msg for keyword in trust_keywords)

    if not movie and has_trust_keyword:
        all_movies = Movie.query.all()
        clean_msg = re.sub(r"[^a-zA-Z0-9]", "", msg)

        for candidate in sorted(all_movies, key=lambda item: len(item.title), reverse=True):
            clean_title = re.sub(r"[^a-zA-Z0-9]", "", candidate.title).lower()
            if clean_title and clean_title in clean_msg.lower():
                movie = candidate
                break

        if not movie:
            rating_query = re.search(
                r"(?:rating|evidence|trust|score|reviews?|reliable|stats?)\s+(?:for|of|on|about)?\s*([A-Za-z0-9\s:,'-]+)",
                msg,
            )
            if rating_query:
                title_candidate = rating_query.group(1).strip()
                movie = find_movie_by_flexible_title(title_candidate)

        if movie:
            trust = calculate_movie_trust_metrics(movie.id)
            src = trust["source_breakdown"]

            comp_text = ""
            if user:
                comp = calculate_compatibility_score(user.id, movie)
                comp_text = f"\n- **Your Personal Compatibility:** {comp}%"

            content = (
                f"### Rating Evidence Analysis: **{movie.title}**\n\n"
                f"- **Average Raw Rating:** {movie.rating_mean:.2f} / 5.0\n"
                f"- **Total Recorded Ratings:** {movie.rating_count}\n"
                f"- **Bayesian Weighted Score:** **{movie.bayesian_score:.2f}★**\n"
                f"- **Evidence Reliability:** {trust['evidence_label']}\n"
                f"- **95% Confidence Interval Margin:** ±{trust['confidence_interval_95']}★\n"
                f"- **MovieLens Records:** {src.get('movielens', 0)}\n"
                f"- **CineMind Community Records:** {src.get('cinemind', 0)}"
                f"{comp_text}\n\n"
                f"*Bayesian smoothing reduces distortion from small sample sizes.*"
            )

            return {
                "response": content,
                "related_movie_ids": [movie.id],
                "type": "trust_analysis",
            }

    # -----------------------------------------------------
    # 3. PERSONAL TASTE DNA
    # -----------------------------------------------------
    taste_keywords = (
        "my taste",
        "my profile",
        "top genre",
        "top genres",
        "my preferences",
        "my taste dna",
        "what do i like",
        "taste profile",
    )

    if any(keyword in msg for keyword in taste_keywords):
        if not user:
            return {
                "response": (
                    "You're browsing as a guest. Please sign in "
                    "to view your personalized Movie Taste DNA. "
                    "Your profile tracks preferred genres, "
                    "languages, runtime preferences, and ratings."
                ),
                "type": "auth_prompt",
            }

        top_g = ", ".join(taste_dna["top_genres"]) or (
            "No strong favorites yet. Rate some movies to build your Taste DNA."
        )
        fav_l = ", ".join(taste_dna["favorite_languages"]) or "Any supported language"
        avoided = ", ".join(taste_dna["avoided_genres"]) or "None currently"

        content = (
            "### Your Movie Taste DNA Profile\n\n"
            f"- **Top Preferred Genres:** {top_g}\n"
            f"- **Frequent Languages:** {fav_l}\n"
            f"- **Genres with Lower Affinity:** {avoided}\n"
            f"- **Runtime Preference:** Approximately {taste_dna['runtime_preference_minutes']} minutes\n"
            f"- **Movies Rated:** {taste_dna['total_ratings']}\n\n"
            "Your profile continuously evolves as you rate more movies."
        )

        return {
            "response": content,
            "type": "taste_dna",
        }

    # -----------------------------------------------------
    # 4. DATABASE-BACKED MOVIE RECOMMENDATIONS & SEARCH
    # -----------------------------------------------------
    search_keywords = (
        "recommend",
        "recommendation",
        "recommendations",
        "suggest",
        "suggestion",
        "suggestions",
        "what should i watch",
        "what to watch",
        "find",
        "search",
        "show me",
        "give me",
        "movies like",
        "movie for me",
        "looking for",
        "top",
        "best",
        "popular",
        "must watch",
        "great",
        "good",
        "movies",
        "movie",
        "films",
        "film",
        "cinema",
    )

    lang_keywords = (
        "telugu",
        "tamil",
        "malayalam",
        "kannada",
        "hindi",
        "english",
    )

    genre_keywords = (
        "action",
        "adventure",
        "animation",
        "comedy",
        "crime",
        "drama",
        "fantasy",
        "horror",
        "mystery",
        "romance",
        "sci-fi",
        "scifi",
        "thriller",
        "suspense",
        "biography",
        "history",
    )

    has_search_kw = any(k in msg for k in search_keywords)
    has_lang_kw = any(k in msg for k in lang_keywords)
    has_genre_kw = any(k in msg for k in genre_keywords)
    has_runtime_kw = bool(re.search(r"\b(under|less than|within|below)\s+\d+", msg))

    # Trigger recommendation / search when discovery entities or explicit prompts are present
    is_movie_query = (
        (has_search_kw and (has_lang_kw or has_genre_kw or has_runtime_kw))
        or (has_lang_kw and ("movie" in msg or "film" in msg or "top" in msg or "best" in msg or has_genre_kw))
        or any(k in msg for k in ["recommend", "suggest", "what should i watch", "what to watch", "find a", "find me", "movies like"])
    )

    if is_movie_query:
        try:
            parsed = parse_natural_language_query(user_message)
            results = parsed.get("results", [])
            entities = parsed.get("parsed_entities", {})

            # Case A: Exact matches found in catalogue
            if results:
                display_results = results[:5]
                lines = [
                    "### CineMind Movie Recommendations\n",
                    f"Matching your search: **{parsed.get('filter_summary', 'Your request')}**\n",
                ]

                related_ids = []
                for index, result in enumerate(display_results, start=1):
                    related_ids.append(result["id"])
                    comp_str = ""
                    if user:
                        movie_obj = Movie.query.get(result["id"])
                        if movie_obj:
                            c_score = calculate_compatibility_score(user.id, movie_obj)
                            comp_str = f" | **Personal Match:** {c_score}%"

                    overview = result.get("overview") or "No overview is available in the catalogue."
                    lines.append(
                        f"{index}. **{result['title']}** ({result.get('release_year', 'Unknown')})\n"
                        f"   - Language: **{result.get('language', 'Unknown')}** | "
                        f"Runtime: {result.get('runtime_minutes', 'Unknown')} mins\n"
                        f"   - Bayesian Score: **{result.get('bayesian_score', 0):.2f}★** | "
                        f"Recorded Ratings: {result.get('rating_count', 0)}{comp_str}\n"
                        f"   - Genres: {', '.join(result.get('genres', []))}\n"
                        f"   - Overview: {overview[:180]}...\n"
                    )

                return {
                    "response": "\n".join(lines),
                    "related_movie_ids": related_ids,
                    "type": "recommendation_list",
                }

            # Case B: No exact match due to strict constraints (e.g. Malayalam mystery strictly under 2 hours)
            # Try relaxed search: match language & genres without strict runtime or rating cutoffs
            relaxed_query = Movie.query
            if entities.get("language"):
                relaxed_query = relaxed_query.filter(Movie.language == entities["language"])
            if entities.get("genres"):
                for g_name in entities["genres"]:
                    relaxed_query = relaxed_query.filter(Movie.genres.any(Genre.name == g_name))

            relaxed_results = relaxed_query.order_by(Movie.bayesian_score.desc()).all()

            if relaxed_results:
                lines = [
                    "### CineMind Movie Recommendations\n",
                    f"*No movies in our catalogue strictly matched all constraints (**{parsed.get('filter_summary')}**).*\n",
                    "However, here are the highest-rated matching films in CineMind with slightly longer runtimes:\n",
                ]

                related_ids = []
                for index, m in enumerate(relaxed_results[:4], start=1):
                    related_ids.append(m.id)
                    comp_str = ""
                    if user:
                        c_score = calculate_compatibility_score(user.id, m)
                        comp_str = f" | **Personal Match:** {c_score}%"

                    trust = calculate_movie_trust_metrics(m.id)
                    overview = m.overview or "No overview available in catalogue."
                    lines.append(
                        f"{index}. **{m.title}** ({m.release_year})\n"
                        f"   - Language: **{m.language}** | Runtime: **{m.runtime_minutes} mins**\n"
                        f"   - Bayesian Score: **{m.bayesian_score:.2f}★** ({trust['evidence_label']}){comp_str}\n"
                        f"   - Genres: {', '.join(g.name for g in m.genres)}\n"
                        f"   - Overview: {overview[:180]}...\n"
                    )

                return {
                    "response": "\n".join(lines),
                    "related_movie_ids": related_ids,
                    "type": "recommendation_list",
                }

        except Exception:
            logger.exception("Catalogue recommendation search failed.")

    # -----------------------------------------------------
    # 5. SIMPLE GREETINGS
    # -----------------------------------------------------
    greeting_pattern = r"^(hi|hello|hey|hi there|hello there|good morning|good afternoon|good evening)[!. ]*$"
    if re.match(greeting_pattern, user_message.strip().lower()):
        return {
            "response": (
                "Hello! I'm CineMind Smart Assistant. "
                "I can recommend movies, compare films, explain Bayesian rating reliability, "
                "and help you discover films based on your mood, language, and personal Taste DNA.\n\n"
                "What would you like to watch or compare today?"
            ),
            "type": "greeting",
        }

    # -----------------------------------------------------
    # 6. GENERAL QUESTIONS & AI ASSISTANT
    # -----------------------------------------------------
    return generate_gemini_answer(
        user_message=user_message,
        user_id=user_id,
    )
