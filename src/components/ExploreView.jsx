import React from 'react';

export function ExploreView({
  trendingAlbums = [],
  personalizedData = null,
  communityUsers = [],
  followingIds = [],
  onSelectAlbum,
  onSelectTrack,
  onSelectUser,
  onToggleFollow,
  onRateAlbum,
  onRateTrack,
  searchTerm,
  searchResults,
  isSearching,
  searchFilter,
  setSearchFilter,
  onPlayTrack,
  currentTrack,
  onSearchTag
}) {
  const hasSearchResults = searchTerm.trim().length > 0;

  const isPersonalized = personalizedData?.isPersonalized;
  const recommendedAlbums = personalizedData?.albums?.length > 0 ? personalizedData.albums : trendingAlbums;
  const recommendedTracks = personalizedData?.tracks || [];
  const topGenres = personalizedData?.topGenres || [];
  const topArtists = personalizedData?.topArtists || [];

  return (
    <div className="space-y-8">
      
      {/* HEADER DA SEÇÃO EXPLORAR */}
      <div className="border-b-2 border-[#151413] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
        <div>
          <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold">
            {hasSearchResults
              ? 'RESULTADOS DE BUSCA'
              : isPersonalized
              ? 'DESCOBERTA PERSONALIZADA'
              : 'ACERVO & DESCOBERTA MUSICAL'}
          </span>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#151413] mt-0.5">
            {hasSearchResults
              ? `Resultados para "${searchTerm}"`
              : isPersonalized
              ? 'Catálogo Sugerido para Você'
              : 'Explorar Discografias, Faixas & Ouvintes'}
          </h1>
          {!hasSearchResults && (
            <p className="font-reading-serif text-xs text-[#58534C] mt-1">
              {isPersonalized
                ? 'Recomendações inéditas calibradas pelas suas notas e artistas mais ouvidos. Encontre também outros ouvintes para acompanhar.'
                : 'Explore obras discográficas completas, canções avulsas e perfis de outros ouvintes da comunidade.'}
            </p>
          )}
        </div>

        {hasSearchResults && (
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 border border-[#151413] font-mono-meta text-xs">
            <button
              onClick={() => setSearchFilter('all')}
              className={`px-2 py-1 ${searchFilter === 'all' ? 'bg-[#151413] text-white font-bold' : 'text-[#58534C]'}`}
            >
              Tudo
            </button>
            <button
              onClick={() => setSearchFilter('albums')}
              className={`px-2 py-1 ${searchFilter === 'albums' ? 'bg-[#151413] text-white font-bold' : 'text-[#58534C]'}`}
            >
              Álbuns
            </button>
            <button
              onClick={() => setSearchFilter('tracks')}
              className={`px-2 py-1 ${searchFilter === 'tracks' ? 'bg-[#151413] text-white font-bold' : 'text-[#58534C]'}`}
            >
              Faixas
            </button>
            <button
              onClick={() => setSearchFilter('users')}
              className={`px-2 py-1 ${searchFilter === 'users' ? 'bg-[#151413] text-white font-bold' : 'text-[#58534C]'}`}
            >
              Ouvintes
            </button>
          </div>
        )}
      </div>

      {/* TAGS DE GÊNEROS E ARTISTAS DE MAIOR AFINIDADE (QUANDO NÃO BUSCANDO) */}
      {!hasSearchResults && (topGenres.length > 0 || topArtists.length > 0) && (
        <div className="p-3.5 bg-[#FAF8F5] border border-rule space-y-2 font-mono-meta text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#888075] text-[10px] uppercase font-bold tracking-wider">
              {isPersonalized ? 'SUA AFINIDADE MUSICAL:' : 'GÊNEROS EM DESTAQUE:'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((g) => (
              <button
                key={g}
                onClick={() => onSearchTag && onSearchTag(g)}
                className="editorial-badge editorial-badge-accent hover:bg-[#151413] hover:text-white transition-colors cursor-pointer"
              >
                #{g}
              </button>
            ))}
            {topArtists.slice(0, 4).map((a) => (
              <button
                key={a}
                onClick={() => onSearchTag && onSearchTag(a)}
                className="editorial-badge hover:bg-[#151413] hover:text-white transition-colors cursor-pointer"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESULTADOS DA BUSCA (SE HOUVER) */}
      {hasSearchResults ? (
        <div className="space-y-6">
          {isSearching ? (
            <div className="p-12 text-center font-mono-meta text-xs text-[#888075]">
              Consultando catálogo e perfis de ouvintes...
            </div>
          ) : (
            <>
              {/* Se busca não encontrou nada */}
              {(!searchResults.albums || searchResults.albums.length === 0) &&
               (!searchResults.tracks || searchResults.tracks.length === 0) &&
               (!searchResults.users || searchResults.users.length === 0) ? (
                <div className="p-12 border border-rule bg-[#FAF8F5] text-center space-y-2">
                  <span className="font-editorial-serif text-lg font-bold text-[#151413] block">
                    Nenhum resultado encontrado.
                  </span>
                  <p className="font-reading-serif text-xs text-[#58534C]">
                    Verifique a ortografia do nome do artista, álbum, música ou nome de usuário.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* SEÇÃO 1: USUÁRIOS / OUVINTES ENCONTRADOS */}
                  {(searchFilter === 'all' || searchFilter === 'users') && searchResults.users?.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                        <h3 className="font-editorial-serif text-xl font-bold text-[#151413]">
                          Ouvintes & Perfis da Comunidade
                        </h3>
                        <span className="editorial-badge editorial-badge-accent">
                          {searchResults.users.length} ENCONTRADO{searchResults.users.length > 1 ? 'S' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.users.map((user) => {
                          const isFollowing = followingIds.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              className="p-4 bg-[#FAF8F5] border border-rule flex flex-col justify-between gap-4 hover:border-[#151413] transition-colors"
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
                                  <div className="flex items-center gap-2">
                                    <h4
                                      onClick={() => onSelectUser && onSelectUser(user)}
                                      className="font-editorial-serif text-base font-bold text-[#151413] hover:text-[#BA3822] hover:underline truncate cursor-pointer"
                                    >
                                      {user.full_name || user.username}
                                    </h4>
                                    <span className="editorial-badge text-[9px]">OUVINTE</span>
                                  </div>
                                  
                                  <span className="text-xs font-mono-meta text-[#BA3822] block truncate">
                                    @{user.username} {user.location ? `· ${user.location}` : ''}
                                  </span>

                                  {user.bio && (
                                    <p className="font-reading-serif text-xs text-[#58534C] line-clamp-2 mt-1">
                                      "{user.bio}"
                                    </p>
                                  )}

                                  {user.favorite_artist && (
                                    <div className="font-mono-meta text-[10px] text-[#888075] mt-1 truncate">
                                      ★ Afinidade: {user.favorite_artist}
                                    </div>
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
                                    className={`text-[11px] py-1 px-3 font-mono-meta uppercase tracking-wider font-bold transition-all ${
                                      isFollowing
                                        ? 'bg-[#EFEAE1] border border-[#151413] text-[#151413] hover:bg-[#FAF8F5]'
                                        : 'btn-editorial-primary'
                                    }`}
                                  >
                                    {isFollowing ? '✓ Seguindo' : '+ Seguir'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SEÇÃO 2: ÁLBUNS ENCONTRADOS */}
                  {(searchFilter === 'all' || searchFilter === 'albums') && searchResults.albums?.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                        <h3 className="font-editorial-serif text-xl font-bold text-[#151413]">Álbuns Encontrados</h3>
                        <span className="editorial-badge">DISCOGRAFIAS COMPLETAS</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {searchResults.albums.map((alb) => (
                          <div
                            key={alb.album_id}
                            onClick={() => onSelectAlbum(alb)}
                            className="space-y-2 cursor-pointer group"
                          >
                            <img
                              src={alb.cover_url || 'https://via.placeholder.com/600'}
                              alt=""
                              className="aspect-square w-full object-cover border border-[#151413] shadow-sm group-hover:contrast-105 transition-all"
                            />
                            <div>
                              <h4 className="font-editorial-serif text-sm font-bold text-[#151413] truncate leading-tight group-hover:text-[#BA3822]">
                                {alb.album_title}
                              </h4>
                              <p className="font-mono-meta text-[11px] text-[#58534C] truncate">
                                {alb.artist_name} {alb.release_year && `(${alb.release_year})`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEÇÃO 3: FAIXAS INDIVIDUAIS ENCONTRADAS */}
                  {(searchFilter === 'all' || searchFilter === 'tracks') && searchResults.tracks?.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                        <h3 className="font-editorial-serif text-xl font-bold text-[#151413]">Faixas Individuais</h3>
                        <span className="editorial-badge editorial-badge-accent">MÚSICAS ESPECÍFICAS</span>
                      </div>
                      <div className="font-mono-meta text-xs divide-y divide-rule border-b border-rule bg-[#FAF8F5] border border-rule">
                        {searchResults.tracks.slice(0, 15).map((tr) => (
                          <div
                            key={tr.track_id}
                            className="py-3 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#EFEAE1] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {tr.preview_url ? (
                                <button
                                  onClick={() => onPlayTrack(tr)}
                                  className="w-6 h-6 bg-[#151413] text-white flex items-center justify-center text-[10px] shrink-0 hover:bg-[#BA3822] transition-colors"
                                  title="Tocar prévia"
                                >
                                  {currentTrack?.track_id === tr.track_id ? '❚❚' : '▶'}
                                </button>
                              ) : (
                                <div className="w-6 h-6 bg-transparent shrink-0" />
                              )}

                              <div className="min-w-0">
                                <button
                                  onClick={() => onSelectTrack && onSelectTrack(tr)}
                                  className="font-bold text-[#151413] hover:text-[#BA3822] hover:underline text-left truncate block text-sm font-editorial-serif"
                                >
                                  {tr.track_name}
                                </button>
                                <span className="text-[#58534C] block text-[11px] truncate">
                                  {tr.artist_name} {tr.album_title ? `· Álbum: ${tr.album_title}` : ''}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0 pl-9 sm:pl-0">
                              <button
                                onClick={() => onSelectTrack && onSelectTrack(tr)}
                                className="btn-editorial-secondary text-[11px] py-1 px-2.5"
                              >
                                Ver música →
                              </button>
                              <button
                                onClick={() => onRateTrack && onRateTrack(tr)}
                                className="btn-editorial-primary text-[11px] py-1 px-2.5"
                              >
                                ★ Avaliar música
                              </button>
                              {tr.album_id && (
                                <button
                                  onClick={() => onSelectAlbum({ album_id: tr.album_id, album_title: tr.album_title, artist_name: tr.artist_name, cover_url: tr.cover_url })}
                                  className="text-[#58534C] hover:text-[#BA3822] hover:underline text-[11px] hidden md:inline"
                                >
                                  Ver disco
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (

        /* =================================================================== */
        /* CATÁLOGO DE EXPLORAÇÃO PERSONALIZADO */
        /* =================================================================== */
        <div className="space-y-12">
          
          {/* SEÇÃO 1: ÁLBUNS RECOMENDADOS INÉDITOS */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-rule pb-2">
              <div>
                <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">
                  {isPersonalized ? 'Álbuns Recomendados para Você' : 'Prensagens e Clássicos em Evidência'}
                </h3>
                <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                  {isPersonalized
                    ? 'Discos inéditos sugeridos de acordo com suas maiores notas'
                    : 'Seleção editorial de obras canônicas fundamentais'}
                </p>
              </div>
              <span className="editorial-badge">
                {isPersonalized ? 'INÉDITOS PARA O SEU PERFIL' : 'SELEÇÃO DA REDAÇÃO'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {recommendedAlbums.slice(0, 12).map((alb) => (
                <div
                  key={alb.album_id}
                  onClick={() => onSelectAlbum(alb)}
                  className="space-y-2 cursor-pointer group"
                >
                  <div className="relative aspect-square w-full overflow-hidden border border-[#151413] shadow-sm">
                    <img
                      src={alb.cover_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                  </div>
                  <div>
                    <h4 className="font-editorial-serif text-sm font-bold text-[#151413] truncate leading-tight group-hover:text-[#BA3822]">
                      {alb.album_title}
                    </h4>
                    <p className="font-mono-meta text-xs text-[#58534C] truncate">
                      {alb.artist_name}
                    </p>
                    <span className="text-[10px] font-mono-meta text-[#888075] block mt-0.5">
                      {alb.release_year} · {alb.genre || 'Música'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SEÇÃO 2: MÚSICAS SUGERIDAS PARA DESCOBERTA (COM PRÉVIA 30S) */}
          {recommendedTracks.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">
                    Faixas Sugeridas para Descoberta
                  </h3>
                  <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                    Músicas individuais de artistas e vertentes que combinam com seu diário.
                  </p>
                </div>
                <span className="editorial-badge editorial-badge-accent">PRÉVIA DE ÁUDIO</span>
              </div>

              <div className="font-mono-meta text-xs divide-y divide-rule border-b border-rule bg-[#FAF8F5] border border-rule">
                {recommendedTracks.slice(0, 8).map((tr) => (
                  <div
                    key={tr.track_id}
                    className="py-3 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#EFEAE1] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {tr.preview_url ? (
                        <button
                          onClick={() => onPlayTrack(tr)}
                          className="w-7 h-7 bg-[#151413] text-white flex items-center justify-center text-[10px] shrink-0 hover:bg-[#BA3822] transition-colors"
                          title="Tocar prévia"
                        >
                          {currentTrack?.track_id === tr.track_id ? '❚❚' : '▶'}
                        </button>
                      ) : (
                        <div className="w-7 h-7 bg-transparent shrink-0" />
                      )}

                      <img
                        src={tr.cover_url || 'https://via.placeholder.com/100'}
                        alt=""
                        className="w-9 h-9 object-cover border border-[#151413] shrink-0"
                      />

                      <div className="min-w-0">
                        <button
                          onClick={() => onSelectTrack && onSelectTrack(tr)}
                          className="font-bold text-[#151413] hover:text-[#BA3822] hover:underline text-left truncate block text-sm font-editorial-serif"
                        >
                          {tr.track_name}
                        </button>
                        <span className="text-[#58534C] block text-[11px] truncate">
                          {tr.artist_name} {tr.album_title ? `· Álbum: ${tr.album_title}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-10 sm:pl-0">
                      <button
                        onClick={() => onSelectTrack && onSelectTrack(tr)}
                        className="btn-editorial-secondary text-[11px] py-1 px-2.5"
                      >
                        Ver música →
                      </button>
                      <button
                        onClick={() => onRateTrack && onRateTrack(tr)}
                        className="btn-editorial-primary text-[11px] py-1 px-2.5"
                      >
                        ★ Avaliar faixa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SEÇÃO 3: COMUNIDADE DE OUVINTES & CRÍTICOS (PARA SEGUIR) */}
          {communityUsers?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">
                    Ouvintes & Críticos da Comunidade
                  </h3>
                  <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                    Conecte-se com outros ouvintes ativos para acompanhar notas e resenhas
                  </p>
                </div>
                <span className="editorial-badge">COMUNIDADE SOUNDLOG</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {communityUsers.slice(0, 6).map((u) => {
                  const isFollowing = followingIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className="p-4 bg-[#FAF8F5] border border-rule flex flex-col justify-between gap-3 hover:border-[#151413] transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          onClick={() => onSelectUser && onSelectUser(u)}
                          className="w-11 h-11 bg-[#151413] text-[#FAF8F5] flex items-center justify-center font-editorial-serif text-base font-bold border border-[#151413] shrink-0 overflow-hidden cursor-pointer"
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{(u.full_name || u.username || 'OU').substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => onSelectUser && onSelectUser(u)}
                            className="font-editorial-serif text-sm font-bold text-[#151413] hover:text-[#BA3822] hover:underline truncate cursor-pointer"
                          >
                            {u.full_name || u.username}
                          </h4>
                          <span className="text-[11px] font-mono-meta text-[#BA3822] block truncate">
                            @{u.username}
                          </span>
                          {u.bio && (
                            <p className="font-reading-serif text-xs text-[#58534C] line-clamp-1 mt-0.5">
                              "{u.bio}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-rule font-mono-meta text-xs">
                        <span className="text-[10px] text-[#888075]">
                          {u.reviews_count || 0} avaliações
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectUser && onSelectUser(u)}
                            className="text-[#58534C] hover:text-[#BA3822] text-[11px]"
                          >
                            Ver →
                          </button>
                          <button
                            onClick={() => onToggleFollow && onToggleFollow(u.id)}
                            className={`text-[10px] py-1 px-2.5 font-mono-meta uppercase tracking-wider font-bold transition-all ${
                              isFollowing
                                ? 'bg-[#EFEAE1] border border-[#151413] text-[#151413] hover:bg-[#FAF8F5]'
                                : 'btn-editorial-primary'
                            }`}
                          >
                            {isFollowing ? '✓ Seguindo' : '+ Seguir'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      )}

    </div>
  );
}

