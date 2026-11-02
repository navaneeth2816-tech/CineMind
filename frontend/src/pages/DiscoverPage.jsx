import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Film, Search, Sparkles, Filter, SlidersHorizontal, Star, 
  Bookmark, BookmarkCheck, ArrowRight, ShieldCheck, 
  RotateCcw, Scale, Zap, Info, X
} from 'lucide-react';
import MoviePoster from '../components/MoviePoster';

export default function DiscoverPage({ onOpenDecisionReport }) {
  const { user, isAuthenticated, watchlistIds, toggleWatchlist } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recMeta, setRecMeta] = useState({
    isPersonalized: false,
    hasRatings: false,
    totalRatings: 0,
    source: 'audience_favorites',
    notice: null
  });
  const [recLoading, setRecLoading] = useState(false);

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

  // Natural Language Search state - Separated from general recommendations
  const [nlQuery, setNlQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [nlSearching, setNlSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  // Load personalized recommendations row respecting language and Taste DNA
  useEffect(() => {
    setRecLoading(true);
    api.getRecommendations({ limit: 6, language: selectedLanguage })
      .then(res => {
        setRecommendations(res.recommendations || []);
        setRecMeta({
          isPersonalized: Boolean(res.is_personalized),
          hasRatings: Boolean(res.has_ratings),
          totalRatings: res.total_ratings ?? 0,
          source: res.source || 'audience_favorites',
          notice: res.notice || null
        });
      })
      .catch(console.error)
      .finally(() => setRecLoading(false));
  }, [user, selectedLanguage]);

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
  const handleNlSearch = async (e, langOverride = undefined) => {
    if (e) e.preventDefault();
    const queryText = nlQuery.trim() || activeSearchQuery.trim();
    if (!queryText) return;

    const effectiveLang = langOverride !== undefined ? langOverride : selectedLanguage;
    setNlSearching(true);
    setActiveSearchQuery(queryText);
    setIsSearchActive(true);

    try {
      const res = await api.naturalLanguageSearch(queryText, effectiveLang);
      setNlResult(res);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('NL Search error:', err);
      setSearchResults([]);
    } finally {
      setNlSearching(false);
    }
  };

  const clearNlSearch = () => {
    setNlQuery('');
    setActiveSearchQuery('');
    setNlResult(null);
    setSearchResults([]);
    setIsSearchActive(false);
  };

  // Language filter button handler
  const handleLanguageSelect = (langValue) => {
    setSelectedLanguage(langValue);
    setPage(1);
    // If a search is currently active, update search results to the selected language
    if (isSearchActive && (nlQuery.trim() || activeSearchQuery.trim())) {
      handleNlSearch(null, langValue);
    }
  };

  const handleCompareClick = (movieId) => {
    navigate(`/compare?ids=${movieId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Clean Beginner-Friendly Hero Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-300 text-xs font-medium">
          <Film className="w-3.5 h-3.5" />
          <span>Movie Recommendation & Decision System</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Find What to Watch Next
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Explore movies across Telugu, Tamil, Malayalam, Kannada, Hindi, and English cinema with ratings and personal recommendations.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleNlSearch} className="relative max-w-xl mx-auto pt-1">
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 transition">
            <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="Search movies (e.g. 'RRR', 'Telugu thriller', 'Drishyam', 'Inception')..."
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-transparent text-white placeholder-slate-500 focus:outline-none"
            />
            {nlQuery && (
              <button
                type="button"
                onClick={() => setNlQuery('')}
                className="text-slate-400 hover:text-white px-2"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={nlSearching || !nlQuery.trim()}
              className="mr-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shrink-0 disabled:opacity-50"
            >
              {nlSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Quick Filter Buttons by Regional Language */}
        <div className="pt-2">
          <p className="text-[11px] text-slate-500 mb-2 font-medium">Filter by Language:</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {[
              { label: 'All Cinema', value: '' },
              { label: 'Telugu', value: 'Telugu' },
              { label: 'Tamil', value: 'Tamil' },
              { label: 'Malayalam', value: 'Malayalam' },
              { label: 'Kannada', value: 'Kannada' },
              { label: 'Hindi', value: 'Hindi' },
              { label: 'English', value: 'English' }
            ].map(l => (
              <button
                key={l.label}
                type="button"
                onClick={() => handleLanguageSelect(l.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedLanguage === l.value
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SEPARATE SECTION 1: SEARCH RESULTS (Shown when user searches) */}
      {isSearchActive && (
        <section className="space-y-4 p-5 bg-slate-900 border border-indigo-900/60 rounded-2xl shadow-lg animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Search Results {selectedLanguage ? `in ${selectedLanguage}` : ''}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-medium">
                {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            <button
              type="button"
              onClick={clearNlSearch}
              className="px-3 py-1 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search</span>
            </button>
          </div>

          {/* Active search filter badge */}
          {nlResult && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="text-slate-300">
                <strong className="text-indigo-300">Active Query:</strong> &ldquo;{activeSearchQuery}&rdquo;
                {nlResult.filter_summary && (
                  <span className="text-slate-400 ml-2">({nlResult.filter_summary})</span>
                )}
                {selectedLanguage && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 font-medium">
                    Language: {selectedLanguage}
                  </span>
                )}
              </span>
              <span className="text-slate-400 shrink-0">
                {searchResults.length} {searchResults.length === 1 ? 'film found' : 'films found'}
              </span>
            </div>
          )}

          {/* Clarifications / Notes when 0 matches found */}
          {nlResult?.clarifications?.length > 0 && searchResults.length === 0 && (
            <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs text-amber-200 space-y-1">
              <p className="font-semibold flex items-center space-x-1">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Search Guidance:</span>
              </p>
              {nlResult.clarifications.map((msg, idx) => (
                <p key={idx} className="text-amber-300/90 pl-5">{msg}</p>
              ))}
            </div>
          )}

          {/* Search Results Grid */}
          {nlSearching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 animate-pulse">
                  <div className="aspect-[2/3] bg-slate-800 rounded-lg" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
              <Info className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">No search results found</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No movies matched &ldquo;{activeSearchQuery}&rdquo; {selectedLanguage ? `under ${selectedLanguage} cinema` : ''}.
              </p>
              {selectedLanguage && (
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('')}
                  className="mt-2 px-3 py-1.5 text-xs text-indigo-400 bg-indigo-950 border border-indigo-800 rounded-lg hover:bg-indigo-900 transition"
                >
                  Search Across All Cinema
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map(m => {
                const isWatchlisted = watchlistIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className="group relative bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 transition duration-300 shadow flex flex-col justify-between"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2.5 bg-slate-900">
                      <MoviePoster
                        src={m.poster_url}
                        alt={m.title}
                        title={m.title}
                        year={m.release_year}
                        language={m.language}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2 left-2">
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
                        {isWatchlisted ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-slate-950/90 rounded border border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400">★ {m.bayesian_score?.toFixed(1) || m.rating_mean?.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400">{m.release_year}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-bold text-xs text-white group-hover:text-indigo-400 transition truncate">
                        {m.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {m.overview}
                      </p>
                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => onOpenDecisionReport(m.id)}
                          className="flex-1 py-1 px-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition flex items-center justify-center space-x-1"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Movie Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompareClick(m.id)}
                          className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                          title="Compare movie"
                        >
                          <Scale className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SEPARATE SECTION 2: RECOMMENDED MOVIES (General recommendations, respecting Taste DNA & language) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Recommended Movies {selectedLanguage ? `(${selectedLanguage})` : ''}</span>
          </h2>

          <div className="text-xs">
            {!isAuthenticated ? (
              <span className="text-slate-400">Top audience favorites</span>
            ) : recMeta.hasRatings && recMeta.totalRatings > 0 ? (
              <span className="text-slate-400">
                Based on your Taste DNA ({recMeta.totalRatings} {recMeta.totalRatings === 1 ? 'rating' : 'ratings'})
              </span>
            ) : (
              <span className="text-amber-400 font-medium bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded-md">
                Using default preferences • 0 ratings recorded
              </span>
            )}
          </div>
        </div>

        {recLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-2 h-44 animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-6 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            No recommended movies available for {selectedLanguage || 'this filter'}. Try selecting &ldquo;All Cinema&rdquo;.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recommendations.map(rec => (
              <div
                key={rec.movie.id}
                onClick={() => onOpenDecisionReport(rec.movie.id)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-2 cursor-pointer hover:border-indigo-500 transition shadow flex flex-col justify-between"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-slate-950">
                  <MoviePoster
                    src={rec.movie.poster_url}
                    alt={rec.movie.title}
                    title={rec.movie.title}
                    year={rec.movie.release_year}
                    language={rec.movie.language}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 font-bold text-[10px]">
                    ★ {rec.movie.bayesian_score?.toFixed(1) || rec.movie.rating_mean?.toFixed(1)}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-white truncate">
                    {rec.movie.title}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {rec.movie.language} • {rec.movie.release_year}
                  </p>
                  {rec.compatibility_score && (
                    <p className="text-[10px] text-indigo-400 font-medium">
                      {rec.compatibility_score}% Match
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEPARATE SECTION 3: MOVIE CATALOGUE FILTERS & GRID */}
      <section className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Movie Catalogue Filters</span>
            <span className="text-[11px] font-normal text-slate-500">
              ({totalCount} {selectedLanguage ? `${selectedLanguage} ` : ''}titles)
            </span>
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
              onChange={(e) => handleLanguageSelect(e.target.value)}
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
                <span>{selectedLanguage} Cinema</span>
                <button onClick={() => handleLanguageSelect('')}>×</button>
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
                handleLanguageSelect('');
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
              handleLanguageSelect('');
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

                  {/* Rating badge at bottom of poster */}
                  <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 bg-slate-950/90 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div className="font-bold text-amber-400 flex items-center space-x-1">
                      <span>★ {m.bayesian_score?.toFixed(1) || m.rating_mean?.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({m.rating_count} reviews)</span>
                    </div>

                    {m.compatibility_score && (
                      <span className="text-[10px] font-bold text-indigo-300">
                        {m.compatibility_score}% Match
                      </span>
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
                      className="flex-1 py-1.5 px-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Movie Details</span>
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
