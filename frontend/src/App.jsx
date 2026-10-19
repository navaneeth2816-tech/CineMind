import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import DecisionReportModal from './components/DecisionReportModal';

// Pages
import DiscoverPage from './pages/DiscoverPage';
import TasteProfilePage from './pages/TasteProfilePage';
import ComparePage from './pages/ComparePage';
import AssistantPage from './pages/AssistantPage';
import GroupDecisionPage from './pages/GroupDecisionPage';
import RegionalAnalyticsPage from './pages/RegionalAnalyticsPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const { isAuthModalOpen, setIsAuthModalOpen, isOnboardingModalOpen, setIsOnboardingModalOpen } = useAuth();
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const handleOpenDecisionReport = (movieId) => {
    setSelectedMovieId(movieId);
  };

  const handleCloseDecisionReport = () => {
    setSelectedMovieId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onSelectMovie={handleOpenDecisionReport} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        <Routes>
          <Route path="/" element={<DiscoverPage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/taste-dna" element={<TasteProfilePage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/compare" element={<ComparePage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/assistant" element={<AssistantPage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/group" element={<GroupDecisionPage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/analytics" element={<RegionalAnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-8 px-4 text-center text-xs text-slate-500 space-y-2 mt-auto">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <span className="font-bold text-slate-300">CineMind</span>
          <span>•</span>
          <span>Personalised Movie Decision Intelligence Platform</span>
          <span>•</span>
          <span>Bayesian Trust Analyzer</span>
          <span>•</span>
          <span>MovieLens Benchmark Attributed</span>
        </div>
        <p className="max-w-2xl mx-auto text-[11px] text-slate-600 leading-relaxed">
          Product Principle: CineMind distinguishes measured facts from model estimates. Compatibility scores are calibrated estimators, not infallible guarantees. All ratings reflect stored database provenance.
        </p>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <OnboardingModal isOpen={isOnboardingModalOpen} onClose={() => setIsOnboardingModalOpen(false)} />
      <DecisionReportModal
        movieId={selectedMovieId}
        isOpen={Boolean(selectedMovieId)}
        onClose={handleCloseDecisionReport}
        onMovieSelect={handleOpenDecisionReport}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
