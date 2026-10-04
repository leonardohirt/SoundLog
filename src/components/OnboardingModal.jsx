import React, { useState } from 'react';
import { updateProfile } from '../services/supabase';
import logoImg from '../assets/logo.jpg';

export function OnboardingModal({ userSession, onFinish }) {

  const [displayName, setDisplayName] = useState(userSession?.full_name || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [genres, setGenres] = useState([]);
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [saving, setSaving] = useState(false);

  const availableGenres = [
    'MPB / Tropicália',
    'Jazz Modal',
    'Samba-Jazz',
    'Bossa Nova',
    'Rock Nacional',
    'Post-Punk / Noise',
    'Hip-Hop / Rap',
    'Música Eletrônica',
    'Folk / Acústico'
  ];

  const toggleGenre = (g) => {
    if (genres.includes(g)) {
      setGenres(genres.filter(item => item !== g));
    } else {
      setGenres([...genres, g]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updated = {
      ...userSession,
      full_name: displayName.trim() || userSession.username,
      display_name: displayName.trim() || userSession.username,
      bio: bio.trim(),
      avatar_url: avatarUrl.trim(),
      favorite_genres: genres,
      favorite_artist: favoriteArtist.trim(),
      updated_at: new Date().toISOString()
    };

    await updateProfile(updated);
    setSaving(false);
    onFinish(updated);
  };

  const handleSkip = () => {
    onFinish(userSession);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="soundlog-paper paper-texture border border-[#151413] shadow-2xl w-full max-w-2xl my-auto p-6 sm:p-10 space-y-6">
        
        {/* MASTHEAD */}
        <div className="border-b-2 border-[#151413] pb-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-8 w-auto object-contain mix-blend-multiply"
            />
            <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold border-l border-rule pl-3">
              BEM-VINDO AO SOUNDLOG
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleSkip}
            className="text-xs font-mono-meta text-[#888075] hover:text-[#151413] underline"
          >
            Pular por enquanto →
          </button>
        </div>


        <div>
          <h1 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[#151413]">
            Personalize seu perfil de ouvinte
          </h1>
          <p className="font-reading-serif text-sm text-[#58534C] mt-1">
            Esta etapa é opcional. Você pode definir suas afinidades estéticas agora ou ajustar depois nas configurações.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nome de Exibição */}
            <div className="space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Nome de exibição</label>
              <input
                type="text"
                placeholder="Como prefere ser chamado"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="field-editorial"
              />
            </div>

            {/* Foto de Perfil */}
            <div className="space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">URL da foto / avatar <span className="text-[#888075] font-normal">(opcional)</span></label>
              <input
                type="text"
                placeholder="https://exemplo.com/foto.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="field-editorial"
              />
            </div>

            {/* Biografia */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Biografia curta</label>
              <textarea
                rows="2"
                maxLength="280"
                placeholder="Conte um pouco sobre sua relação com a música, instrumentos ou formatos preferidos..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="field-editorial font-reading-serif resize-none"
              />
            </div>

            {/* Artistas Favoritos */}
            <div className="sm:col-span-2 space-y-1">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Artistas de cabeceira</label>
              <input
                type="text"
                placeholder="ex: Milton Nascimento, Elis Regina, Juçara Marçal"
                value={favoriteArtist}
                onChange={(e) => setFavoriteArtist(e.target.value)}
                className="field-editorial"
              />
            </div>

            {/* Gêneros Favoritos */}
            <div className="sm:col-span-2 space-y-2">
              <label className="font-mono-meta text-xs font-bold text-[#151413]">Gêneros musicais de maior afinidade</label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`editorial-badge cursor-pointer transition-colors ${genres.includes(g) ? 'editorial-badge-accent font-bold' : 'text-[#58534C] hover:text-[#151413]'}`}
                  >
                    {genres.includes(g) ? `✓ ${g}` : `+ ${g}`}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* AÇÕES */}
          <div className="pt-4 border-t border-[#151413] flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-mono-meta text-[#58534C] hover:text-[#151413] py-2"
            >
              Pular por enquanto
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="btn-editorial-primary w-full sm:w-auto py-2.5 px-8"
            >
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
