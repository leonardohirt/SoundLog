import React, { useState, useEffect } from 'react';
import { getTrackDetails } from '../services/musicApi';
import { StarRating } from './StarRating';
import logoImg from '../assets/logo.jpg';

export function TrackDetailModal({
  track,
  userReview,
  trackReviews = [],
  onClose,
  onOpenReview,
  onOpenAlbum,
  onPlayTrack,
  currentPlayingTrack,
  onDeleteReview
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (track?.track_id) {
      setLoading(true);
      getTrackDetails(track.track_id).then((resDetails) => {
        setDetails(resDetails || track);
        setLoading(false);
      });
    }
  }, [track]);

  if (!track) return null;
  const trackData = details || track;

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="soundlog-paper paper-texture border border-[#151413] shadow-2xl w-full max-w-3xl my-auto p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="border-b-2 border-[#151413] pb-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply"
            />
            <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase font-bold tracking-widest border-l border-rule pl-3">
              FICHA DE MÚSICA / FAIXA
            </span>
          </div>
          <button

            onClick={onClose}
            className="text-xs font-mono-meta text-[#58534C] hover:text-[#151413] border border-[#151413] px-2 py-1 bg-[#FAF8F5]"
          >
            ✕ FECHAR
          </button>
        </div>

        {/* HERO SECTION DA MÚSICA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-b border-rule pb-6">
          
          {/* Capa & Player Preview (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <div className="relative aspect-square bg-[#151413] border-2 border-[#151413] shadow-md overflow-hidden">
              <img
                src={trackData.cover_url || 'https://via.placeholder.com/600'}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* Audio Preview Button */}
            {trackData.preview_url ? (
              <button
                onClick={() => onPlayTrack && onPlayTrack(trackData)}
                className="w-full btn-editorial-secondary text-xs py-2 px-3 flex items-center justify-center gap-2"
              >
                <span>{currentPlayingTrack?.track_id === trackData.track_id ? '❚❚ Pausar' : '▶ Prévia (30s)'}</span>
              </button>
            ) : (
              <div className="text-[10px] font-mono-meta text-center text-[#888075] py-1 border border-dashed border-rule">
                Prévia de áudio não disponível
              </div>
            )}

            {/* Ações Rápidas */}
            <div className="space-y-2 font-mono-meta text-xs">
              <button
                onClick={() => onOpenReview(trackData)}
                className="w-full btn-editorial-primary text-xs py-2 px-3 text-center"
              >
                {userReview ? 'Editar Nota da Música' : '★ Avaliar esta Música'}
              </button>
            </div>
          </div>

          {/* Informações e Metadados (8 cols) */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2 font-mono-meta text-xs">
                <span className="editorial-badge editorial-badge-accent">MÚSICA / FAIXA</span>
                {trackData.duration_formatted && (
                  <span className="editorial-badge">⏱ {trackData.duration_formatted}</span>
                )}
                {trackData.release_year && (
                  <span className="editorial-badge">{trackData.release_year}</span>
                )}
              </div>

              <h1 className="font-editorial-serif text-2xl sm:text-3xl font-black text-[#151413] tracking-tight leading-tight">
                {trackData.track_name || trackData.title}
              </h1>
              <h2 className="font-editorial-serif text-lg text-[#58534C] font-semibold mt-0.5">
                {trackData.artist_name || trackData.artist}
              </h2>

              {/* Link para o Álbum de Origem */}
              {trackData.album_title && (
                <div className="mt-2 text-xs font-mono-meta text-[#58534C]">
                  <span>Álbum de Origem: </span>
                  <button
                    onClick={() => {
                      if (onOpenAlbum) {
                        onClose();
                        onOpenAlbum({
                          album_id: trackData.album_id,
                          album_title: trackData.album_title,
                          artist_name: trackData.artist_name,
                          cover_url: trackData.cover_url
                        });
                      }
                    }}
                    className="text-[#BA3822] font-bold hover:underline"
                  >
                    {trackData.album_title} →
                  </button>
                </div>
              )}
            </div>

            {/* Painel da Avaliação do Usuário para esta canção */}
            {userReview ? (
              <div className="p-4 bg-[#EFEAE1] border border-[#151413] space-y-2 font-mono-meta text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[#151413] uppercase">Sua Avaliação da Música:</span>
                  <span className="text-[#BA3822] text-base font-bold">★ {Number(userReview.rating).toFixed(1)} / 5.0</span>
                </div>
                {userReview.review_text && (
                  <p className="font-reading-serif text-xs text-[#38332C] leading-relaxed">
                    "{userReview.review_text}"
                  </p>
                )}
                <div className="pt-2 border-t border-rule flex justify-between text-[11px] text-[#888075]">
                  <span>Ouvido em {userReview.listened_date} ({userReview.media_format || 'Streaming'})</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenReview(trackData)}
                      className="text-[#BA3822] underline"
                    >
                      Editar
                    </button>
                    {onDeleteReview && (
                      <button
                        onClick={() => {
                          if (confirm('Deseja excluir sua avaliação desta música?')) {
                            onDeleteReview(userReview.id);
                            onClose();
                          }
                        }}
                        className="text-[#9E2A1B] underline"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FAF8F5] border border-rule space-y-1">
                <span className="text-xs font-mono-meta text-[#888075] uppercase block">
                  Status no seu perfil
                </span>
                <p className="font-reading-serif text-xs text-[#58534C]">
                  Você ainda não avaliou esta música nem registrou sua escuta no diário.
                </p>
              </div>
            )}

            {/* Link Externo no Spotify */}
            {trackData.spotify_url && (
              <div className="pt-1">
                <a
                  href={trackData.spotify_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono-meta text-[#58534C] hover:text-[#BA3822] inline-flex items-center gap-1.5"
                >
                  <span>Abrir faixa no Spotify ↗</span>
                </a>
              </div>
            )}
          </div>

        </div>

        {/* HISTÓRICO DE RESENHAS DESTA FAIXA */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between border-b-2 border-[#151413] pb-2">
            <h3 className="font-editorial-serif text-lg font-bold text-[#151413]">
              Críticas e Registros da Canção
            </h3>
            <span className="text-xs font-mono-meta text-[#888075]">
              {trackReviews.length} {trackReviews.length === 1 ? 'REGISTRO' : 'REGISTROS'}
            </span>
          </div>

          {trackReviews.length === 0 ? (
            <p className="font-reading-serif text-xs text-[#888075] py-2 italic">
              Nenhuma resenha ou comentário comunitário para esta faixa até o momento.
            </p>
          ) : (
            <div className="space-y-3 divide-y divide-rule">
              {trackReviews.map((rev) => (
                <div key={rev.id} className="pt-2 text-xs font-mono-meta space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[#151413]">Avaliação do Ouvinte</span>
                    <span className="text-[#BA3822] font-bold">★ {Number(rev.rating).toFixed(1)}</span>
                  </div>
                  {rev.review_text && (
                    <p className="font-reading-serif text-xs text-[#38332C]">"{rev.review_text}"</p>
                  )}
                  <span className="text-[10px] text-[#888075] block">
                    {rev.listened_date} · {rev.media_format || 'Streaming'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
