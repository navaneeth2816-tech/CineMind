/**
 * CineMind Verified Movie Poster Registry
 * 
 * Provides production-verified TMDB image URLs for all benchmark movies across
 * Telugu, Tamil, Malayalam, Kannada, Hindi, and English cinema.
 * 
 * Features:
 * - Direct CDN URLs tested with HTTP 200 responses
 * - Title normalization and alias mapping
 * - Safe fallback resolution when backend returns missing/empty URLs
 */

export const VERIFIED_POSTERS = {
  // Telugu Cinema
  'rrr': 'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
  'baahubali2theconclusion': 'https://image.tmdb.org/t/p/w500/21sC2assImQIYCEDA84Qh9d1RsK.jpg',
  'baahubali2': 'https://image.tmdb.org/t/p/w500/21sC2assImQIYCEDA84Qh9d1RsK.jpg',
  'cokancharapalem': 'https://image.tmdb.org/t/p/w500/fDsN0xMM7OUJohZbCxjMB3JXu8h.jpg',
  'kancharapalem': 'https://image.tmdb.org/t/p/w500/fDsN0xMM7OUJohZbCxjMB3JXu8h.jpg',
  'jersey': 'https://image.tmdb.org/t/p/w500/bU9q9yVtxeBiC0Do27CekHXNE6D.jpg',
  'eega': 'https://image.tmdb.org/t/p/w500/pX7fn4EZrg2YFlV4GNMIfHDOQZ6.jpg',

  // Tamil Cinema
  'vikram': 'https://image.tmdb.org/t/p/w500/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg',
  'jaibhim': 'https://image.tmdb.org/t/p/w500/ehybiOtBUtrMkmtB39zQEtq1Jie.jpg',
  'superdeluxe': 'https://image.tmdb.org/t/p/w500/4B2NFKN713AdXJExc8Kayr6qofu.jpg',
  '96': 'https://image.tmdb.org/t/p/w500/dYImzEquIZglfzDnJlHYdlUIeSo.jpg',

  // Malayalam Cinema
  'manjummelboys': 'https://image.tmdb.org/t/p/w500/zGsHpuMN412VyzJZZnQeq4lMdjF.jpg',
  'drishyam': 'https://image.tmdb.org/t/p/w500/gPBldHTnqpgsrnDnSrAlFwE6Q1t.jpg',
  'kumbalanginights': 'https://image.tmdb.org/t/p/w500/lJ3RvIirE2C7gdBKvPRaoQ3iCo2.jpg',
  'bramayugam': 'https://image.tmdb.org/t/p/w500/snQLwRrfQAl5YFKVefZq9Lbscki.jpg',

  // Kannada Cinema
  'kantara': 'https://image.tmdb.org/t/p/w500/jIsKmkxMzdCZ0Ux1GVSnu8m6Na6.jpg',
  'kgfchapter1': 'https://image.tmdb.org/t/p/w500/ltHlJwvxKv7d0ooCiKSAvfwV9tX.jpg',
  'kgf': 'https://image.tmdb.org/t/p/w500/ltHlJwvxKv7d0ooCiKSAvfwV9tX.jpg',
  '777charlie': 'https://image.tmdb.org/t/p/w500/qArPmXH0aWsT3SEtYl8XrU2Oz48.jpg',
  'charlie777': 'https://image.tmdb.org/t/p/w500/qArPmXH0aWsT3SEtYl8XrU2Oz48.jpg',

  // Hindi Cinema
  '3idiots': 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
  'threeidiots': 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
  'dangal': 'https://image.tmdb.org/t/p/w500/cJRPOLEexI7qp2DKtFfCh7YaaUG.jpg',
  'tumbbad': 'https://image.tmdb.org/t/p/w500/z1xOCxw780WFJC5uCTMfCkQ4Agi.jpg',
  'andhadhun': 'https://image.tmdb.org/t/p/w500/dy3K6hNvwE05siGgiLJcEiwgpdO.jpg',

  // English Cinema
  'inception': 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
  'interstellar': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'thedarkknight': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'darkknight': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'parasite': 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  'pulpfiction': 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  'duneparttwo': 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'dunepart2': 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  'dune2': 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'
};

/**
 * Normalizes title string into alphanumeric lowercase key
 */
export function normalizeMovieTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Resolves a verified movie poster URL by title.
 * Returns null if no verified poster is found for the given title.
 */
export function getVerifiedPoster(title) {
  const key = normalizeMovieTitle(title);
  return VERIFIED_POSTERS[key] || null;
}
