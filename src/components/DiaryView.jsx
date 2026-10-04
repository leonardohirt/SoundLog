import React, { useState } from 'react';

export function DiaryView({
  reviews = [],
  onSelectAlbum,
  onSelectTrack,
  onOpenReviewModal,
  onNavigateExplore
}) {
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'track' | 'album'
  const [formatFilter, setFormatFilter] = useState('ALL');

  const diaryEntries = (reviews || []).filter((r) => r.listened_date);

  const filteredByType = typeFilter === 'ALL'
    ? diaryEntries
    : diaryEntries.filter((e) => {
        const itemType = e.item_type || (e.track_id ? 'track' : 'album');
        return itemType === typeFilter;
      });

  const filteredEntries = formatFilter === 'ALL'
    ? filteredByType
    : filteredByType.filter((e) => (e.media_format || 'Vinil').toUpperCase() === formatFilter.toUpperCase());

  return (
    <div className="space-y-8">
      
      {/* HEADER DIÁRIO */}
      <div className="border-b-2 border-[#151413] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-3">
        <div>
          <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold">
            HISTÓRICO PESSOAL DE ESCUTA
          </span>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#151413] mt-0.5">
            Diário Musical
          </h1>
          <p className="font-reading-serif text-sm text-[#58534C] mt-1">
            Registro cronológico das audições de músicas e álbuns completos com formatos e datas.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-meta text-xs">
          <button
            onClick={() => onNavigateExplore && onNavigateExplore()}
            className="btn-editorial-primary text-xs py-2 px-4"
          >
            + Registrar nova escuta
          </button>
        </div>
      </div>

      {/* FILTROS DUPLOS: TIPO & FORMATO */}
      {diaryEntries.length > 0 && (
        <div className="space-y-3 p-3 bg-[#FAF8F5] border border-rule font-mono-meta text-xs">
          {/* Filtro por Tipo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#888075] w-20">TIPO:</span>
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`editorial-badge ${typeFilter === 'ALL' ? 'editorial-badge-accent font-bold' : 'text-[#58534C] hover:text-[#151413]'}`}
            >
              TODOS OS REGISTROS ({diaryEntries.length})
            </button>
            <button
              onClick={() => setTypeFilter('track')}
              className={`editorial-badge ${typeFilter === 'track' ? 'editorial-badge-accent font-bold' : 'text-[#58534C] hover:text-[#151413]'}`}
            >
              MÚSICAS ({diaryEntries.filter(e => e.item_type === 'track').length})
            </button>
            <button
              onClick={() => setTypeFilter('album')}
              className={`editorial-badge ${typeFilter === 'album' ? 'editorial-badge-accent font-bold' : 'text-[#58534C] hover:text-[#151413]'}`}
            >
              ÁLBUNS ({diaryEntries.filter(e => e.item_type === 'album' || !e.item_type).length})
            </button>
          </div>

          {/* Filtro por Formato de Mídia */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rule">
            <span className="text-[#888075] w-20">FORMATO:</span>
            {['ALL', 'Vinil', 'Streaming', 'CD', 'Cassete', 'Ao Vivo'].map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={`editorial-badge ${formatFilter === f ? 'editorial-badge-accent font-bold' : 'text-[#58534C] hover:text-[#151413]'}`}
              >
                {f === 'ALL' ? 'TODOS' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LISTA DO DIÁRIO OU ESTADO VAZIO */}
      {diaryEntries.length === 0 ? (
        <div className="p-10 border border-rule bg-[#FAF8F5] text-center space-y-3">
          <h2 className="font-editorial-serif text-xl font-bold text-[#151413]">
            Seu diário está vazio.
          </h2>
          <p className="font-reading-serif text-xs text-[#58534C] max-w-md mx-auto leading-relaxed">
            Registre as músicas e álbuns que você ouviu para acompanhar sua trajetória musical ao longo das semanas.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateExplore && onNavigateExplore()}
              className="btn-editorial-primary text-xs py-2 px-6"
            >
              Adicionar ao diário
            </button>
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-2">
          <p className="font-reading-serif text-sm text-[#58534C]">
            Nenhum registro encontrado para os filtros selecionados.
          </p>
          <button
            onClick={() => {
              setTypeFilter('ALL');
              setFormatFilter('ALL');
            }}
            className="text-xs font-mono-meta text-[#BA3822] underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="border border-rule bg-[#FAF8F5] divide-y divide-rule font-mono-meta text-xs">
          {filteredEntries.map((entry) => {
            const isTrack = entry.item_type === 'track';
            return (
              <div
                key={entry.id}
                onClick={() => {
                  if (isTrack && onSelectTrack) {
                    onSelectTrack({
                      track_id: entry.track_id,
                      track_name: entry.track_name,
                      artist_name: entry.artist_name,
                      album_id: entry.album_id,
                      album_title: entry.album_title,
                      cover_url: entry.cover_url,
                      duration_formatted: entry.duration_formatted,
                      release_year: entry.release_year
                    });
                  } else if (onSelectAlbum) {
                    onSelectAlbum({
                      album_id: entry.album_id,
                      album_title: entry.album_title,
                      artist_name: entry.artist_name,
                      cover_url: entry.cover_url,
                      release_year: entry.release_year
                    });
                  }
                }}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#EFEAE1] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={entry.cover_url || 'https://via.placeholder.com/300'}
                    alt=""
                    className="w-12 h-12 object-cover border border-[#151413] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`editorial-badge text-[9px] ${isTrack ? 'editorial-badge-accent' : ''}`}>
                        {isTrack ? 'MÚSICA' : 'ÁLBUM'}
                      </span>
                      <span className="font-editorial-serif text-base font-bold text-[#151413] truncate">
                        {isTrack ? entry.track_name : entry.album_title}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#58534C] truncate">
                      {entry.artist_name} {isTrack && entry.album_title ? `· Álbum: ${entry.album_title}` : (entry.release_year ? `(${entry.release_year})` : '')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-right shrink-0">
                  <span className="editorial-badge">{entry.media_format || 'Vinil'}</span>
                  <span className="text-[#BA3822] font-bold text-sm">★ {Number(entry.rating).toFixed(1)}</span>
                  <span className="text-[#888075] text-[11px]">{entry.listened_date ? new Date(entry.listened_date).toLocaleDateString('pt-BR') : 'Hoje'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

