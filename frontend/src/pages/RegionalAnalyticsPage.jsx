import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BarChart3, Globe, ShieldCheck, Film, 
  Clock, Star, Info, TrendingUp 
} from 'lucide-react';

export default function RegionalAnalyticsPage() {
  const [regionalData, setRegionalData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getRegionalAnalytics(),
      api.getRatingAnalytics()
    ])
      .then(([regData, globData]) => {
        setRegionalData(regData.regional_comparison || []);
        setDisclaimer(regData.dataset_disclaimer || '');
        setGlobalStats(globData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading regional and global analytics...</p>
      </div>
    );
  }

  const overview = globalStats?.overview;
  const starDist = globalStats?.star_distribution_pct || {};

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Regional Cinema Analytics</h1>
            <p className="text-xs text-slate-400">
              Comparative rating evidence across Telugu, Tamil, Malayalam, Kannada, Hindi, and Global cinema (PRD 6.14)
            </p>
          </div>
        </div>
      </div>

      {/* Global Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Catalogue Size</div>
          <div className="text-2xl font-black text-white mt-1">{overview?.total_movies || 0} Titles</div>
          <div className="text-[10px] text-indigo-400 mt-0.5">Verified Metadata</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Ratings Sample</div>
          <div className="text-2xl font-black text-white mt-1">{overview?.total_ratings || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">MovieLens + CineMind</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Global Mean Rating</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{overview?.average_rating || 0}★</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Prior catalogue mean C</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Regional Coverage</div>
          <div className="text-2xl font-black text-violet-400 mt-1">{regionalData.length} Languages</div>
          <div className="text-[10px] text-slate-400 mt-0.5">South Asian & Global</div>
        </div>
      </div>

      {/* Regional Cinema Comparison Table / Cards */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Cross-Industry Rating & Runtime Benchmark (PRD Section 6.14)
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionalData.map((reg) => (
            <div
              key={reg.language}
              className="p-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-white">
                  {reg.language} Cinema
                </span>
                <span className="px-2 py-0.5 text-xs font-black bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg">
                  {reg.average_bayesian_score}★ Bayesian
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Catalogue Representation:</span>
                  <span className="font-semibold">{reg.titles_count} movies</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Total Review Sample:</span>
                  <span className="font-semibold">{reg.total_ratings_sample} ratings</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Average Film Runtime:</span>
                  <span className="font-semibold">{reg.average_runtime_minutes} mins</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1">Dominant Genres:</span>
                  <div className="flex flex-wrap gap-1">
                    {reg.top_genres?.map(g => (
                      <span key={g} className="px-2 py-0.5 bg-slate-800 text-[11px] text-slate-300 rounded">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global 1-5 Star Distribution & Top Rated Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Star Rating Distribution */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Global 1–5 Star Rating Distribution
            </h3>
          </div>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map(star => {
              const pct = starDist[star] || 0;
              const count = globalStats?.star_distribution?.[star] || 0;
              return (
                <div key={star} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-semibold">{star} Stars</span>
                    <span className="text-slate-400">{count} ratings ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Bayesian-Ranked Titles */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Top 5 Statistically Sound Titles (Bayesian Score)
            </h3>
          </div>

          <div className="divide-y divide-slate-800/80">
            {globalStats?.top_bayesian_movies?.map((m, idx) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-5 text-slate-500 font-bold">#{idx + 1}</span>
                  <div>
                    <h4 className="font-bold text-white">{m.title}</h4>
                    <span className="text-[11px] text-slate-400">{m.language} • {m.rating_count} reviews</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-amber-400">{m.bayesian_score.toFixed(2)}★</span>
                  <div className="text-[10px] text-slate-500">{m.rating_mean.toFixed(2)}★ raw</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Provenance & Ethics Disclosure (PRD 3.1 & 6.14) */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Data Integrity & Provenance Disclosure:</strong> {disclaimer}
          All ratings are stored in the relational database; no synthetic chart numbers are hardcoded. CineMind Bayesian smoothing prevents low-sample skew by shrinking sparse observations towards the catalogue baseline.
        </p>
      </div>
    </div>
  );
}
