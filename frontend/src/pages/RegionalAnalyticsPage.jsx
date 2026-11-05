import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BarChart3, Globe, ShieldCheck, Film, 
  Clock, Star, Info, TrendingUp, Calculator,
  Sliders, Layers, PieChart, CheckCircle2,
  AlertCircle, RotateCw, RefreshCw
} from 'lucide-react';

function ChartCard({
  title,
  icon: Icon,
  badge,
  badgeColor = 'bg-indigo-950 text-indigo-300 border-indigo-800/60',
  chartUrl,
  chartEndpoint,
  minRatings,
  description,
  loading,
  onOpenZoom
}) {
  const [imageError, setImageError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reset error when chartUrl or minRatings changes
  useEffect(() => {
    setImageError(false);
  }, [chartUrl, minRatings]);

  const directUrl = api.getChartImageUrl(chartEndpoint, minRatings);
  const effectiveSrc = (!imageError && chartUrl) ? chartUrl : `${directUrl}&k=${refreshKey}`;

  const handleRetry = (e) => {
    e.stopPropagation();
    setImageError(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{title}</span>
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${badgeColor}`}>
          {badge}
        </span>
      </div>

      <div 
        className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 cursor-pointer group relative min-h-[220px] flex items-center justify-center"
        onClick={() => effectiveSrc && !imageError && onOpenZoom(effectiveSrc)}
      >
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-2 text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] text-slate-400">Rendering visual chart...</span>
          </div>
        ) : imageError ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <div className="text-xs text-rose-300 font-semibold">Chart generation temporarily unavailable</div>
            <p className="text-[11px] text-slate-500 max-w-xs">Failed to load visual chart from server.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
            >
              <RotateCw className="w-3 h-3 text-indigo-400" />
              <span>Retry Render</span>
            </button>
          </div>
        ) : (
          <img
            src={effectiveSrc}
            alt={title}
            onError={() => setImageError(true)}
            className="w-full h-auto object-contain transition group-hover:scale-[1.01]"
          />
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 italic leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function RegionalAnalyticsPage() {
  const [regionalData, setRegionalData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minRatings, setMinRatings] = useState(5);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'charts', 'stats', 'top-rated'
  const [selectedChart, setSelectedChart] = useState(null);

  const fetchAnalytics = (threshold) => {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.getRegionalAnalytics(),
      api.getRatingAnalytics(threshold)
    ])
      .then(([regResult, globResult]) => {
        let successCount = 0;

        if (regResult.status === 'fulfilled' && regResult.value) {
          setRegionalData(regResult.value.regional_comparison || []);
          setDisclaimer(regResult.value.dataset_disclaimer || '');
          successCount++;
        }

        if (globResult.status === 'fulfilled' && globResult.value) {
          setGlobalStats(globResult.value);
          // If regional endpoint was unpopulated, use regional_analysis from ratings endpoint
          if (regResult.status !== 'fulfilled' && globResult.value.regional_analysis) {
            setRegionalData(globResult.value.regional_analysis);
          }
          successCount++;
        }

        if (successCount === 0) {
          const errMsg = globResult.reason?.message || regResult.reason?.message || 'Failed to connect to analytics service.';
          setError(errMsg);
        }
      })
      .catch((err) => {
        console.error('Analytics Fetch Error:', err);
        setError(err.message || 'Error communicating with analytics backend.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics(minRatings);
  }, [minRatings]);

  const overview = globalStats?.overview;
  const ratingStats = globalStats?.numpy_statistics || {};
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
              <h1 className="text-2xl font-black text-white tracking-tight">Movie Analytics & Insights</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore movie trends, audience ratings, genre performance, and regional cinema insights through interactive visualizations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchAnalytics(minRatings)}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50 cursor-pointer"
            title="Fetch latest verified data and update charts"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh Insights</span>
          </button>

          {/* View Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
            {[
              { id: 'all', label: 'All-in-One Dashboard', icon: Layers },
              { id: 'charts', label: 'Interactive Charts', icon: PieChart },
              { id: 'stats', label: 'Rating Statistics', icon: Calculator },
              { id: 'top-rated', label: 'Top-Rated Films', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
      </div>

      {/* Error Alert Banner with Retry */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Analytics Service Notice:</span>
              <span>{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(minRatings)}
            className="px-3.5 py-1.5 bg-rose-900 hover:bg-rose-800 text-white font-semibold rounded-xl border border-rose-700 transition shrink-0 self-start sm:self-auto"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Global Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Movies Analyzed</div>
          <div className="text-2xl font-black text-white mt-1">{overview?.total_movies || 0} Titles</div>
          <div className="text-[10px] text-indigo-400 mt-0.5 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Curated Film Catalogue</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Ratings</div>
          <div className="text-2xl font-black text-white mt-1">{(overview?.total_ratings || 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Audience & Critic Reviews</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Average Movie Rating</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{ratingStats?.mean || overview?.average_rating || 0}★</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Median: {ratingStats?.median || 0}★ (±{ratingStats?.std_dev || 0} deviation)</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Languages Covered</div>
          <div className="text-2xl font-black text-violet-400 mt-1">{regionalData.length} Languages</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Telugu, Tamil, Hindi, Global</div>
        </div>
      </div>

      {loading && !globalStats && (
        <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Analyzing movie trends and generating insights...</p>
        </div>
      )}

      {/* SECTION 1: Interactive Data Visualizations */}
      {(activeTab === 'all' || activeTab === 'charts') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Interactive Visualizations
              </h2>
              <span className="text-xs text-slate-400">
                (Generated dynamically from verified platform data)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 italic">
              Click any chart to inspect high-resolution view
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Genre Analysis */}
            <ChartCard
              title="1. Genre Rating Analysis"
              icon={Film}
              badge="Genre Performance"
              badgeColor="bg-indigo-950 text-indigo-300 border-indigo-800/60"
              chartUrl={charts?.genre_analysis}
              chartEndpoint="genre-analysis"
              minRatings={minRatings}
              loading={loading && !charts?.genre_analysis}
              onOpenZoom={setSelectedChart}
              description="Aggregates average audience rating by genre across all catalogue entries to highlight top-performing film categories."
            />

            {/* Chart 2: Rating Distribution */}
            <ChartCard
              title="2. Rating Distribution (1★ to 5★)"
              icon={Star}
              badge="Rating Distribution"
              badgeColor="bg-amber-950 text-amber-300 border-amber-800/60"
              chartUrl={charts?.rating_distribution}
              chartEndpoint="rating-distribution"
              minRatings={minRatings}
              loading={loading && !charts?.rating_distribution}
              onOpenZoom={setSelectedChart}
              description="Illustrates exact audience rating frequencies, highlighting concentration across 1-star to 5-star evaluation tiers."
            />

            {/* Chart 3: Top-Rated Movies with Threshold */}
            <ChartCard
              title="3. Verified Top-Rated Movies"
              icon={TrendingUp}
              badge={`Min ${minRatings}+ Ratings Threshold`}
              badgeColor="bg-emerald-950 text-emerald-300 border-emerald-800/60"
              chartUrl={charts?.top_rated_movies}
              chartEndpoint="top-rated"
              minRatings={minRatings}
              loading={loading && !charts?.top_rated_movies}
              onOpenZoom={setSelectedChart}
              description={`Filters out titles with fewer than ${minRatings} reviews to prevent low-sample skew, ranking top films by sample mean.`}
            />

            {/* Chart 4: Regional Rating Comparison */}
            <ChartCard
              title="4. Regional Cinema Comparison"
              icon={Globe}
              badge="Dual-Axis Rating vs Volume"
              badgeColor="bg-violet-950 text-violet-300 border-violet-800/60"
              chartUrl={charts?.regional_comparison}
              chartEndpoint="regional-comparison"
              minRatings={minRatings}
              loading={loading && !charts?.regional_comparison}
              onOpenZoom={setSelectedChart}
              description="Compares Bayesian average rating performance alongside total review sample volume across all regional film industries."
            />
          </div>
        </div>
      )}

      {/* SECTION 2: Rating Statistical Analysis */}
      {(activeTab === 'all' || activeTab === 'stats') && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Comprehensive Rating Statistics & Dispersion
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Sample Mean</span>
              <div className="text-lg font-black text-amber-400 mt-1">{ratingStats?.mean || 0}★</div>
              <span className="text-[9px] text-slate-500">Mean</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Median Rating</span>
              <div className="text-lg font-black text-indigo-400 mt-1">{ratingStats?.median || 0}★</div>
              <span className="text-[9px] text-slate-500">Median</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Std Deviation</span>
              <div className="text-lg font-black text-violet-400 mt-1">±{ratingStats?.std_dev || 0}</div>
              <span className="text-[9px] text-slate-500">Std Dev (σ)</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Variance</span>
              <div className="text-lg font-black text-slate-200 mt-1">{ratingStats?.variance || 0}</div>
              <span className="text-[9px] text-slate-500">Variance (σ²)</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Minimum</span>
              <div className="text-lg font-black text-rose-400 mt-1">{ratingStats?.min || 0}★</div>
              <span className="text-[9px] text-slate-500">Minimum</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Maximum</span>
              <div className="text-lg font-black text-emerald-400 mt-1">{ratingStats?.max || 0}★</div>
              <span className="text-[9px] text-slate-500">Maximum</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">25th %-tile (Q1)</span>
              <div className="text-lg font-black text-cyan-400 mt-1">{ratingStats?.percentile_25 || 0}★</div>
              <span className="text-[9px] text-slate-500">Lower Quartile</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">75th %-tile (Q3)</span>
              <div className="text-lg font-black text-cyan-400 mt-1">{ratingStats?.percentile_75 || 0}★</div>
              <span className="text-[9px] text-slate-500">Upper Quartile</span>
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Rating Frequency Breakdown
            </span>
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingStats?.star_distribution?.[star] || 0;
              const pct = ratingStats?.star_percentages?.[star] || 0;
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

      {/* SECTION 3: Top-Rated Movies & Minimum Rating Threshold */}
      {(activeTab === 'all' || activeTab === 'top-rated') && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Verified Top-Rated Movies (Minimum-Rating Threshold)
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
              Evaluated with verified volume thresholds
            </span>
          </div>

          <div className="divide-y divide-slate-800/70 border border-slate-800/80 rounded-2xl bg-slate-950/60 overflow-hidden">
            {topRatedMovies.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No movies qualified under the minimum threshold of {minRatings} ratings.
              </div>
            ) : (
              topRatedMovies.slice(0, 10).map((m, idx) => (
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
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: Genre Performance Breakdown */}
      {(activeTab === 'all' || activeTab === 'stats') && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Genre Performance Breakdown
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
      {(activeTab === 'all' || activeTab === 'stats') && (
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

      {/* Data Integrity & Methodology Overview */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Data Integrity & Methodology:</strong> {disclaimer ? `${disclaimer} ` : ''}
          All audience evaluations and cinema metrics are analyzed dynamically to ensure statistical accuracy and mitigate low-sample bias.
          User privacy is strictly protected: personal identifiers are never exposed or processed in public analytics computations.
          Visualizations and statistical charts update in real-time to reflect verified ratings across regional cinema industries.
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
              <span className="text-xs font-bold text-white">High-Resolution Visual Chart</span>
              <button
                type="button"
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
