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

  try {
    const res = await fetch(`${PRIMARY_API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    // If local dev server proxy is unreachable (e.g. python run.py not yet started), auto-fallback to deployed Render backend
    if (PRIMARY_API_BASE === '/api') {
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
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

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
  searchAutocomplete: (q) => request(`/movies/search?q=${encodeURIComponent(q)}`),
  naturalLanguageSearch: (query) => request('/search/natural-language', { method: 'POST', body: JSON.stringify({ query }) }),

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
  getRecommendations: (limit = 10) => request(`/recommendations?limit=${limit}`),
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
  getGroupRecommendations: (code) => request(`/groups/${code}/recommendations`),

  // Analytics
  getRatingAnalytics: () => request('/analytics/ratings'),
  getRegionalAnalytics: () => request('/analytics/regional'),

  // Admin
  getAdminOverview: () => request('/admin/overview'),
  createMovie: (payload) => request('/admin/movies', { method: 'POST', body: JSON.stringify(payload) }),
  updateMovie: (id, payload) => request(`/admin/movies/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMovie: (id) => request(`/admin/movies/${id}`, { method: 'DELETE' })
};
