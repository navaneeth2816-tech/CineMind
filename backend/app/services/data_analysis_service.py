"""
CineMind Data Analysis and Visualization Service
Genuine implementation using Pandas, NumPy, and Matplotlib for:
- Data extraction from MySQL via SQLAlchemy ORM (privacy-preserving: no user PII)
- Pandas DataFrame aggregations (by movie, by genre, by language)
- NumPy rating statistical computations (mean, median, std, min, max, percentiles)
- Matplotlib chart generation (dark-themed visualizations returned as Base64 and PNG streams)
- Top-rated movies filtering with configurable minimum-rating-count rule
"""

import io
import base64
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Headless backend for web server environments
import matplotlib.pyplot as plt

from app.models import db, Movie, Rating, Genre, movie_genres


# CineMind Dark Theme Palette for Matplotlib charts
THEME_BG = '#090d16'         # Deep dark slate background
THEME_AXES_BG = '#0f172a'    # Slate-900 chart axes background
THEME_GRID = '#334155'       # Slate-700 subtle gridlines
THEME_TEXT = '#f1f5f9'       # Slate-100 high-contrast titles/labels
THEME_SUBTEXT = '#94a3b8'    # Slate-400 tick labels and legends
ACCENT_PRIMARY = '#6366f1'   # Indigo-500
ACCENT_SECONDARY = '#8b5cf6' # Violet-500
ACCENT_CYAN = '#06b6d4'      # Cyan-500
ACCENT_AMBER = '#f59e0b'     # Amber-500
ACCENT_EMERALD = '#10b981'   # Emerald-500
ACCENT_ROSE = '#f43f5e'      # Rose-500

PALETTE = [
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', 
    '#06b6d4', '#14b8a6', '#10b981', '#f59e0b'
]


def _apply_dark_theme(fig, ax, title="", xlabel="", ylabel=""):
    """Applies CineMind dark mode styling to a Matplotlib figure and axis."""
    fig.patch.set_facecolor(THEME_BG)
    ax.set_facecolor(THEME_AXES_BG)
    
    # Title and Labels
    if title:
        ax.set_title(title, fontsize=13, fontweight='bold', color=THEME_TEXT, pad=12)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=10, fontweight='semibold', color=THEME_SUBTEXT, labelpad=8)
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=10, fontweight='semibold', color=THEME_SUBTEXT, labelpad=8)
        
    # Ticks & Grid
    ax.tick_params(colors=THEME_SUBTEXT, labelsize=9)
    ax.grid(True, linestyle='--', alpha=0.35, color=THEME_GRID)
    
    # Spines
    for spine in ax.spines.values():
        spine.set_color(THEME_GRID)
        spine.set_linewidth(0.8)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)


