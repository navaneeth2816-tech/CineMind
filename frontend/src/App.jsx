import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import DecisionReportModal from './components/DecisionReportModal';

// Pages
import LandingPage from './pages/LandingPage';
import DiscoverPage from './pages/DiscoverPage';
import TasteProfilePage from './pages/TasteProfilePage';
import ComparePage from './pages/ComparePage';
import AssistantPage from './pages/AssistantPage';
import GroupDecisionPage from './pages/GroupDecisionPage';
import RegionalAnalyticsPage from './pages/RegionalAnalyticsPage';
import AdminPage from './pages/AdminPage';

// Helper component for direct /login and /register navigation
function AuthRoute({ mode, onOpenDecisionReport }) {
  const { openAuthModal } = useAuth();
  useEffect(() => {
    if (openAuthModal) {
      openAuthModal(mode);
    }
  }, [mode, openAuthModal]);

  return <LandingPage onOpenDecisionReport={onOpenDecisionReport} />;
}

function AppContent() {
  const { isAuthModalOpen, setIsAuthModalOpen, isOnboardingModalOpen, setIsOnboardingModalOpen } = useAuth();
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const location = useLocation();

  const handleOpenDecisionReport = (movieId) => {
    setSelectedMovieId(movieId);
  };

  const handleCloseDecisionReport = () => {
    setSelectedMovieId(null);
  };

  const isLandingRoute = 
    location.pathname === '/' || 
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname === '/signup';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar onSelectMovie={handleOpenDecisionReport} />

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${isLandingRoute ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 pt-6'}`}>
        <Routes>
          {/* Landing Page (First Page) */}
          <Route path="/" element={<LandingPage onOpenDecisionReport={handleOpenDecisionReport} />} />

          {/* Existing Movie Exploration Routes */}
          <Route path="/discover" element={<DiscoverPage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/explore" element={<DiscoverPage onOpenDecisionReport={handleOpenDecisionReport} />} />

          {/* Auth Direct URL Routes */}
          <Route path="/login" element={<AuthRoute mode="login" onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/register" element={<AuthRoute mode="register" onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/signup" element={<AuthRoute mode="register" onOpenDecisionReport={handleOpenDecisionReport} />} />

          {/* Core Feature Pages */}
          <Route path="/taste-dna" element={<TasteProfilePage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/compare" element={<ComparePage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/assistant" element={<AssistantPage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/group" element={<GroupDecisionPage onOpenDecisionReport={handleOpenDecisionReport} />} />
          <Route path="/analytics" element={<RegionalAnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      {/* Footer for Non-Landing Pages (Landing page includes its own rich 4-column footer) */}
      {!isLandingRoute && (
        <footer className="border-t border-slate-900 bg-slate-950/70 py-6 px-4 text-center text-xs text-slate-500 space-y-1.5 mt-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
            <span className="font-bold text-slate-300">CineMind</span>
            <span>•</span>
            <span>Movie Ratings Analysis & Recommendation System</span>
            <span>•</span>
            <span>React & Python Flask with MySQL</span>
          </div>
          <p className="max-w-xl mx-auto text-[11px] text-slate-600">
            A full-stack movie recommendation web application featuring regional cinema discovery, rating comparison, and AI assistant.
          </p>
        </footer>
      )}

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