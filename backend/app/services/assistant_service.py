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

logger = logging.getLogger(__name__)

# Load the backend .env file reliably.
BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


# ---------------------------------------------------------
# MOVIE SEARCH
# ---------------------------------------------------------

def find_movie_by_flexible_title(name: str):
    """Find a movie even when punctuation differs, such as K.G.F and KGF."""

    if not name:
        return None

    name_stripped = name.strip()

    direct = Movie.query.filter(
        Movie.title.ilike(f"%{name_stripped}%")
    ).first()

    if direct:
        return direct

    clean_target = re.sub(
        r"[^a-zA-Z0-9]", "", name_stripped
    ).lower()

    if not clean_target:
        return None

    all_movies = Movie.query.all()

    for movie in all_movies:
        clean_title = re.sub(
            r"[^a-zA-Z0-9]", "", movie.title
        ).lower()

        if clean_target in clean_title or clean_title in clean_target:
            return movie

    return None


# ---------------------------------------------------------
# GEMINI GENERAL QUESTION HANDLER
# ---------------------------------------------------------

def generate_gemini_answer(user_message: str, user_id: int = None):
    """
    Answer general questions using Gemini.

    Movie ratings and database facts should come from the
    application's database-backed features, not invented claims.
    """

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        logger.error("GEMINI_API_KEY is missing.")

        return {
            "response": (
                "My AI service is not configured yet. "
                "Please check the GEMINI_API_KEY in backend/.env "
                "and restart the backend."
            ),
            "type": "configuration_error",
        }

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are CineMind Assistant, a helpful AI movie decision assistant.

YOUR RESPONSIBILITIES:

1. Understand the user's actual question.
2. Respond directly instead of repeating a welcome message.
3. Help users discover movies and make viewing decisions.
4. Ask useful follow-up questions when preferences are unclear.
5. Explain CineMind's movie comparison, rating analysis,
   recommendation, and Taste DNA features.
6. Help users explore genres, languages, storytelling,
   actors, directors, and movie styles.
7. Never invent database ratings, review counts, or personal
   user preferences.
8. Never claim to have searched CineMind's database unless
   actual database results were supplied.
9. If you do not know a fact, acknowledge the uncertainty.
10. Be friendly, clear, concise, and conversational.
11. Do not repeat the full welcome message for every question.
12. If the user asks for a recommendation but provides no
    preferences, ask about genre, language, or mood.
13. If asked for current releases or current availability,
    explain that you cannot verify live information unless
    a reliable current data source is available.

CINEMIND CAPABILITIES:

- Movie comparisons using the application's database.
- Movie rating reliability analysis.
- Database-backed movie discovery.
- Personal Taste DNA for signed-in users.
- General movie guidance and viewing suggestions.

USER QUESTION:
{user_message}

