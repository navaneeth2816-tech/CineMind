import React, { useState, useEffect } from 'react';
import { Film } from 'lucide-react';
import { getVerifiedPoster } from '../constants/posters';

/**
 * Robust, production-grade MoviePoster component with:
 * - Direct TMDB image rendering with referrerPolicy="no-referrer"
 * - Intelligent self-healing fallback to verified TMDB registry by title
 * - Smooth skeleton loading state (prevents broken image icons)
 * - Graceful fallback card only when all image sources are exhausted
 * - Preserves existing layout, dimensions, and responsive aspect ratios
 */
export default function MoviePoster({
  src,
  alt,
  title,
  year,
  language,
  className = '',
  aspectRatio = 'aspect-[2/3]',
  loading = 'lazy'
}) {
  const getInitialSource = () => {
    if (src && typeof src === 'string' && src.trim() !== '') {
      return src;
    }
    return getVerifiedPoster(title);
  };

  const [effectiveSrc, setEffectiveSrc] = useState(getInitialSource);
  const [hasError, setHasError] = useState(!getInitialSource());
  const [isLoaded, setIsLoaded] = useState(false);
  const [triedVerifiedFallback, setTriedVerifiedFallback] = useState(
    Boolean(!src && getVerifiedPoster(title))
  );

  // Synchronize state whenever src or title prop updates
  useEffect(() => {
    const initial = (src && typeof src === 'string' && src.trim() !== '')
      ? src
      : getVerifiedPoster(title);

    setEffectiveSrc(initial);
    setIsLoaded(false);
    setHasError(!initial);
    setTriedVerifiedFallback(Boolean(!src && initial));
  }, [src, title]);

  const handleImageError = () => {
    if (!triedVerifiedFallback) {
      const verified = getVerifiedPoster(title);
      if (verified && verified !== effectiveSrc) {
        setTriedVerifiedFallback(true);
        setEffectiveSrc(verified);
        return;
      }
    }
    setHasError(true);
  };

  // If no source provided or error encountered, render professional fallback
  if (!effectiveSrc || hasError) {
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
        src={effectiveSrc}
        alt={alt || title || 'Movie poster'}
        loading={loading}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
