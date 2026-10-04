import React from 'react';

export function ListsView({ lists = [], onOpenCreateList, onSelectAlbum, onDeleteList }) {
  return (
    <div className="space-y-8">
      
      {/* HEADER LISTAS */}
      <div className="border-b-2 border-[#151413] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-3">
        <div>
          <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold">
            CURADORIA & SELEÇÕES
          </span>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#151413] mt-0.5">
            Listas Temáticas
          </h1>
          <p className="font-reading-serif text-sm text-[#58534C] mt-1">
            Coleções de álbuns organizadas por conceito, época, movimento ou intenção estética.
          </p>
        </div>

        <button
          onClick={onOpenCreateList}
          className="btn-editorial-primary text-xs py-2 px-4 font-mono-meta"
        >
          + Criar nova lista
        </button>
      </div>

      {/* CONTEÚDO DE LISTAS OU ESTADO VAZIO */}
      {lists.length === 0 ? (
        <div className="p-10 border border-rule bg-[#FAF8F5] text-center space-y-3">
          <h2 className="font-editorial-serif text-xl font-bold text-[#151413]">
            Você ainda não criou nenhuma lista.
          </h2>
          <p className="font-reading-serif text-xs text-[#58534C] max-w-md mx-auto leading-relaxed">
            Monte seleções com seus discos favoritos, guias de discografias para iniciantes ou trilhas sonoras conceituais.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenCreateList}
              className="btn-editorial-primary text-xs py-2 px-6 font-mono-meta"
            >
              Criar lista
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lists.map((list) => (
            <div key={list.id} className="p-5 bg-[#FAF8F5] border border-[#151413] shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="editorial-badge">LISTA CURADA</span>
                  <h3 className="font-editorial-serif text-xl font-bold text-[#151413] mt-1">
                    {list.title}
                  </h3>
                </div>
                {onDeleteList && (
                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir a lista "${list.title}"?`)) onDeleteList(list.id);
                    }}
                    className="text-xs font-mono-meta text-[#9E2A1B] hover:underline"
                  >
                    Excluir
                  </button>
                )}
              </div>

              {list.description && (
                <p className="font-reading-serif text-xs text-[#58534C] leading-relaxed">
                  {list.description}
                </p>
              )}

              {/* Itens da lista */}
              <div className="pt-2 border-t border-rule space-y-2">
                <div className="text-[10px] font-mono-meta text-[#888075] uppercase">
                  {(list.items || []).length} DISCOS INCLUÍDOS
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(list.items || []).map((item, idx) => (
                    <img
                      key={idx}
                      src={item.cover_url}
                      alt={item.album_title}
                      title={`${item.album_title} - ${item.artist_name}`}
                      className="w-14 h-14 object-cover border border-[#151413] shrink-0"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