Write a relevant answer to the user's question.
"""

        result = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
        )

        answer = (result.text or "").strip()

        if not answer:
            return {
                "response": (
                    "I couldn't generate an answer just now. "
                    "Please try asking your question again."
                ),
                "type": "ai_empty_response",
            }

        return {
            "response": answer,
            "type": "ai_answer",
        }

    except Exception:
        import traceback
        traceback.print_exc()
        logger.exception("Gemini request failed.")

        return {
            "response": (
                "I'm having trouble connecting to my AI service. "
                "Please try again shortly."
            ),
            "type": "ai_error",
        }


# ---------------------------------------------------------
# MAIN SMART ASSISTANT
# ---------------------------------------------------------

def run_smart_assistant(
    user_message: str,
    user_id: int = None,
    movie_context_id: int = None,
):
    """
    CineMind Smart Assistant.

    Uses database-backed logic for movie comparisons, rating
    evidence, Taste DNA, and recommendations. Uses Gemini for
    general questions and requests not handled by those features.
    """

    if not user_message or not user_message.strip():
        return {
            "response": "Please enter a question so I can help you.",
            "type": "empty_message",
        }

    msg = user_message.lower().strip()

    # Load the user and their Taste DNA when available.
    user = User.query.get(user_id) if user_id else None

    taste_dna = (
        build_user_taste_dna(user_id)
        if user_id
        else None
    )

    # -----------------------------------------------------
    # 1. MOVIE COMPARISON
    # -----------------------------------------------------

    compare_match = re.search(
        r"(?:compare|difference\s+between|which\s+(?:is\s+)?better)"
        r"\s+([A-Za-z0-9\s:,'\.-]+?)"
        r"\s+(?:and|or|vs|versus)\s+"
        r"([A-Za-z0-9\s:,'\.-]+)",
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

            better = (
                m1.title
                if m1.bayesian_score >= m2.bayesian_score
                else m2.title
            )

            content = (
                f"### Comparison: **{m1.title}** vs **{m2.title}**\n\n"
                f"- **{m1.title}** ({m1.release_year}, {m1.language}):\n"
                f"  - General Rating: {m1.rating_mean:.2f}★ "
                f"from {m1.rating_count} reviews\n"
                f"  - Bayesian Evidence Score: "
                f"**{m1.bayesian_score:.2f}★** "
                f"({t1['evidence_label']}){c1_text}\n"
                f"  - Runtime: {m1.runtime_minutes or 'Unknown'} mins\n"
                f"  - Genres: "
                f"{', '.join(g.name for g in m1.genres)}\n\n"
                f"- **{m2.title}** ({m2.release_year}, {m2.language}):\n"
                f"  - General Rating: {m2.rating_mean:.2f}★ "
                f"from {m2.rating_count} reviews\n"
                f"  - Bayesian Evidence Score: "
                f"**{m2.bayesian_score:.2f}★** "
                f"({t2['evidence_label']}){c2_text}\n"
                f"  - Runtime: {m2.runtime_minutes or 'Unknown'} mins\n"
                f"  - Genres: "
                f"{', '.join(g.name for g in m2.genres)}\n\n"
                f"**Evidence Assessment:** Based on the stored "
                f"Bayesian scores, **{better}** has the stronger "
                f"empirical rating evidence in this catalogue."
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

    has_trust_keyword = any(
        keyword in msg for keyword in trust_keywords
    )

    if not movie and has_trust_keyword:
        all_movies = Movie.query.all()

        clean_msg = re.sub(
            r"[^a-zA-Z0-9]", "", msg
        )

        for candidate in sorted(
            all_movies,
            key=lambda item: len(item.title),
            reverse=True,
        ):
            clean_title = re.sub(
                r"[^a-zA-Z0-9]", "", candidate.title
            ).lower()

            if clean_title and clean_title in clean_msg.lower():
                movie = candidate
                break

        if not movie:
            rating_query = re.search(
                r"(?:rating|evidence|trust|score|reviews?|"
                r"reliable|stats?)\s+(?:for|of|on|about)?\s*"
                r"([A-Za-z0-9\s:,'-]+)",
                msg,
            )

            if rating_query:
                title_candidate = rating_query.group(1).strip()
                movie = find_movie_by_flexible_title(
                    title_candidate
                )

        if movie:
            trust = calculate_movie_trust_metrics(movie.id)
            src = trust["source_breakdown"]

            comp_text = ""

            if user:
                comp = calculate_compatibility_score(
                    user.id, movie
                )
                comp_text = (
                    f"\n- **Your Personal Compatibility:** {comp}%"
                )

            content = (
                f"### Rating Evidence Analysis: **{movie.title}**\n\n"
                f"- **Average Raw Rating:** "
                f"{movie.rating_mean:.2f} / 5.0\n"
                f"- **Total Recorded Ratings:** "
                f"{movie.rating_count}\n"
                f"- **Bayesian Weighted Score:** "
                f"**{movie.bayesian_score:.2f}★**\n"
                f"- **Evidence Reliability:** "
                f"{trust['evidence_label']}\n"
                f"- **95% Confidence Interval Margin:** "
                f"±{trust['confidence_interval_95']}★\n"
                f"- **MovieLens Records:** "
                f"{src.get('movielens', 0)}\n"
                f"- **CineMind Community Records:** "
                f"{src.get('cinemind', 0)}"
                f"{comp_text}\n\n"
                f"*Bayesian smoothing helps reduce the influence "
                f"of unusually high or low ratings based on a "
                f"small sample.*"
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
    )

    if any(keyword in msg for keyword in taste_keywords):
        if not user:
            return {
                "response": (
                    "You're browsing as a guest. Please sign in "
                    "to view your personalized Movie Taste DNA. "
                    "Your profile can show preferred genres, "
                    "languages, runtime preferences, and ratings."
                ),
                "type": "auth_prompt",
            }

        top_g = ", ".join(taste_dna["top_genres"]) or (
            "No strong favorites yet. Rate some movies to build "
            "your Taste DNA."
        )

        fav_l = ", ".join(
            taste_dna["favorite_languages"]
        ) or "Any supported language"

        avoided = ", ".join(
            taste_dna["avoided_genres"]
        ) or "None currently"

        content = (
            "### Your Movie Taste DNA Profile\n\n"
            f"- **Top Preferred Genres:** {top_g}\n"
            f"- **Frequent Languages:** {fav_l}\n"
            f"- **Genres with Lower Affinity:** {avoided}\n"
            f"- **Runtime Preference:** "
            f"Approximately {taste_dna['runtime_preference_minutes']} "
            f"minutes\n"
            f"- **Movies Rated:** {taste_dna['total_ratings']}\n\n"
            "Your profile can evolve as you rate more movies."
        )

        return {
            "response": content,
            "type": "taste_dna",
        }

    # -----------------------------------------------------
    # 4. DATABASE-BACKED MOVIE RECOMMENDATIONS
    # -----------------------------------------------------

    recommendation_keywords = (
        "recommend",
        "suggest",
        "what should i watch",
        "find me a",
        "movies like",
        "movie for me",
    )

    is_recommendation = any(
        keyword in msg for keyword in recommendation_keywords
    )

    if is_recommendation:
        try:
            from app.services.nl_search_service import (
                parse_natural_language_query,
            )

            parsed = parse_natural_language_query(user_message)
            results = parsed.get("results", [])[:4]

            if results:
                lines = [
                    "### CineMind Movie Recommendations\n",
                    f"Matching your search: "
                    f"**{parsed.get('filter_summary', 'Your request')}**\n",
                ]

                related_ids = []

                for index, result in enumerate(results, start=1):
                    related_ids.append(result["id"])

                    comp_str = ""
                    if user:
                        movie_obj = Movie.query.get(result["id"])

                        if movie_obj:
                            c_score = calculate_compatibility_score(
                                user.id, movie_obj
                            )
                            comp_str = (
                                f" | **Personal Match:** {c_score}%"
                            )

                    overview = (
                        result.get("overview")
                        or "No overview is available in the catalogue."
                    )

                    lines.append(
                        f"{index}. **{result['title']}** "
                        f"({result.get('release_year', 'Unknown')})\n"
                        f"   - Language: "
                        f"{result.get('language', 'Unknown')}\n"
                        f"   - Bayesian Score: "
                        f"{result.get('bayesian_score', 0):.1f}★\n"
                        f"   - Recorded Ratings: "
                        f"{result.get('rating_count', 0)}"
                        f"{comp_str}\n"
                        f"   - Overview: {overview[:200]}\n"
                    )

                return {
                    "response": "\n".join(lines),
                    "related_movie_ids": related_ids,
                    "type": "recommendation_list",
                }

            # No database matches: allow Gemini to respond instead
            # of returning the same generic no-results message.

        except Exception:
            logger.exception(
                "Catalogue recommendation search failed."
            )

            # Fall through to Gemini for a helpful response.
    # -----------------------------------------------------
    # 5. HANDLE SIMPLE GREETINGS
    # -----------------------------------------------------

    greeting_pattern = r"^(hi|hello|hey|hi there|hello there)[!. ]*$"

    if re.match(greeting_pattern, user_message.strip().lower()):
        return {
            "response": (
                "Hello! I'm CineMind Smart Assistant. "
                "I can recommend movies, compare films, explain rating reliability, "
                "and help you discover movies based on your mood, language, and genre. "
                "What would you like to watch?"
            ),
            "type": "greeting"
        }

    # -----------------------------------------------------
    # 6. GENERAL QUESTIONS: GEMINI
    # -----------------------------------------------------

    return generate_gemini_answer(
        user_message=user_message,
        user_id=user_id,
    )