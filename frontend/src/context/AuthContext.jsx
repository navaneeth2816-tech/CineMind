import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cinemind_token'));
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Load user profile and watchlist on startup or token change
  useEffect(() => {
    async function initUser() {
      if (!token) {
        setUser(null);
        setWatchlistIds(new Set());
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.getMe();
        setUser(user);
        const { watchlist } = await api.getWatchlist();
        setWatchlistIds(new Set(watchlist.map(m => m.id)));
      } catch (err) {
        console.warn('Failed to restore session:', err);
        localStorage.removeItem('cinemind_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('cinemind_token', res.token);
    setToken(res.token);
    setUser(res.user);
    // Fetch user's watchlist
    try {
      const { watchlist } = await api.getWatchlist();
      setWatchlistIds(new Set(watchlist.map(m => m.id)));
    } catch (e) {}
    setIsAuthModalOpen(false);
    return res;
  };

  const register = async (name, email, password, confirm_password) => {
    const res = await api.register({ name, email, password, confirm_password });
    localStorage.setItem('cinemind_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    // Show onboarding for new accounts
    setIsOnboardingModalOpen(true);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('cinemind_token');
    setToken(null);
    setUser(null);
    setWatchlistIds(new Set());
  };

  const toggleWatchlist = async (movieId) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const isPresent = watchlistIds.has(movieId);
    try {
      if (isPresent) {
        await api.removeFromWatchlist(movieId);
        setWatchlistIds(prev => {
          const next = new Set(prev);
          next.delete(movieId);
          return next;
        });
      } else {
        await api.addToWatchlist(movieId);
        setWatchlistIds(prev => new Set(prev).add(movieId));
      }
    } catch (err) {
      console.error('Watchlist error:', err);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const { user } = await api.getMe();
      setUser(user);
    } catch (e) {}
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    watchlistIds,
    loading,
    login,
    register,
    logout,
    toggleWatchlist,
    refreshUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isOnboardingModalOpen,
    setIsOnboardingModalOpen
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
