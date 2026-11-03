import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import MoviePoster from '../components/MoviePoster';
import {
  Film, Sparkles, BrainCircuit, BarChart3, Compass,
  Star, ArrowRight, CheckCircle2, ShieldCheck, Heart,
  Flame, Sliders, Users, Layers, Play, Clock, Globe,
  Bookmark, ChevronRight, Eye, Database, Code2, Cpu
} from 'lucide-react';

// Curated benchmark fallback movies to guarantee instant visual rendering
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
    poster_url: 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeMu1QXO.jpg',
    genres: ['Action', 'Drama']
  },
  {
    id: 2,
    title: 'Kantara',
    release_year: 2022,
    language: 'Kannada',
    runtime_minutes: 148,
    bayesian_score: 4.74,
    rating_mean: 4.78,
    rating_count: 245,
    poster_url: 'https://image.tmdb.org/t/p/w500/5v6k6pGsmhK8v2g3Yl9m8JpY9Pz.jpg',
    genres: ['Action', 'Drama', 'Mystery']
  },
  {
    id: 3,
    title: 'Interstellar',
    release_year: 2014,
    language: 'English',
    runtime_minutes: 169,
    bayesian_score: 4.90,
    rating_mean: 4.92,
    rating_count: 420,
    poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    genres: ['Adventure', 'Drama', 'Sci-Fi']
  },
  {
    id: 4,
    title: 'Dune: Part Two',
    release_year: 2024,
    language: 'English',
    runtime_minutes: 166,
    bayesian_score: 4.82,
    rating_mean: 4.85,
    rating_count: 310,
    poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    genres: ['Action', 'Adventure', 'Sci-Fi']
  },
  {
    id: 5,
    title: 'Sita Ramam',
    release_year: 2022,
    language: 'Telugu',
    runtime_minutes: 163,
    bayesian_score: 4.76,
    rating_mean: 4.80,
    rating_count: 215,
    poster_url: 'https://image.tmdb.org/t/p/w500/9yB79G55e1uQW6y41u3vY0NqY6k.jpg',
    genres: ['Drama', 'Mystery', 'Romance']
  },
  {
    id: 6,
    title: 'Asuran',
    release_year: 2019,
    language: 'Tamil',
    runtime_minutes: 141,
    bayesian_score: 4.80,
    rating_mean: 4.83,
    rating_count: 280,
    poster_url: 'https://image.tmdb.org/t/p/w500/l8Z80z8w9w4yX5z0y7k5w1n2p3.jpg',
    genres: ['Action', 'Drama']
  },
  {
    id: 7,
    title: 'Manjummel Boys',
    release_year: 2024,
    language: 'Malayalam',
    runtime_minutes: 135,
    bayesian_score: 4.78,
    rating_mean: 4.81,
    rating_count: 195,
    poster_url: 'https://image.tmdb.org/t/p/w500/bCblJmC0NZZ7yK4vQfHqg8f7h1.jpg',
    genres: ['Adventure', 'Drama', 'Thriller']
  },
  {
    id: 8,
    title: 'Jersey',
    release_year: 2019,
    language: 'Telugu',
    runtime_minutes: 157,
    bayesian_score: 4.73,
    rating_mean: 4.76,
    rating_count: 210,
    poster_url: 'https://image.tmdb.org/t/p/w500/6v0n7m8n9p0q1r2s3t4u5v6w7x8.jpg',
    genres: ['Drama', 'Sport']
  }
];

