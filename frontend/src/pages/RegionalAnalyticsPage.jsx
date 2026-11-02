import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BarChart3, Globe, ShieldCheck, Film, 
  Clock, Star, Info, TrendingUp, Calculator,
  Sliders, Layers, PieChart, CheckCircle2
} from 'lucide-react';

export default function RegionalAnalyticsPage() {
  const [regionalData, setRegionalData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);
  const [minRatings, setMinRatings] = useState(5);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'charts', 'stats', 'top-rated'
  const [selectedChart, setSelectedChart] = useState(null);

  const fetchAnalytics = (threshold) => {
    setLoading(true);
    Promise.all([
      api.getRegionalAnalytics(),
      api.getRatingAnalytics(threshold)
    ])
      .then(([regData, globData]) => {
        setRegionalData(regData.regional_comparison || []);
        setDisclaimer(regData.dataset_disclaimer || '');
        setGlobalStats(globData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics(minRatings);
  }, [minRatings]);

  const overview = globalStats?.overview;
  const numpyStats = globalStats?.numpy_statistics || {};
  const starDist = globalStats?.star_distribution_pct || {};
  const charts = globalStats?.charts || {};
  const topRatedMovies = globalStats?.top_rated_movies || [];
  const genreAnalysis = globalStats?.genre_analysis || [];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Movie Analytics & Visualizations</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/80 rounded-full">
                Pandas • NumPy • Matplotlib
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive ratings intelligence, statistical distributions, and automated chart visualizations from live MySQL data
            </p>
          </div>
        </div>

        {/* View Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl self-start md:self-auto">
          {[
            { id: 'all', label: 'All-in-One Dashboard', icon: Layers },
            { id: 'charts', label: 'Matplotlib Charts', icon: PieChart },
            { id: 'stats', label: 'NumPy Statistics', icon: Calculator },
            { id: 'top-rated', label: 'Top-Rated Films', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Catalogue Evaluated</div>
          <div className="text-2xl font-black text-white mt-1">{overview?.total_movies || 0} Titles</div>
          <div className="text-[10px] text-indigo-400 mt-0.5 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified in MySQL</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Rating Sample</div>
          <div className="text-2xl font-black text-white mt-1">{overview?.total_ratings || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pandas DataFrame Aggregated</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">NumPy Sample Mean</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{numpyStats?.mean || overview?.average_rating || 0}★</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Median: {numpyStats?.median || 0}★ (±{numpyStats?.std_dev || 0} σ)</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Regional Industries</div>
          <div className="text-2xl font-black text-violet-400 mt-1">{regionalData.length} Languages</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Telugu, Tamil, Hindi, Global</div>
        </div>
      </div>

      {loading && (
        <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Computing analytics and rendering Matplotlib visualizations...</p>
        </div>
      )}

      {/* SECTION 1: Matplotlib Data Visualizations (Requirement 4) */}
      {(activeTab === 'all' || activeTab === 'charts') && !loading && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Matplotlib Visualizations
              </h2>
              <span className="text-xs text-slate-400">
                (Generated dynamically by Python Matplotlib backend)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 italic">
              Click any chart to view high-resolution render
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Genre Analysis */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1. Genre Rating Analysis</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-md border border-indigo-800/60 font-semibold">
                  Pandas GroupBy & Matplotlib
                </span>
              </div>
              <div 
                className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 cursor-pointer group relative"
                onClick={() => setSelectedChart(charts.genre_analysis)}
              >
                {charts.genre_analysis ? (
                  <img
                    src={charts.genre_analysis}
                    alt="Genre Rating Analysis Chart"
                    className="w-full h-auto object-contain transition group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">Generating chart...</div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic leading-relaxed">
                Aggregates average audience rating by genre across all catalogue entries using Pandas relational grouping.
              </p>
            </div>

            {/* Chart 2: Rating Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Rating Distribution (1★ to 5★)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-950 text-amber-300 rounded-md border border-amber-800/60 font-semibold">
                  NumPy Bincount & Matplotlib
                </span>
              </div>
              <div 
                className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 cursor-pointer group relative"
                onClick={() => setSelectedChart(charts.rating_distribution)}
              >
                {charts.rating_distribution ? (
                  <img
                    src={charts.rating_distribution}
                    alt="Rating Distribution Chart"
                    className="w-full h-auto object-contain transition group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">Generating chart...</div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic leading-relaxed">
                Illustrates exact rating frequencies computed via NumPy bin counting, showing volume concentration in 4★ and 5★ tiers.
              </p>
            </div>

            {/* Chart 3: Top-Rated Movies with Threshold */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Verified Top-Rated Movies</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded-md border border-emerald-800/60 font-semibold">
                  Min {minRatings}+ Ratings Threshold
                </span>
              </div>
              <div 
                className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 cursor-pointer group relative"
                onClick={() => setSelectedChart(charts.top_rated_movies)}
              >
                {charts.top_rated_movies ? (
                  <img
                    src={charts.top_rated_movies}
                    alt="Top Rated Movies Chart"
                    className="w-full h-auto object-contain transition group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">Generating chart...</div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic leading-relaxed">
                Filters out titles with fewer than {minRatings} reviews to prevent low-sample skew, ranking top films by sample mean.
              </p>
            </div>

            {/* Chart 4: Regional Rating Comparison */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-violet-400" />
                  <span>4. Regional Cinema Comparison</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-violet-950 text-violet-300 rounded-md border border-violet-800/60 font-semibold">
                  Dual-Axis Rating vs Volume
                </span>
              </div>
              <div 
                className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 cursor-pointer group relative"
                onClick={() => setSelectedChart(charts.regional_comparison)}
              >
                {charts.regional_comparison ? (
                  <img
                    src={charts.regional_comparison}
                    alt="Regional Comparison Chart"
                    className="w-full h-auto object-contain transition group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">Generating chart...</div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic leading-relaxed">
                Compares Bayesian average rating performance alongside total review sample volume across all regional film industries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: NumPy Statistical Analysis (Requirement 3) */}
      {(activeTab === 'all' || activeTab === 'stats') && !loading && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              NumPy Rating Statistics & Parameter Estimation (Requirement 3)
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Sample Mean</span>
              <div className="text-lg font-black text-amber-400 mt-1">{numpyStats?.mean || 0}★</div>
              <span className="text-[9px] text-slate-500">np.mean</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Median Rating</span>
              <div className="text-lg font-black text-indigo-400 mt-1">{numpyStats?.median || 0}★</div>
              <span className="text-[9px] text-slate-500">np.median</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Std Deviation</span>
              <div className="text-lg font-black text-violet-400 mt-1">±{numpyStats?.std_dev || 0}</div>
              <span className="text-[9px] text-slate-500">np.std (σ)</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Variance</span>
              <div className="text-lg font-black text-slate-200 mt-1">{numpyStats?.variance || 0}</div>
              <span className="text-[9px] text-slate-500">np.var (σ²)</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Minimum</span>
              <div className="text-lg font-black text-rose-400 mt-1">{numpyStats?.min || 0}★</div>
              <span className="text-[9px] text-slate-500">np.min</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Maximum</span>
              <div className="text-lg font-black text-emerald-400 mt-1">{numpyStats?.max || 0}★</div>
              <span className="text-[9px] text-slate-500">np.max</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">25th %-tile (Q1)</span>
              <div className="text-lg font-black text-cyan-400 mt-1">{numpyStats?.percentile_25 || 0}★</div>
              <span className="text-[9px] text-slate-500">np.percentile</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">75th %-tile (Q3)</span>
              <div className="text-lg font-black text-cyan-400 mt-1">{numpyStats?.percentile_75 || 0}★</div>
              <span className="text-[9px] text-slate-500">np.percentile</span>
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Rating Frequency Breakdown (NumPy Bincount)
            </span>
            {[5, 4, 3, 2, 1].map(star => {
              const count = numpyStats?.star_distribution?.[star] || 0;
              const pct = numpyStats?.star_percentages?.[star] || 0;
              return (
                <div key={star} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-semibold">{star} Stars</span>
                    <span className="text-slate-400">{count.toLocaleString()} ratings ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
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
      )}

      {/* SECTION 3: Top-Rated Movies & Minimum Rating Threshold Rule (Requirement 5) */}
      {(activeTab === 'all' || activeTab === 'top-rated') && !loading && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Verified Top-Rated Movies (Minimum-Rating Rule)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Movies with fewer than {minRatings} ratings are automatically excluded from the verified ranking to guarantee statistical confidence.
              </p>
            </div>

            {/* Threshold Selector Controls */}
            <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <Sliders className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <span className="text-xs text-slate-400 font-semibold">Min Threshold:</span>
              {[3, 5, 10, 20].map(val => (
                <button
                  key={val}
                  onClick={() => setMinRatings(val)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition ${
                    minRatings === val
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {val}+ votes
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-2 text-slate-400">
            <span>
              Showing <strong className="text-emerald-400">{topRatedMovies.length}</strong> movies meeting threshold (minimum {minRatings} reviews):
            </span>
            <span className="text-[11px] text-slate-500">
              Evaluated with Pandas DataFrame filter
            </span>
          </div>

          <div className="divide-y divide-slate-800/70 border border-slate-800/80 rounded-2xl bg-slate-950/60 overflow-hidden">
            {topRatedMovies.slice(0, 10).map((m, idx) => (
              <div key={m.movie_id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition">
                <div className="flex items-center space-x-3.5">
                  <span className="w-6 text-center text-xs font-black text-slate-500">#{idx + 1}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{m.title}</h4>
                    <span className="text-[11px] text-slate-400">
                      {m.language} • {m.release_year} • {m.rating_count} verified reviews
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400">{m.rating_mean.toFixed(2)}★</span>
                    <div className="text-[10px] text-indigo-400 font-semibold">{m.bayesian_score.toFixed(2)}★ Bayesian</div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded-md">
                    Qualified (≥{minRatings})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Pandas Genre Aggregation Table (Requirement 2) */}
      {(activeTab === 'all' || activeTab === 'stats') && !loading && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Pandas Genre Rating Breakdown (Requirement 2)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {genreAnalysis.map(g => (
              <div key={g.genre} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{g.genre}</span>
                  <div className="text-[10px] text-slate-400">{g.ratings_count} ratings • {g.movies_count} titles</div>
                </div>
                <span className="px-2 py-1 text-xs font-black bg-indigo-950/80 text-amber-400 border border-indigo-800/60 rounded-xl">
                  {g.average_rating.toFixed(2)}★
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: Regional Cinema Breakdown Cards */}
      {(activeTab === 'all' || activeTab === 'stats') && !loading && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Regional Cinema Benchmark (Telugu, Tamil, Malayalam, Hindi, Kannada, Global)
            </h2>
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
      )}

      {/* Data Provenance & Ethics Disclosure (PRD 3.1 & 6.14) */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Data Integrity, Privacy & Provenance Disclosure:</strong> {disclaimer}
          All ratings are stored in MySQL and analyzed dynamically using Pandas DataFrames and NumPy arrays.
          No user private identifiers (names, emails, user IDs) are exposed or processed in analytics computations.
          Visual charts are generated on the server using Matplotlib and styled to match CineMind's dark theme.
        </p>
      </div>

      {/* Fullscreen Chart Modal */}
      {selectedChart && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedChart(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 px-2">
              <span className="text-xs font-bold text-white">High-Resolution Chart (Matplotlib)</span>
              <button
                onClick={() => setSelectedChart(null)}
                className="text-xs font-semibold px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                Close (ESC)
              </button>
            </div>
            <img
              src={selectedChart}
              alt="High-Resolution Visualization"
              className="w-full h-auto rounded-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
