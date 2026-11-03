import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Film, Sparkles, BrainCircuit, Users, BarChart3, 
  Bookmark, ShieldAlert, LogOut, User, ChevronDown, Scale,
  Compass, Info, Home, Layers
} from 'lucide-react';

export default function Navbar({ onSelectMovie }) {
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    watchlistIds, 
    logout, 
    openAuthModal,
    setIsAuthModalOpen, 
    setIsOnboardingModalOpen 
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleScrollTo = (targetId) => {
    if (location.pathname === '/') {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${targetId}`);
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* CineMind Logo on the Left */}
        <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-blue-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-300">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-purple-300 transition">
                Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-orange-400">Mind</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
              Movie Recommendation System
            </p>
          </div>
        </Link>

        {/* Navigation Bar Links: Home, Explore Movies, Taste DNA, Analytics, Features and About Us */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
          {/* Home */}
          <Link
            to="/"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              location.pathname === '/'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          {/* Explore Movies */}
          <Link
            to="/discover"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              location.pathname === '/discover' || location.pathname === '/explore'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Explore Movies</span>
          </Link>

          {/* Taste DNA */}
          <Link
            to="/taste-dna"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              location.pathname === '/taste-dna'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Taste DNA</span>
          </Link>

          {/* Analytics */}
          <Link
            to="/analytics"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              location.pathname === '/analytics'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
            <span>Analytics</span>
          </Link>

          {/* Features */}
          <a
            href="/#features"
            onClick={(e) => {
              e.preventDefault();
              handleScrollTo('features');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Features</span>
          </a>

          {/* About Us */}
          <a
            href="/#about"
            onClick={(e) => {
              e.preventDefault();
              handleScrollTo('about');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
          >
            <Info className="w-3.5 h-3.5 text-orange-400" />
            <span>About Us</span>
          </a>

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

        {/* Watchlist, Login and Sign Up Options */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Watchlist Option */}
          <Link
            to="/taste-dna#watchlist"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition group"
            title="Your Watchlist"
          >
            <div className="relative">
              <Bookmark className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition" />
              {watchlistIds.size > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-gradient-to-r from-purple-600 to-orange-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                  {watchlistIds.size}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Watchlist</span>
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-1.5 pr-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 via-blue-600 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow">
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
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-purple-950 text-purple-400 border border-purple-800/40">
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
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Calibrate Taste DNA</span>
                    </button>
                    <Link
                      to="/taste-dna"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-purple-400" />
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
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => (openAuthModal ? openAuthModal('login') : setIsAuthModalOpen(true))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => (openAuthModal ? openAuthModal('register') : setIsAuthModalOpen(true))}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-blue-600 to-orange-500 hover:from-purple-500 hover:via-blue-500 hover:to-orange-400 rounded-xl shadow-md shadow-purple-600/30 hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Mobile Navigation Pills */}
      <div className="lg:hidden flex items-center space-x-2 px-4 py-2 border-t border-slate-900 overflow-x-auto no-scrollbar bg-[#060913]/95">
        <Link
          to="/"
          className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 ${
            location.pathname === '/'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-3 h-3" />
          <span>Home</span>
        </Link>

        <Link
          to="/discover"
          className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 ${
            location.pathname === '/discover' || location.pathname === '/explore'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-3 h-3 text-blue-400" />
          <span>Explore</span>
        </Link>

        <Link
          to="/taste-dna"
          className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 ${
            location.pathname === '/taste-dna'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Taste DNA</span>
        </Link>

        <Link
          to="/analytics"
          className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 ${
            location.pathname === '/analytics'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3 h-3 text-orange-400" />
          <span>Analytics</span>
        </Link>

        <a
          href="/#features"
          onClick={(e) => {
            e.preventDefault();
            handleScrollTo('features');
          }}
          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 bg-slate-900 text-slate-400 hover:text-white"
        >
          <Layers className="w-3 h-3 text-blue-400" />
          <span>Features</span>
        </a>

        <a
          href="/#about"
          onClick={(e) => {
            e.preventDefault();
            handleScrollTo('about');
          }}
          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 bg-slate-900 text-slate-400 hover:text-white"
        >
          <Info className="w-3 h-3 text-orange-400" />
          <span>About</span>
        </a>

        {!isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => (openAuthModal ? openAuthModal('login') : setIsAuthModalOpen(true))}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 bg-slate-800 text-slate-300"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => (openAuthModal ? openAuthModal('register') : setIsAuthModalOpen(true))}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 bg-gradient-to-r from-purple-600 to-orange-500 text-white"
            >
              Sign Up
            </button>
          </>
        )}

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