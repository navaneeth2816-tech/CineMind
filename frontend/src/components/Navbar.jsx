import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Film, Sparkles, BrainCircuit, Users, BarChart3, 
  Bookmark, ShieldAlert, LogOut, User, ChevronDown, Scale,
  Compass, Info, Home
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
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const handleAboutClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('about');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#about');
      setTimeout(() => {
        const el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/discover', label: 'Explore Movies', icon: Compass },
    { to: '/taste-dna', label: 'Taste DNA', icon: Sparkles },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const moreTools = [
    { to: '/compare', label: 'Compare Movies', icon: Scale, desc: 'Side-by-side metric comparison' },
    { to: '/assistant', label: 'Smart Assistant', icon: BrainCircuit, desc: 'Conversational movie AI' },
    { to: '/group', label: 'Group Room', icon: Users, desc: 'Watch party consensus voting' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo with Movie Icon */}
        <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-300">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-purple-300 transition">
                Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">Mind</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
              Movie Recommendation System
            </p>
          </div>
        </Link>

        {/* Primary Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || (item.to === '/discover' && location.pathname === '/explore');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  active
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More Tools Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              onBlur={() => setTimeout(() => setToolsMenuOpen(false), 200)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
            >
              <span>Features</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {toolsMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in divide-y divide-slate-800/80">
                <div className="space-y-1 pb-1">
                  {moreTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.to}
                        to={tool.to}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-800 text-left transition group"
                        onClick={() => setToolsMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                          <ToolIcon className="w-3.5 h-3.5 text-purple-400" />
                          <span>{tool.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 pl-5.5">{tool.desc}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* About Us Link */}
          <a
            href="/#about"
            onClick={handleAboutClick}
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

        {/* User Account / Auth Actions */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Watchlist Counter */}
          <Link
            to="/taste-dna#watchlist"
            className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
            title="Your Watchlist"
          >
            <Bookmark className="w-4 h-4" />
            {watchlistIds.size > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
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
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-orange-500 text-white flex items-center justify-center text-xs font-bold">
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
                className="flex items-center space-x-1 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 hover:from-purple-500 hover:via-indigo-500 hover:to-orange-400 rounded-xl shadow-md shadow-purple-600/30 hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Pills */}
      <div className="md:hidden flex items-center space-x-2 px-4 py-2 border-t border-slate-900 overflow-x-auto no-scrollbar">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to || (item.to === '/discover' && location.pathname === '/explore');
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 ${
                active
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <a
          href="/#about"
          onClick={handleAboutClick}
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