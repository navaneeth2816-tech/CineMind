const FALLBACK_API_BASE = 'https://cinemind-backend-i482.onrender.com/api';
const PRIMARY_API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : FALLBACK_API_BASE);

function getAuthHeaders() {
  const token = localStorage.getItem('cinemind_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const isAuthOrUserData = endpoint.startsWith('/auth') || endpoint.startsWith('/me');

  try {
    const res = await fetch(`${PRIMARY_API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        const connErr = new Error('Local backend server is not running. Please start the Python backend (python run.py).');
        connErr.status = res.status;
        connErr.isConnectionError = true;
        throw connErr;
      }
      const err = new Error(data.error || data.message || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    const isConnErr = err.isConnectionError || 
      err.status === 502 || err.status === 503 || err.status === 504 || 
      err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');

    // CRITICAL: NEVER silently fall back to an external/remote database for authentication or user sessions.
    // Silently routing auth to a different server causes split-brain data loss between local MySQL and cloud SQLite.
    if (PRIMARY_API_BASE === '/api' && !isAuthOrUserData) {
      try {
        const fallbackRes = await fetch(`${FALLBACK_API_BASE}${endpoint}`, { ...options, headers });
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok) {
          return fallbackData;
        }
      } catch (fbErr) {
        // Fallback also failed
      }
    }

    if (isConnErr && PRIMARY_API_BASE === '/api') {
      const serverErr = new Error('Local backend server is not running. Please start the Python backend with: python run.py');
      serverErr.status = 503;
      serverErr.isConnectionError = true;
      throw serverErr;
    }

    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const API_BASE = PRIMARY_API_BASE;

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  validatePassword: (password) => request('/auth/validate-password', { method: 'POST', body: JSON.stringify({ password }) }),
  getMe: () => request('/auth/me'),
  updatePreferences: (payload) => request('/auth/me/preferences', { method: 'PUT', body: JSON.stringify(payload) }),

  // Movies
  getMovies: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return request(`/movies?${query.toString()}`);
  },
  getMovieDetail: (id) => request(`/movies/${id}`),
  getDecisionReport: (id) => request(`/movies/${id}/decision-report`),
  getReviewSummary: (id) => request(`/movies/${id}/review-summary`),
  compareMovies: (ids) => request(`/movies/compare?ids=${ids.join(',')}`),
  submitRating: (id, rating) => request(`/movies/${id}/rating`, { method: 'PUT', body: JSON.stringify({ rating }) }),
  deleteRating: (id) => request(`/movies/${id}/rating`, { method: 'DELETE' }),
  getGenres: () => request('/movies/genres'),
  getLanguages: () => request('/movies/languages'),

  // Search
  searchAutocomplete: (q, language = '') => {
    const params = new URLSearchParams({ q });
    if (language) params.append('language', language);
    return request(`/movies/search?${params.toString()}`);
  },
  naturalLanguageSearch: (query, language = '') => request('/search/natural-language', { 
    method: 'POST', 
    body: JSON.stringify({ query, language }) 
  }),

  // User
  getTasteProfile: () => request('/me/taste-profile'),
  getUserRatings: () => request('/me/ratings'),
  getWatchlist: () => request('/me/watchlist'),
  addToWatchlist: (movieId) => request(`/me/watchlist/${movieId}`, { method: 'POST' }),
  removeFromWatchlist: (movieId) => request(`/me/watchlist/${movieId}`, { method: 'DELETE' }),
  getHistory: () => request('/me/history'),
  recordView: (movieId) => request(`/me/history/${movieId}`, { method: 'POST' }),
  clearHistory: () => request('/me/history', { method: 'DELETE' }),

  // Recommendations & Onboarding
  getRecommendations: (params = 10, maybeLang = '') => {
    let limit = 10;
    let language = '';
    if (typeof params === 'object' && params !== null) {
      limit = params.limit || 10;
      language = params.language || '';
    } else {
      limit = params || 10;
      language = maybeLang || '';
    }
    const q = new URLSearchParams();
    if (limit) q.append('limit', limit);
    if (language) q.append('language', language);
    return request(`/recommendations?${q.toString()}`);
  },
  saveOnboardingPreferences: (payload) => request('/recommendations/onboarding/preferences', { method: 'POST', body: JSON.stringify(payload) }),

  // Smart Assistant
  askAssistant: (message, movieContextId = null) => request('/assistant', {
    method: 'POST',
    body: JSON.stringify({ message, movie_context_id: movieContextId })
  }),

  // Groups
  createGroup: (payload) => request('/groups', { method: 'POST', body: JSON.stringify(payload) }),
  getGroup: (code) => request(`/groups/${code}`),
  joinGroup: (code, payload) => request(`/groups/${code}/join`, { method: 'POST', body: JSON.stringify(payload) }),
  voteGroup: (code, payload) => request(`/groups/${code}/vote`, { method: 'POST', body: JSON.stringify(payload) }),
  getGroupRecommendations: (code, memberId = null) => {
    const q = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';
    return request(`/groups/${code}/recommendations${q}`);
  },

  // Analytics
  getRatingAnalytics: (minRatings = 5) => request(`/analytics/ratings?min_ratings=${encodeURIComponent(minRatings)}`),
  getRegionalAnalytics: () => request('/analytics/regional'),
  getChartImageUrl: (chartName, minRatings = 5) => `${PRIMARY_API_BASE}/analytics/charts/${chartName}?min_ratings=${minRatings}&t=${Date.now()}`,

  // Admin
  getAdminOverview: () => request('/admin/overview'),
  createMovie: (payload) => request('/admin/movies', { method: 'POST', body: JSON.stringify(payload) }),
  updateMovie: (id, payload) => request(`/admin/movies/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMovie: (id) => request(`/admin/movies/${id}`, { method: 'DELETE' })
};
