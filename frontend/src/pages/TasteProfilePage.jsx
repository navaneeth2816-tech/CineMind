import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Sliders, Film, Clock, Globe, Bookmark, 
  History, Star, Trash2, ShieldCheck, Check, AlertCircle 
} from 'lucide-react';
import MoviePoster from '../components/MoviePoster';

export default function TasteProfilePage({ onOpenDecisionReport }) {
  const { user, isAuthenticated, setIsAuthModalOpen, setIsOnboardingModalOpen, refreshUser } = useAuth();
  const [tasteDna, setTasteDna] = useState(null);
  const [userRatings, setUserRatings] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editable settings
  const [runtimeLimit, setRuntimeLimit] = useState(150);
  const [excludedGenres, setExcludedGenres] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const ALL_GENRES = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 
    'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 
    'Romance', 'Sci-Fi', 'Thriller'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api.getTasteProfile(),
      api.getUserRatings(),
      api.getWatchlist(),
      api.getHistory()
    ])
      .then(([dnaData, ratingsData, watchData, histData]) => {
        setTasteDna(dnaData.taste_dna);
        setUserRatings(ratingsData.ratings || []);
        setWatchlist(watchData.watchlist || []);
        setHistory(histData.history || []);
        if (user) {
          setRuntimeLimit(user.runtime_limit || 150);
          setExcludedGenres(user.excluded_genres || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await api.updatePreferences({
        runtime_limit: runtimeLimit,
        excluded_genres: excludedGenres
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleExcludeGenre = (g) => {
    setExcludedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  };

  const handleRemoveFromWatchlist = async (movieId) => {
    try {
      await api.removeFromWatchlist(movieId);
      setWatchlist(prev => prev.filter(m => m.id !== movieId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear viewing history:', e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
        <Sparkles className="w-12 h-12 text-indigo-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Unlock Your Movie Taste DNA</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Sign in to view your real-time genre affinity profile, rating evidence history, watchlist, and personalized match scores.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Movie Taste DNA</h1>
            <p className="text-xs text-slate-400">
              Inferred from your {userRatings.length} logged ratings and explicit constraints (PRD Section 6.6)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOnboardingModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 rounded-xl transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Re-calibrate Onboarding Quiz</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Synthesizing your Taste DNA profile...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Taste DNA Genre Affinities & Evidence */}
          <div className="lg:col-span-2 space-y-6">
            {/* Genre Affinity Radar / Breakdown */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Genre Affinity Spectrum & Rating Evidence
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Range: -1.0 (Avoided) to +1.0 (Favorite)
                </span>
              </div>

              {/* Genre Bars */}
              <div className="space-y-3">
                {tasteDna?.genre_dna?.map((g) => {
                  const score = g.preference_score;
                  const pct = Math.round(((score + 1.0) / 2.0) * 100);
                  const isPositive = score > 0.05;
                  const isNegative = score < -0.05;

                  return (
                    <div key={g.genre} className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{g.genre}</span>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="text-slate-400">
                            {g.rating_count} ratings ({g.average_rating > 0 ? `${g.average_rating}★ avg` : 'Prior'})
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            isPositive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            isNegative ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {g.affinity_label}
                          </span>
                        </div>
                      </div>

                      {/* Visual Spectrum Bar */}
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isPositive
                              ? 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                              : isNegative
                              ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>Evidence confidence: {g.confidence}</span>
                        <span>Normalized score: {score > 0 ? `+${score}` : score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Watchlist Section */}
            <div id="watchlist" className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    My Watchlist ({watchlist.length})
                  </h3>
                </div>
              </div>

              {watchlist.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Your watchlist is empty. Add movies while exploring the catalogue!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {watchlist.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between space-x-3 group"
                    >
                      <div
                        onClick={() => onOpenDecisionReport(m.id)}
                        className="flex items-center space-x-3 cursor-pointer min-w-0"
                      >
                        <MoviePoster
                          src={m.poster_url}
                          alt={m.title}
                          title={m.title}
                          year={m.release_year}
                          language={m.language}
                          className="w-10 h-14 shrink-0 rounded-lg border border-slate-800"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition">
                            {m.title}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {m.language} • {m.release_year} • {m.bayesian_score.toFixed(1)}★
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFromWatchlist(m.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition shrink-0"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Rating History */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Your Rating History ({userRatings.length})
                  </h3>
                </div>
              </div>

              {userRatings.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  You haven't rated any movies yet. Open a Decision Report to rate movies!
                </p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {userRatings.map((item) => (
                    <div
                      key={item.rating_id}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 px-2 rounded-xl transition"
                      onClick={() => onOpenDecisionReport(item.movie.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <MoviePoster
                          src={item.movie.poster_url}
                          alt={item.movie.title}
                          title={item.movie.title}
                          year={item.movie.release_year}
                          language={item.movie.language}
                          className="w-8 h-12 shrink-0 rounded border border-slate-800"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.movie.title}</h4>
                          <p className="text-[11px] text-slate-400">
                            {item.movie.language} • {item.movie.release_year}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-amber-400">{item.rating.toFixed(1)}★</div>
                        <div className="text-[10px] text-slate-500">Your score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: User Constraints & Risk Settings */}
          <div className="space-y-6">
            {/* Preference Constraints Form (PRD Section 6.12) */}
            <form onSubmit={handleSavePreferences} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Watch Risk & Constraints
                </h3>
              </div>

              {saveSuccess && (
                <div className="p-3 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Preferences saved successfully!</span>
                </div>
              )}

              {/* Runtime Limit Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Max Desired Runtime</span>
                  <span className="text-indigo-400 font-bold">{runtimeLimit} mins (~{(runtimeLimit / 60).toFixed(1)}h)</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="210"
                  step="10"
                  value={runtimeLimit}
                  onChange={(e) => setRuntimeLimit(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Movies exceeding this limit trigger a "Runtime Exceeded" notice in your Decision Report.
                </p>
              </div>

              {/* Excluded Genres */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Exclude Specific Genres (Hard Constraint)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_GENRES.map((g) => {
                    const isExcluded = excludedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleExcludeGenre(g)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition ${
                          isExcluded
                            ? 'bg-rose-950 border-rose-800 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isExcluded ? `✕ ${g}` : g}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Films featuring excluded genres are filtered out of personal recommendations.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Watch Risk Preferences'}
              </button>
            </form>

            {/* Quick Profile Summary */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                DNA Summary Overview
              </h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Total Logged Ratings:</span>
                  <span className="font-bold text-white">{tasteDna?.total_ratings || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Top Affinity Genres:</span>
                  <span className="font-bold text-indigo-400">{tasteDna?.top_genres?.slice(0, 3).join(', ') || 'Calibrating'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Frequent Languages:</span>
                  <span className="font-bold text-violet-300">{tasteDna?.favorite_languages?.join(', ') || 'Any'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
