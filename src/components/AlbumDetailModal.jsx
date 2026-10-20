import React, { useState, useEffect } from 'react';
import { getAlbumDetails } from '../services/musicApi';
import logoImg from '../assets/logo.jpg';

export function AlbumDetailModal({
  album,
  userReview,
  allReviews = [],
  onClose,
  onOpenReview,
  onSelectTrack,
  onOpenTrackReview,
  onDeleteReview,
  onPlayTrack,
  currentPlayingTrack
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (album?.album_id) {
      setLoading(true);
      getAlbumDetails(album.album_id).then((resDetails) => {
        setDetails(resDetails || album);
        setLoading(false);
      });
    }
  }, [album]);

  if (!album) return null;
  const albumData = details || album;

  // Helper to find review for a specific track
  const getTrackReview = (trackId) => {
    return allReviews.find(
      (r) => r.item_type === 'track' && String(r.track_id) === String(trackId)
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="soundlog-paper paper-texture border border-[#151413] shadow-2xl w-full max-w-4xl my-auto p-6 sm:p-10 max-h-[90vh] overflow-y-auto space-y-8">
        
        {/* TOP BAR */}
        <div className="border-b-2 border-[#151413] pb-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply"
            />
            <span className="text-[10px] font-mono-meta text-[#888075] uppercase hidden sm:inline border-l border-rule pl-3">
              FICHA DISCOGRÁFICA · ÁLBUM COMPLETO
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-mono-meta text-[#58534C] hover:text-[#151413] border border-[#151413] px-2 py-1 bg-[#FAF8F5]"
          >
            ✕ FECHAR
          </button>
        </div>

        {/* HERO SECTION DO ÁLBUM */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-rule pb-8">
          
          {/* Capa do Álbum (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-square bg-[#151413] border-2 border-[#151413] shadow-md overflow-hidden">
              <img
                src={albumData.cover_url || 'https://via.placeholder.com/600'}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* Ações Compactas e Objetivas */}
            <div className="grid grid-cols-2 gap-2 font-mono-meta text-xs">
              <button
                onClick={() => onOpenReview(albumData)}
                className="btn-editorial-primary text-xs py-2 px-2 text-center"
              >
                {userReview ? 'Editar Nota do Álbum' : '★ Avaliar Álbum'}
              </button>
              <button
                onClick={() => onOpenReview(albumData)}
                className="btn-editorial-secondary text-xs py-2 px-2 text-center"
              >
                + Diário do Álbum
              </button>
            </div>
          </div>

          {/* Informações e Metadados (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2 font-mono-meta text-xs">
                <span className="editorial-badge editorial-badge-accent">ÁLBUM COMPLETO</span>
                <span className="editorial-badge">{albumData.release_year || 'N/A'}</span>
                <span className="editorial-badge">{albumData.genre || 'Música'}</span>
                <span className="editorial-badge">{(albumData.tracks || []).length || albumData.total_tracks || '0'} FAIXAS</span>
              </div>

              <h1 className="font-editorial-serif text-3xl sm:text-4xl font-black text-[#151413] tracking-tight leading-tight">
                {albumData.album_title}
              </h1>
              <h2 className="font-editorial-serif text-xl text-[#58534C] font-semibold mt-0.5">
                {albumData.artist_name}
              </h2>
            </div>

            {/* Painel da Avaliação do Usuário para o Álbum */}
            {userReview ? (
              <div className="p-4 bg-[#EFEAE1] border border-[#151413] space-y-2 font-mono-meta text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[#151413] uppercase">Sua Avaliação do Álbum Completo:</span>
                  <span className="text-[#BA3822] text-base font-bold">★ {Number(userReview.rating).toFixed(1)} / 5.0</span>
                </div>
                {userReview.review_text && (
                  <p className="font-reading-serif text-xs text-[#38332C] leading-relaxed">
                    "{userReview.review_text}"
                  </p>
                )}
                <div className="pt-2 border-t border-rule flex justify-between text-[11px] text-[#888075]">
                  <span>Ouvido em {userReview.listened_date} ({userReview.media_format || 'Vinil'})</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenReview(albumData)}
                      className="text-[#BA3822] underline"
                    >
                      Editar
                    </button>
                    {onDeleteReview && (
                      <button
                        onClick={async () => {
                          if (!confirm('Deseja excluir a avaliação deste álbum?')) return;
                          try {
                            await onDeleteReview(userReview.id);
                          } catch (error) {
                            window.alert(error.message || 'Não foi possível excluir a avaliação.');
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
                  Status do Álbum no seu perfil
                </span>
                <p className="font-reading-serif text-xs text-[#58534C]">
                  Você ainda não avaliou este álbum como um todo. Você pode avaliar o disco completo e também avaliar faixas individuais separadamente.
                </p>
              </div>
            )}

            {/* Link Externo no Spotify */}
            {albumData.spotify_url && (
              <div className="pt-2">
                <a
                  href={albumData.spotify_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono-meta text-[#58534C] hover:text-[#BA3822] inline-flex items-center gap-1.5"
                >
                  <span>Abrir álbum no Spotify ↗</span>
                </a>
              </div>
            )}
          </div>

        </div>

        {/* ALINHAMENTO DE FAIXAS COM AUDIO PREVIEW & AVALIAÇÃO INDEPENDENTE DE CADA MÚSICA */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b-2 border-[#151413] pb-2">
            <div>
              <h3 className="font-editorial-serif text-xl font-bold text-[#151413]">
                Alinhamento de Faixas
              </h3>
              <p className="text-[11px] font-mono-meta text-[#58534C] mt-0.5">
                Clique no título para ver a ficha da música ou em ★ para avaliar a faixa individualmente.
              </p>
            </div>
            <span className="text-xs font-mono-meta text-[#888075] shrink-0">
              {(albumData.tracks || []).length} FAIXAS
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center font-mono-meta text-xs text-[#888075]">
              Carregando faixas e durações...
            </div>
          ) : (
            <div className="font-mono-meta text-xs divide-y divide-rule border-b border-rule bg-[#FAF8F5]">
              {(albumData.tracks || []).map((tr, idx) => {
                const trackRev = getTrackReview(tr.track_id);
                const trackPayload = {
                  track_id: tr.track_id,
                  track_name: tr.track_name,
                  artist_name: tr.artist_name || albumData.artist_name,
                  album_id: albumData.album_id,
                  album_title: albumData.album_title,
                  cover_url: albumData.cover_url,
                  duration_formatted: tr.duration_formatted,
                  preview_url: tr.preview_url,
                  release_year: albumData.release_year,
                  spotify_url: tr.spotify_url
                };

                return (
                  <div
                    key={tr.track_id || idx}
                    className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#EFEAE1] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[#888075] w-5 text-right font-mono-meta">
                        {String(tr.track_number || idx + 1).padStart(2, '0')}
                      </span>

                      {tr.preview_url ? (
                        <button
                          onClick={() => onPlayTrack(trackPayload)}
                          className="w-6 h-6 bg-[#151413] text-white flex items-center justify-center text-[9px] shrink-0 hover:bg-[#BA3822] transition-colors"
                          title="Tocar prévia"
                        >
                          {currentPlayingTrack?.track_id === tr.track_id ? '❚❚' : '▶'}
                        </button>
                      ) : (
                        <div className="w-6 h-6 bg-transparent shrink-0" />
                      )}

                      <button
                        onClick={() => onSelectTrack && onSelectTrack(trackPayload)}
                        className="font-medium text-[#151413] hover:text-[#BA3822] hover:underline text-left truncate"
                        title="Ver detalhes da música"
                      >
                        {tr.track_name}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-3 shrink-0 pl-8 sm:pl-0">
                      {trackRev ? (
                        <span className="text-[#BA3822] font-bold text-xs bg-[#FAF8F5] px-1.5 py-0.5 border border-rule">
                          ★ {Number(trackRev.rating).toFixed(1)}
                        </span>
                      ) : null}

                      <button
                        onClick={() => onOpenTrackReview && onOpenTrackReview(trackPayload)}
                        className="text-[11px] text-[#58534C] hover:text-[#BA3822] hover:underline font-mono-meta"
                      >
                        {trackRev ? 'Editar nota' : '★ Avaliar faixa'}
                      </button>

                      <span className="text-[#888075] text-[11px] w-12 text-right">
                        {tr.duration_formatted || (tr.duration_ms ? `${Math.floor(tr.duration_ms / 60000)}:${Math.floor((tr.duration_ms % 60000) / 1000).toString().padStart(2, '0')}` : '—')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

