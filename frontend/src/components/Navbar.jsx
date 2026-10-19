import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Film, Sparkles, BrainCircuit, Users, BarChart3, 
  Search, Bookmark, ShieldAlert, LogOut, User, ChevronDown, Scale
} from 'lucide-react';
import MoviePoster from './MoviePoster';

export default function Navbar({ onSelectMovie }) {
  const { user, isAuthenticated, isAdmin, watchlistIds, logout, setIsAuthModalOpen, setIsOnboardingModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);

  // Autocomplete debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { results } = await api.searchAutocomplete(searchQuery);
        setSuggestions(results || []);
        setShowDropdown(true);
      } catch (e) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (movie) => {
    setShowDropdown(false);
    setSearchQuery('');
    if (onSelectMovie) {
      onSelectMovie(movie.id);
    } else {
      navigate(`/?selected=${movie.id}`);
    }
  };

  const navLinks = [
    { to: '/', label: 'Discover', icon: Film },
    { to: '/taste-dna', label: 'Taste DNA', icon: Sparkles },
    { to: '/compare', label: 'Compare', icon: Scale },
    { to: '/assistant', label: 'Smart Assistant', icon: BrainCircuit },
    { to: '/group', label: 'Group Room', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-indigo-400 transition">
                CineMind
              </span>
              
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight -mt-0.5 hidden sm:block">
              Decision Intelligence
            </p>
          </div>
        </Link>

        {/* Live Autocomplete Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder="Search movies, regional titles, directors..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-white placeholder-slate-500 transition shadow-inner"
            />
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
              <div className="p-2 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                Catalogue Matches
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {suggestions.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectSuggestion(m)}
                    className="p-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center space-x-3 transition group"
                  >
                    <MoviePoster
                      src={m.poster_url}
                      alt={m.title}
                      title={m.title}
                      year={m.release_year}
                      language={m.language}
                      className="w-8 h-12 shrink-0 rounded border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-white group-hover:text-indigo-400 transition truncate">
                        {m.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {m.language} • {m.release_year} • {m.genres?.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 shrink-0">
                      {m.bayesian_score.toFixed(1)}★
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                location.pathname === '/admin'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border-rose-900/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div className="flex items-center space-x-3">
          {/* Watchlist Counter */}
          <Link
            to="/taste-dna#watchlist"
            className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
            title="Your Watchlist"
          >
            <Bookmark className="w-4 h-4" />
            {watchlistIds.size > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {watchlistIds.size}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-1.5 pr-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in divide-y divide-slate-800">
                  <div className="p-2">
                    <div className="font-semibold text-xs text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setIsOnboardingModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center space-x-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Calibrate Taste DNA</span>
                    </button>
                    <Link
                      to="/taste-dna"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Taste Profile & History</span>
                    </Link>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav pills */}
      <div className="lg:hidden flex items-center space-x-2 px-4 py-2 border-t border-slate-900 overflow-x-auto no-scrollbar">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 bg-rose-950 text-rose-300 border border-rose-800/60"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Admin</span>
          </Link>
        )}
      </div>
    </header>
  );
}
