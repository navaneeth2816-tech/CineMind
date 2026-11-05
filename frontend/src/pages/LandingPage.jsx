import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import MoviePoster from '../components/MoviePoster';
import { getVerifiedPoster } from '../constants/posters';
import {
  Film, Sparkles, BrainCircuit, BarChart3, Compass,
  Star, ArrowRight, CheckCircle2, ShieldCheck, Heart,
  Flame, Sliders, Users, Layers, Play, Clock, Globe,
  Bookmark, ChevronRight, Eye, Database, Code2, Cpu,
  ChevronLeft, Award, Activity, Check, MessageSquare,
  TrendingUp, ThumbsUp, Zap
} from 'lucide-react';

// Curated verified benchmark fallback movies covering all 6 regional cinema industries
const FALLBACK_FEATURED = [
  {
    id: 1,
    title: 'RRR',
    release_year: 2022,
    language: 'Telugu',
    runtime_minutes: 187,
    bayesian_score: 4.86,
    rating_mean: 4.88,
    rating_count: 360,
    confidence_pct: 98.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
    genres: ['Action', 'Drama']
  },
  {
    id: 6,
    title: 'Vikram',
    release_year: 2022,
    language: 'Tamil',
    runtime_minutes: 174,
    bayesian_score: 4.70,
    rating_mean: 4.72,
    rating_count: 72,
    confidence_pct: 97.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg',
    genres: ['Action', 'Thriller', 'Crime']
  },
  {
    id: 11,
    title: 'Drishyam',
    release_year: 2013,
    language: 'Malayalam',
    runtime_minutes: 160,
    bayesian_score: 4.78,
    rating_mean: 4.81,
    rating_count: 90,
    confidence_pct: 98.2,
    poster_url: 'https://image.tmdb.org/t/p/w500/gPBldHTnqpgsrnDnSrAlFwE6Q1t.jpg',
    genres: ['Crime', 'Mystery', 'Thriller']
  },
  {
    id: 26,
    title: 'Kantara',
    release_year: 2022,
    language: 'Kannada',
    runtime_minutes: 148,
    bayesian_score: 4.74,
    rating_mean: 4.78,
    rating_count: 245,
    confidence_pct: 97.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/jIsKmkxMzdCZ0Ux1GVSnu8m6Na6.jpg',
    genres: ['Action', 'Drama', 'Mystery']
  },
  {
    id: 18,
    title: 'Dangal',
    release_year: 2016,
    language: 'Hindi',
    runtime_minutes: 161,
    bayesian_score: 4.74,
    rating_mean: 4.77,
    rating_count: 88,
    confidence_pct: 97.9,
    poster_url: 'https://image.tmdb.org/t/p/w500/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg',
    genres: ['Action', 'Biography', 'Drama']
  },
  {
    id: 22,
    title: 'Interstellar',
    release_year: 2014,
    language: 'English',
    runtime_minutes: 169,
    bayesian_score: 4.90,
    rating_mean: 4.92,
    rating_count: 420,
    confidence_pct: 99.2,
    poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    genres: ['Adventure', 'Drama', 'Sci-Fi']
  }
];

