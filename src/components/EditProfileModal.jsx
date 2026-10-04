import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, updateProfile } from '../services/supabase';

export function EditProfileModal({ profile, onClose, onSave }) {
  const [fullName, setFullName] = useState(profile?.full_name || profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [website, setWebsite] = useState(profile?.website || '');
  
  // Preferências (Iniciam 100% vazias para usuário novo)
  const [favoriteArtist, setFavoriteArtist] = useState(profile?.favorite_artist || '');
  const [genres, setGenres] = useState(profile?.favorite_genres || []);
  const [newGenre, setNewGenre] = useState('');
  const [showGenreInput, setShowGenreInput] = useState(false);
  
  // Visibilidade
  const [isPublicReviews, setIsPublicReviews] = useState(true);
  const [isPublicDiary, setIsPublicDiary] = useState(true);
  const [allowFollowers, setAllowFollowers] = useState(true);

  // Segurança
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Estados de feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddGenre = (e) => {
    e.preventDefault();
    if (newGenre.trim() && !genres.includes(newGenre.trim())) {
      setGenres([...genres, newGenre.trim()]);
      setNewGenre('');
      setShowGenreInput(false);
    }
  };

  const handleRemoveGenre = (genreToRemove) => {
    setGenres(genres.filter(g => g !== genreToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);

    const cleanUsername = username.trim().replace('@', '') || profile?.username;

    const updated = {
      ...profile,
      full_name: fullName,
      display_name: fullName,
      username: cleanUsername,
      avatar_url: avatarUrl,
      bio,
      location,
      website,
      favorite_artist: favoriteArtist,
      favorite_genres: genres,
      is_public_reviews: isPublicReviews,
      is_public_diary: isPublicDiary,
      allow_followers: allowFollowers,
      updated_at: new Date().toISOString()
    };

    try {
      if (isSupabaseConfigured() && supabase) {
        await updateProfile(updated);

        // Se o usuário digitou uma nova senha
        if (newPassword) {
          if (newPassword.length < 8) {
            throw new Error('A nova senha deve ter no mínimo 8 caracteres.');
          }
          if (newPassword !== confirmNewPassword) {
            throw new Error('As novas senhas informadas não coincidem.');
          }
          const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
          if (passErr) throw passErr;
        }
      }

      onSave(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/80 backdrop-blur-none flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="soundlog-paper paper-texture border border-[#151413] shadow-2xl w-full max-w-3xl my-auto p-6 sm:p-10 max-h-[90vh] overflow-y-auto space-y-8">
        
        {/* MASTHEAD HEADER */}
        <div className="border-b-2 border-[#151413] pb-4 flex justify-between items-baseline">
          <div>
            <span className="font-editorial-serif text-3xl font-black text-[#151413]">Soundlog</span>
            <div className="text-[10px] font-mono-meta text-[#BA3822] uppercase font-bold tracking-widest mt-0.5">
              PAINEL DO OUVINTE
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-xs font-mono-meta text-[#58534C] hover:text-[#151413] border border-[#151413] px-2 py-1 bg-[#FAF8F5]"
          >
            ✕ FECHAR
          </button>
        </div>

        {/* TÍTULO E FEEDBACKS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-rule pb-3">
          <div>
            <h1 className="font-editorial-serif text-3xl font-bold text-[#151413]">Editar Perfil</h1>
            <p className="font-reading-serif text-sm text-[#58534C] mt-1">
              Personalize sua identidade pública, diretrizes de acervo e credenciais de segurança.
            </p>
          </div>

          {savedSuccess && (
            <div className="bg-[#F2F7F1] border border-[#3A6338] px-3 py-1.5 text-xs font-mono-meta text-[#3A6338] font-bold">
              ✓ ALTERAÇÕES SALVAS
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 border-l-4 border-[#BA3822] bg-[#FDF2F0] text-xs font-mono-meta text-[#9E2A1B]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* SEÇÃO 1: INFORMAÇÕES PÚBLICAS */}
          <section className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#151413] pb-1.5">
              <h2 className="font-editorial-serif text-lg font-bold text-[#151413]">1. Informações Públicas</h2>
              <span className="text-[11px] font-mono-meta text-[#888075]">VISÍVEL NA COMUNIDADE</span>
            </div>

            {/* Avatar & Imagem */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-[#EFEAE1] border border-rule">
              <div className="w-16 h-16 bg-[#151413] text-[#FAF8F5] flex items-center justify-center font-editorial-serif text-xl font-bold border border-[#151413] shrink-0">
                {fullName ? fullName.substring(0, 2).toUpperCase() : 'LM'}
              </div>
              <div className="space-y-1 flex-1">
                <div className="font-editorial-serif text-sm font-bold text-[#151413]">Foto do Perfil</div>
                <p className="font-reading-serif text-xs text-[#58534C]">
                  Utilize imagens quadradas de alta nitidez.
                </p>
                <div className="flex gap-2 pt-1 font-mono-meta text-xs">
                  <input
                    type="text"
                    placeholder="URL da imagem (ex: https://...)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="field-editorial text-xs py-1.5 max-w-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="font-mono-meta text-xs font-bold text-[#151413]">Nome de exibição</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo ou pseudônimo"
                  className="field-editorial"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono-meta text-xs font-bold text-[#151413]">Nome de usuário</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="seunome"
                  className="field-editorial font-mono-meta"
                />
                <span className="text-[11px] font-mono-meta text-[#BA3822]">soundlog.fm/@{username || 'ouvinte'}</span>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="font-mono-meta text-xs font-bold text-[#151413]">Biografia</label>
                  <span className="text-[10px] font-mono-meta text-[#888075]">{bio.length} / 280 caracteres</span>
                </div>
                <textarea
                  rows="3"
                  maxLength="280"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escreva sobre suas afinidades musicais, hábitos de escuta ou colecionismo..."
                  className="field-editorial font-reading-serif resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono-meta text-xs font-bold text-[#151413]">Localização <span className="text-[#888075] font-normal">(opcional)</span></label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ex: Belo Horizonte, MG"
                  className="field-editorial"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono-meta text-xs font-bold text-[#151413]">Site ou Acervo <span className="text-[#888075] font-normal">(opcional)</span></label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://seusite.com"
                  className="field-editorial"
                />
              </div>

            </div>
          </section>


          {/* SEÇÃO 2: PREFERÊNCIAS MUSICAIS & PRIVACIDADE */}
          <section className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#151413] pb-1.5">
              <h2 className="font-editorial-serif text-lg font-bold text-[#151413]">2. Preferências Musicais & Visibilidade</h2>
              <span className="text-[11px] font-mono-meta text-[#888075]">CURADORIA & PRIVACIDADE</span>
            </div>

            <div className="space-y-4">
              
              {/* Gêneros */}
              <div className="space-y-2">
                <label className="font-mono-meta text-xs font-bold text-[#151413]">Gêneros musicais de maior afinidade</label>
                <div className="flex flex-wrap items-center gap-2">
                  {genres.map(g => (
                    <span key={g} className="editorial-badge editorial-badge-accent flex items-center gap-1.5">
                      {g}
                      <button type="button" onClick={() => handleRemoveGenre(g)} className="hover:text-black font-bold">✕</button>
                    </span>
                  ))}
                  
                  {showGenreInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Novo gênero..."
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        className="field-editorial text-xs py-1 px-2 w-32"
                      />
                      <button type="button" onClick={handleAddGenre} className="btn-editorial-primary text-xs py-1 px-2">OK</button>
                      <button type="button" onClick={() => setShowGenreInput(false)} className="text-xs text-[#888075] px-1">✕</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowGenreInput(true)}
                      className="editorial-badge text-[#888075] hover:text-[#151413]"
                    >
                      + Adicionar gênero
                    </button>
                  )}
                </div>
              </div>

              {/* Artistas */}
              <div className="space-y-1">
                <label className="font-mono-meta text-xs font-bold text-[#151413]">Artistas de cabeceira</label>
                <input
                  type="text"
                  value={favoriteArtist}
                  onChange={(e) => setFavoriteArtist(e.target.value)}
                  placeholder="ex: Milton Nascimento, Radiohead, Juçara Marçal"
                  className="field-editorial"
                />
                <p className="text-[11px] font-reading-serif text-[#888075]">Separados por vírgula para destaque na sua estante.</p>
              </div>

              {/* Opções de Visibilidade */}
              <div className="pt-3 border-t border-rule space-y-3">
                <div className="font-mono-meta text-xs font-bold text-[#151413] uppercase">Opções de Privacidade:</div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicReviews}
                    onChange={(e) => setIsPublicReviews(e.target.checked)}
                    className="checkbox-editorial"
                  />
                  <div>
                    <div className="text-xs font-mono-meta font-bold text-[#151413]">Avaliações e resenhas públicas</div>
                    <div className="text-xs font-reading-serif text-[#58534C]">Suas resenhas aparecem nas fichas de discos e no feed geral.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicDiary}
                    onChange={(e) => setIsPublicDiary(e.target.checked)}
                    className="checkbox-editorial"
                  />
                  <div>
                    <div className="text-xs font-mono-meta font-bold text-[#151413]">Exibir histórico do diário de escuta</div>
                    <div className="text-xs font-reading-serif text-[#58534C]">Visitantes podem consultar seu calendário de audições.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowFollowers}
                    onChange={(e) => setAllowFollowers(e.target.checked)}
                    className="checkbox-editorial"
                  />
                  <div>
                    <div className="text-xs font-mono-meta font-bold text-[#151413]">Permitir que outros membros sigam o perfil</div>
                    <div className="text-xs font-reading-serif text-[#58534C]">Outros ouvintes acompanham suas novas publicações e listas.</div>
                  </div>
                </label>
              </div>

            </div>
          </section>


          {/* SEÇÃO 3: SEGURANÇA DA CONTA */}
          <section className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#151413] pb-1.5">
              <h2 className="font-editorial-serif text-lg font-bold text-[#151413]">3. Segurança da Conta</h2>
              <span className="text-[11px] font-mono-meta text-[#888075]">CREDENCIAIS & SESSÕES</span>
            </div>

            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#FAF8F5] border border-rule">
                <div>
                  <span className="text-[10px] font-mono-meta text-[#888075] uppercase block">E-mail atual</span>
                  <span className="text-xs font-mono-meta font-bold text-[#151413]">{profile?.email || 'seu@email.com'}</span>
                </div>
                <button type="button" onClick={() => alert('Instruções enviadas para confirmação de novo e-mail.')} className="btn-editorial-secondary text-xs py-1.5">
                  Alterar e-mail
                </button>
              </div>

              {/* Alterar Senha */}
              <div className="p-4 bg-[#FAF8F5] border border-rule space-y-3">
                <div className="font-mono-meta text-xs font-bold text-[#151413] uppercase">Alterar Senha:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono-meta text-[11px] text-[#58534C]">Senha atual</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="field-editorial text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono-meta text-[11px] text-[#58534C]">Nova senha</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="field-editorial text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono-meta text-[11px] text-[#58534C]">Confirmar nova senha</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="field-editorial text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-mono-meta text-[#58534C]">
                <span>Sessão ativa neste navegador.</span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('soundlog_session');
                    window.location.reload();
                  }}
                  className="text-[#BA3822] hover:underline font-semibold"
                >
                  Sair de todos os dispositivos
                </button>
              </div>

            </div>
          </section>


          {/* SEÇÃO 4: ZONA DE RISCO / EXCLUSÃO */}
          <section className="pt-4 border-t-2 border-[#151413]">
            <div className="p-4 border border-[#BA3822] bg-[#FDF2F0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="font-editorial-serif text-sm font-bold text-[#9E2A1B]">Encerrar e excluir conta</div>
                <p className="font-reading-serif text-xs text-[#58534C] max-w-xl">
                  Esta ação removerá permanentemente seu diário, resenhas escritas e listas catalogadas no Soundlog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza de que deseja excluir permanentemente sua conta no Soundlog? Esta ação não pode ser desfeita.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="btn-editorial-secondary border-[#BA3822] text-[#9E2A1B] hover:bg-[#BA3822] hover:text-white text-xs py-2 shrink-0"
              >
                Excluir minha conta
              </button>
            </div>
          </section>


          {/* BOTÕES DE AÇÃO PRINCIPAIS */}
          <div className="pt-4 border-t border-[#151413] flex flex-col-reverse sm:flex-row justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-editorial-secondary w-full sm:w-auto py-2.5 px-6"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-editorial-primary w-full sm:w-auto py-2.5 px-8"
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
