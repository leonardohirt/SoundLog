import React, { useState } from 'react';
import logoImg from '../assets/logo.jpg';

export function Header({
  activeTab,
  onSelectTab,
  profile,
  onOpenEditProfile,
  onLogout,
  onSearch,
  searchTerm
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="border-b-2 border-[#151413] pb-4 mb-8">
      
      {/* Linha Superior: Logo + Busca + Perfil */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-rule mb-3">
        
        <div>
          <div className="text-[10px] font-mono-meta text-[#888075] uppercase tracking-widest mb-1">
            CADERNO CRÍTICO & ARQUIVO SONORO
          </div>
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 text-left group transition-transform duration-150 active:scale-98"
          >
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-10 sm:h-12 w-auto object-contain rounded-none mix-blend-multiply"
            />
          </button>
        </div>


        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          
          {/* Barra de Busca Discreta */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar músicas, álbuns, artistas ou ouvintes..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="bg-[#FAF8F5] border border-[#151413] text-[#151413] placeholder-[#888075] text-xs font-mono-meta px-3 py-2 w-64 focus:outline-none focus:border-[#BA3822]"
            />
          </div>

          {/* Menu de Perfil do Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 border border-[#151413] bg-[#FAF8F5] hover:bg-[#EFEAE1] px-2.5 py-1.5 transition-colors font-mono-meta text-xs"
            >
              <span className="w-5 h-5 bg-[#151413] text-[#FAF8F5] flex items-center justify-center text-[10px] font-bold">
                {(profile?.full_name || profile?.username || 'LM').substring(0, 2).toUpperCase()}
              </span>
              <span className="font-bold text-[#151413]">
                {profile?.username || 'Perfil'}
              </span>
              <span className="text-[9px] text-[#888075]">▼</span>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div 
                className="absolute right-0 mt-1 w-48 bg-[#FAF8F5] border-2 border-[#151413] shadow-xl py-1 z-50 font-mono-meta text-xs"
                onClick={() => setShowProfileMenu(false)}
              >
                <button
                  onClick={() => onSelectTab('profile')}
                  className="w-full text-left px-3 py-2 hover:bg-[#EFEAE1] text-[#151413] flex items-center gap-2"
                >
                  <span>👤</span> Ver Meu Perfil
                </button>
                <button
                  onClick={onOpenEditProfile}
                  className="w-full text-left px-3 py-2 hover:bg-[#EFEAE1] text-[#151413] flex items-center gap-2"
                >
                  <span>✎</span> Editar Perfil
                </button>
                <button
                  onClick={() => onSelectTab('diary')}
                  className="w-full text-left px-3 py-2 hover:bg-[#EFEAE1] text-[#151413] flex items-center gap-2"
                >
                  <span>📓</span> Diário de Escuta
                </button>
                <div className="border-t border-rule my-1"></div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 hover:bg-[#FDF2F0] text-[#9E2A1B] font-bold flex items-center gap-2"
                >
                  <span>⇥</span> Encerrar Sessão
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Linha Inferior: Sub-navegação Editorial */}
      <div className="hidden md:flex flex-wrap items-center justify-between text-xs font-mono-meta tracking-wider uppercase">
        <nav className="flex items-center gap-6 text-[#58534C]">
          <button
            onClick={() => onSelectTab('home')}
            className={`pb-0.5 transition-colors ${activeTab === 'home' ? 'text-[#BA3822] font-bold border-b border-[#BA3822]' : 'hover:text-[#151413]'}`}
          >
            Início
          </button>
          <button
            onClick={() => onSelectTab('explore')}
            className={`pb-0.5 transition-colors ${activeTab === 'explore' ? 'text-[#BA3822] font-bold border-b border-[#BA3822]' : 'hover:text-[#151413]'}`}
          >
            Explorar
          </button>
          <button
            onClick={() => onSelectTab('reviews')}
            className={`pb-0.5 transition-colors ${activeTab === 'reviews' ? 'text-[#BA3822] font-bold border-b border-[#BA3822]' : 'hover:text-[#151413]'}`}
          >
            Avaliações
          </button>
          <button
            onClick={() => onSelectTab('lists')}
            className={`pb-0.5 transition-colors ${activeTab === 'lists' ? 'text-[#BA3822] font-bold border-b border-[#BA3822]' : 'hover:text-[#151413]'}`}
          >
            Listas
          </button>
          <button
            onClick={() => onSelectTab('diary')}
            className={`pb-0.5 transition-colors ${activeTab === 'diary' ? 'text-[#BA3822] font-bold border-b border-[#BA3822]' : 'hover:text-[#151413]'}`}
          >
            Diário
          </button>
        </nav>

        <div className="text-[10px] text-[#888075] font-mono-meta">
          DISCOGRAFIA & MEMÓRIA AUDITIVA · SOUNDLOG FM
        </div>
      </div>

    </header>
  );
}
