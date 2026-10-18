import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Plus, Clock, ThumbsUp, ThumbsDown, 
  Sparkles, Trophy, ArrowRight, ShieldCheck, Check, 
  Copy, RefreshCw, AlertCircle 
} from 'lucide-react';

export default function GroupDecisionPage({ onOpenDecisionReport }) {
  const { user } = useAuth();
  const [activeCode, setActiveCode] = useState('');
  const [groupData, setGroupData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [objective, setObjective] = useState('avoid_mismatch');
  const [maxRuntime, setMaxRuntime] = useState(160);
  const [allowedLanguages, setAllowedLanguages] = useState(['Telugu', 'Tamil', 'Hindi', 'English']);
  const [creatorName, setCreatorName] = useState(user?.name || 'Organizer');

  // Join form state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState('');
  const [joinGenres, setJoinGenres] = useState(['Action', 'Thriller']);
  const [myMemberId, setMyMemberId] = useState(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);

  const GENRES_LIST = ['Action', 'Comedy', 'Drama', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'];
  const LANGUAGES_LIST = ['Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Hindi', 'English'];

  // Refresh group details and ranked candidates
  const fetchGroupState = async (code) => {
    if (!code) return;
    try {
      const gRes = await api.getGroup(code);
      setGroupData(gRes);
      const cRes = await api.getGroupRecommendations(code);
      setCandidates(cRes.candidates || []);
    } catch (err) {
      console.error('Failed to poll group:', err);
    }
  };

  useEffect(() => {
    if (!activeCode) return;
    fetchGroupState(activeCode);
    const interval = setInterval(() => fetchGroupState(activeCode), 8000);
    return () => clearInterval(interval);
  }, [activeCode]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createGroup({
        objective,
        creator_name: creatorName,
        constraints: {
          max_runtime: maxRuntime,
          languages: allowedLanguages
        },
        preferences: {
          genres: ['Action', 'Thriller', 'Sci-Fi']
        }
      });
      setActiveCode(res.code);
      setMyMemberId(res.member_id);
      setIsCreating(false);
    } catch (err) {
      alert(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setLoading(true);
    try {
      const res = await api.joinGroup(joinCodeInput.trim().toUpperCase(), {
        name: joinNameInput || 'Friend',
        preferences: { genres: joinGenres }
      });
      setActiveCode(joinCodeInput.trim().toUpperCase());
      setMyMemberId(res.member_id);
    } catch (err) {
      alert(err.message || 'Could not join room.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (movieId, voteVal) => {
    if (!activeCode || !myMemberId) {
      alert('Please join the session first to cast votes.');
      return;
    }
    setVoteSubmitting(true);
    try {
      await api.voteGroup(activeCode, {
        member_id: myMemberId,
        movie_id: movieId,
        vote: voteVal
      });
      // Immediate refresh
      await fetchGroupState(activeCode);
    } catch (err) {
      console.error(err);
    } finally {
      setVoteSubmitting(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatCountdown = (secs) => {
    if (!secs || secs <= 0) return 'Voting Closed';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s remaining`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-pink-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Group Movie Decision Maker</h1>
            <p className="text-xs text-slate-400">
              Pick one film together without arguments. Balances everyone's taste using egalitarian fairness constraints (PRD Section 6.13)
            </p>
          </div>
        </div>

        {activeCode && (
          <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Room Code</div>
              <div className="text-lg font-black text-indigo-400 tracking-widest">{activeCode}</div>
            </div>
            <button
              onClick={copyRoomCode}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {!activeCode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Room Card */}
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Create a Decision Room</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start a new session with custom group objectives and invite friends with a 6-character room code.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Your Nickname</label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Group Objective (Fairness Strategy)</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="avoid_mismatch">
                    Consensus First • Avoid strong mismatch for anyone (Egalitarian)
                  </option>
                  <option value="best_average">
                    Best Average • Maximize collective group score (Utilitarian)
                  </option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {objective === 'avoid_mismatch'
                    ? "Heavily penalizes movies where even one person has a low match score."
                    : "Picks films that maximize average happiness across the room."}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Maximum Runtime</span>
                  <span className="text-indigo-400 font-bold">{maxRuntime} mins</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="190"
                  step="10"
                  value={maxRuntime}
                  onChange={(e) => setMaxRuntime(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Permitted Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES_LIST.map(lang => {
                    const active = allowedLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setAllowedLanguages(prev =>
                            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                          );
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition ${
                          active
                            ? 'bg-indigo-950 border-indigo-700 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {loading ? 'Generating Room...' : 'Create Room & Generate Code'}
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
                <Users className="w-5 h-5 text-pink-400" />
                <h2 className="text-lg font-bold text-white">Join an Existing Room</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter a room code given by the organizer to cast your votes and submit your preferences.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">6-Character Room Code</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CM8942"
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-center tracking-widest text-base uppercase rounded-xl px-3 py-2.5 focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={joinNameInput}
                    onChange={(e) => setJoinNameInput(e.target.value)}
                    placeholder="e.g. Rohit"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">What are you in the mood for?</label>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRES_LIST.map(g => {
                      const active = joinGenres.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setJoinGenres(prev =>
                              prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                            );
                          }}
                          className={`px-2 py-1 text-[11px] rounded-lg border transition ${
                            active
                              ? 'bg-pink-950 border-pink-700 text-pink-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !joinCodeInput.trim()}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-xl transition shadow-lg shadow-pink-600/30 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Decision Room'}
                </button>
              </form>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-500">
              Tip: Participants don't need an account. Preferences are private and aggregated objectively.
            </div>
          </div>
        </div>
      ) : (
        /* Active Room Live Lobby */
        <div className="space-y-6">
          {/* Lobby Info Bar */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Room {groupData?.code}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-indigo-400 font-normal">
                    {groupData?.objective === 'avoid_mismatch' ? 'Consensus Objective (Avoid Mismatch)' : 'Best Average Objective'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {groupData?.members_count} participants:{' '}
                    {groupData?.members?.map(m => m.name).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-400 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-800/60">
                <Clock className="w-4 h-4" />
                <span>{formatCountdown(groupData?.remaining_seconds)}</span>
              </div>
              <button
                onClick={() => fetchGroupState(activeCode)}
                className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
                title="Refresh Room State"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setActiveCode(''); setGroupData(null); }}
                className="text-xs text-slate-400 hover:text-rose-400 transition"
              >
                Leave Room
              </button>
            </div>
          </div>

          {/* Ranked Candidates Grid with Voting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Ranked Group Candidates
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Votes update ranking live (+5 score bonus per upvote)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {candidates.map((c, idx) => {
                const isWinner = idx === 0;
                return (
                  <div
                    key={c.movie.id}
                    className={`relative bg-slate-900 border rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-4 transition ${
                      isWinner ? 'border-amber-500/60 shadow-amber-500/10' : 'border-slate-800'
                    }`}
                  >
                    {isWinner && (
                      <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow flex items-center space-x-1">
                        <Trophy className="w-3 h-3" />
                        <span>#1 Consensus Leader</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <img
                          src={c.movie.poster_url}
                          alt={c.movie.title}
                          className="w-16 h-24 object-cover rounded-xl border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-slate-950 text-indigo-400 border border-slate-800 rounded">
                            {c.movie.language} • {c.movie.release_year}
                          </span>
                          <h4 className="text-sm font-bold text-white truncate mt-1">
                            {c.movie.title}
                          </h4>
                          <div className="text-[11px] text-slate-400">
                            {c.movie.runtime_minutes}m • {c.movie.genres?.join(', ')}
                          </div>
                          <div className="text-xs font-black text-amber-400 mt-1">
                            {c.movie.bayesian_score.toFixed(1)}★ Bayesian
                          </div>
                        </div>
                      </div>

                      {/* Group Fair Match Stats */}
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Group Composite Score:</span>
                          <span className="font-black text-indigo-400">{c.composite_score}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Average Match: {c.average_match}%</span>
                          <span>Lowest Match: {c.lowest_individual_match}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                          {c.explanation}
                        </div>
                      </div>
                    </div>

                    {/* Voting controls & Decision Report link */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          disabled={voteSubmitting}
                          onClick={() => handleVote(c.movie.id, 1)}
                          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/60 rounded-lg transition"
                          title="Vote Yes (+1)"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Upvote</span>
                        </button>
                        <button
                          type="button"
                          disabled={voteSubmitting}
                          onClick={() => handleVote(c.movie.id, -1)}
                          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-300 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 rounded-lg transition"
                          title="Veto / Dislike (-1)"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Veto</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDecisionReport(c.movie.id)}
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Evidence</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
