import React, { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import { generateUUID } from '../services/supabase';
import logoImg from '../assets/logo.jpg';

export function ReviewModal({

  item,
  album,
  track,
  type,
  existingReview,
  onClose,
  onSaveReview,
  onDeleteReview
}) {
  const activeItem = item || album || track;
  const isTrack = type === 'track' || (type !== 'album' && Boolean(activeItem?.track_id));

  const [rating, setRating] = useState(existingReview?.rating || 4.5);

  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [listenedDate, setListenedDate] = useState(
    existingReview?.listened_date || new Date().toISOString().split('T')[0]
  );
  const [mediaFormat, setMediaFormat] = useState(existingReview?.media_format || 'Vinil');
  const [isRelisten, setIsRelisten] = useState(existingReview?.is_relisten || false);
  const [isFavorite, setIsFavorite] = useState(existingReview?.is_favorite || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 4.5);
      setReviewText(existingReview.review_text || '');
      setListenedDate(existingReview.listened_date || new Date().toISOString().split('T')[0]);
      setMediaFormat(existingReview.media_format || 'Vinil');
      setIsRelisten(Boolean(existingReview.is_relisten));
      setIsFavorite(Boolean(existingReview.is_favorite));
    }
  }, [existingReview]);

  if (!activeItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const reviewData = {
      id: existingReview?.id || generateUUID(),
      item_type: isTrack ? 'track' : 'album',
      // Common fields
      rating: Number(rating),
      review_text: reviewText.trim(),
      listened_date: listenedDate,
      media_format: mediaFormat,
      is_relisten: Boolean(isRelisten),
      is_favorite: Boolean(isFavorite),
      created_at: existingReview?.created_at || new Date().toISOString(),

      // Track Specific
      track_id: isTrack ? String(activeItem.track_id) : null,
      track_name: isTrack ? (activeItem.track_name || activeItem.title) : null,
      duration_formatted: isTrack ? (activeItem.duration_formatted || '') : null,

      // Album Specific / Associated
      album_id: String(activeItem.album_id || activeItem.id),
      album_title: activeItem.album_title || (isTrack ? activeItem.album_name : activeItem.name) || '',
      artist_name: activeItem.artist_name || activeItem.artist || '',
      cover_url: activeItem.cover_url || activeItem.image_url || '',
      release_year: activeItem.release_year || '',
      genre: activeItem.genre || 'Música'
    };

    await onSaveReview(reviewData);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="soundlog-paper paper-texture border border-[#151413] shadow-2xl w-full max-w-xl my-auto p-6 sm:p-8 space-y-6">
        
        {/* MASTHEAD HEADER */}
        <div className="border-b-2 border-[#151413] pb-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-8 w-auto object-contain mix-blend-multiply"
            />
            <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold border-l border-rule pl-3">
              {isTrack ? 'AVALIAÇÃO DE MÚSICA' : 'AVALIAÇÃO DE ÁLBUM'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono-meta text-[#58534C] hover:text-[#151413] border border-[#151413] px-2 py-1 bg-[#FAF8F5]"
          >
            ✕ FECHAR
          </button>
        </div>


        {/* TÍTULO E IDENTIFICAÇÃO */}
        <div className="flex gap-4 items-center border-b border-rule pb-4">
          <img
            src={activeItem.cover_url || 'https://via.placeholder.com/600'}
            alt=""
            className="w-16 h-16 object-cover border border-[#151413] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`editorial-badge ${isTrack ? 'editorial-badge-accent' : ''}`}>
                {isTrack ? 'MÚSICA / FAIXA' : 'ÁLBUM COMPLETO'}
              </span>
              {isTrack && activeItem.duration_formatted && (
                <span className="text-[11px] font-mono-meta text-[#888075]">⏱ {activeItem.duration_formatted}</span>
              )}
            </div>

            <h3 className="font-editorial-serif text-xl font-bold text-[#151413] leading-tight truncate">
              {isTrack ? (activeItem.track_name || activeItem.title) : activeItem.album_title}
            </h3>
            <p className="font-mono-meta text-xs text-[#58534C] mt-0.5 truncate">
              {activeItem.artist_name} {isTrack && activeItem.album_title ? `· ${activeItem.album_title}` : (activeItem.release_year ? `(${activeItem.release_year})` : '')}
            </p>
          </div>
        </div>


        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* NOTA EM ESTRELAS */}
          <div className="space-y-2 p-3 bg-[#FAF8F5] border border-rule text-center">
            <label className="font-mono-meta text-xs font-bold text-[#151413] uppercase block">
              Nota {isTrack ? 'da Música' : 'do Álbum'} ({rating.toFixed(1)} / 5.0)
            </label>
            <div className="flex justify-center py-1">
              <StarRating rating={rating} onRate={setRating} size={28} />
            </div>
          </div>

          {/* RESENHA CRÍTICA (OPCIONAL) */}
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">
                Resenha {isTrack ? 'da Faixa' : 'do Álbum'} <span className="text-[#888075] font-normal">(opcional)</span>
              </label>
              <span className="text-[10px] font-mono-meta text-[#888075]">TEXTO CRÍTICO</span>
            </div>
            <textarea
              rows="4"
              placeholder={
                isTrack
                  ? "Escreva suas impressões sobre a melodia, letra, arranjos ou performance nesta canção..."
                  : "Escreva sua crítica sobre o conjunto da obra, conceito estético e produção do álbum..."
              }
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="field-editorial font-reading-serif resize-none text-sm"
            />
          </div>

          {/* METADADOS DO DIÁRIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Data de Escuta</label>
              <input
                type="date"
                value={listenedDate}
                onChange={(e) => setListenedDate(e.target.value)}
                className="field-editorial text-xs font-mono-meta"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Formato de Mídia</label>
              <select
                value={mediaFormat}
                onChange={(e) => setMediaFormat(e.target.value)}
                className="field-editorial text-xs font-mono-meta"
              >
                <option value="Vinil">Vinil (LP / Compacto)</option>
                <option value="Streaming">Streaming</option>
                <option value="CD">CD / Compact Disc</option>
                <option value="Cassete">Fita Cassete</option>
                <option value="Ao Vivo">Apresentação ao Vivo</option>
              </select>
            </div>
          </div>

          {/* OPÇÕES ADICIONAIS */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-rule text-xs font-mono-meta">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRelisten}
                onChange={(e) => setIsRelisten(e.target.checked)}
                className="checkbox-editorial"
              />
              <span>Reescuta</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="checkbox-editorial"
              />
              <span className="text-[#BA3822]">♡ Marcar como favorita</span>
            </label>
          </div>

          {/* AÇÕES */}
          <div className="pt-4 border-t border-[#151413] flex justify-between items-center gap-3">
            {existingReview && onDeleteReview ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(isTrack ? 'Excluir avaliação da música?' : 'Excluir avaliação do álbum?')) {
                    onDeleteReview(existingReview.id);
                    onClose();
                  }
                }}
                className="text-xs font-mono-meta text-[#9E2A1B] hover:underline"
              >
                {isTrack ? 'Excluir avaliação da música' : 'Excluir avaliação do álbum'}
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-editorial-secondary text-xs py-2 px-4"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-editorial-primary text-xs py-2 px-6"
              >
                {saving
                  ? 'Publicando...'
                  : isTrack
                  ? 'Publicar avaliação da música'
                  : 'Publicar avaliação do álbum'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
