import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, saveLocalProfile, updateProfile, isUsernameAvailable } from '../services/supabase';
import logoImg from '../assets/logo.jpg';

export function AuthScreen({ onLoginSuccess, initialView = 'login', onPasswordRecoveryComplete }) {

  const [view, setView] = useState(initialView); // 'login' | 'cadastro' | 'recuperacao' | 'redefinicao'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    setView(initialView);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialView]);

  // Força de senha
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Vazia', color: 'text-[#888075]' };
    if (pass.length < 6) return { score: 1, label: 'Fraca', color: 'text-[#C26338]' };
    if (pass.length < 10) return { score: 2, label: 'Média', color: 'text-[#B8860B]' };
    return { score: 3, label: 'Forte', color: 'text-[#3A6338]' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const cleanUsername = username.trim().replace('@', '').toLowerCase() || (email.split('@')[0] || 'ouvinte');
    const displayName = fullName.trim() || cleanUsername;

    try {
      // 1. TELA DE CADASTRO
      if (view === 'cadastro') {
        if (!acceptTerms) {
          throw new Error('É necessário aceitar os termos de uso e política de privacidade.');
        }
        if (password.length < 8) {
          throw new Error('A senha deve conter no mínimo 8 caracteres.');
        }
        if (password !== confirmPassword) {
          throw new Error('As senhas informadas não coincidem.');
        }

        // Validação estrita de formato de e-mail
        const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
        if (!emailValid) {
          throw new Error('Por favor, informe um endereço de e-mail válido.');
        }

        // Validação de nome de usuário
        if (!/^[a-z0-9_]{3,30}$/i.test(cleanUsername)) {
          throw new Error('O nome de usuário deve ter entre 3 e 30 caracteres (letras, números e underline).');
        }

        if (isSupabaseConfigured() && supabase) {
          localStorage.setItem('soundlog_remember_session', String(rememberMe));
          if (!(await isUsernameAvailable(cleanUsername))) {
            throw new Error('Esse nome de usuário já está em uso. Escolha outro.');
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: displayName,
                username: cleanUsername
              }
            }
          });

          if (error) throw error;

          if (!data.session) {
            setSuccessMsg('Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre.');
            setPassword('');
            setConfirmPassword('');
            setView('login');
            return;
          }
          
          const user = data.user;
          const userSession = {
            id: user.id,
            email,
            full_name: displayName,
            username: cleanUsername,
            avatar_url: ''
          };

          if (rememberMe) {
            localStorage.setItem('soundlog_session', JSON.stringify(userSession));
            sessionStorage.removeItem('soundlog_session');
          } else {
            sessionStorage.setItem('soundlog_session', JSON.stringify(userSession));
            localStorage.removeItem('soundlog_session');
          }
          saveLocalProfile(userSession);
          await updateProfile(userSession, { strict: true });
          onLoginSuccess(userSession);
        } else {
          throw new Error('O backend de autenticação (Supabase) não está configurado. Adicione as chaves no arquivo .env.');
        }
      } 
      // 2. TELA DE LOGIN
      else if (view === 'login') {
        // Basic validation
        if (!email || !password) {
          throw new Error('Por favor, informe seu e‑mail ou usuário e sua senha.');
        }

        // Supabase Auth accepts email addresses, not usernames.
        const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
        if (!emailValid) {
          throw new Error('Informe o e-mail da sua conta. O login por nome de usuário ainda não está disponível.');
        }

        // Minimum password length
        if (password.length < 8) {
          throw new Error('A senha deve conter no mínimo 8 caracteres.');
        }

        if (isSupabaseConfigured() && supabase) {
          localStorage.setItem('soundlog_remember_session', String(rememberMe));
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            if (error.message.includes('Invalid login credentials')) {
              throw new Error('E‑mail, usuário ou senha incorretos.');
            }
            throw error;
          }

          const user = data.user;
          const userSession = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            username: user.user_metadata?.username || user.email.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url || ''
          };

          if (rememberMe) {
            localStorage.setItem('soundlog_session', JSON.stringify(userSession));
            sessionStorage.removeItem('soundlog_session');
          } else {
            sessionStorage.setItem('soundlog_session', JSON.stringify(userSession));
            localStorage.removeItem('soundlog_session');
          }

          saveLocalProfile(userSession);
          onLoginSuccess(userSession);
        } else {
          // Supabase not configured; cannot login
          throw new Error('Autenticação não está configurada. Por favor, configure o Supabase ou use o modo demo.');
        }
      }
      // 3. RECUPERAÇÃO DE SENHA
      else if (view === 'recuperacao') {
        if (!email) {
          throw new Error('Por favor, informe um endereço de e-mail válido.');
        }

        if (!isSupabaseConfigured() || !supabase) {
          throw new Error('Autenticação não está configurada. Não foi possível enviar as instruções.');
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;

        setSuccessMsg('Se existir uma conta associada a este e-mail, você receberá as instruções em alguns minutos.');
        setResendTimer(45);
      }
      // 4. REDEFINIÇÃO DE SENHA
      else if (view === 'redefinicao') {
        if (password.length < 8) {
          throw new Error('A nova senha deve ter no mínimo 8 caracteres.');
        }
        if (password !== confirmPassword) {
          throw new Error('As senhas não conferem.');
        }

        if (isSupabaseConfigured() && supabase) {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
        } else {
          throw new Error('Autenticação não está configurada. Não foi possível alterar a senha.');
        }

        setSuccessMsg('Sua senha foi alterada com sucesso! Você já pode entrar com sua nova senha.');
        await onPasswordRecoveryComplete?.();
        setView('login');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen soundlog-paper paper-texture flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      
      {/* CARD PRINCIPAL EDITORIAL */}
      <div className="w-full max-w-4xl bg-[#FAF8F5] border border-[#151413] shadow-2xl p-6 sm:p-10">
        
        {/* MASTHEAD HEADER */}
        <div className="border-b-2 border-[#151413] pb-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply"
            />
            <span className="text-[10px] font-mono-meta text-[#888075] uppercase hidden md:inline border-l border-rule pl-4">
              CADERNO CRÍTICO & MEMÓRIA FONOGRÁFICA
            </span>
          </div>


          <div className="text-xs font-mono-meta">
            {view === 'login' && (
              <span>Ainda não tem conta? <button onClick={() => { setView('cadastro'); setErrorMsg(''); setSuccessMsg(''); }} className="text-[#BA3822] font-bold hover:underline">Criar conta →</button></span>
            )}
            {view === 'cadastro' && (
              <span>Já tem uma conta? <button onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }} className="text-[#BA3822] font-bold hover:underline">Entrar →</button></span>
            )}
            {(view === 'recuperacao' || view === 'redefinicao') && (
              <button onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }} className="text-[#58534C] hover:text-[#BA3822]">← Voltar ao login</button>
            )}
          </div>
        </div>

        {/* MENSAGEM DE ERRO GERAL */}
        {errorMsg && (
          <div className="mb-6 p-3 border-l-4 border-[#BA3822] bg-[#FDF2F0] text-xs font-mono-meta text-[#9E2A1B] space-y-0.5">
            <div className="font-bold">Aviso:</div>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* MENSAGEM DE SUCESSO */}
        {successMsg && (
          <div className="mb-6 p-4 border border-[#3A6338] bg-[#F2F7F1] text-xs font-reading-serif text-[#253E23] space-y-2">
            <div className="font-mono-meta font-bold text-[#3A6338]">✓ CONFIRMAÇÃO</div>
            <p>{successMsg}</p>
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* FORMULÁRIO (COLUNA 7 ou 12) */}
          <div className={`${view === 'cadastro' ? 'md:col-span-7' : 'md:col-span-12 max-w-md mx-auto w-full'} space-y-6`}>
            
            {/* TÍTULO DA ETAPA */}
            <div>
              <span className="text-[10px] font-mono-meta text-[#BA3822] uppercase tracking-widest font-bold">
                {view === 'cadastro' && 'REGISTRO DE NOVO OUVINTE'}
                {view === 'login' && 'ACESSO AO ACERVO'}
                {view === 'recuperacao' && 'SEGURANÇA DA CONTA'}
                {view === 'redefinicao' && 'NOVA CREDENCIAL'}
              </span>

              <h1 className="font-editorial-serif text-3xl font-bold text-[#151413] mt-1">
                {view === 'cadastro' && 'Criar uma conta'}
                {view === 'login' && 'Entrar'}
                {view === 'recuperacao' && 'Recuperar acesso'}
                {view === 'redefinicao' && 'Criar nova senha'}
              </h1>

              <p className="font-reading-serif text-sm text-[#58534C] mt-1">
                {view === 'cadastro' && 'Registre o que você ouve, avalie músicas e acompanhe outras pessoas.'}
                {view === 'login' && 'Acesse seu diário, avaliações e listas catalogadas.'}
                {view === 'recuperacao' && 'Informe seu e-mail e enviaremos as instruções para criar uma nova senha.'}
                {view === 'redefinicao' && 'Defina uma nova senha segura para continuar utilizando o Soundlog.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* CAMPO NOME DE USUÁRIO (Apenas no Cadastro) */}
              {view === 'cadastro' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="font-mono-meta text-xs font-bold text-[#151413]">Nome de usuário</label>
                    <span className="text-[10px] font-mono-meta text-[#888075]">soundlog.fm/@{username.trim() || 'seunome'}</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="ex: heitor_villa"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="field-editorial"
                  />
                  <p className="text-[11px] font-reading-serif text-[#58534C]">
                    Será exibido nas suas avaliações, resenhas, listas e no seu perfil público.
                  </p>
                </div>
              )}

              {/* CAMPO NOME DE EXIBIÇÃO (Apenas no Cadastro) */}
              {view === 'cadastro' && (
                <div className="space-y-1">
                  <label className="font-mono-meta text-xs font-bold text-[#151413]">Nome de exibição</label>
                  <input
                    type="text"
                    placeholder="ex: Heitor Villa-Lobos"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field-editorial"
                  />
                </div>
              )}

              {/* CAMPO E-MAIL (Cadastro, Login e Recuperação) */}
              {view !== 'redefinicao' && (
                <div className="space-y-1">
                  <label className="font-mono-meta text-xs font-bold text-[#151413]">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-editorial"
                  />
                </div>
              )}

              {/* CAMPO SENHA (Cadastro, Login e Redefinição) */}
              {view !== 'recuperacao' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="font-mono-meta text-xs font-bold text-[#151413]">
                      {view === 'redefinicao' ? 'Nova senha' : 'Senha'}
                    </label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setView('recuperacao'); setErrorMsg(''); }}
                        className="text-[11px] font-mono-meta text-[#BA3822] hover:underline font-semibold"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field-editorial pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono-meta uppercase tracking-wider text-[#58534C] hover:text-[#151413] bg-[#FAF8F5] px-1.5 py-0.5 border border-[#DDD6C9]"
                    >
                      {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                    </button>
                  </div>

                  {/* Medidor de força de senha no cadastro/redefinição */}
                  {(view === 'cadastro' || view === 'redefinicao') && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1">
                        <div className={`meter-bar ${strength.score >= 1 ? (strength.score === 1 ? 'active-weak' : strength.score === 2 ? 'active-medium' : 'active-strong') : ''}`}></div>
                        <div className={`meter-bar ${strength.score >= 2 ? (strength.score === 2 ? 'active-medium' : 'active-strong') : ''}`}></div>
                        <div className={`meter-bar ${strength.score >= 3 ? 'active-strong' : ''}`}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono-meta text-[#888075]">
                        <span>Segurança da senha: <strong className={strength.color}>{strength.label}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CAMPO CONFIRMAR SENHA (Cadastro e Redefinição) */}
              {(view === 'cadastro' || view === 'redefinicao') && (
                <div className="space-y-1">
                  <label className="font-mono-meta text-xs font-bold text-[#151413]">
                    {view === 'redefinicao' ? 'Confirmar nova senha' : 'Confirmar senha'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="field-editorial"
                  />
                </div>
              )}

              {/* CHECKBOXES ESPECÍFICOS */}
              {view === 'cadastro' && (
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="checkbox-editorial"
                    />
                    <span className="text-xs font-reading-serif text-[#38332C] leading-snug">
                      Li e concordo com os Termos de Uso e Política de Privacidade do Soundlog.
                    </span>
                  </label>
                </div>
              )}

              {view === 'login' && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox-editorial"
                    />
                    <span className="text-xs font-reading-serif text-[#38332C]">
                      Manter minha sessão conectada neste dispositivo
                    </span>
                  </label>
                </div>
              )}

              {/* BOTÃO SUBMIT */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-editorial-primary w-full py-3"
                >
                  {loading ? 'Processando...' : (
                    view === 'cadastro' ? 'Criar conta' :
                    view === 'login' ? 'Entrar' :
                    view === 'recuperacao' ? 'Enviar instruções' : 'Salvar nova senha'
                  )}
                </button>
              </div>

            </form>

            {/* AUTENTICAÇÃO EXTERNA DISCRETA (Login & Cadastro) */}
          </div>

          {/* COLUNA EDITORIAL LATERAL (Apenas no Cadastro Desktop) */}
          {view === 'cadastro' && (
            <div className="md:col-span-5 space-y-6 md:border-l md:border-rule md:pl-8 flex flex-col justify-between">
              
              <div className="space-y-3">
                <span className="editorial-badge">ARQUIVO EM DESTAQUE</span>
                
                <div className="aspect-square bg-[#2B1E17] border border-[#151413] p-4 text-[#FAF8F5] flex flex-col justify-between">
                  <div className="flex justify-between text-[9px] font-mono-meta text-[#DDD6C9]">
                    <span>MEMÓRIA FONOGRÁFICA</span>
                    <span>1972</span>
                  </div>
                  <div className="text-center py-6">
                    <span className="font-editorial-serif text-2xl font-bold">Clube da Esquina</span>
                    <p className="text-xs font-mono-meta text-[#DDD6C9]">Milton Nascimento & Lô Borges</p>
                  </div>
                  <div className="text-[10px] font-mono-meta text-[#BA3822] bg-[#FAF8F5] p-2 border border-[#151413] text-[#151413] font-bold text-center">
                    4.812 ouvintes registraram este mês
                  </div>
                </div>

                <div className="border-t border-rule pt-3">
                  <h4 className="font-editorial-serif text-base font-bold text-[#151413]">Por que criar seu perfil?</h4>
                  <ul className="font-reading-serif text-xs text-[#58534C] mt-2 space-y-2 leading-relaxed">
                    <li>— <strong>Diário cronológico:</strong> Mantenha registro do que você ouviu com data, formato e impressões.</li>
                    <li>— <strong>Crítica sem algoritmo:</strong> Escreva ensaios curtos ou longos com diagramação de revista.</li>
                    <li>— <strong>Listas temáticas:</strong> Catalogue discografias e seleções conceituais.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-[#EFEAE1] border border-rule text-[11px] font-mono-meta text-[#58534C]">
                <strong>Privacidade:</strong> Seus dados não são comercializados para terceiros nem usados para anúncios direcionados.
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
