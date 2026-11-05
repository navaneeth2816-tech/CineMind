import React, { useState, useEffect, useRef } from 'react';
import { Film } from 'lucide-react';
import { getPosterCandidates } from '../constants/posters';

/**
 * Robust, production-grade MoviePoster component:
 * - Dynamic multi-tier candidate resolution (Primary URL -> Local ID asset -> Backend Proxy)
 * - Zero hardcoded movie names; works dynamically for all movies in the database
 * - Eliminates empty backgrounds: instantly displays cached and streaming images
 * - Handles ISP / network blocks seamlessly by auto-switching to backend streaming proxy
 * - Graceful fallback card displayed ONLY when all image sources are genuinely exhausted
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
  const [candidates, setCandidates] = useState(() => getPosterCandidates(src, id));
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Synchronize candidate list whenever src or id changes
  useEffect(() => {
    const list = getPosterCandidates(src, id);
    setCandidates(list);
    setCandidateIndex(0);
    setIsLoaded(false);
    setHasError(list.length === 0);
  }, [src, id]);

  const currentSrc = candidates[candidateIndex];

  // Immediately detect if the image is already complete in browser cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  const handleImageLoad = (e) => {
    if (e.target.naturalWidth > 0) {
      setIsLoaded(true);
      setHasError(false);
    }
  };

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      // Advance to next dynamic fallback candidate
      setCandidateIndex(prev => prev + 1);
      setIsLoaded(false);
    } else {
      // All candidates genuinely exhausted
      setHasError(true);
    }
  };

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
    <div className={`relative ${aspectRatio} w-full overflow-hidden bg-slate-900 rounded-xl ${className}`}>
      {/* Background loading pulse (hidden once image loads, never blocks image visibility) */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center pointer-events-none">
          <Film className="w-6 h-6 text-slate-600 animate-pulse" />
        </div>
      )}
      <img
        ref={imgRef}
        key={currentSrc}
        src={currentSrc}
        alt={alt || title || 'Movie poster'}
        loading={loading}
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
