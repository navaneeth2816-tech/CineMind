import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Sparkles, Filter, SlidersHorizontal, Star, 
  Bookmark, BookmarkCheck, ArrowRight, ShieldCheck, 
  RotateCcw, Scale, Zap, Info
} from 'lucide-react';
import MoviePoster from '../components/MoviePoster';

export default function DiscoverPage({ onOpenDecisionReport }) {
  const { user, isAuthenticated, watchlistIds, toggleWatchlist } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [genresList, setGenresList] = useState([]);
  const [languagesList, setLanguagesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxRuntime, setMaxRuntime] = useState(200);
  const [sortBy, setSortBy] = useState('bayesian');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Natural Language Search state (PRD Section 6.9)
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [nlSearching, setNlSearching] = useState(false);

  // Load genres and languages
  useEffect(() => {
    Promise.all([api.getGenres(), api.getLanguages()])
      .then(([gData, lData]) => {
        setGenresList(gData.genres || []);
        setLanguagesList(lData.languages || []);
      })
      .catch(console.error);
  }, []);

  // Check URL query params (e.g. from navbar search ?selected=12)
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId && onOpenDecisionReport) {
      onOpenDecisionReport(Number(selectedId));
    }
  }, [searchParams, onOpenDecisionReport]);

  // Load personalized recommendations row
  useEffect(() => {
    api.getRecommendations(6)
      .then(res => setRecommendations(res.recommendations || []))
      .catch(console.error);
  }, [user]);

  // Fetch catalogue movies on filter change
  useEffect(() => {
    setLoading(true);
    api.getMovies({
      page,
      limit: 12,
      genre: selectedGenre,
      language: selectedLanguage,
      min_rating: minRating > 0 ? minRating : undefined,
      max_runtime: maxRuntime < 200 ? maxRuntime : undefined,
      sort_by: sortBy
    })
      .then(res => {
        setMovies(res.movies || []);
        setTotalPages(res.total_pages || 1);
        setTotalCount(res.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, selectedGenre, selectedLanguage, minRating, maxRuntime, sortBy, user]);

  // Natural Language Query submit
  const handleNlSearch = async (e) => {
    if (e) e.preventDefault();
    if (!nlQuery.trim()) return;

    setNlSearching(true);
    try {
      const res = await api.naturalLanguageSearch(nlQuery);
      setNlResult(res);
      if (res.results) {
        setMovies(res.results);
        setTotalCount(res.match_count);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('NL Search error:', err);
    } finally {
      setNlSearching(false);
    }
  };

  const clearNlSearch = () => {
    setNlQuery('');
    setNlResult(null);
    setPage(1);
  };

  const handleCompareClick = (movieId) => {
    navigate(`/compare?ids=${movieId}`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Hero Banner with Natural Language Search */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-900/40 p-6 sm:p-10 shadow-2xl">
        {/* Glow orb */}
        <div className="absolute top-0 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-600/40 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Decision Intelligence • Bayesian Verified Ratings</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Stop Guessing What to Watch. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400">
              Decide with Pure Evidence.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            CineMind blends authentic MovieLens statistics, rich Indian regional cinema, Bayesian evidence smoothing, and personal Taste DNA to deliver transparent movie intelligence.
          </p>

          {/* Natural Language Query Bar (PRD Section 6.9) */}
          <form onSubmit={handleNlSearch} className="relative max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden focus-within:border-indigo-500 transition">
              <Search className="w-5 h-5 text-indigo-400 ml-4 shrink-0" />
              <input
                type="text"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="Ask in natural language: e.g. 'Find a Telugu thriller under 2 hours with high rating'"
                className="w-full px-3 py-3.5 text-xs sm:text-sm bg-transparent text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={nlSearching || !nlQuery.trim()}
                className="mr-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition flex items-center space-x-1.5 shrink-0 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {nlSearching ? (
                  <span>Parsing...</span>
                ) : (
                  <>
                    <span>Extract & Search</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick NL Query Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="text-slate-500">Try queries:</span>
            {[
              'Telugu action movie under 3 hours',
              'Malayalam mystery thriller',
              'Top rated sci-fi movies',
              'Hindi comedy with high rating'
            ].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setNlQuery(q);
                  api.naturalLanguageSearch(q).then(res => {
                    setNlResult(res);
                    if (res.results) {
                      setMovies(res.results);
                      setTotalCount(res.match_count);
                      setTotalPages(1);
                    }
                  });
                }}
                className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition"
              >
                "{q}"
              </button>
            ))}
          </div>

          {/* Natural Language Filter Extraction Card */}
          {nlResult && (
            <div className="mt-4 p-4 bg-slate-900/90 border border-indigo-500/40 rounded-2xl text-left text-xs space-y-2 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>Extracted Structured Constraints (PRD Section 6.9)</span>
                </div>
                <button
                  type="button"
                  onClick={clearNlSearch}
                  className="flex items-center space-x-1 text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Full Catalogue</span>
                </button>
              </div>
              <div className="text-slate-300 font-medium bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                {nlResult.filter_summary}
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Found {nlResult.match_count} verified catalogue matches</span>
                {nlResult.clarifications?.length > 0 && (
                  <span className="text-amber-400 italic">{nlResult.clarifications[0]}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Personalized Recommendations Row (PRD Section 6.5) */}
      {recommendations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isAuthenticated ? 'Recommended For You • Calibrated to Taste DNA' : 'Curated Decision Favorites'}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {isAuthenticated ? 'Updated from your ratings' : 'Based on Bayesian consensus'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {recommendations.map(rec => (
              <div
                key={rec.movie.id}
                onClick={() => onOpenDecisionReport(rec.movie.id)}
                className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-2.5 cursor-pointer hover:border-indigo-500/50 transition duration-300 shadow-lg flex flex-col justify-between"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-slate-950">
                  <MoviePoster
                    src={rec.movie.poster_url}
                    alt={rec.movie.title}
                    title={rec.movie.title}
                    year={rec.movie.release_year}
                    language={rec.movie.language}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  {/* Personal Compatibility badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-indigo-950/90 text-indigo-300 font-extrabold text-[10px] border border-indigo-700/60 shadow">
                    {rec.compatibility_score}% Match
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition">
                    {rec.movie.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {rec.movie.language} • {rec.movie.release_year}
                  </p>
                  <p className="text-[10px] text-indigo-300/80 mt-1 line-clamp-1 italic">
                    "{rec.primary_reason}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Catalogue Filter Bar (PRD Section 6.1) */}
      <section className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Catalogue Filters & Controls</span>
            <span className="text-[11px] font-normal text-slate-500">({totalCount} titles)</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              <option value="bayesian">Bayesian Evidence Score</option>
              <option value="rating">General Rating Mean</option>
              <option value="count">Most Reviewed Count</option>
              <option value="year">Release Year (Newest)</option>
              <option value="title">Alphabetical (A-Z)</option>
              {isAuthenticated && <option value="compatibility">Personal Compatibility</option>}
            </select>
          </div>
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Genre selector */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Genres ({genresList.length})</option>
              {genresList.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Regional Language selector */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Language (Regional & Global)
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => { setSelectedLanguage(e.target.value); setPage(1); }}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Languages</option>
              {languagesList.map(l => (
                <option key={l} value={l}>{l} Cinema</option>
              ))}
            </select>
          </div>

          {/* Minimum Bayesian Rating Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
              <span>Min Evidence Rating</span>
              <span className="font-bold text-amber-400">{minRating > 0 ? `${minRating}★` : 'Any'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="4.8"
              step="0.2"
              value={minRating}
              onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1); }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Max Runtime Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
              <span>Max Runtime</span>
              <span className="font-bold text-indigo-400">{maxRuntime < 200 ? `${maxRuntime}m` : 'Any'}</span>
            </div>
            <input
              type="range"
              min="90"
              max="200"
              step="10"
              value={maxRuntime}
              onChange={(e) => { setMaxRuntime(Number(e.target.value)); setPage(1); }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Active filter badges */}
        {(selectedGenre || selectedLanguage || minRating > 0 || maxRuntime < 200) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400">Active Filters:</span>
            {selectedGenre && (
              <span className="px-2 py-0.5 text-[11px] bg-indigo-950 text-indigo-300 rounded-md border border-indigo-800 flex items-center space-x-1">
                <span>{selectedGenre}</span>
                <button onClick={() => setSelectedGenre('')}>×</button>
              </span>
            )}
            {selectedLanguage && (
              <span className="px-2 py-0.5 text-[11px] bg-violet-950 text-violet-300 rounded-md border border-violet-800 flex items-center space-x-1">
                <span>{selectedLanguage}</span>
                <button onClick={() => setSelectedLanguage('')}>×</button>
              </span>
            )}
            {minRating > 0 && (
              <span className="px-2 py-0.5 text-[11px] bg-amber-950 text-amber-300 rounded-md border border-amber-800 flex items-center space-x-1">
                <span>≥ {minRating}★</span>
                <button onClick={() => setMinRating(0)}>×</button>
              </span>
            )}
            {maxRuntime < 200 && (
              <span className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-300 rounded-md border border-slate-700 flex items-center space-x-1">
                <span>≤ {maxRuntime}m</span>
                <button onClick={() => setMaxRuntime(200)}>×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedGenre('');
                setSelectedLanguage('');
                setMinRating(0);
                setMaxRuntime(200);
              }}
              className="text-[11px] text-slate-500 hover:text-white underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* Movie Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="aspect-[2/3] bg-slate-800 rounded-xl" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No movies match your filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your runtime limit or lowering your minimum rating threshold.
          </p>
          <button
            onClick={() => {
              setSelectedGenre('');
              setSelectedLanguage('');
              setMinRating(0);
              setMaxRuntime(200);
            }}
            className="px-4 py-2 text-xs font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800 rounded-xl hover:bg-indigo-900 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {movies.map((m) => {
            const isWatchlisted = watchlistIds.has(m.id);
            return (
              <div
                key={m.id}
                className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3.5 transition duration-300 shadow-xl flex flex-col justify-between"
              >
                {/* Poster container */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-slate-950">
                  <MoviePoster
                    src={m.poster_url}
                    alt={m.title}
                    title={m.title}
                    year={m.release_year}
                    language={m.language}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-950/90 text-white rounded border border-slate-700/60 shadow">
                      {m.language}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(m.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg border shadow transition ${
                      isWatchlisted
                        ? 'bg-emerald-950/90 border-emerald-600 text-emerald-300'
                        : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isWatchlisted ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
                  </button>

                  {/* Dual Metrics pill at bottom of poster */}
                  <div className="absolute bottom-2 left-2 right-2 p-2 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Bayesian Rating</div>
                      <div className="font-extrabold text-amber-400 flex items-center space-x-1">
                        <span>{m.bayesian_score.toFixed(1)}★</span>
                        <span className="text-[10px] text-slate-500 font-normal">({m.rating_count})</span>
                      </div>
                    </div>

                    {m.compatibility_score ? (
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-indigo-400 uppercase">Personal Match</div>
                        <div className="font-extrabold text-indigo-300">
                          {m.compatibility_score}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Audience Mean</div>
                        <div className="font-medium text-slate-300 text-xs">
                          {m.rating_mean.toFixed(1)}★
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Movie Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{m.release_year}</span>
                    <span>•</span>
                    <span>{m.runtime_minutes ? `${m.runtime_minutes} mins` : '—'}</span>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{m.genres?.slice(0, 2).join(', ')}</span>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition truncate">
                    {m.title}
                  </h3>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {m.overview}
                  </p>

                  {/* Quick Action buttons */}
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onOpenDecisionReport(m.id)}
                      className="flex-1 py-1.5 px-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center justify-center space-x-1 shadow-md shadow-indigo-600/20"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Decision Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompareClick(m.id)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
                      title="Compare movie"
                    >
                      <Scale className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
