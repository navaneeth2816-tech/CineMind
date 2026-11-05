import React, { useState, useEffect } from 'react';
import { Film } from 'lucide-react';
import { getPosterCandidates } from '../constants/posters';

/**
 * Resilient, multi-tier MoviePoster component:
 * 1. Tries primary backend poster_url (TMDB CDN)
 * 2. On error/ISP block, immediately falls back to high-res first-party bundled poster (/posters/<slug>.jpg)
 * 3. Gracefully transitions smoothly with skeleton loader
 * 4. Only shows placeholder card if all image sources are genuinely exhausted
 * 5. Completely eliminates CORS/ISP issues on deployed environments (Vercel)
 */
export default function MoviePoster({
  src,
  alt,
  title,
  year,
  language,
  id,
  className = '',
  aspectRatio = 'aspect-[2/3]',
  loading = 'lazy'
}) {
  const [candidates, setCandidates] = useState(() => getPosterCandidates(src, title, id));
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const list = getPosterCandidates(src, title, id);
    setCandidates(list);
    setCandidateIndex(0);
    setIsLoaded(false);
    setHasError(list.length === 0);
  }, [src, title, id]);

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex(prev => prev + 1);
      setIsLoaded(false);
    } else {
      setHasError(true);
    }
  };

  const currentSrc = candidates[candidateIndex];

  // If no source provided or all candidates failed, render professional fallback
  if (!currentSrc || hasError) {
    return (
      <div
        className={`relative ${aspectRatio} w-full bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center p-3 text-center border border-slate-700/50 rounded-xl overflow-hidden select-none ${className}`}
        role="img"
        aria-label={alt || title || 'Movie poster unavailable'}
      >
        <div className="absolute inset-0 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <Film className="w-10 h-10 text-indigo-400/60 mb-2 shrink-0" />
        {title && (
          <p className="text-xs font-semibold text-slate-200 line-clamp-2 px-1 leading-snug">
            {title}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
          {year && (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
              {year}
            </span>
          )}
          {language && (
            <span className="text-[10px] font-medium text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
              {language}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${aspectRatio} w-full overflow-hidden bg-slate-800 rounded-xl ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          <Film className="w-6 h-6 text-slate-600 animate-pulse" />
        </div>
      )}
      <img
        key={currentSrc}
        src={currentSrc}
        alt={alt || title || 'Movie poster'}
        loading={loading}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