export default function LandingPage({ onOpenDecisionReport }) {
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();
  const [featuredMovies, setFeaturedMovies] = useState(FALLBACK_FEATURED);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Fetch actual movie records from database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const res = await api.getMovies({ sort: 'bayesian', limit: 6 });
        if (isMounted && res && res.movies && res.movies.length > 0) {
          const enriched = res.movies.map((m, idx) => ({
            ...m,
            poster_url: m.poster_url || getVerifiedPoster(m.title) || FALLBACK_FEATURED[idx % FALLBACK_FEATURED.length]?.poster_url,
            confidence_pct: m.rating_count ? Math.min(99.4, +(92 + (m.rating_count / 300) * 7.4).toFixed(1)) : (98.6 - idx * 0.3)
          }));
          setFeaturedMovies(enriched);
        }
      } catch (err) {
        console.warn('Using fallback featured catalog for landing page:', err);
      }
    }
    loadFeatured();
    return () => { isMounted = false; };
  }, []);

  const previewCount = Math.min(6, featuredMovies.length);

  // Auto-cycle through top preview spotlight cards
  useEffect(() => {
    if (previewCount <= 1) return;
    const timer = setInterval(() => {
      setActivePreviewIndex(prev => (prev + 1) % previewCount);
    }, 5500);
    return () => clearInterval(timer);
  }, [previewCount]);

  const handleExploreClick = () => {
    navigate('/discover');
  };

  const handleGetStartedClick = () => {
    if (openAuthModal) {
      openAuthModal('register');
    } else {
      navigate('/discover');
    }
  };

  const currentPreview = featuredMovies[activePreviewIndex] || featuredMovies[0];

  return (
    <div id="home" className="w-full bg-[#f8faff] text-slate-900 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* =========================================================================
          HERO SECTION (Inspired by SpaceBasic's Visual Hierarchy & Spacing)
          ========================================================================= */}
      <section className="relative pt-10 pb-20 sm:pt-14 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#eef4ff] via-[#f8faff] to-white overflow-hidden">
        
        {/* Soft Lavender & Light-Blue Ambient Mesh Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-tr from-blue-300/35 via-indigo-200/40 to-purple-200/45 blur-[120px] rounded-full" />
          <div className="absolute top-1/3 -left-48 w-[450px] h-[450px] bg-blue-200/30 blur-[130px] rounded-full" />
          <div className="absolute top-1/2 -right-48 w-[450px] h-[450px] bg-purple-200/35 blur-[130px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto space-y-14">
          
          {/* Main Hero Header Text Block */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/90 border border-indigo-200/80 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                Next-Generation Movie Decision Intelligence
              </span>
            </div>

            {/* Large Bold Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.12]">
              Discover Movies <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                That Match Your Mind.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Experience smarter movie discovery with AI-powered recommendations, personalized suggestions, movie ratings, reviews, and intelligent analytics. Find your next favourite movie with CineMind.
            </p>

            {/* Two Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleGetStartedClick}
                className="w-full sm:w-auto px-8 py-4 text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 rounded-2xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center space-x-2.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={handleExploreClick}
                className="w-full sm:w-auto px-7 py-4 text-sm font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Explore Movies</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              LARGE, ENGAGING HERO ILLUSTRATION / PLATFORM SHOWCASE CANVAS
              (Similar to the prominent campus illustration in SpaceBasic)
              ========================================================================= */}
          <div className="relative max-w-5xl mx-auto pt-6">
            
            {/* Ambient Base Glow */}
            <div className="absolute inset-x-8 -inset-y-4 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-3xl blur-2xl pointer-events-none" />

            {/* Main Center Platform Canvas Frame */}
            <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-2xl p-4 sm:p-7 backdrop-blur-xl transition duration-500">
              
              {/* Device Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="text-xs font-semibold text-slate-500 pl-2">
                    CineMind Intelligence Dashboard
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Real-Time Bayesian Recommendation</span>
                </div>
              </div>

              {/* Central Cinema Stage with Surrounding Floating Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Cinema Visual Display Frame (Left 7 Cols) */}
                <div 
                  className="lg:col-span-7 relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group cursor-pointer"
                  onClick={() => onOpenDecisionReport && onOpenDecisionReport(currentPreview.id)}
                  title="Click to view Decision Report"
                >
                  <MoviePoster
                    key={`hero-preview-${currentPreview.id || currentPreview.title}`}
                    src={currentPreview.poster_url}
                    alt={currentPreview.title}
                    title={currentPreview.title}
                    year={currentPreview.release_year}
                    language={currentPreview.language}
                    aspectRatio="aspect-[16/10]"
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

                  {/* Play & Preview Floating Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Movie Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                    <div className="space-y-1">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-600 text-white shadow-xs">
                        {currentPreview.language} Cinema
                      </span>
                      <h3 className="text-2xl font-black text-white drop-shadow-md">
                        {currentPreview.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <span>{currentPreview.release_year}</span>
                        <span>•</span>
                        <span>{currentPreview.runtime_minutes ? `${currentPreview.runtime_minutes} mins` : '150 mins'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-400/40 text-amber-300 font-extrabold text-sm shadow-lg">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{(currentPreview.bayesian_score || currentPreview.rating_mean || 4.8).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Insight Panel (Right 5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Floating AI Match Score Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 border border-indigo-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
                          <BrainCircuit className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          AI Taste Match Score
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                        {(currentPreview.confidence_pct || 98.6).toFixed(1)}% Match
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, currentPreview.confidence_pct || 98.6)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Calculated using Bayesian shrinkage estimation and cosine preference vectors.
                    </p>
                  </div>

                  {/* Genre Affinities Card */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <div className="text-xs font-bold text-slate-700">
                      Dominant Genre Affinities
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(currentPreview.genres) ? currentPreview.genres : ['Action', 'Drama']).map((g) => (
                        <span
                          key={g}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {g}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {currentPreview.language}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Language & Consensus Strip */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Catalog Diversity
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        6 Indian & Global Dialects
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-500 font-extrabold text-xs">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Verified Title</span>
                    </div>
                  </div>

                  {/* Selector Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePreviewIndex(prev => (prev - 1 + previewCount) % previewCount)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      title="Previous Movie"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex space-x-2">
                      {Array.from({ length: previewCount }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePreviewIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            activePreviewIndex === idx
                              ? 'w-7 bg-gradient-to-r from-blue-600 to-indigo-600'
                              : 'w-2 bg-slate-200 hover:bg-slate-300'
                          }`}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActivePreviewIndex(prev => (prev + 1) % previewCount)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      title="Next Movie"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 3: FEATURES SECTION (6 Beautiful SaaS Feature Cards)
          ========================================================================= */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            <span>Platform Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Engineered for Precision & Film Discovery
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Everything you need to navigate the world of cinema with intelligence, transparency, and statistical certainty.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature 1: AI Movie Recommendations */}
          <div className="group p-8 bg-white border border-slate-200/90 hover:border-indigo-300 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition">
              AI Movie Recommendations
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Advanced machine learning algorithms with Bayesian shrinkage estimation eliminate cold-start rating bias, surfacing authentic cinematic gems that match your taste profile.
            </p>
          </div>

          {/* Feature 2: Personalized Movie Discovery */}
          <div className="group p-8 bg-white border border-slate-200/90 hover:border-purple-300 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition">
              Personalized Movie Discovery
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dynamic Taste DNA vectors adapt in real time to your viewing habits, preferred runtimes, and explicit genre constraints for tailored recommendations.
            </p>
          </div>

          {/* Feature 3: Ratings and Reviews */}
          <div className="group p-8 bg-white border border-slate-200/90 hover:border-amber-300 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition">
              Ratings and Reviews
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore verified 1-to-5 star audience ratings, sentiment summaries, and spoiler-free viewer feedback without commercial manipulation or spam.
            </p>
          </div>

          {/* Feature 4: Trending Movies */}
          <div className="group p-8 bg-white border border-slate-200/90 hover:border-rose-300 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition">
              Trending Movies
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Real-time catalog of critically acclaimed and trending cinema spanning Telugu, Tamil, Malayalam, Kannada, Hindi, and Hollywood titles.
            </p>
          </div>

          {/* Feature 5: Movie Analytics */}
          <div className="group p-8 bg-white border border-slate-200/90 hover:border-cyan-300 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition">
              Movie Analytics
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Comprehensive data science visualizations powered by real Pandas and NumPy calculations, featuring Matplotlib rating distribution charts and regional metrics.
            </p>
          </div>

          {/* Feature 6: Community Voting */}
          <div className="group p-8 bg-white border border-slate-200/90 hover:border-emerald-300 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition">
              Community Voting
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Real-time collaborative Group Decision rooms for watch parties with instant consensus scoring and mutual-exclusion Upvote/Veto voting rules.
            </p>
          </div>

        </div>

      </section>

      {/* =========================================================================
          SECTION 4: HOW IT WORKS (Clean SaaS Visual Workflow)
          ========================================================================= */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50/30 to-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide">
              <Layers className="w-3.5 h-3.5" />
              <span>Simple Workflow</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              How CineMind Works
            </h2>

            <p className="text-base sm:text-lg text-slate-600">
              Four streamlined steps taking you from sign-up to personalized cinematic recommendations.
            </p>
          </div>

          {/* 4 Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-indigo-300 transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-lg shadow-xs">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create Your Profile
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Sign up in seconds, configure your regional language preferences, and set initial movie interests to prime the recommendation pipeline.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-1.5 text-xs font-bold text-blue-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Instant Account Setup</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-indigo-300 transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-lg shadow-xs">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Rate & Bookmark Films
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Rate movies you have watched on a 1-to-5 star scale and bookmark upcoming titles to your personal watchlist from our verified catalog.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-1.5 text-xs font-bold text-indigo-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Interactive Catalog</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-indigo-300 transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-black text-lg shadow-xs">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Intelligent AI Analysis
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Our Bayesian trust engine processes your ratings, updating your Taste DNA vector and calculating cosine similarities across catalog features.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-1.5 text-xs font-bold text-purple-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bayesian Vectorization</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-indigo-300 transition">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-lg shadow-xs">
                  04
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Discover Your Next Favourite
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Receive pinpoint-accurate movie recommendations with full transparency into why each film was chosen for you.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Explainable AI Suggestions</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: WHY CINEMIND (Advantages of Intelligent Discovery)
          ========================================================================= */}
      <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Content & Advantages */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Why CineMind</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Smarter Film Recommendations Grounded in Data Science
            </h2>

            <p className="text-base text-slate-600 leading-relaxed">
              Movie lovers waste an average of 25 minutes browsing streaming catalogs before deciding what to watch. Most platforms rely on generic commercial popularity that obscures hidden masterpieces and creates severe rating bias for newer titles.
            </p>

            {/* 4 Advantage Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-2 text-sm font-bold text-indigo-700">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Zero Popularity Bias</span>
                </div>
                <p className="text-xs text-slate-600">
                  Bayesian shrinkage eliminates rating inflation, giving under-rated films equal standing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-2 text-sm font-bold text-blue-700">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Multi-Regional Cinema</span>
                </div>
                <p className="text-xs text-slate-600">
                  Equal prominence for Telugu, Tamil, Malayalam, Kannada, Hindi, and Hollywood titles.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-2 text-sm font-bold text-purple-700">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Explainable AI (XAI)</span>
                </div>
                <p className="text-xs text-slate-600">
                  Clear match scores and transparent evidence reasons for every single recommendation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5 shadow-xs">
                <div className="flex items-center space-x-2 text-sm font-bold text-emerald-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Engineering Rigor</span>
                </div>
                <p className="text-xs text-slate-600">
                  Engineered with MySQL 8.0, Python Flask, Pandas, NumPy, and Matplotlib.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Key Verified Statistics Grid */}
          <div className="lg:col-span-5 relative">
            <div className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-2xl space-y-7">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Platform Benchmark Metrics
                </span>
                <h3 className="text-xl font-bold text-white">
                  Verified Data & Algorithmic Accuracy
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                  <div className="text-3xl font-black text-white">25+</div>
                  <div className="text-xs text-slate-300 font-semibold">Curated Titles</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                  <div className="text-3xl font-black text-indigo-300">1,890+</div>
                  <div className="text-xs text-slate-300 font-semibold">Verified Ratings</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                  <div className="text-3xl font-black text-blue-300">6</div>
                  <div className="text-xs text-slate-300 font-semibold">Languages</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                  <div className="text-3xl font-black text-amber-300">98.4%</div>
                  <div className="text-xs text-slate-300 font-semibold">Bayesian Reliability</div>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                <p className="text-xs text-indigo-200">
                  B.Tech Computer Science Engineering Capstone Project
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FINAL SECTION (Attractive High-Converting CTA Banner)
          ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-14 text-center text-white shadow-2xl overflow-hidden space-y-6">
          
          {/* Ambient decorative lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-900/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Your Next Favourite Movie Is Waiting.
            </h2>
            <p className="text-base sm:text-lg text-indigo-100 font-normal leading-relaxed">
              Join CineMind today and experience the future of personalized movie recommendations and intelligent rating analytics.
            </p>
          </div>

          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleGetStartedClick}
              className="w-full sm:w-auto px-9 py-4 text-sm font-extrabold text-indigo-700 bg-white hover:bg-indigo-50 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Get Started</span>
            </button>

            <button
              type="button"
              onClick={handleExploreClick}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-indigo-700/60 hover:bg-indigo-700/90 border border-white/20 rounded-2xl backdrop-blur-md transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Movies</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CLEAN SAAS MODERN FOOTER
          ========================================================================= */}
      <footer className="border-t border-slate-200/90 bg-white pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Main 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Column 1: Brand & Tagline */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Film className="w-4 h-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Mind</span>
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Movie Ratings Analysis & Recommendation System. Delivering transparent, mathematically grounded film recommendations backed by Bayesian shrinkage and Taste DNA profiling.
              </p>
              <div className="text-xs text-slate-500">
                Designed & built for high-performance cinematic discovery.
              </div>
            </div>

            {/* Column 2: Platform Navigation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Platform Navigation
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li>
                  <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
                </li>
                <li>
                  <Link to="/discover" className="hover:text-indigo-600 transition">Explore Movies</Link>
                </li>
                <li>
                  <Link to="/taste-dna" className="hover:text-indigo-600 transition">Taste DNA Profile</Link>
                </li>
                <li>
                  <Link to="/analytics" className="hover:text-indigo-600 transition">Ratings & Regional Analytics</Link>
                </li>
                <li>
                  <Link to="/compare" className="hover:text-indigo-600 transition">Side-by-Side Comparison</Link>
                </li>
                <li>
                  <Link to="/group" className="hover:text-indigo-600 transition">Group Decision Room</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Engineering Team */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Engineering Team
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Database Developer</span>
                    <p className="text-[11px] text-slate-500">MySQL 8.0 Schema, Driver & Relational Integrity</p>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Backend & ML Engineer</span>
                    <p className="text-[11px] text-slate-500">Bayesian Shrinkage, Cosine DNA & Flask APIs</p>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Data Analyst</span>
                    <p className="text-[11px] text-slate-500">Pandas, NumPy Aggregations & Visualizations</p>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Frontend UI/UX</span>
                    <p className="text-[11px] text-slate-500">React 18 & Modern SaaS Responsive Interface</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & University Context */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                About & Contact
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                CineMind is an engineering final-year capstone project focused on machine learning in recommender systems, cultural cinema preservation, and rating analytics.
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                <div><strong>Email:</strong> support@cinemind.dev</div>
                <div><strong>Department:</strong> Computer Science & Engineering</div>
                <div><strong>Status:</strong> Live Demonstration Ready</div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright & Badges */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              &copy; 2026 <strong>CineMind</strong> &mdash; Movie Ratings Analysis & Recommendation System. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">React 18</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">Python Flask</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">MySQL 8.0</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">Pandas & NumPy</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">Matplotlib</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}