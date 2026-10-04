import React, { useState } from 'react';
import { searchAlbums } from '../services/musicApi';
import { generateUUID } from '../services/supabase';

export function CreateListModal({ onClose, onSaveList }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listItems, setListItems] = useState([]);

  // Busca de álbuns para inclusão
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchAlbums = async (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const res = await searchAlbums(term);
    setSearchResults(res);
    setIsSearching(false);
  };

  const handleAddAlbum = (album) => {
    if (!listItems.some(i => String(i.album_id) === String(album.album_id))) {
      setListItems(prev => [...prev, album]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveAlbum = (albumId) => {
    setListItems(prev => prev.filter(i => String(i.album_id) !== String(albumId)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newList = {
      id: generateUUID(),
      title: title.trim(),
      description: description.trim(),
      created_at: new Date().toISOString(),
      items: listItems.map(item => ({
        album_id: item.album_id,
        album_title: item.album_title,
        artist_name: item.artist_name,
        cover_url: item.cover_url
      }))
    };

    onSaveList(newList);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="soundlog-paper paper-texture border border-[#151413] shadow-2xl w-full max-w-2xl my-auto p-6 sm:p-8 space-y-6">
        
        {/* MASTHEAD HEADER */}
        <div className="border-b-2 border-[#151413] pb-3 flex justify-between items-baseline">
          <div>
            <span className="font-editorial-serif text-2xl font-black text-[#151413]">Soundlog</span>
            <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold block">
              CURADORIA MUSICAL
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono-meta text-[#58534C] hover:text-[#151413] border border-[#151413] px-2 py-1 bg-[#FAF8F5]"
          >
            ✕ FECHAR
          </button>
        </div>

        <div>
          <h2 className="font-editorial-serif text-2xl font-bold text-[#151413]">
            Criar Nova Lista Temática
          </h2>
          <p className="font-reading-serif text-xs text-[#58534C] mt-1">
            Organize seleções conceituais de discos, fases discográficas ou recomendações essenciais.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            
            {/* Título */}
            <div className="space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Título da Lista</label>
              <input
                type="text"
                required
                placeholder="ex: Melhores discos brasileiros dos anos 2000"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field-editorial"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Descrição / Texto Curatorial</label>
              <textarea
                rows="3"
                placeholder="Explique o conceito estético por trás desta seleção..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field-editorial font-reading-serif resize-none text-xs"
              />
            </div>

            {/* Adicionar Álbuns à Lista */}
            <div className="space-y-2 pt-2 border-t border-rule">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">
                Pesquisar Álbuns para Incluir ({listItems.length} selecionados)
              </label>
              <input
                type="text"
                placeholder="Digite o nome de um álbum para adicionar..."
                value={searchTerm}
                onChange={(e) => handleSearchAlbums(e.target.value)}
                className="field-editorial text-xs"
              />

              {/* Resultados da busca rápida de inclusão */}
              {searchResults.length > 0 && (
                <div className="bg-[#FAF8F5] border border-[#151413] max-h-48 overflow-y-auto divide-y divide-rule font-mono-meta text-xs">
                  {searchResults.slice(0, 6).map((alb) => (
                    <div
                      key={alb.album_id}
                      onClick={() => handleAddAlbum(alb)}
                      className="p-2 flex items-center justify-between hover:bg-[#EFEAE1] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img src={alb.cover_url} alt="" className="w-8 h-8 object-cover border border-[#151413]" />
                        <span className="font-bold truncate">{alb.album_title} · {alb.artist_name}</span>
                      </div>
                      <span className="text-[#BA3822] font-bold text-xs pl-2">+ Adicionar</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Álbuns já inclusos na lista */}
            {listItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono-meta text-[#888075] uppercase block">
                  Discos na Lista:
                </span>
                <div className="flex flex-wrap gap-2">
                  {listItems.map((item) => (
                    <div
                      key={item.album_id}
                      className="flex items-center gap-2 p-1.5 bg-[#EFEAE1] border border-rule font-mono-meta text-xs"
                    >
                      <img src={item.cover_url} alt="" className="w-6 h-6 object-cover" />
                      <span className="truncate max-w-[140px] font-bold text-[#151413]">{item.album_title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlbum(item.album_id)}
                        className="text-[#9E2A1B] hover:text-black font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* AÇÕES */}
          <div className="pt-4 border-t border-[#151413] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-editorial-secondary text-xs py-2 px-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-editorial-primary text-xs py-2 px-6"
            >
              Salvar lista
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
