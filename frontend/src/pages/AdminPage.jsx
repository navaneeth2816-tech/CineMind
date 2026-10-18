import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Plus, Edit2, Trash2, Database, 
  AlertCircle, CheckCircle, FileText, X, Check 
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, setIsAuthModalOpen } = useAuth();
  const [overview, setOverview] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState(2024);
  const [newLanguage, setNewLanguage] = useState('Telugu');
  const [newRuntime, setNewRuntime] = useState(140);
  const [newGenres, setNewGenres] = useState('Action, Drama');
  const [newOverview, setNewOverview] = useState('');
  const [newPoster, setNewPoster] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchAdminData = async () => {
    try {
      const [ovData, mData] = await Promise.all([
        api.getAdminOverview(),
        api.getMovies({ limit: 50 })
      ]);
      setOverview(ovData);
      setMovies(mData.movies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage('');

    try {
      await api.createMovie({
        title: newTitle,
        release_year: Number(newYear),
        language: newLanguage,
        runtime_minutes: Number(newRuntime),
        genres: newGenres.split(',').map(g => g.trim()),
        overview: newOverview,
        poster_url: newPoster
      });
      setStatusMessage(`Movie '${newTitle}' created successfully!`);
      setIsCreateModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewOverview('');
      setNewPoster('');
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMovie = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete '${title}' from catalogue?`)) {
      return;
    }
    try {
      await api.deleteMovie(id);
      setStatusMessage(`Deleted '${title}'.`);
      await fetchAdminData();
    } catch (e) {
      alert(e.message || 'Deletion failed');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-16 text-center bg-slate-900 border border-rose-900/40 rounded-3xl max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          This portal is restricted to authorized platform administrators. Please sign in with admin credentials.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  const metrics = overview?.metrics;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-600/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin & Catalogue Management</h1>
            <p className="text-xs text-slate-400">
              Audit logs, data-quality monitoring, and CRUD controls (PRD Section 6.18)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Catalogue Titles</div>
          <div className="text-2xl font-black text-white mt-1">{metrics?.total_movies || 0}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Active records</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Registered Accounts</div>
          <div className="text-2xl font-black text-white mt-1">{metrics?.total_users || 0}</div>
          <div className="text-[10px] text-indigo-400 mt-0.5">Argon2/bcrypt hashed</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Ratings Logged</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{metrics?.total_ratings || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bayesian indexed</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Missing Metadata</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {metrics?.missing_metadata?.missing_posters || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">100% Poster Coverage</div>
        </div>
      </div>

      {/* Catalogue Management Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Catalogue Records ({movies.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Title & Language</th>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Runtime</th>
                <th className="py-2.5 px-3">Bayesian Score</th>
                <th className="py-2.5 px-3">Ratings</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {movies.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center space-x-2">
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="w-6 h-9 object-cover rounded border border-slate-800 shrink-0"
                    />
                    <div>
                      <div>{m.title}</div>
                      <span className="text-[10px] text-slate-500">{m.language}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{m.release_year}</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.runtime_minutes || '—'} mins</td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">{m.bayesian_score.toFixed(1)}★</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.rating_count}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteMovie(m.id, m.title)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Audit Trail (PRD Section 6.18) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Audit Trail History (PRD 6.18)
          </h2>
        </div>

        {overview?.audit_logs?.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No modifications logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {overview?.audit_logs?.map((l) => (
              <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-400 uppercase mr-2">{l.action}</span>
                  <span className="text-slate-300">{l.details}</span>
                </div>
                <span className="text-[11px] text-slate-500">{l.timestamp?.slice(0, 19).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Movie Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add New Movie to Catalogue</h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Kalki 2898 AD"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Release Year</label>
                  <input
                    type="number"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Language</label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2"
                  >
                    {['Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Hindi', 'English'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Runtime (mins)</label>
                  <input
                    type="number"
                    value={newRuntime}
                    onChange={(e) => setNewRuntime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={newGenres}
                    onChange={(e) => setNewGenres(e.target.value)}
                    placeholder="Action, Sci-Fi"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Poster URL</label>
                <input
                  type="url"
                  value={newPoster}
                  onChange={(e) => setNewPoster(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  value={newOverview}
                  onChange={(e) => setNewOverview(e.target.value)}
                  placeholder="Overview of the movie..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Save to Catalogue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