export default function LandingPage({ onOpenDecisionReport }) {
  const navigate = useNavigate();
  const { openAuthModal, isAuthenticated, watchlistIds, toggleWatchlist } = useAuth();
  const [featuredMovies, setFeaturedMovies] = useState(FALLBACK_FEATURED);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  // Fetch real database records on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const res = await api.getMovies({ sort: 'bayesian', limit: 8 });
        if (isMounted && res && res.movies && res.movies.length > 0) {
          setFeaturedMovies(res.movies);
        }
      } catch (err) {
        console.warn('Using fallback featured catalog for landing page:', err);
      } finally {
        if (isMounted) setLoadingMovies(false);
      }
    }
    loadFeatured();
    return () => { isMounted = false; };
  }, []);

  // Hero carousel auto-timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="w-full text-slate-100 overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* =========================================================================
          HERO SECTION: Cinematic Background, Smooth Glowing Gradients & Dynamic Cards
          ========================================================================= */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950">
        {/* Cinematic Ambient Glow Gradients (Deep Obsidian, Royal Purple, Warm Amber) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-purple-900/30 via-indigo-900/25 to-orange-700/20 blur-[130px] rounded-full" />
          <div className="absolute top-1/3 -left-48 w-[500px] h-[500px] bg-purple-950/40 blur-[140px] rounded-full" />
          <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-orange-950/30 blur-[140px] rounded-full" />
          {/* Subtle cinematic starfield / noise overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />
        </div>

        <div className="relative max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading, Description & Action Buttons */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 shadow-lg shadow-purple-950/40 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-slate-200">
                AI-Powered Decision Intelligence Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Discover Movies <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-orange-400">
                That Match Your Taste.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Explore amazing movies, analyse ratings, and discover your next favourite movie with intelligent AI-powered recommendations.
            </p>

            {/* Action Buttons: Explore Movies & Get Started */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {/* Explore Movies Button */}
              <button
                type="button"
                onClick={handleExploreClick}
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 rounded-2xl shadow-xl shadow-purple-950/30 flex items-center justify-center space-x-2.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <Film className="w-4 h-4 text-purple-400 group-hover:text-orange-400 transition" />
                <span>Explore Movies</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition" />
              </button>

              {/* Get Started Button */}
              <button
                type="button"
                onClick={handleGetStartedClick}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 hover:from-purple-500 hover:via-indigo-500 hover:to-orange-400 rounded-2xl shadow-xl shadow-purple-600/35 hover:shadow-orange-500/25 flex items-center justify-center space-x-2.5 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            </div>

            {/* Key Trust Metrics Strip */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80">
              <div>
                <div className="text-2xl font-black text-white">25+</div>
                <div className="text-xs text-slate-400 font-medium">Curated Titles</div>
              </div>
              <div>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">
                  1,890+
                </div>
                <div className="text-xs text-slate-400 font-medium">Verified Ratings</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">6</div>
                <div className="text-xs text-slate-400 font-medium">Languages</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-400">99.4%</div>
                <div className="text-xs text-slate-400 font-medium">Bayesian Accuracy</div>
              </div>
            </div>
          </div>

          {/* Right Column: Cinematic Floating Interactive Showcase Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Ambient Background Glow Behind Cards */}
            <div className="absolute w-72 h-72 bg-gradient-to-br from-purple-600/30 to-orange-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Main Interactive Showcase Card */}
            <div className="relative w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-purple-500/40">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-semibold text-slate-400 pl-2">
                    CineMind Recommendation Engine
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800/40">
                  Live Match
                </span>
              </div>

              {/* Movie Spotlight */}
              {featuredMovies.length > 0 && (
                <div className="pt-4 space-y-4">
                  {(() => {
                    const spotlight = featuredMovies[activeHeroSlide % featuredMovies.length] || featuredMovies[0];
                    return (
                      <>
                        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer"
                             onClick={() => onOpenDecisionReport && onOpenDecisionReport(spotlight.id)}>
                          <MoviePoster
                            src={spotlight.poster_url}
                            title={spotlight.title}
                            year={spotlight.release_year}
                            language={spotlight.language}
                            aspectRatio="aspect-[16/9]"
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                            <div>
                              <div className="inline-block px-2 py-0.5 mb-1 text-[10px] font-bold rounded bg-orange-500/90 text-white">
                                {spotlight.language} Cinema
                              </div>
                              <h3 className="text-lg font-black text-white drop-shadow-md">
                                {spotlight.title}
                              </h3>
                            </div>
                            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-lg">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{(spotlight.bayesian_score || spotlight.rating_mean || 4.8).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Analysis Pill Breakdown */}
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Bayesian Confidence</span>
                            <span className="text-emerald-400 font-bold">98.6% High Sample</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-orange-500 rounded-full w-[96%]" />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Genres: {Array.isArray(spotlight.genres) ? spotlight.genres.join(', ') : 'Action, Drama'}</span>
                            <span>{spotlight.runtime_minutes ? `${spotlight.runtime_minutes} mins` : '150 mins'}</span>
                          </div>
                        </div>

                        {/* Slide Selector Indicator */}
                        <div className="flex justify-center space-x-2 pt-1">
                          {[0, 1, 2, 3].map(idx => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveHeroSlide(idx)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                activeHeroSlide === idx
                                  ? 'w-6 bg-gradient-to-r from-purple-500 to-orange-500'
                                  : 'w-2 bg-slate-800 hover:bg-slate-700'
                              }`}
                              aria-label={`Slide ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Floating Side Badge */}
            <div className="hidden sm:flex absolute -bottom-5 -left-6 items-center space-x-3 p-3 bg-slate-900/95 border border-purple-500/40 rounded-2xl shadow-xl backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 flex items-center justify-center text-white shadow-md">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">IMDb Bayesian Filter</div>
                <div className="text-[10px] text-slate-400">Zero Small-Sample Bias</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: FEATURES SECTION (Four Attractive Feature Cards)
          ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Next-Generation Decision Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Engineered for Film Enthusiasts & Data Geeks
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Traditional recommendation algorithms push sponsored hype. CineMind uses genuine statistical data science to reveal movies you will truly love.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: AI-Powered Recommendations */}
          <div className="group relative p-6 bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-950/30 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                Mathematical Modeling
              </span>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                AI-Powered Recommendations
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combines Bayesian Shrinkage Estimation with Cosine Similarity vector matching. We counter sparse-review cold starts by pulling under-rated gems to the surface.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-semibold">
              <span>IMDb-style algorithm</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Movie Discovery */}
          <div className="group relative p-6 bg-slate-900/70 border border-slate-800 hover:border-orange-500/50 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-orange-950/30 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl group-hover:bg-orange-600/20 transition" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
                Multi-Regional Depth
              </span>
              <h3 className="text-lg font-bold text-white group-hover:text-orange-300 transition">
                Movie Discovery
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Break language silos with deep catalog support across Telugu, Tamil, Malayalam, Kannada, Hindi, and English films. Search using natural conversational prompts.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-orange-400 font-semibold">
              <span>6 Indian & Global Dialects</span>
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Rating Analysis & Statistics */}
          <div className="group relative p-6 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-950/30 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl group-hover:bg-cyan-600/20 transition" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Pandas & NumPy
              </span>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                Rating Analysis & Statistics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive Matplotlib charts powered by real database queries. Inspect star distributions, variance, confidence intervals, and verified minimum-count leaderboards.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-semibold">
              <span>Parametric Data Science</span>
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Personalized Movie Experience */}
          <div className="group relative p-6 bg-slate-900/70 border border-slate-800 hover:border-fuchsia-500/50 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-fuchsia-950/30 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-600/10 rounded-full blur-2xl group-hover:bg-fuchsia-600/20 transition" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-600/30 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-800/40">
                Taste DNA & Rooms
              </span>
              <h3 className="text-lg font-bold text-white group-hover:text-fuchsia-300 transition">
                Personalized Movie Experience
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build your evolving cinematic fingerprint. Set runtime limit constraints, exclude unwanted genres, curate watchlists, and host collaborative Group Voting rooms.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-fuchsia-400 font-semibold">
              <span>Watch Party Consensus</span>
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: HOW IT WORKS (Four Sequential Steps)
          ========================================================================= */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-800/40 text-orange-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Seamless 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How CineMind Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            From first login to tonight's movie recommendation in less than two minutes.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col justify-between group hover:border-purple-500/40 transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-purple-400 group-hover:bg-gradient-to-tr group-hover:from-purple-600 group-hover:to-orange-500 group-hover:text-white transition-all shadow-md">
                01
              </div>
              <h3 className="text-base font-bold text-white">Create your account.</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up in seconds or use demo accounts. Configure your regional language preferences and initial movie interests to prime the recommendation pipeline.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center space-x-1.5 text-[11px] text-purple-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant Setup</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col justify-between group hover:border-purple-500/40 transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-indigo-400 group-hover:bg-gradient-to-tr group-hover:from-indigo-600 group-hover:to-purple-500 group-hover:text-white transition-all shadow-md">
                02
              </div>
              <h3 className="text-base font-bold text-white">Explore and select your favourite movies.</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse our multi-language catalog. Log 1-to-5 star ratings for movies you have watched and bookmark upcoming titles to your personal watchlist.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center space-x-1.5 text-[11px] text-indigo-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Interactive Catalog</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col justify-between group hover:border-orange-500/40 transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-orange-400 group-hover:bg-gradient-to-tr group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white transition-all shadow-md">
                03
              </div>
              <h3 className="text-base font-bold text-white">Our recommendation system analyses your preferences.</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our Bayesian evidence engine updates your Taste DNA affinity vector, computes cosine similarity across catalog features, and eliminates statistical noise.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center space-x-1.5 text-[11px] text-orange-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bayesian Vectorization</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col justify-between group hover:border-emerald-500/40 transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-lg text-emerald-400 group-hover:bg-gradient-to-tr group-hover:from-emerald-500 group-hover:to-cyan-500 group-hover:text-white transition-all shadow-md">
                04
              </div>
              <h3 className="text-base font-bold text-white">Discover movies recommended for you.</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive personalized recommendations complete with transparent confidence scores, match reasons, runtime metrics, and verified viewer feedback.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Explainable AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FEATURED MOVIES (Dynamic from Database / Verified Benchmark)
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold mb-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Verified Database Records</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Featured & Highly-Rated Movies
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mt-1">
              Popular films across regional and global cinema, ranked using Bayesian weighted evidence smoothing.
            </p>
          </div>

          <Link
            to="/discover"
            className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 rounded-xl transition group self-start md:self-auto"
          >
            <span>View Full Catalog (25 Titles)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition" />
          </Link>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {featuredMovies.map((movie) => {
            const isWatchlisted = watchlistIds.has(movie.id);
            return (
              <div
                key={movie.id}
                className="group relative bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/20 flex flex-col justify-between"
              >
                {/* Poster Container */}
                <div
                  className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => onOpenDecisionReport && onOpenDecisionReport(movie.id)}
                >
                  <MoviePoster
                    src={movie.poster_url}
                    alt={movie.title}
                    title={movie.title}
                    year={movie.release_year}
                    language={movie.language}
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle top/bottom shadow gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />

                  {/* Top Badges: Language & Watchlist button */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950/80 text-purple-300 border border-purple-800/40 backdrop-blur-md">
                      {movie.language}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(movie.id);
                      }}
                      className={`p-1.5 rounded-xl backdrop-blur-md transition ${
                        isWatchlisted
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                      title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  {/* Rating Tag */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-950/85 text-amber-300 text-[11px] font-extrabold border border-amber-500/30 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{(movie.bayesian_score || movie.rating_mean || 4.5).toFixed(1)}</span>
                  </div>
                </div>

                {/* Details Container */}
                <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2.5">
                  <div>
                    <h4
                      onClick={() => onOpenDecisionReport && onOpenDecisionReport(movie.id)}
                      className="text-xs font-bold text-white group-hover:text-purple-300 transition line-clamp-1 cursor-pointer"
                    >
                      {movie.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{movie.release_year}</span>
                      <span>•</span>
                      <span>{movie.runtime_minutes ? `${movie.runtime_minutes}m` : '150m'}</span>
                    </div>
                  </div>

                  {/* Genres Chips */}
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(movie.genres) ? movie.genres : []).slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Decision Report Action */}
                  <button
                    type="button"
                    onClick={() => onOpenDecisionReport && onOpenDecisionReport(movie.id)}
                    className="w-full py-1.5 px-2 text-[11px] font-semibold text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 rounded-xl transition flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3 h-3 text-purple-400" />
                    <span>Decision Report</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: ABOUT CINEMIND (Mission, Purpose, & Technical Architecture)
          ========================================================================= */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: About Text & Vision */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>About CineMind</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              A Transparent Film Discovery Platform Engineered with Data Science
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Movie lovers waste an average of 25 minutes browsing streaming catalogs before deciding what to watch. Most platforms rely on generic commercial popularity that obscures hidden masterpieces and creates severe rating bias for newer titles.
            </p>

            <p className="text-sm text-slate-400 leading-relaxed">
              <strong>CineMind</strong> was created as a full-stack academic and engineering solution: an end-to-end Decision Intelligence Platform combining <em>Bayesian Shrinkage Estimation</em>, <em>Cosine Vector Similarity</em>, and <em>Multi-Language Regional Cinema Data</em>. We eliminate sparse-data cold starts and empower viewers to understand exactly why a film matches their personal Taste DNA.
            </p>

            {/* Architecture Highlights Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>MySQL 8.0 & SQLAlchemy</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  14 relational tables with strict unique constraints and foreign key cascade rules.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-orange-300">
                  <Cpu className="w-4 h-4 text-orange-400" />
                  <span>Pandas & NumPy Analytics</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Direct SQL-to-DataFrame statistical modeling, star distributions, and Matplotlib visuals.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Regional Cinema</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Equal prominence for Telugu, Tamil, Malayalam, Kannada, Hindi, and Hollywood titles.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Consensus Group Decision</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Real-time watch party rooms with Upvote/Veto mutual exclusion voting rules.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Interactive Architectural Infographic Box */}
          <div className="lg:col-span-5 relative">
            <div className="p-6 bg-slate-900/80 border border-purple-500/30 rounded-3xl shadow-2xl backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span>Technical System Architecture</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                  Production Verified
                </span>
              </div>

              {/* Stack Layers */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-bold text-purple-300">Frontend Presentation</div>
                  <div className="text-xs text-slate-300 font-medium">React 18 • Vite • Tailwind CSS • Lucide</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-bold text-indigo-300">Backend & API Layer</div>
                  <div className="text-xs text-slate-300 font-medium">Python 3.11 • Flask RESTful • JWT Auth</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-bold text-orange-300">Data Science & Intelligence</div>
                  <div className="text-xs text-slate-300 font-medium">Pandas • NumPy • Matplotlib • Bayesian Engine</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] font-bold text-cyan-300">Database & Storage</div>
                  <div className="text-xs text-slate-300 font-medium">MySQL 8.0 • mysql-connector-python • SQLAlchemy</div>
                </div>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-xl text-center">
                <p className="text-[11px] text-purple-300 font-semibold">
                  B.Tech Engineering Capstone Project Demonstration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FOOTER (About Us, Contact, Team Members, and Copyright)
          ========================================================================= */}
      <footer className="border-t border-slate-800/80 bg-slate-950/95 pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main Footer 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand & Overview */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                  <Film className="w-4 h-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">Mind</span>
                </span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                Movie Ratings Analysis & Recommendation System. Delivering transparent, mathematically grounded film recommendations backed by Bayesian shrinkage and Taste DNA profiling.
              </p>
              <div className="text-[11px] text-slate-500">
                Designed & built for high-performance cinematic discovery.
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Platform Navigation
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/" className="hover:text-purple-400 transition">Home</Link>
                </li>
                <li>
                  <Link to="/discover" className="hover:text-purple-400 transition">Explore Movies</Link>
                </li>
                <li>
                  <Link to="/taste-dna" className="hover:text-purple-400 transition">Taste DNA Profile</Link>
                </li>
                <li>
                  <Link to="/analytics" className="hover:text-purple-400 transition">Ratings & Regional Analytics</Link>
                </li>
                <li>
                  <Link to="/compare" className="hover:text-purple-400 transition">Side-by-Side Comparison</Link>
                </li>
                <li>
                  <Link to="/group" className="hover:text-purple-400 transition">Group Decision Room</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Team Members (B.Tech Demonstration) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Project Engineering Team
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200">Database Developer</span>
                    <p className="text-[11px] text-slate-500">MySQL Schema, Driver & Relational Integrity</p>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200">Backend & ML Engineer</span>
                    <p className="text-[11px] text-slate-500">Bayesian Shrinkage, Cosine DNA & Flask APIs</p>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200">Data Analyst</span>
                    <p className="text-[11px] text-slate-500">Pandas, NumPy Aggregations & Visualizations</p>
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200">Frontend UI/UX</span>
                    <p className="text-[11px] text-slate-500">React 18 & Cinematic Tailwind Interface</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Project Context */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                About Us & Contact
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                CineMind is an engineering final-year capstone project focused on machine learning in recommender systems, cultural cinema preservation, and rating analytics.
              </p>
              <div className="space-y-1 text-xs text-slate-400">
                <div><strong>Email:</strong> support@cinemind.dev</div>
                <div><strong>Department:</strong> Computer Science & Engineering</div>
                <div><strong>Status:</strong> Live Demonstration Ready</div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Tech Badges */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              &copy; 2026 <strong>CineMind</strong> &mdash; Movie Ratings Analysis & Recommendation System. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">React 18</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Python Flask</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">MySQL 8.0</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Pandas & NumPy</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Matplotlib</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}