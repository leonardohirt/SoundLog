import React, { useState } from 'react';
import logoImg from '../assets/logo.jpg';

export function UserProfileModal({
  user,
  isFollowing,
  onToggleFollow,
  onClose,
  onSelectAlbum,
  onSelectTrack
}) {
  const [following, setFollowing] = useState(isFollowing);
  const [followersCount, setFollowersCount] = useState(user?.followers_count || 0);

  if (!user) return null;

  const handleFollowClick = () => {
    const nextState = !following;
    setFollowing(nextState);
    setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    onToggleFollow(user.id);
  };

  const favoriteArtistsList = user.favorite_artist
    ? user.favorite_artist.split(',').map((a) => a.trim()).filter(Boolean)
    : [];

  const favoriteGenresList = user.favorite_genres || [];
  const recentReviews = user.recent_reviews || [];

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="soundlog-paper paper-texture border border-[#151413] shadow-2xl w-full max-w-3xl my-auto p-6 sm:p-10 max-h-[90vh] overflow-y-auto space-y-8">
        
        {/* TOP BAR */}
        <div className="border-b-2 border-[#151413] pb-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply"
            />
            <span className="text-[10px] font-mono-meta text-[#888075] uppercase hidden sm:inline border-l border-rule pl-3">
              PERFIL PÚBLICO · COMUNIDADE CRÍTICA
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-mono-meta text-[#58534C] hover:text-[#151413] border border-[#151413] px-2.5 py-1 bg-[#FAF8F5]"
          >
            ✕ Fechar [ESC]
          </button>
        </div>

        {/* CABEÇALHO DO PERFIL */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-rule">
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 bg-[#151413] text-[#FAF8F5] flex items-center justify-center font-editorial-serif text-2xl font-bold border-2 border-[#151413] shrink-0 overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{(user.full_name || user.username || 'OU').substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[#151413]">
                  {user.full_name || user.username}
                </h2>
                <span className="editorial-badge">OUVINTE</span>
              </div>
              <div className="font-mono-meta text-xs text-[#BA3822] font-semibold">
                soundlog.fm/@{user.username}
              </div>
              {user.location && (
                <div className="font-mono-meta text-xs text-[#888075]">
                  📍 {user.location}
                </div>
              )}
            </div>
          </div>

          {/* Botão Seguir */}
          <button
            onClick={handleFollowClick}
            className={`text-xs py-2 px-6 font-mono-meta uppercase tracking-wider font-bold transition-all ${
              following
                ? 'bg-[#EFEAE1] border-2 border-[#151413] text-[#151413] hover:bg-[#FAF8F5]'
                : 'btn-editorial-primary'
            }`}
          >
            {following ? '✓ Seguindo' : '+ Seguir'}
          </button>
        </div>

        {/* BIOGRAFIA */}
        {user.bio && (
          <div className="p-4 bg-[#FAF8F5] border border-rule font-reading-serif text-sm text-[#38332C] leading-relaxed">
            "{user.bio}"
          </div>
        )}

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-3 gap-3 font-mono-meta text-xs">
          <div className="p-3 bg-[#FAF8F5] border border-rule text-center">
            <span className="text-[10px] text-[#888075] block uppercase">Avaliações</span>
            <span className="text-xl font-bold text-[#BA3822]">{user.reviews_count || recentReviews.length || 0}</span>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-rule text-center">
            <span className="text-[10px] text-[#888075] block uppercase">Seguidores</span>
            <span className="text-xl font-bold text-[#151413]">{followersCount}</span>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-rule text-center">
            <span className="text-[10px] text-[#888075] block uppercase">Status</span>
            <span className="text-sm font-bold text-[#58534C] mt-1 block">
              {following ? 'Conectado' : 'Não conectado'}
            </span>
          </div>
        </div>

        {/* ARTISTAS & GÊNEROS DE CABECEIRA */}
        {(favoriteArtistsList.length > 0 || favoriteGenresList.length > 0) && (
          <div className="space-y-3 pt-2">
            <h4 className="font-editorial-serif text-base font-bold text-[#151413]">
              Preferências & Afinidades Musicais
            </h4>
            <div className="flex flex-wrap gap-2 font-mono-meta text-xs">
              {favoriteArtistsList.map((artist) => (
                <span key={artist} className="editorial-badge">
                  {artist}
                </span>
              ))}
              {favoriteGenresList.map((genre) => (
                <span key={genre} className="editorial-badge editorial-badge-accent">
                  #{genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AVALIAÇÕES RECENTES DO USUÁRIO */}
        <div className="space-y-4 pt-4 border-t border-rule">
          <div className="flex items-baseline justify-between">
            <h3 className="font-editorial-serif text-xl font-bold text-[#151413]">
              Avaliações & Críticas Recentes
            </h3>
            <span className="text-xs font-mono-meta text-[#888075]">DIÁRIO PÚBLICO</span>
          </div>

          {recentReviews.length === 0 ? (
            <div className="p-6 bg-[#FAF8F5] border border-rule text-center font-reading-serif text-xs text-[#58534C]">
              Este ouvinte ainda não publicou avaliações públicas adicionais.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((rev, idx) => {
                const isTrack = rev.item_type === 'track';
                return (
                  <div key={idx} className="p-4 bg-[#FAF8F5] border border-rule space-y-2">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-2">
                        <span className={`editorial-badge ${isTrack ? 'editorial-badge-accent' : ''}`}>
                          {isTrack ? 'MÚSICA' : 'ÁLBUM'}
                        </span>
                        <span className="font-editorial-serif text-base font-bold text-[#151413]">
                          {isTrack ? rev.track_name : rev.album_title}
                          <span className="text-xs text-[#58534C] font-normal ml-1">· {rev.artist_name}</span>
                        </span>
                      </div>
                      <span className="text-sm font-mono-meta font-bold text-[#BA3822]">
                        ★ {Number(rev.rating).toFixed(1)}
                      </span>
                    </div>

                    {rev.review_text && (
                      <p className="font-reading-serif text-xs text-[#38332C] italic">
                        "{rev.review_text}"
                      </p>
                    )}
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