def _figure_to_base64_and_bytes(fig):
    """Encodes a matplotlib figure to both Base64 data URL and raw PNG bytes."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=140, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    raw_bytes = buf.getvalue()
    b64 = f"data:image/png;base64,{base64.b64encode(raw_bytes).decode('utf-8')}"
    return b64, raw_bytes


def get_ratings_dataframe():
    """
    Retrieves movie rating records from MySQL using SQLAlchemy into a Pandas DataFrame.
    Privacy Guarantee: Never loads user IDs, usernames, or email addresses.
    """
    ratings_query = db.session.query(
        Rating.id.label('rating_id'),
        Rating.movie_id,
        Rating.rating,
        Rating.source
    ).all()
    
    if not ratings_query:
        return pd.DataFrame(columns=['rating_id', 'movie_id', 'rating', 'source'])
        
    df = pd.DataFrame([
        {
            'rating_id': r.rating_id,
            'movie_id': r.movie_id,
            'rating': float(r.rating),
            'source': r.source or 'cinemind'
        }
        for r in ratings_query
    ])
    return df


def get_movies_dataframe():
    """
    Retrieves movie metadata from MySQL using SQLAlchemy into a Pandas DataFrame.
    """
    movies_query = db.session.query(
        Movie.id.label('movie_id'),
        Movie.title,
        Movie.language,
        Movie.release_year,
        Movie.runtime_minutes,
        Movie.bayesian_score
    ).all()
    
    if not movies_query:
        return pd.DataFrame(columns=['movie_id', 'title', 'language', 'release_year', 'runtime_minutes', 'bayesian_score'])
        
    df = pd.DataFrame([
        {
            'movie_id': m.movie_id,
            'title': m.title,
            'language': m.language,
            'release_year': m.release_year,
            'runtime_minutes': m.runtime_minutes or 0,
            'bayesian_score': float(m.bayesian_score or 0.0)
        }
        for m in movies_query
    ])
    return df


def get_genres_dataframe():
    """
    Retrieves movie-genre mappings from MySQL using SQLAlchemy into a Pandas DataFrame.
    """
    genres_query = db.session.query(
        movie_genres.c.movie_id,
        Genre.name.label('genre_name')
    ).join(Genre, movie_genres.c.genre_id == Genre.id).all()
    
    if not genres_query:
        return pd.DataFrame(columns=['movie_id', 'genre_name'])
        
    df = pd.DataFrame([
        {'movie_id': g.movie_id, 'genre_name': g.genre_name}
        for g in genres_query
    ])
    return df


# ==============================================================================
# 3. NumPy – Rating Statistics
# ==============================================================================

def calculate_numpy_rating_statistics(df_ratings: pd.DataFrame):
    """
    Uses NumPy arrays and statistical functions to compute rigorous dataset statistics:
    - Mean rating (np.mean)
    - Median rating (np.median)
    - Standard deviation (np.std)
    - Minimum and maximum ratings (np.min, np.max)
    - 25th and 75th percentiles (np.percentile)
    - Variance (np.var)
    - Star distribution via NumPy bincount
    Safely handles empty datasets or single-value arrays.
    """
    if df_ratings.empty or 'rating' not in df_ratings.columns or len(df_ratings['rating']) == 0:
        return {
            'total_ratings': 0,
            'mean': 0.0,
            'median': 0.0,
            'std_dev': 0.0,
            'variance': 0.0,
            'min': 0.0,
            'max': 0.0,
            'percentile_25': 0.0,
            'percentile_75': 0.0,
            'star_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            'star_percentages': {1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0}
        }

    # Convert to NumPy array
    ratings_arr = df_ratings['rating'].to_numpy(dtype=float)
    # Remove NaN values safely if any
    ratings_arr = ratings_arr[~np.isnan(ratings_arr)]
    
    if len(ratings_arr) == 0:
        return {
            'total_ratings': 0,
            'mean': 0.0,
            'median': 0.0,
            'std_dev': 0.0,
            'variance': 0.0,
            'min': 0.0,
            'max': 0.0,
            'percentile_25': 0.0,
            'percentile_75': 0.0,
            'star_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            'star_percentages': {1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0}
        }

    # Genuine NumPy Computations
    mean_val = float(np.mean(ratings_arr))
    median_val = float(np.median(ratings_arr))
    std_val = float(np.std(ratings_arr))
    var_val = float(np.var(ratings_arr))
    min_val = float(np.min(ratings_arr))
    max_val = float(np.max(ratings_arr))
    p25 = float(np.percentile(ratings_arr, 25))
    p75 = float(np.percentile(ratings_arr, 75))

    # Star distribution calculation using NumPy clip, round, and bincount
    rounded = np.clip(np.round(ratings_arr), 1, 5).astype(int)
    counts = np.bincount(rounded, minlength=6)
    
    star_dist = {star: int(counts[star]) for star in range(1, 6)}
    total = len(ratings_arr)
    star_pct = {
        star: round((star_dist[star] / max(1, total)) * 100, 1)
        for star in range(1, 6)
    }

    return {
        'total_ratings': int(total),
        'mean': round(mean_val, 3),
        'median': round(median_val, 2),
        'std_dev': round(std_val, 3),
        'variance': round(var_val, 3),
        'min': round(min_val, 1),
        'max': round(max_val, 1),
        'percentile_25': round(p25, 2),
        'percentile_75': round(p75, 2),
        'star_distribution': star_dist,
        'star_percentages': star_pct
    }


# ==============================================================================
# 2. Pandas – Rating Analysis & Aggregations
# ==============================================================================

def analyze_ratings_with_pandas(df_ratings: pd.DataFrame, df_movies: pd.DataFrame, df_genres: pd.DataFrame, min_ratings: int = 5):
    """
    Performs comprehensive relational aggregations using Pandas DataFrames:
    - Aggregates ratings by movie (count, mean, sum)
    - Groups ratings by genre (average rating, count of ratings, movie count)
    - Computes top-rated movies adhering strictly to the minimum-rating threshold rule
    - Groups ratings by language / region
    """
    if df_ratings.empty or df_movies.empty:
        return {
            'movie_aggregations': [],
            'genre_aggregations': [],
            'regional_aggregations': [],
            'top_rated_movies': [],
            'min_ratings_threshold': min_ratings,
            'movies_evaluated': len(df_movies),
            'movies_qualified': 0
        }

    # 1. Aggregate ratings by movie
    movie_stats = df_ratings.groupby('movie_id').agg(
        rating_count=('rating', 'count'),
        rating_mean=('rating', 'mean')
    ).reset_index()

    # Merge with movie metadata
    merged_movies = pd.merge(df_movies, movie_stats, on='movie_id', how='left')
    merged_movies['rating_count'] = merged_movies['rating_count'].fillna(0).astype(int)
    merged_movies['rating_mean'] = merged_movies['rating_mean'].fillna(0.0).round(2)

    # 2. Genre Analysis via Pandas Merge & GroupBy
    genre_data = []
    if not df_genres.empty:
        # Merge ratings with movie genres
        merged_genres = pd.merge(df_genres, df_ratings, on='movie_id', how='inner')
        if not merged_genres.empty:
            genre_stats = merged_genres.groupby('genre_name').agg(
                genre_rating_count=('rating', 'count'),
                genre_rating_mean=('rating', 'mean'),
                unique_movies=('movie_id', 'nunique')
            ).reset_index()

            genre_stats['genre_rating_mean'] = genre_stats['genre_rating_mean'].round(2)
            genre_stats = genre_stats.sort_values(by='genre_rating_mean', ascending=False)
            
            genre_data = [
                {
                    'genre': row['genre_name'],
                    'average_rating': float(row['genre_rating_mean']),
                    'ratings_count': int(row['genre_rating_count']),
                    'movies_count': int(row['unique_movies'])
                }
                for _, row in genre_stats.iterrows()
            ]

    # 3. Regional / Language Aggregations via Pandas
    regional_data = []
    if not df_movies.empty:
        lang_stats = merged_movies.groupby('language').agg(
            titles_count=('movie_id', 'count'),
            total_ratings=('rating_count', 'sum'),
            avg_rating=('rating_mean', 'mean'),
            avg_bayesian=('bayesian_score', 'mean'),
            avg_runtime=('runtime_minutes', 'mean')
        ).reset_index()

        lang_stats['avg_rating'] = lang_stats['avg_rating'].round(2)
        lang_stats['avg_bayesian'] = lang_stats['avg_bayesian'].round(2)
        lang_stats['avg_runtime'] = lang_stats['avg_runtime'].round(0).astype(int)
        lang_stats = lang_stats.sort_values(by='titles_count', ascending=False)

        regional_data = [
            {
                'language': row['language'],
                'titles_count': int(row['titles_count']),
                'total_ratings': int(row['total_ratings']),
                'average_rating': float(row['avg_rating']),
                'average_bayesian_score': float(row['avg_bayesian']),
                'average_runtime_minutes': int(row['avg_runtime'])
            }
            for _, row in lang_stats.iterrows()
        ]

    # 4. Top-Rated Movies Rule: Minimum rating count filter (Requirement 5)
    # Movies with fewer than min_ratings are strictly filtered out
    qualified_movies = merged_movies[merged_movies['rating_count'] >= min_ratings].copy()
    
    # Sort by rating_mean desc, then rating_count desc
    qualified_movies = qualified_movies.sort_values(
        by=['rating_mean', 'rating_count'], 
        ascending=[False, False]
    )

    top_rated_list = [
        {
            'movie_id': int(row['movie_id']),
            'title': row['title'],
            'language': row['language'],
            'release_year': int(row['release_year']),
            'rating_mean': float(row['rating_mean']),
            'rating_count': int(row['rating_count']),
            'bayesian_score': float(row['bayesian_score']),
            'meets_threshold': True
        }
        for _, row in qualified_movies.iterrows()
    ]

    all_movies_summary = [
        {
            'movie_id': int(row['movie_id']),
            'title': row['title'],
            'language': row['language'],
            'rating_mean': float(row['rating_mean']),
            'rating_count': int(row['rating_count']),
            'bayesian_score': float(row['bayesian_score']),
            'meets_threshold': bool(row['rating_count'] >= min_ratings)
        }
        for _, row in merged_movies.sort_values(by='rating_count', ascending=False).iterrows()
    ]

    return {
        'movie_aggregations': all_movies_summary,
        'genre_aggregations': genre_data,
        'regional_aggregations': regional_data,
        'top_rated_movies': top_rated_list,
        'min_ratings_threshold': min_ratings,
        'movies_evaluated': len(merged_movies),
        'movies_qualified': len(qualified_movies)
    }


# ==============================================================================
# 4. Matplotlib – Data Visualization (Dark Theme)
# ==============================================================================

def create_genre_analysis_chart(genre_data: list):
    """
    Chart 1: Genre Analysis – Average rating by movie genre.
    Renders horizontal bar chart sorted by rating with count annotations.
    """
    if not genre_data:
        fig, ax = plt.subplots(figsize=(7, 4))
        _apply_dark_theme(fig, ax, title="Genre Analysis (No Data)")
        return _figure_to_base64_and_bytes(fig)

    # Sort ascending for horizontal bar chart (highest at top)
    sorted_genres = sorted(genre_data, key=lambda x: x['average_rating'])
    names = [g['genre'] for g in sorted_genres]
    scores = [g['average_rating'] for g in sorted_genres]
    counts = [g['ratings_count'] for g in sorted_genres]

    fig, ax = plt.subplots(figsize=(8, max(4.5, len(names) * 0.42)))
    _apply_dark_theme(fig, ax, title="Genre Rating Analysis (Average Rating by Genre)", xlabel="Average Rating (Stars)")

    # Color gradient from violet to cyan
    colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(names)))
    bars = ax.barh(names, scores, color=colors, height=0.65, edgecolor='#475569', linewidth=0.6)

    # Value labels on bars
    for bar, score, count in zip(bars, scores, counts):
        width = bar.get_width()
        ax.text(
            width + 0.05, bar.get_y() + bar.get_height() / 2,
            f"{score:.2f}★ ({count} ratings)",
            ha='left', va='center',
            fontsize=8.5, fontweight='bold', color=THEME_TEXT
        )

    ax.set_xlim(0, 5.5)
    ax.axvline(x=4.0, color=ACCENT_AMBER, linestyle=':', alpha=0.6, label='High Quality Baseline (4.0★)')
    ax.legend(loc='lower right', facecolor=THEME_AXES_BG, edgecolor=THEME_GRID, labelcolor=THEME_SUBTEXT, fontsize=8)

    return _figure_to_base64_and_bytes(fig)


def create_rating_distribution_chart(stats: dict):
    """
    Chart 2: Rating Distribution – Number of 1-star to 5-star ratings.
    Renders styled vertical bar chart with percentage and count labels.
    """
    star_dist = stats.get('star_distribution', {1: 0, 2: 0, 3: 0, 4: 0, 5: 0})
    total = stats.get('total_ratings', sum(star_dist.values()))

    stars = [1, 2, 3, 4, 5]
    counts = [star_dist.get(s, 0) for s in stars]
    labels = [f"{s} Star" if s == 1 else f"{s} Stars" for s in stars]

    fig, ax = plt.subplots(figsize=(7, 4.2))
    _apply_dark_theme(fig, ax, title="Global Rating Distribution (1★ to 5★)", xlabel="Rating Tier", ylabel="Number of Ratings")

    # Star-themed colors: red/orange for low, amber/emerald for high
    star_colors = ['#f43f5e', '#fb923c', '#facc15', '#818cf8', '#10b981']
    bars = ax.bar(labels, counts, color=star_colors, width=0.55, edgecolor='#334155', linewidth=0.8)

    # Value labels on top of bars
    for bar, count in zip(bars, counts):
        height = bar.get_height()
        pct = (count / max(1, total)) * 100
        ax.text(
            bar.get_x() + bar.get_width() / 2, height + max(1, total * 0.015),
            f"{count:,}\n({pct:.1f}%)",
            ha='center', va='bottom',
            fontsize=8.5, fontweight='bold', color=THEME_TEXT
        )

    # Statistical annotation box
    mean_val = stats.get('mean', 0.0)
    median_val = stats.get('median', 0.0)
    std_val = stats.get('std_dev', 0.0)
    info_text = f"Total: {total:,}\nMean: {mean_val:.2f}★\nMedian: {median_val:.1f}★\nStd Dev: {std_val:.2f}"
    ax.text(
        0.03, 0.95, info_text, transform=ax.transAxes,
        ha='left', va='top', fontsize=8.5, color=THEME_TEXT,
        bbox=dict(boxstyle='round,pad=0.5', facecolor=THEME_AXES_BG, edgecolor=ACCENT_PRIMARY, alpha=0.9)
    )

    max_c = max(counts) if counts else 10
    ax.set_ylim(0, max_c * 1.25)
    return _figure_to_base64_and_bytes(fig)


def create_top_rated_movies_chart(top_movies: list, min_threshold: int = 5, limit: int = 8):
    """
    Chart 3: Top-Rated Movies – Comparison of top movie ratings.
    Renders comparative horizontal bar chart strictly reflecting the minimum-rating rule.
    """
    if not top_movies:
        fig, ax = plt.subplots(figsize=(7.5, 4))
        _apply_dark_theme(fig, ax, title=f"Top-Rated Movies (Min {min_threshold} Ratings Required - None Qualified)")
        return _figure_to_base64_and_bytes(fig)

    display_movies = top_movies[:limit]
    # Reverse so top is at top of vertical axis
    display_movies = list(reversed(display_movies))

    titles = [f"{m['title']} ({m['language']})" for m in display_movies]
    scores = [m['rating_mean'] for m in display_movies]
    counts = [m['rating_count'] for m in display_movies]

    fig, ax = plt.subplots(figsize=(8.5, max(4.2, len(titles) * 0.48)))
    _apply_dark_theme(
        fig, ax, 
        title=f"Verified Top-Rated Movies (Minimum {min_threshold}+ Ratings Threshold)", 
        xlabel="Sample Mean Rating (Stars)"
    )

    bars = ax.barh(titles, scores, color=ACCENT_SECONDARY, height=0.6, edgecolor='#475569', linewidth=0.6)

    for bar, score, count in zip(bars, scores, counts):
        width = bar.get_width()
        ax.text(
            width + 0.04, bar.get_y() + bar.get_height() / 2,
            f"{score:.2f}★  [{count} reviews]",
            ha='left', va='center',
            fontsize=8.5, fontweight='bold', color=THEME_TEXT
        )

    ax.set_xlim(0, 5.5)
    ax.axvline(x=4.5, color=ACCENT_EMERALD, linestyle='--', alpha=0.5, label='Masterpiece Tier (4.5★)')
    ax.legend(loc='lower right', facecolor=THEME_AXES_BG, edgecolor=THEME_GRID, labelcolor=THEME_SUBTEXT, fontsize=8)

    return _figure_to_base64_and_bytes(fig)


def create_regional_comparison_chart(regional_data: list):
    """
    Chart 4: Regional Rating Comparison – Rating comparisons across supported languages.
    Compares average Bayesian ratings and sample volumes across regional industries.
    """
    if not regional_data:
        fig, ax = plt.subplots(figsize=(7.5, 4))
        _apply_dark_theme(fig, ax, title="Regional Comparison (No Data)")
        return _figure_to_base64_and_bytes(fig)

    # Sort by total titles or average rating
    languages = [r['language'] for r in regional_data]
    avg_scores = [r['average_bayesian_score'] for r in regional_data]
    total_ratings = [r['total_ratings'] for r in regional_data]

    x = np.arange(len(languages))
    width = 0.45

    fig, ax1 = plt.subplots(figsize=(8.5, 4.5))
    _apply_dark_theme(fig, ax1, title="Regional Cinema Rating & Volume Benchmark", ylabel="Average Bayesian Score (Stars)")

    # Bar chart for rating scores
    bars = ax1.bar(x, avg_scores, width, color=ACCENT_PRIMARY, edgecolor='#4338ca', label='Average Bayesian Score')
    ax1.set_ylim(0, 5.5)
    ax1.set_xticks(x)
    ax1.set_xticklabels(languages, fontweight='semibold', color=THEME_TEXT)

    # Annotate score on top of each bar
    for bar, score in zip(bars, avg_scores):
        height = bar.get_height()
        ax1.text(
            bar.get_x() + bar.get_width() / 2, height + 0.08,
            f"{score:.2f}★",
            ha='center', va='bottom',
            fontsize=8.5, fontweight='bold', color=THEME_TEXT
        )

    # Secondary axis for total ratings volume
    ax2 = ax1.twinx()
    ax2.set_facecolor('none')
    ax2.plot(x, total_ratings, color=ACCENT_AMBER, marker='o', linewidth=2, markersize=6, label='Review Sample Volume')
    ax2.set_ylabel("Total Reviews Sample", color=ACCENT_AMBER, fontsize=10, labelpad=8)
    ax2.tick_params(colors=ACCENT_AMBER, labelsize=9)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_color(ACCENT_AMBER)
    ax2.spines['left'].set_color(THEME_GRID)
    ax2.grid(False)

    # Combined legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right', facecolor=THEME_AXES_BG, edgecolor=THEME_GRID, labelcolor=THEME_SUBTEXT, fontsize=8)

    return _figure_to_base64_and_bytes(fig)


# ==============================================================================
# Master Unified Analytics Generator
# ==============================================================================

def generate_complete_analytics_report(min_ratings: int = 5):
    """
    Orchestrates:
    1. Pandas extraction from MySQL
    2. NumPy statistical calculations
    3. Pandas aggregations (movie, genre, language, top-rated filter)
    4. Matplotlib chart rendering (4 charts)
    Returns clean JSON-ready dictionary with Base64 chart URLs and numerical stats.
    """
    df_ratings = get_ratings_dataframe()
    df_movies = get_movies_dataframe()
    df_genres = get_genres_dataframe()

    # NumPy calculations
    numpy_stats = calculate_numpy_rating_statistics(df_ratings)

    # Pandas aggregations
    pandas_analysis = analyze_ratings_with_pandas(
        df_ratings, df_movies, df_genres, min_ratings=min_ratings
    )

    # Matplotlib chart generation
    genre_b64, genre_bytes = create_genre_analysis_chart(pandas_analysis['genre_aggregations'])
    dist_b64, dist_bytes = create_rating_distribution_chart(numpy_stats)
    top_b64, top_bytes = create_top_rated_movies_chart(pandas_analysis['top_rated_movies'], min_threshold=min_ratings)
    reg_b64, reg_bytes = create_regional_comparison_chart(pandas_analysis['regional_aggregations'])

    return {
        'statistics': numpy_stats,
        'analysis': pandas_analysis,
        'charts': {
            'genre_analysis': genre_b64,
            'rating_distribution': dist_b64,
            'top_rated_movies': top_b64,
            'regional_comparison': reg_b64
        },
        'raw_chart_bytes': {
            'genre_analysis': genre_bytes,
            'rating_distribution': dist_bytes,
            'top_rated_movies': top_bytes,
            'regional_comparison': reg_bytes
        }
    }
