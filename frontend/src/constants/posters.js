/**
 * CineMind Dynamic Movie Poster Resilience Layer
 * 
 * Generates dynamic, multi-tier fallback candidates for ANY movie record in the database.
 * Does not rely on any hardcoded movie names or static title lists.
 */

const FALLBACK_API_BASE = 'https://cinemind-backend-i482.onrender.com/api';
const PRIMARY_API_BASE = typeof window !== 'undefined' && window.location 
  ? (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : FALLBACK_API_BASE))
  : FALLBACK_API_BASE;

/**
 * Normalizes any poster URL into a valid, fully qualified URL.
 * Handles relative TMDB paths (e.g. '/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg').
 */
export function normalizePosterUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // If it's a relative TMDB path, prepend TMDB base URL
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/posters/')) {
    return `https://image.tmdb.org/t/p/w500${trimmed}`;
  }
  return trimmed;
}

/**
 * Builds an ordered list of fallback candidates for ANY movie record:
 * 1. Primary poster_url from database/API
 * 2. Backend streaming proxy endpoint (/api/movies/<id>/poster)
 * 3. Local first-party static asset (/posters/<id>.jpg)
 * 4. Backend URL proxy endpoint (/api/movies/poster-proxy?url=...)
 * 5. Production fallback backend proxy (if running on custom host)
 */
export function getPosterCandidates(src, id) {
  const candidates = [];
  const normalizedSrc = normalizePosterUrl(src);

  // 1. Primary URL from database
  if (normalizedSrc) {
    candidates.push(normalizedSrc);
  }

  // 2. First-party asset by numeric ID (if available)
  if (id) {
    const idPath = `/posters/${id}.jpg`;
    if (!candidates.includes(idPath)) {
      candidates.push(idPath);
    }
  }

  // 3. Primary backend proxy endpoint by movie ID
  if (id) {
    const primaryProxy = `${PRIMARY_API_BASE}/movies/${id}/poster`;
    if (!candidates.includes(primaryProxy)) {
      candidates.push(primaryProxy);
    }
  }

  // 4. Remote production backend proxy (ensures high reliability on Vercel)
  if (id && PRIMARY_API_BASE !== FALLBACK_API_BASE) {
    const remoteProxy = `${FALLBACK_API_BASE}/movies/${id}/poster`;
    if (!candidates.includes(remoteProxy)) {
      candidates.push(remoteProxy);
    }
  }

  // 5. Backend general URL proxy (if primary URL was an external TMDB URL)
  if (normalizedSrc && normalizedSrc.includes('image.tmdb.org')) {
    const urlProxy = `${PRIMARY_API_BASE}/movies/poster-proxy?url=${encodeURIComponent(normalizedSrc)}`;
    if (!candidates.includes(urlProxy)) {
      candidates.push(urlProxy);
    }
  }

  return candidates;
}
