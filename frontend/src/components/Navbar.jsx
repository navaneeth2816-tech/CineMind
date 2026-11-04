import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Film, Sparkles, BrainCircuit, Users, BarChart3, 
  Bookmark, ShieldAlert, LogOut, User, ChevronDown, Scale,
  Compass, Info, Home, Layers, ArrowRight
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = location.pathname === '/';

  const handleScrollTo = (targetId) => {
    setMobileMenuOpen(false);
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

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/');
  };

  // -------------------------------------------------------------
  // 1. PUBLIC SAAS LANDING PAGE NAVBAR (SpaceBasic-inspired)
  // -------------------------------------------------------------
  if (isLanding) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo on the Left */}
          <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                  Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Mind</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide -mt-0.5 hidden sm:block">
                Movie Intelligence Platform
              </p>
            </div>
          </Link>

          {/* Navigation Links: Home, Features, How It Works, About Us */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              type="button"
              onClick={() => handleScrollTo('home')}
              className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition cursor-pointer"
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => handleScrollTo('features')}
              className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition cursor-pointer"
            >
              Features
            </button>

            <button
              type="button"
              onClick={() => handleScrollTo('how-it-works')}
              className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition cursor-pointer"
            >
              How It Works
            </button>

            <button
              type="button"
              onClick={() => handleScrollTo('about')}
              className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70 rounded-xl transition cursor-pointer"
            >
              About Us
            </button>
          </nav>

          {/* Sign In & Get Started Buttons on the Right */}
          <div className="flex items-center space-x-3 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/discover"
                  className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enter Platform</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-1.5 pr-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 hidden sm:inline max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fade-in divide-y divide-slate-100">
                      <div className="p-2">
                        <div className="font-semibold text-xs text-slate-900 truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                          {user.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/taste-dna"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg flex items-center space-x-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Taste Profile & History</span>
                        </Link>
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => (openAuthModal ? openAuthModal('login') : setIsAuthModalOpen(true))}
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => (openAuthModal ? openAuthModal('register') : setIsAuthModalOpen(true))}
                  className="inline-flex items-center space-x-1.5 px-4 sm:px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar Pills */}
        <div className="md:hidden flex items-center space-x-2 px-4 py-2 border-t border-slate-100 overflow-x-auto no-scrollbar bg-white/95">
          <button
            type="button"
            onClick={() => handleScrollTo('home')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('features')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('how-it-works')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('about')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg shrink-0"
          >
            About Us
          </button>
          <Link
            to="/discover"
            className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0 flex items-center space-x-1"
          >
            <Compass className="w-3 h-3" />
            <span>Explore</span>
          </Link>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------
  // 2. INTERNAL APPLICATION DASHBOARD NAVBAR (Dark Mode)
  // -------------------------------------------------------------
  const internalNavLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/discover', label: 'Explore Movies', icon: Compass },
    { to: '/taste-dna', label: 'Taste DNA', icon: Sparkles },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
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

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {internalNavLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || (item.to === '/discover' && location.pathname === '/explore');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  active
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-xs shadow-purple-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            to="/compare"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              location.pathname === '/compare'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Compare</span>
          </Link>

          <Link
            to="/group"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              location.pathname === '/group'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Group Room</span>
          </Link>

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

        {/* Watchlist & User Profile */}
        <div className="flex items-center space-x-2.5 shrink-0">
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
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 via-blue-600 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
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
                      onClick={handleLogout}
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
                Sign In
              </button>
              <button
                type="button"
                onClick={() => (openAuthModal ? openAuthModal('register') : setIsAuthModalOpen(true))}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-blue-600 to-orange-500 hover:from-purple-500 hover:via-blue-500 hover:to-orange-400 rounded-xl shadow-md shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}