import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Scale, Plus, X, Star, ShieldCheck, Sparkles, 
  Clock, Globe, Film, ArrowRight, Check 
} from 'lucide-react';

export default function ComparePage({ onOpenDecisionReport }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [comparisonMovies, setComparisonMovies] = useState([]);
  const [availableMovies, setAvailableMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovieToAdd, setSelectedMovieToAdd] = useState('');

  // Initial load from URL query params or defaults (e.g. Inception vs Interstellar)
  useEffect(() => {
    const idsParam = searchParams.get('ids');
    let ids = idsParam ? idsParam.split(',').map(Number).filter(Boolean) : [];
    if (ids.length === 0) {
      ids = [1, 6]; // Default: RRR vs Vikram
    }

    setLoading(true);
    api.compareMovies(ids)
      .then(res => setComparisonMovies(res.comparison || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Also fetch all movies list for addition dropdown
    api.getMovies({ limit: 50 })
      .then(res => setAvailableMovies(res.movies || []))
      .catch(console.error);
  }, [searchParams, user]);

  const updateIdsInUrl = (newIds) => {
    setSearchParams({ ids: newIds.join(',') });
  };

  const handleRemoveMovie = (idToRemove) => {
    const newIds = comparisonMovies.map(m => m.id).filter(id => id !== idToRemove);
    if (newIds.length >= 1) {
      updateIdsInUrl(newIds);
    }
  };

  const handleAddMovie = (e) => {
    e.preventDefault();
    if (!selectedMovieToAdd) return;
    const currentIds = comparisonMovies.map(m => m.id);
    if (currentIds.length >= 3) {
      alert('You can compare a maximum of 3 movies simultaneously.');
      return;
    }
    const idNum = Number(selectedMovieToAdd);
    if (!currentIds.includes(idNum)) {
      updateIdsInUrl([...currentIds, idNum]);
    }
    setSelectedMovieToAdd('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-600/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Head-to-Head Comparison</h1>
            <p className="text-xs text-slate-400">
              Compare 2 or 3 movies across empirical rating evidence, Bayesian confidence, and personal compatibility.
            </p>
          </div>
        </div>

        {/* Add Movie to Compare Dropdown */}
        {comparisonMovies.length < 3 && (
          <form onSubmit={handleAddMovie} className="flex items-center space-x-2">
            <select
              value={selectedMovieToAdd}
              onChange={(e) => setSelectedMovieToAdd(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">+ Add movie to compare...</option>
              {availableMovies
                .filter(m => !comparisonMovies.some(c => c.id === m.id))
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.release_year}, {m.language})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={!selectedMovieToAdd}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition disabled:opacity-40"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Comparing movie metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Cards Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-${Math.max(2, comparisonMovies.length)} gap-6`}>
            {comparisonMovies.map((movie, idx) => (
              <div
                key={movie.id}
                className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6 overflow-hidden"
              >
                {/* Remove button */}
                {comparisonMovies.length > 2 && (
                  <button
                    onClick={() => handleRemoveMovie(movie.id)}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="space-y-4">
                  {/* Poster & Title Header */}
                  <div className="flex items-start space-x-4">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-20 sm:w-24 h-auto object-cover rounded-xl shadow-md border border-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                          {movie.language}
                        </span>
                        <span className="text-xs text-slate-400">{movie.release_year}</span>
                      </div>
                      <h2 className="text-lg font-bold text-white leading-tight">
                        {movie.title}
                      </h2>
                      <div className="text-xs text-slate-400 mt-1">
                        {movie.runtime_minutes ? `${movie.runtime_minutes} mins` : '—'} • {movie.genres?.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Bayesian Score Highlight */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Bayesian Weighted Score
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-amber-400">{movie.bayesian_score.toFixed(2)}★</span>
                      <span className="text-xs text-slate-400">vs {movie.rating_mean.toFixed(2)}★ raw</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Sample: {movie.rating_count} reviews</span>
                      <span className="text-indigo-400 font-semibold">{movie.evidence_label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      95% Confidence Margin: ±{movie.margin_of_error}★
                    </div>
                  </div>

                  {/* Personal Compatibility */}
                  <div className="p-4 bg-indigo-950/30 rounded-2xl border border-indigo-700/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Personal Compatibility</span>
                      </span>
                      <span className="text-xs font-black text-indigo-400">
                        {movie.compatibility_score ? `${movie.compatibility_score}%` : 'N/A'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {movie.compatibility_score
                        ? (movie.compatibility_score >= 80 ? 'High taste synergy with your preferred genres.' : 'Moderate synergy.')
                        : 'Sign in to calibrate personal match.'}
                    </p>
                  </div>

                  {/* Synopsis */}
                  <div className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {movie.overview}
                  </div>
                </div>

                {/* Open Decision Report */}
                <button
                  type="button"
                  onClick={() => onOpenDecisionReport(movie.id)}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Full Decision Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Evidence Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-x-auto">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Side-by-Side Metric Matrix (PRD Section 6.2)</span>
            </h3>

            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Metric</th>
                  {comparisonMovies.map(m => (
                    <th key={m.id} className="py-3 px-4 font-bold text-white">{m.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Bayesian Evidence Score</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4 font-black text-amber-400 text-sm">
                      {m.bayesian_score.toFixed(2)}★
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Raw Audience Mean</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4 text-slate-300 font-semibold">
                      {m.rating_mean.toFixed(2)}★
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Review Sample Size</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4 font-medium">{m.rating_count} recorded ratings</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Evidence Reliability</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4 text-indigo-400 font-medium">{m.evidence_label}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Uncertainty Margin (95% CI)</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4 text-slate-400">±{m.margin_of_error}★</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Personal Compatibility</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4 font-black text-indigo-400">
                      {m.compatibility_score ? `${m.compatibility_score}%` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Runtime</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4">{m.runtime_minutes || '—'} mins</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Language</td>
                  {comparisonMovies.map(m => (
                    <td key={m.id} className="py-3 px-4 font-medium text-violet-300">{m.language}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
