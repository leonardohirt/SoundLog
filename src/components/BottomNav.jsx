import React from 'react';

export function BottomNav({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'home', label: 'Início', dot: '●' },
    { id: 'explore', label: 'Explorar', dot: '○' },
    { id: 'reviews', label: 'Avaliações', dot: '○' },
    { id: 'lists', label: 'Listas', dot: '○' },
    { id: 'diary', label: 'Diário', dot: '○' },
    { id: 'profile', label: 'Perfil', dot: '○' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FAF8F5] border-t-2 border-[#151413] px-2 py-2 flex justify-around items-center font-mono-meta text-[11px] shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
              isActive ? 'text-[#BA3822] font-bold' : 'text-[#58534C] hover:text-[#151413]'
            }`}
          >
            <span className="text-[9px] leading-none">{isActive ? '●' : '○'}</span>
            <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
