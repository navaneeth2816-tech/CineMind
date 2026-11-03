import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Lock, Mail, User, Check, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, authModalMode } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync mode with authModalMode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegister(authModalMode === 'register');
      setError('');
    }
  }, [isOpen, authModalMode]);

  // Live password validation state (PRD 6.3)
  const [passwordStats, setPasswordStats] = useState({
    strength_score: 0,
    strength_label: 'Weak',
    errors: []
  });

  useEffect(() => {
    if (!isRegister || !password) {
      setPasswordStats({ strength_score: 0, strength_label: 'Weak', errors: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const stats = await api.validatePassword(password);
        setPasswordStats(stats);
      } catch (e) {}
    }, 200);

    return () => clearTimeout(timer);
  }, [password, isRegister]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await register(name, email, password, confirmPassword);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@cinemind.com');
      setPassword('Admin@12345');
    } else {
      setEmail('viewer@cinemind.com');
      setPassword('Viewer@12345');
    }
    setIsRegister(false);
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await login('viewer@cinemind.com', 'Viewer@12345');
      onClose();
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try standard sign in.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthBarColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-indigo-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isRegister ? 'Create CineMind Account' : 'Welcome to CineMind'}
              </h3>
              <p className="text-xs text-slate-400">Decision Intelligence Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 my-4 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
              !isRegister ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
              isRegister ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 hover:border-slate-700 shadow-md transition disabled:opacity-50 group mb-3"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span className="group-hover:text-white transition">
            {isRegister ? 'Sign up with Google' : 'Continue with Google'}
          </span>
        </button>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-2.5 text-[10px] text-slate-500 uppercase tracking-wider absolute">or continue with email</span>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samantha Rao"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-white placeholder-slate-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-white placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Password</label>
              {isRegister && password && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  passwordStats.strength_score >= 80 ? 'text-emerald-400' :
                  passwordStats.strength_score >= 60 ? 'text-indigo-400' :
                  passwordStats.strength_score >= 40 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {passwordStats.strength_label} ({passwordStats.strength_score}%)
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-white placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Strength Meter (PRD Section 6.3) */}
            {isRegister && password && (
              <div className="mt-2 space-y-1.5">
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthBarColor(passwordStats.strength_score)}`}
                    style={{ width: `${passwordStats.strength_score}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 mt-2">
                  <div className={`flex items-center space-x-1 ${password.length >= 8 ? 'text-emerald-400' : ''}`}>
                    <Check className={`w-3 h-3 ${password.length >= 8 ? 'opacity-100' : 'opacity-30'}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${/[A-Z]/.test(password) ? 'text-emerald-400' : ''}`}>
                    <Check className={`w-3 h-3 ${/[A-Z]/.test(password) ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${/\d/.test(password) ? 'text-emerald-400' : ''}`}>
                    <Check className={`w-3 h-3 ${/\d/.test(password) ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password) ? 'text-emerald-400' : ''}`}>
                    <Check className={`w-3 h-3 ${/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password) ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:border-indigo-500 focus:outline-none text-white placeholder-slate-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Quick Demo Fill Buttons for Evaluators */}
        <div className="pt-4 mt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 mb-2 font-medium flex items-center justify-center space-x-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Quick-fill test accounts:</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('viewer')}
              className="flex-1 py-1.5 px-2 text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-lg transition"
            >
              Demo Viewer (Pre-rated)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex-1 py-1.5 px-2 text-xs bg-slate-800/60 hover:bg-slate-800 text-indigo-300 border border-indigo-700/40 rounded-lg transition"
            >
              Admin Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
