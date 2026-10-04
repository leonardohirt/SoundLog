import React, { useRef, useState, useEffect } from 'react';

export function MiniPlayer({ track, onClose }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (track && track.preview_url && audioRef.current) {
      audioRef.current.src = track.preview_url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [track]);

  if (!track || !track.preview_url) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5] border-t-2 border-[#151413] shadow-2xl p-3 sm:px-8 flex items-center justify-between gap-4 font-mono-meta text-xs">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <div className="flex items-center gap-3 min-w-0">
        <span className="editorial-badge editorial-badge-accent shrink-0">ÁUDIO 30S</span>
        <div className="truncate">
          <span className="font-bold text-[#151413] block truncate">{track.track_name}</span>
          <span className="text-[11px] text-[#58534C] truncate">{track.artist_name || track.album_title}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={togglePlay}
          className="btn-editorial-primary text-xs py-1.5 px-3"
        >
          {isPlaying ? '❚❚ Pausar' : '▶ Ouvir'}
        </button>

        <button
          onClick={onClose}
          className="text-[#888075] hover:text-[#151413] text-xs px-2 py-1 border border-rule bg-[#FAF8F5]"
        >
          ✕ Fechar
        </button>
      </div>
    </div>
  );
}
