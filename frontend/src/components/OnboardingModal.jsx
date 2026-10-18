import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Check, Clock, Globe, Film, ChevronRight } from 'lucide-react';

const GENRES = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 
    'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 
    'Romance', 'Sci-Fi', 'Thriller'
];

const LANGUAGES = [
    { code: 'Telugu', label: 'Telugu Cinema' },
    { code: 'Tamil', label: 'Tamil Cinema' },
    { code: 'Malayalam', label: 'Malayalam Cinema' },
    { code: 'Kannada', label: 'Kannada Cinema' },
    { code: 'Hindi', label: 'Hindi Cinema' },
    { code: 'English', label: 'English & Global' }
];

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const { refreshUser } = useAuth();
  const [selectedGenres, setSelectedGenres] = useState(['Sci-Fi', 'Thriller']);
  const [selectedLanguages, setSelectedLanguages] = useState(['Telugu', 'English']);
  const [runtimeLimit, setRuntimeLimit] = useState(160);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.saveOnboardingPreferences({
        genres: selectedGenres,
        languages: selectedLanguages,
        runtime_limit: runtimeLimit
      });
      await refreshUser();
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      console.error('Failed to save onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Initialize Your Taste DNA</h2>
            <p className="text-xs text-slate-400">Select what you love so CineMind can calibrate your compatibility scores</p>
          </div>
        </div>

        <div className="space-y-5 max-h-[68vh] overflow-y-auto pr-1">
          {/* Step 1: Genres */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              <Film className="w-4 h-4 text-indigo-400" />
              <span>Favorite Genres (Pick at least 2)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => {
                const active = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition flex items-center space-x-1.5 ${
                      active
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Regional Languages */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Regional & Global Cinema Affinities</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(l => {
                const active = selectedLanguages.includes(l.code);
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleLanguage(l.code)}
                    className={`p-2.5 text-left text-xs font-medium rounded-xl border transition flex items-center justify-between ${
                      active
                        ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{l.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Runtime limit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Comfortable Max Runtime</span>
              </label>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/40">
                {runtimeLimit} minutes (~{(runtimeLimit / 60).toFixed(1)} hrs)
              </span>
            </div>
            <input
              type="range"
              min="90"
              max="210"
              step="10"
              value={runtimeLimit}
              onChange={(e) => setRuntimeLimit(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>90m (Short)</span>
              <span>150m (Standard)</span>
              <span>210m (Epic length)</span>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-5 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading || selectedGenres.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <span>{loading ? 'Calibrating...' : 'Calibrate My Taste DNA'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
