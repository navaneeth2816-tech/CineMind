import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, Star, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2, 
  Eye, EyeOff, Bookmark, BookmarkCheck, ArrowRight, Info, BarChart2 
} from 'lucide-react';
import MoviePoster from './MoviePoster';

export default function DecisionReportModal({ movieId, isOpen, onClose, onMovieSelect }) {
  const { user, watchlistIds, toggleWatchlist, setIsAuthModalOpen } = useAuth();
  const [report, setReport] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingSaving, setRatingSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !movieId) return;
    setLoading(true);
    setShowSpoilers(false);

    Promise.all([
      api.getDecisionReport(movieId),
      api.getReviewSummary(movieId),
      api.getMovieDetail(movieId)
    ])
      .then(([repData, revData, detailData]) => {
        setReport(repData.report);
        setReviews(revData.summary);
        setUserRating(detailData.movie.user_rating || 0);
      })
      .catch(err => console.error('Failed to load decision report:', err))
      .finally(() => setLoading(false));

    // Record view in history if logged in
    if (user) {
      api.recordView(movieId).catch(() => {});
    }
  }, [movieId, isOpen, user]);

  if (!isOpen) return null;

  const handleRate = async (score) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setRatingSaving(true);
    try {
      await api.submitRating(movieId, score);
      setUserRating(score);
      // Refresh report
      const rep = await api.getDecisionReport(movieId);
      setReport(rep.report);
    } catch (e) {
      console.error('Rating failed:', e);
    } finally {
      setRatingSaving(false);
    }
  };

  const isWatchlisted = watchlistIds.has(movieId);
  const movie = report?.movie;
  const trust = report?.trust_metrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded-full">
              Decision Intelligence Report
            </span>
            <span className="text-xs text-slate-400">ID #{movieId}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !report ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Synthesizing Rating Evidence & Compatibility...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
            {/* Top Movie Overview Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="md:col-span-1 flex justify-center">
                <MoviePoster
                  src={movie.poster_url}
                  alt={movie.title}
                  title={movie.title}
                  year={movie.release_year}
                  language={movie.language}
                  className="w-40 sm:w-48 shadow-xl border border-slate-800"
                />
              </div>

              <div className="md:col-span-3 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 text-xs font-semibold bg-violet-950/80 text-violet-300 border border-violet-800/60 rounded-md">
                      {movie.language}
                    </span>
                    <span className="text-xs text-slate-400">{movie.release_year}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">{movie.runtime_minutes || '—'} mins</span>
                    <span className="text-xs text-slate-400">•</span>
                    <div className="flex gap-1">
                      {movie.genres?.map(g => (
                        <span key={g} className="text-xs text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {movie.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed line-clamp-3">
                    {movie.overview}
                  </p>
                </div>

                {/* Dual Metrics (PRD Section 6.2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                  {/* General Rating Evidence */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        General Rating Evidence
                      </div>
                      <div className="flex items-baseline space-x-1.5 mt-0.5">
                        <span className="text-2xl font-black text-amber-400">{movie.bayesian_score.toFixed(1)}★</span>
                        <span className="text-xs text-slate-400">Bayesian smoothed</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Raw mean: {movie.rating_mean.toFixed(1)}★ ({movie.rating_count} ratings)
                      </div>
                    </div>
                    <span className="px-2 py-1 text-[10px] font-bold text-slate-300 bg-slate-800 rounded-lg">
                      {trust?.evidence_label}
                    </span>
                  </div>

                  {/* Personal Compatibility */}
                  <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-700/40 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Personal Compatibility</span>
                      </div>
                      <div className="flex items-baseline space-x-1.5 mt-0.5">
                        <span className="text-2xl font-black text-indigo-400">
                          {report.compatibility_score ? `${report.compatibility_score}%` : 'N/A'}
                        </span>
                        <span className="text-xs text-indigo-300/80">{report.compatibility_label}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {report.has_user_context ? 'Calibrated to your Taste DNA' : 'Guest estimate based on popularity'}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                      {report.compatibility_score ? `${report.compatibility_score}%` : '—'}
                    </div>
                  </div>
                </div>

                {/* Action buttons & User rating */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-400">Your Rating:</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          disabled={ratingSaving}
                          onClick={() => handleRate(star)}
                          className={`p-1 transition ${
                            star <= userRating ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-amber-300'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                    {userRating > 0 && (
                      <span className="text-xs font-bold text-amber-400">{userRating}.0★</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleWatchlist(movie.id)}
                    className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                      isWatchlisted
                        ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    {isWatchlisted ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
                    <span>{isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: Rating Trust Analyzer (PRD Section 6.8) */}
            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Rating Trust Analyzer
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Margin of error: ±{trust?.confidence_interval_95}★ (95% CI)
                </span>
              </div>

              {/* Bayesian Formula Explanation */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">
                  Bayesian Smoothing Formulation: <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded">weighted_score = (v / (v + m)) * R + (m / (v + m)) * C</code>
                </p>
                <p className="text-[11px] text-slate-400">
                  Movie review sample (v) = {trust?.rating_count} | Evidence threshold constant (m) = {trust?.evidence_constant_m} | Global catalogue mean (C) = {trust?.catalogue_mean_c}★
                </p>
              </div>

              {/* 1-5 Star Distribution */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span>Verified 1–5 Star Rating Distribution ({trust?.rating_count} total)</span>
                </div>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = trust?.distribution?.[star] || 0;
                    const pct = trust?.distribution_pct?.[star] || 0;
                    return (
                      <div key={star} className="flex items-center space-x-2 text-xs">
                        <span className="w-8 font-medium text-slate-400 text-right">{star}★</span>
                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-slate-400 text-[11px]">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 2: Why It Fits & Possible Mismatches (Watch Risk) (PRD 6.7, 6.12) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Why It Fits */}
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Why It Fits Your Taste</h4>
                </div>
                <div className="space-y-2">
                  {report.why_it_fits?.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 text-xs">
                      <div className="font-semibold text-slate-200">{item.factor}</div>
                      <div className="text-slate-400 mt-0.5">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Possible Mismatches / Watch Risk */}
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Watch Risk / Potential Mismatches</h4>
                </div>
                <div className="space-y-2">
                  {report.possible_mismatches?.length > 0 ? (
                    report.possible_mismatches.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-amber-900/30 text-xs">
                        <div className="font-semibold text-amber-300">{item.factor}</div>
                        <div className="text-slate-400 mt-0.5">{item.detail}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 italic">
                      No significant preference conflicts detected. Runtime and genre attributes align with your viewing parameters.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Spoiler-Aware Review Summaries (PRD Section 6.11) */}
            {reviews && (
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Spoiler-Aware Review Consensus
                    </h4>
                  </div>
                  {reviews.spoiler_count > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSpoilers(!showSpoilers)}
                      className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition ${
                        showSpoilers
                          ? 'bg-rose-950/50 border-rose-700/60 text-rose-300'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                    >
                      {showSpoilers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSpoilers ? 'Hide Spoilers' : `Reveal Spoilers (${reviews.spoiler_count})`}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-emerald-400 block mb-1">Common Praises:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {reviews.common_positive_themes?.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-amber-400 block mb-1">Areas of Critical Debate:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {reviews.areas_of_debate?.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Individual Reviews with spoiler protection */}
                <div className="space-y-2 pt-2">
                  {reviews.reviews?.map((r) => {
                    const isMasked = r.has_spoilers && !showSpoilers;
                    return (
                      <div
                        key={r.id}
                        className={`p-3 rounded-xl border transition ${
                          r.has_spoilers ? 'border-amber-900/40 bg-amber-950/20' : 'border-slate-800 bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="font-semibold text-slate-300">{r.author}</span>
                          {r.has_spoilers && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400 bg-amber-950 border border-amber-800/60 rounded">
                              Contains Spoilers
                            </span>
                          )}
                        </div>
                        <p className={`text-xs text-slate-300 ${isMasked ? 'blur-sm select-none filter' : ''}`}>
                          "{r.review_text}"
                        </p>
                        {isMasked && (
                          <button
                            type="button"
                            onClick={() => setShowSpoilers(true)}
                            className="mt-1 text-[11px] font-semibold text-amber-400 hover:underline"
                          >
                            Click to reveal spoiler commentary
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 4: Similar Alternatives */}
            {report.similar_alternatives?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Similar Alternatives in Catalogue
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {report.similar_alternatives.map((alt) => (
                    <div
                      key={alt.movie.id}
                      onClick={() => onMovieSelect && onMovieSelect(alt.movie.id)}
                      className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition flex items-center space-x-3 group"
                    >
                      <MoviePoster
                        src={alt.movie.poster_url}
                        alt={alt.movie.title}
                        title={alt.movie.title}
                        year={alt.movie.release_year}
                        language={alt.movie.language}
                        className="w-12 h-16 shrink-0 rounded-lg border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-white truncate group-hover:text-indigo-400 transition">
                          {alt.movie.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {alt.movie.language} • {alt.movie.release_year}
                        </div>
                        <div className="text-[10px] font-bold text-indigo-400 mt-1">
                          {alt.similarity_score}% Similar
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
