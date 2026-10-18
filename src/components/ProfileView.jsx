import React, { useState } from 'react';
import { StarRating } from './StarRating';

export function ProfileView({
  profile,
  reviews = [],
  diaryLogs = [],
  lists = [],
  followingIds = [],
  followersCount = 0,
  communityUsers = [],
  onSelectAlbum,
  onSelectTrack,
  onSelectUser,
  onToggleFollow,
  onOpenEditProfile,
  onDeleteReview,
  onOpenCreateList,
  onNavigateTab
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'tracks' | 'albums' | 'reviews' | 'diary' | 'lists' | 'following'

  const userReviews = reviews || [];
  const userLists = lists || [];

  // Separate Tracks and Albums strictly
  const trackReviews = userReviews.filter((r) => r.item_type === 'track');
  const albumReviews = userReviews.filter((r) => r.item_type === 'album' || !r.item_type);
  const textReviews = userReviews.filter((r) => r.review_text && r.review_text.trim().length > 0);

  const totalTracks = trackReviews.length;
  const totalAlbums = albumReviews.length;
  const totalWrittenReviews = textReviews.length;
  const totalDiary = userReviews.length;
  const totalLists = userLists.length;
  const totalFollowing = followingIds.length;

  const favoriteArtistsList = profile?.favorite_artist
    ? profile.favorite_artist.split(',').map((a) => a.trim()).filter(Boolean)
    : [];

  const favoriteGenresList = profile?.favorite_genres || [];

  return (
    <div className="space-y-8">
      
      {/* 1. MASTHEAD DO PERFIL (INFORMAÇÕES DO USUÁRIO) */}
      <div className="border-b-2 border-[#151413] pb-6 space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 bg-[#151413] text-[#FAF8F5] flex items-center justify-center font-editorial-serif text-2xl font-bold border-2 border-[#151413] shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{(profile?.full_name || profile?.username || 'LM').substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[#151413]">
                  {profile?.full_name || profile?.username || 'Ouvinte Soundlog'}
                </h1>
                <span className="editorial-badge">OUVINTE CRÍTICO</span>
              </div>
              <div className="font-mono-meta text-xs text-[#BA3822] font-semibold">
                soundlog.fm/@{profile?.username || 'usuario'}
              </div>
              {profile?.location && (
                <div className="font-mono-meta text-xs text-[#888075]">
                  📍 {profile.location}
                </div>
              )}
            </div>
          </div>

          {/* Botão de Editar Perfil */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenEditProfile}
              className="btn-editorial-secondary text-xs py-2 px-4 flex items-center gap-2"
            >
              <span>✎</span> Editar Perfil
            </button>
          </div>

        </div>

        {/* Biografia ou Estado Vazio */}
        {profile?.bio ? (
          <p className="font-reading-serif text-sm text-[#38332C] max-w-2xl leading-relaxed">
            "{profile.bio}"
          </p>
        ) : (
          <div className="text-xs font-reading-serif text-[#888075] italic">
            Nenhuma biografia adicionada. <button onClick={onOpenEditProfile} className="text-[#BA3822] underline not-italic">Adicionar biografia</button>
          </div>
        )}

        {/* 2. ESTATÍSTICAS SEPARADAS DO OUVINTE */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-4 border-t border-rule font-mono-meta text-xs">
          <div className="p-2.5 bg-[#FAF8F5] border border-rule">
            <span className="text-[10px] text-[#888075] block uppercase">Músicas</span>
            <span className="text-lg font-bold text-[#BA3822]">{totalTracks}</span>
          </div>
          <div className="p-2.5 bg-[#FAF8F5] border border-rule">
            <span className="text-[10px] text-[#888075] block uppercase">Álbuns</span>
            <span className="text-lg font-bold text-[#151413]">{totalAlbums}</span>
          </div>
          <div className="p-2.5 bg-[#FAF8F5] border border-rule">
            <span className="text-[10px] text-[#888075] block uppercase">Resenhas</span>
            <span className="text-lg font-bold text-[#151413]">{totalWrittenReviews}</span>
          </div>
          <div className="p-2.5 bg-[#FAF8F5] border border-rule">
            <span className="text-[10px] text-[#888075] block uppercase">Listas</span>
            <span className="text-lg font-bold text-[#151413]">{totalLists}</span>
          </div>
          <div className="p-2.5 bg-[#FAF8F5] border border-rule">
            <span className="text-[10px] text-[#888075] block uppercase">Seguidores</span>
            <span className="text-lg font-bold text-[#151413]">{followersCount}</span>
          </div>
          <div
            onClick={() => setActiveSubTab('following')}
            className="p-2.5 bg-[#FAF8F5] border border-rule cursor-pointer hover:bg-[#EFEAE1] transition-colors"
          >
            <span className="text-[10px] text-[#888075] block uppercase">Seguindo</span>
            <span className="text-lg font-bold text-[#BA3822]">{totalFollowing}</span>
          </div>
        </div>

      </div>

      {/* 3. SUB-NAVEGAÇÃO DO PERFIL */}
      <div className="flex items-center gap-3 sm:gap-6 border-b border-[#151413] pb-2 text-xs font-mono-meta uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-1 shrink-0 ${activeSubTab === 'overview' ? 'text-[#BA3822] font-bold border-b-2 border-[#BA3822]' : 'text-[#58534C] hover:text-[#151413]'}`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveSubTab('tracks')}
          className={`pb-1 shrink-0 ${activeSubTab === 'tracks' ? 'text-[#BA3822] font-bold border-b-2 border-[#BA3822]' : 'text-[#58534C] hover:text-[#151413]'}`}
        >
          Músicas ({totalTracks})
        </button>
        <button
          onClick={() => setActiveSubTab('albums')}
          className={`pb-1 shrink-0 ${activeSubTab === 'albums' ? 'text-[#BA3822] font-bold border-b-2 border-[#BA3822]' : 'text-[#58534C] hover:text-[#151413]'}`}
        >
          Álbuns ({totalAlbums})
        </button>
        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`pb-1 shrink-0 ${activeSubTab === 'reviews' ? 'text-[#BA3822] font-bold border-b-2 border-[#BA3822]' : 'text-[#58534C] hover:text-[#151413]'}`}
        >
          Resenhas ({totalWrittenReviews})
        </button>
        <button
          onClick={() => setActiveSubTab('diary')}
          className={`pb-1 shrink-0 ${activeSubTab === 'diary' ? 'text-[#BA3822] font-bold border-b-2 border-[#BA3822]' : 'text-[#58534C] hover:text-[#151413]'}`}
        >
          Diário ({totalDiary})
        </button>
        <button
          onClick={() => setActiveSubTab('lists')}
          className={`pb-1 shrink-0 ${activeSubTab === 'lists' ? 'text-[#BA3822] font-bold border-b-2 border-[#BA3822]' : 'text-[#58534C] hover:text-[#151413]'}`}
        >
          Listas ({totalLists})
        </button>
        <button
          onClick={() => setActiveSubTab('following')}
          className={`pb-1 shrink-0 ${activeSubTab === 'following' ? 'text-[#BA3822] font-bold border-b-2 border-[#BA3822]' : 'text-[#58534C] hover:text-[#151413]'}`}
        >
          Seguindo ({totalFollowing})
        </button>
      </div>

      {/* 4. CONTEÚDO DAS ABAS */}

      {/* ABA: VISÃO GERAL */}
      {activeSubTab === 'overview' && (
        <div className="space-y-12">
          
          {/* SEÇÃO 1: MÚSICAS AVALIADAS */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-rule pb-2">
              <div className="flex items-baseline gap-3">
                <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Músicas Avaliadas</h3>
                <span className="editorial-badge editorial-badge-accent">FAIXAS / CANÇÕES</span>
              </div>
              {totalTracks > 0 && (
                <button
                  onClick={() => setActiveSubTab('tracks')}
                  className="text-xs font-mono-meta text-[#BA3822] hover:underline"
                >
                  Ver todas as {totalTracks} músicas avaliadas →
                </button>
              )}
            </div>

            {totalTracks === 0 ? (
              <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-3">
                <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                  Nenhuma música avaliada ainda.
                </span>
                <p className="font-reading-serif text-xs text-[#58534C] max-w-md mx-auto leading-relaxed">
                  Pesquise suas faixas favoritas para registrar suas primeiras notas e impressões sobre canções específicas.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('explore')}
                    className="btn-editorial-primary text-xs py-2 px-6"
                  >
                    Explorar músicas
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trackReviews.slice(0, 6).map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => onSelectTrack && onSelectTrack({
                      track_id: rev.track_id,
                      track_name: rev.track_name,
                      artist_name: rev.artist_name,
                      album_id: rev.album_id,
                      album_title: rev.album_title,
                      cover_url: rev.cover_url,
                      duration_formatted: rev.duration_formatted,
                      release_year: rev.release_year
                    })}
                    className="p-3 bg-[#FAF8F5] border border-rule flex gap-3 items-center hover:bg-[#EFEAE1] transition-colors cursor-pointer group"
                  >
                    <img
                      src={rev.cover_url || 'https://via.placeholder.com/300'}
                      alt=""
                      className="w-14 h-14 object-cover border border-[#151413] shrink-0 group-hover:contrast-105"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="editorial-badge text-[9px] py-0 px-1">MÚSICA</span>
                        <span className="text-xs font-mono-meta font-bold text-[#BA3822]">
                          ★ {Number(rev.rating).toFixed(1)}
                        </span>
                      </div>
                      <h4 className="font-editorial-serif text-sm font-bold text-[#151413] truncate group-hover:text-[#BA3822]">
                        {rev.track_name || rev.title}
                      </h4>
                      <p className="font-mono-meta text-[11px] text-[#58534C] truncate">
                        {rev.artist_name} {rev.album_title ? `· ${rev.album_title}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>


          {/* SEÇÃO 2: ÁLBUNS AVALIADOS */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-rule pb-2">
              <div className="flex items-baseline gap-3">
                <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Álbuns Avaliados</h3>
                <span className="editorial-badge">DISCOGRAFIAS COMPLETAS</span>
              </div>
              {totalAlbums > 0 && (
                <button
                  onClick={() => setActiveSubTab('albums')}
                  className="text-xs font-mono-meta text-[#BA3822] hover:underline"
                >
                  Ver todos os {totalAlbums} álbuns avaliados →
                </button>
              )}
            </div>

            {totalAlbums === 0 ? (
              <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-3">
                <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                  Nenhum álbum avaliado ainda.
                </span>
                <p className="font-reading-serif text-xs text-[#58534C] max-w-md mx-auto leading-relaxed">
                  Explore discografias completas e avalie obras de ponta a ponta com resenhas críticas.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('explore')}
                    className="btn-editorial-primary text-xs py-2 px-6"
                  >
                    Explorar álbuns
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albumReviews.slice(0, 6).map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => onSelectAlbum && onSelectAlbum({
                      album_id: rev.album_id,
                      album_title: rev.album_title,
                      artist_name: rev.artist_name,
                      cover_url: rev.cover_url,
                      release_year: rev.release_year,
                      genre: rev.genre
                    })}
                    className="space-y-2 cursor-pointer group"
                  >
                    <div className="relative aspect-square w-full overflow-hidden border border-[#151413] shadow-sm">
                      <img
                        src={rev.cover_url || 'https://via.placeholder.com/600'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute top-1.5 right-1.5 bg-[#151413] text-white text-[10px] font-mono-meta font-bold px-1.5 py-0.5">
                        ★ {Number(rev.rating).toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-editorial-serif text-sm font-bold text-[#151413] truncate leading-tight group-hover:text-[#BA3822]">
                        {rev.album_title}
                      </h4>
                      <p className="font-mono-meta text-[11px] text-[#58534C] truncate">
                        {rev.artist_name} {rev.release_year && `(${rev.release_year})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>


          {/* SEÇÃO 3: RESENHAS RECENTES */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-rule pb-2">
              <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Resenhas Recentes</h3>
              {totalWrittenReviews > 0 && (
                <button
                  onClick={() => setActiveSubTab('reviews')}
                  className="text-xs font-mono-meta text-[#BA3822] hover:underline"
                >
                  Ver todas as {totalWrittenReviews} resenhas →
                </button>
              )}
            </div>

            {totalWrittenReviews === 0 ? (
              <div className="p-6 border border-rule bg-[#FAF8F5] text-center space-y-2">
                <span className="font-editorial-serif text-base font-bold text-[#151413] block">
                  Nenhuma resenha escrita ainda.
                </span>
                <p className="font-reading-serif text-xs text-[#58534C]">
                  Ao avaliar um disco ou canção, escreva suas impressões críticas para registrar suas reflexões.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {textReviews.slice(0, 3).map((rev) => {
                  const isTrack = rev.item_type === 'track';
                  return (
                    <article key={rev.id} className="border-b border-rule pb-4 flex gap-4 items-start">
                      <img
                        src={rev.cover_url || 'https://via.placeholder.com/600'}
                        alt=""
                        className="w-16 h-16 object-cover border border-[#151413] shrink-0 cursor-pointer"
                        onClick={() => {
                          if (isTrack && onSelectTrack) {
                            onSelectTrack({
                              track_id: rev.track_id,
                              track_name: rev.track_name,
                              artist_name: rev.artist_name,
                              album_id: rev.album_id,
                              album_title: rev.album_title,
                              cover_url: rev.cover_url
                            });
                          } else if (onSelectAlbum) {
                            onSelectAlbum({
                              album_id: rev.album_id,
                              album_title: rev.album_title,
                              artist_name: rev.artist_name,
                              cover_url: rev.cover_url
                            });
                          }
                        }}
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`editorial-badge ${isTrack ? 'editorial-badge-accent' : ''}`}>
                              {isTrack ? 'MÚSICA' : 'ÁLBUM'}
                            </span>
                            <h4 className="font-editorial-serif text-base font-bold text-[#151413] truncate">
                              {isTrack ? rev.track_name : rev.album_title}
                              <span className="text-xs text-[#58534C] font-normal ml-1">· {rev.artist_name}</span>
                            </h4>
                          </div>
                          <span className="text-xs font-mono-meta font-bold text-[#BA3822] shrink-0 pl-2">
                            ★ {Number(rev.rating).toFixed(1)}
                          </span>
                        </div>
                        <p className="font-reading-serif text-xs text-[#38332C] line-clamp-2">
                          "{rev.review_text}"
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono-meta text-[#888075] pt-1">
                          <span>Ouvido em {rev.listened_date || 'Hoje'} ({rev.media_format || 'Vinil'})</span>
                          {onDeleteReview && (
                            <button
                              onClick={() => {
                                if (confirm('Excluir esta avaliação?')) onDeleteReview(rev.id);
                              }}
                              className="text-[#9E2A1B] hover:underline"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>


          {/* SEÇÃO 4: ARTISTAS E GÊNEROS DE CABECEIRA */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-rule">
            {/* Artistas Favoritos */}
            <div className="border border-rule p-4 bg-[#FAF8F5] space-y-3">
              <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold">
                ARTISTAS DE CABECEIRA
              </span>
              
              {favoriteArtistsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {favoriteArtistsList.map((a) => (
                    <span key={a} className="editorial-badge">{a}</span>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-xs font-reading-serif text-[#888075] space-y-1">
                  <p>Adicione artistas favoritos para personalizar seu perfil.</p>
                  <button onClick={onOpenEditProfile} className="text-[#BA3822] font-mono-meta text-[11px] underline">
                    + Configurar artistas
                  </button>
                </div>
              )}
            </div>

            {/* Gêneros Favoritos */}
            <div className="border border-rule p-4 bg-[#FAF8F5] space-y-3">
              <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold">
                GÊNEROS DE MAIOR AFINIDADE
              </span>
              
              {favoriteGenresList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {favoriteGenresList.map((g) => (
                    <span key={g} className="editorial-badge editorial-badge-accent">{g}</span>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-xs font-reading-serif text-[#888075] space-y-1">
                  <p>Nenhum gênero selecionado ainda.</p>
                  <button onClick={onOpenEditProfile} className="text-[#BA3822] font-mono-meta text-[11px] underline">
                    + Adicionar gêneros
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      )}


      {/* ABA: MÚSICAS AVALIADAS (TODAS AS FAIXAS) */}
      {activeSubTab === 'tracks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-rule pb-2">
            <div>
              <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Todas as Músicas Avaliadas</h3>
              <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                Avaliações independentes atribuídas a faixas específicas.
              </p>
            </div>
            <span className="text-xs font-mono-meta text-[#888075]">{totalTracks} FAIXAS</span>
          </div>

          {totalTracks === 0 ? (
            <div className="p-10 border border-rule bg-[#FAF8F5] text-center space-y-3">
              <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                Nenhuma música avaliada ainda.
              </span>
              <p className="font-reading-serif text-xs text-[#58534C]">
                Pesquise faixas no catálogo para atribuir suas notas individuais.
              </p>
              <div className="pt-2">
                <button onClick={() => onNavigateTab && onNavigateTab('explore')} className="btn-editorial-primary text-xs py-2 px-6">
                  Explorar catálogo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {trackReviews.map((rev) => (
                <article key={rev.id} className="p-4 bg-[#FAF8F5] border border-rule flex flex-col sm:flex-row gap-4 items-start">
                  <img
                    src={rev.cover_url || 'https://via.placeholder.com/300'}
                    alt=""
                    className="w-16 h-16 object-cover border border-[#151413] shrink-0 cursor-pointer"
                    onClick={() => onSelectTrack && onSelectTrack({
                      track_id: rev.track_id,
                      track_name: rev.track_name,
                      artist_name: rev.artist_name,
                      album_id: rev.album_id,
                      album_title: rev.album_title,
                      cover_url: rev.cover_url
                    })}
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="editorial-badge editorial-badge-accent text-[9px] mr-2">MÚSICA</span>
                        <h4 className="font-editorial-serif text-lg font-bold text-[#151413] inline">
                          {rev.track_name || rev.title}
                        </h4>
                        <span className="text-xs text-[#58534C] font-normal block mt-0.5">
                          {rev.artist_name} {rev.album_title ? `· Álbum: ${rev.album_title}` : ''}
                        </span>
                      </div>
                      <span className="font-mono-meta text-sm font-bold text-[#BA3822] shrink-0 pl-2">
                        ★ {Number(rev.rating).toFixed(1)}
                      </span>
                    </div>
                    {rev.review_text && (
                      <p className="font-reading-serif text-sm text-[#38332C] leading-relaxed">
                        "{rev.review_text}"
                      </p>
                    )}
                    <div className="flex justify-between items-center text-xs font-mono-meta text-[#888075] pt-2 border-t border-rule">
                      <span>Ouvido em {rev.listened_date} ({rev.media_format || 'Streaming'})</span>
                      {onDeleteReview && (
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir esta avaliação da música?')) onDeleteReview(rev.id);
                          }}
                          className="text-[#9E2A1B] hover:underline"
                        >
                          Excluir avaliação
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ABA: ÁLBUNS AVALIADOS (TODOS OS DISCOS) */}
      {activeSubTab === 'albums' && (
        <div className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-rule pb-2">
            <div>
              <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Todos os Álbuns Avaliados</h3>
              <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                Avaliações atribuídas a obras discográficas completas.
              </p>
            </div>
            <span className="text-xs font-mono-meta text-[#888075]">{totalAlbums} ÁLBUNS</span>
          </div>

          {totalAlbums === 0 ? (
            <div className="p-10 border border-rule bg-[#FAF8F5] text-center space-y-3">
              <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                Nenhum álbum avaliado ainda.
              </span>
              <p className="font-reading-serif text-xs text-[#58534C]">
                Explore discografias e registre suas notas sobre álbuns completos.
              </p>
              <div className="pt-2">
                <button onClick={() => onNavigateTab && onNavigateTab('explore')} className="btn-editorial-primary text-xs py-2 px-6">
                  Explorar álbuns
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {albumReviews.map((rev) => (
                <article key={rev.id} className="p-4 bg-[#FAF8F5] border border-rule flex flex-col sm:flex-row gap-4 items-start">
                  <img
                    src={rev.cover_url || 'https://via.placeholder.com/600'}
                    alt=""
                    className="w-20 h-20 object-cover border border-[#151413] shrink-0 cursor-pointer"
                    onClick={() => onSelectAlbum && onSelectAlbum({
                      album_id: rev.album_id,
                      album_title: rev.album_title,
                      artist_name: rev.artist_name,
                      cover_url: rev.cover_url
                    })}
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="editorial-badge text-[9px] mr-2">ÁLBUM</span>
                        <h4 className="font-editorial-serif text-lg font-bold text-[#151413] inline">
                          {rev.album_title}
                        </h4>
                        <span className="text-xs text-[#58534C] font-normal block mt-0.5">
                          {rev.artist_name} {rev.release_year && `(${rev.release_year})`}
                        </span>
                      </div>
                      <span className="font-mono-meta text-sm font-bold text-[#BA3822] shrink-0 pl-2">
                        ★ {Number(rev.rating).toFixed(1)}
                      </span>
                    </div>
                    {rev.review_text && (
                      <p className="font-reading-serif text-sm text-[#38332C] leading-relaxed">
                        "{rev.review_text}"
                      </p>
                    )}
                    <div className="flex justify-between items-center text-xs font-mono-meta text-[#888075] pt-2 border-t border-rule">
                      <span>Ouvido em {rev.listened_date} ({rev.media_format || 'Vinil'})</span>
                      {onDeleteReview && (
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir esta avaliação do álbum?')) onDeleteReview(rev.id);
                          }}
                          className="text-[#9E2A1B] hover:underline"
                        >
                          Excluir avaliação
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ABA: RESENHAS ESCRITAS */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-rule pb-2">
            <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Todas as Resenhas Críticas</h3>
            <span className="text-xs font-mono-meta text-[#888075]">{totalWrittenReviews} TEXTOS</span>
          </div>

          {totalWrittenReviews === 0 ? (
            <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-3">
              <span className="font-editorial-serif text-base font-bold text-[#151413] block">
                Suas resenhas aparecerão aqui.
              </span>
              <p className="font-reading-serif text-xs text-[#58534C]">
                Explore o catálogo para escrever seus primeiros ensaios críticos sobre músicas e álbuns.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {textReviews.map((rev) => {
                const isTrack = rev.item_type === 'track';
                return (
                  <article key={rev.id} className="p-5 bg-[#FAF8F5] border border-rule space-y-3">
                    <div className="flex gap-4 items-center">
                      <img
                        src={rev.cover_url || 'https://via.placeholder.com/600'}
                        alt=""
                        className="w-14 h-14 object-cover border border-[#151413] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`editorial-badge ${isTrack ? 'editorial-badge-accent' : ''}`}>
                            {isTrack ? 'MÚSICA' : 'ÁLBUM'}
                          </span>
                          <span className="text-sm font-mono-meta font-bold text-[#BA3822]">
                            ★ {Number(rev.rating).toFixed(1)}
                          </span>
                        </div>
                        <h4 className="font-editorial-serif text-lg font-bold text-[#151413] truncate">
                          {isTrack ? rev.track_name : rev.album_title}
                        </h4>
                        <p className="font-mono-meta text-xs text-[#58534C] truncate">
                          {rev.artist_name} {isTrack && rev.album_title ? `· ${rev.album_title}` : ''}
                        </p>
                      </div>
                    </div>

                    <p className="font-reading-serif text-sm text-[#38332C] leading-relaxed whitespace-pre-wrap">
                      "{rev.review_text}"
                    </p>

                    <div className="flex justify-between items-center text-xs font-mono-meta text-[#888075] pt-2 border-t border-rule">
                      <span>Registrado em {new Date(rev.created_at || Date.now()).toLocaleDateString('pt-BR')} ({rev.media_format || 'Streaming'})</span>
                      {onDeleteReview && (
                        <button
                          onClick={() => {
                            if (confirm('Deseja apagar esta resenha?')) onDeleteReview(rev.id);
                          }}
                          className="text-[#9E2A1B] hover:underline"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* ABA: DIÁRIO DE ESCUTA */}
      {activeSubTab === 'diary' && (
        <div className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-rule pb-2">
            <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Diário Cronológico</h3>
            <span className="text-xs font-mono-meta text-[#888075]">{totalDiary} AUDIÇÕES</span>
          </div>

          {totalDiary === 0 ? (
            <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-3">
              <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                Seu diário está vazio.
              </span>
              <p className="font-reading-serif text-xs text-[#58534C] max-w-md mx-auto leading-relaxed">
                Registre as músicas e álbuns que você ouviu para acompanhar sua trajetória musical ao longo do tempo.
              </p>
            </div>
          ) : (
            <div className="font-mono-meta text-xs divide-y divide-rule border-b border-rule bg-[#FAF8F5] border border-rule">
              {userReviews.map((entry) => {
                const isTrack = entry.item_type === 'track';
                return (
                  <div key={entry.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[#888075] w-20">{entry.listened_date || 'Hoje'}</span>
                      <span className={`editorial-badge ${isTrack ? 'editorial-badge-accent' : ''}`}>
                        {isTrack ? 'MÚSICA' : 'ÁLBUM'}
                      </span>
                      <span className="font-bold text-[#151413]">{isTrack ? entry.track_name : entry.album_title}</span>
                      <span className="text-[#58534C]">· {entry.artist_name}</span>
                    </div>
                    <div className="flex items-center gap-3 pl-20 sm:pl-0">
                      <span className="editorial-badge">{entry.media_format || 'Vinil'}</span>
                      <span className="text-[#BA3822] font-bold">★ {Number(entry.rating).toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* ABA: LISTAS */}
      {activeSubTab === 'lists' && (
        <div className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-rule pb-2">
            <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">Listas Catalogadas</h3>
            <button
              onClick={onOpenCreateList}
              className="text-xs font-mono-meta text-[#BA3822] font-semibold hover:underline"
            >
              + Criar nova lista
            </button>
          </div>

          {totalLists === 0 ? (
            <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-3">
              <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                Você ainda não criou nenhuma lista.
              </span>
              <p className="font-reading-serif text-xs text-[#58534C] max-w-md mx-auto leading-relaxed">
                Crie coleções temáticas de álbuns e seleções conceituais para compartilhar.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenCreateList}
                  className="btn-editorial-primary text-xs py-2 px-6"
                >
                  Criar lista
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userLists.map((list) => (
                <div key={list.id} className="p-4 bg-[#FAF8F5] border border-rule space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-editorial-serif text-base font-bold text-[#151413]">{list.title}</h4>
                    <span className="text-[10px] font-mono-meta text-[#888075]">{(list.items || []).length} DISCOS</span>
                  </div>
                  {list.description && (
                    <p className="font-reading-serif text-xs text-[#58534C] line-clamp-2">{list.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: SEGUINDO (OUVINTES QUE VOCÊ ACOMPANHA) */}
      {activeSubTab === 'following' && (
        <div className="space-y-6">
          <div className="flex justify-between items-baseline border-b border-rule pb-2">
            <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">
              Ouvintes que Você Acompanha
            </h3>
            <span className="text-xs font-mono-meta text-[#888075]">
              {totalFollowing} CONEXÕE{totalFollowing === 1 ? 'S' : 'ES'}
            </span>
          </div>

          {totalFollowing === 0 ? (
            <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-3">
              <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                Você ainda não segue nenhum ouvinte.
              </span>
              <p className="font-reading-serif text-xs text-[#58534C] max-w-md mx-auto leading-relaxed">
                Use a barra de busca ou a aba Explorar para descobrir outros ouvintes, críticos e pesquisadores musicais.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab && onNavigateTab('explore')}
                  className="btn-editorial-primary text-xs py-2 px-6"
                >
                  Explorar ouvintes
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {communityUsers
                .filter((u) => followingIds.includes(u.id))
                .map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-[#FAF8F5] border border-rule flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        onClick={() => onSelectUser && onSelectUser(user)}
                        className="w-12 h-12 bg-[#151413] text-[#FAF8F5] flex items-center justify-center font-editorial-serif text-lg font-bold border border-[#151413] shrink-0 overflow-hidden cursor-pointer"
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{(user.full_name || user.username || 'OU').substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4
                          onClick={() => onSelectUser && onSelectUser(user)}
                          className="font-editorial-serif text-base font-bold text-[#151413] hover:text-[#BA3822] hover:underline truncate cursor-pointer"
                        >
                          {user.full_name || user.username}
                        </h4>
                        <span className="text-xs font-mono-meta text-[#BA3822] block truncate">
                          @{user.username} {user.location ? `· ${user.location}` : ''}
                        </span>
                        {user.bio && (
                          <p className="font-reading-serif text-xs text-[#58534C] line-clamp-1 mt-1">
                            "{user.bio}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-rule font-mono-meta text-xs">
                      <span className="text-[11px] text-[#888075]">
                        {user.reviews_count || 0} avaliações
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectUser && onSelectUser(user)}
                          className="btn-editorial-secondary text-[11px] py-1 px-2.5"
                        >
                          Ver perfil →
                        </button>
                        <button
                          onClick={() => onToggleFollow && onToggleFollow(user.id)}
                          className="text-[#9E2A1B] hover:underline text-[11px]"
                        >
                          Deixar de seguir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

