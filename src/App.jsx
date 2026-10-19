import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { ExploreView } from './components/ExploreView';
import { DiaryView } from './components/DiaryView';
import { ListsView } from './components/ListsView';
import { ProfileView } from './components/ProfileView';
import { AlbumDetailModal } from './components/AlbumDetailModal';
import { TrackDetailModal } from './components/TrackDetailModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ReviewModal } from './components/ReviewModal';
import { EditProfileModal } from './components/EditProfileModal';
import { CreateListModal } from './components/CreateListModal';
import { MiniPlayer } from './components/MiniPlayer';
import logoImg from './assets/logo.jpg';
import { searchAll, getTrendingAlbums } from './services/musicApi';
import { getPersonalizedHomeData, getPersonalizedExploreData } from './services/recommendationService';

import {
  fetchReviews,
  createOrUpdateReview,
  deleteReview,
  getLocalLists,
  saveLocalList,
  deleteList,
  fetchProfile,
  updateProfile,
  fetchFollows,
  toggleFollowUser,
  searchUsers,
  fetchCommunityProfiles,
  fetchUserFollowersCount,
  syncLocalReviewsToSupabase,
  supabase
} from './services/supabase';

export default function App() {
  // 1. ESTADO DE SESSÃO DO USUÁRIO
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('soundlog_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explore' | 'reviews' | 'lists' | 'diary' | 'profile'

  // Dados do Catálogo & Usuário
  const [trendingAlbums, setTrendingAlbums] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [lists, setLists] = useState([]);
  const [profile, setProfile] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [communityUsers, setCommunityUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados de Personalização
  const [personalizedHome, setPersonalizedHome] = useState({
    isPersonalized: false,
    heroAlbum: null,
    contextReason: null,
    recommendedAlbums: [],
    recommendedTracks: [],
    topGenres: []
  });
  const [personalizedExplore, setPersonalizedExplore] = useState({
    isPersonalized: false,
    albums: [],
    tracks: [],
    topGenres: [],
    topArtists: []
  });

  // Busca ativa
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all' | 'albums' | 'tracks' | 'users'
  const [searchResults, setSearchResults] = useState({ albums: [], tracks: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Modais de Detalhes e Avaliação
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewType, setReviewType] = useState('album'); // 'album' | 'track'
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);

  // Player de Áudio (Previews de 30s)
  const [currentTrack, setCurrentTrack] = useState(null);


  // Sincronizar com Supabase Auth
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userObj = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            username: session.user.user_metadata?.username || session.user.email.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url || ''
          };
          localStorage.setItem('soundlog_session', JSON.stringify(userObj));
          setUserSession(userObj);
        }
      });
    }
  }, []);

  // Carregar dados quando a sessão estiver ativa
  useEffect(() => {
    if (userSession) {
      loadInitialData();
    }
  }, [userSession]);

  const loadInitialData = async () => {
    setLoading(true);
    const [trend, revs, prof, follows, commUsers, myFollowersCount] = await Promise.all([
      getTrendingAlbums(),
      syncLocalReviewsToSupabase(userSession),
      fetchProfile(userSession),
      fetchFollows(userSession.id),
      fetchCommunityProfiles(userSession.id),
      fetchUserFollowersCount(userSession.id)
    ]);

    setTrendingAlbums(trend || []);
    setReviews(revs || []);
    setFollowingIds(follows || []);
    setFollowersCount(myFollowersCount || 0);
    setCommunityUsers(commUsers || []);
    setProfile(prof || {
      id: userSession.id,
      full_name: userSession.full_name || userSession.username,
      username: userSession.username,
      avatar_url: userSession.avatar_url || '',
      bio: '',
      favorite_artist: '',
      favorite_genres: []
    });
    setLists(getLocalLists());
    setLoading(false);
  };

  // Filtra estritamente as avaliações pessoais do usuário logado
  const myReviews = reviews.filter((r) => {
    if (!userSession?.id) return true;
    return (
      r.user_id === userSession.id ||
      (r.user_username && userSession.username && r.user_username.toLowerCase() === userSession.username.toLowerCase())
    );
  });

  // Recalcular recomendações personalizadas sempre que houver novas avaliações ou alterações no perfil
  useEffect(() => {
    if (userSession) {
      let isMounted = true;
      const runPersonalization = async () => {
        try {
          const [homeData, exploreData] = await Promise.all([
            getPersonalizedHomeData(myReviews, profile),
            getPersonalizedExploreData(myReviews, profile)
          ]);
          if (isMounted) {
            setPersonalizedHome(homeData);
            setPersonalizedExplore(exploreData);
          }
        } catch (err) {
          console.error('Erro ao calcular recomendações:', err);
        }
      };
      runPersonalization();
      return () => {
        isMounted = false;
      };
    }
  }, [reviews, profile, userSession]);

  // Logout
  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair da sua conta no Soundlog?')) {
      localStorage.removeItem('soundlog_session');
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUserSession(null);
      setProfile(null);
      setReviews([]);
      setLists([]);
      setFollowingIds([]);
      setActiveTab('home');
    }
  };

  // Busca em tempo real (Álbuns, Faixas e Ouvintes/Usuários)
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults({ albums: [], tracks: [], users: [] });
      return;
    }
    setIsSearching(true);
    const [musicResults, userResults] = await Promise.all([
      searchAll(term),
      searchUsers(term, userSession?.id)
    ]);
    setSearchResults({
      albums: musicResults.albums || [],
      tracks: musicResults.tracks || [],
      users: userResults || []
    });
    setIsSearching(false);
  };

  // Alternar seguir / deixar de seguir usuário
  const handleToggleFollow = async (targetUserId) => {
    if (!userSession?.id || !targetUserId) return;
    const result = await toggleFollowUser(userSession.id, targetUserId);
    setFollowingIds(result.following);
  };

  // Handlers para Abertura de Avaliação
  const handleOpenAlbumReview = (album) => {
    setSelectedAlbum(null);
    setReviewItem(album);
    setReviewType('album');
  };

  const handleOpenTrackReview = (track) => {
    setSelectedTrack(null);
    setReviewItem(track);
    setReviewType('track');
  };

  // Salvar avaliação / resenha
  const handleSaveReview = async (reviewData) => {
    const saved = await createOrUpdateReview(reviewData, userSession);
    const updated = await fetchReviews();
    setReviews(updated);
    setReviewItem(null);
  };

  // Excluir avaliação
  const handleDeleteReview = async (reviewId) => {
    await deleteReview(reviewId);
    const updated = await fetchReviews();
    setReviews(updated);
  };

  // Salvar nova lista
  const handleSaveList = (newList) => {
    const updated = saveLocalList(newList);
    setLists(updated);
    setShowCreateList(false);
  };

  // Excluir lista
  const handleDeleteList = (listId) => {
    const updated = deleteList(listId);
    setLists(updated);
  };

  // Salvar perfil
  const handleSaveProfile = async (updatedProfile) => {
    await updateProfile(updatedProfile);
    setProfile(updatedProfile);
    setShowEditProfile(false);
  };

  // -------------------------------------------------------------------------
  // 1. SE NÃO HOUVER SESSÃO AUTENTICADA: APRESENTA EXCLUSIVAMENTE AUTH
  // -------------------------------------------------------------------------
  if (!userSession) {
    return (
      <AuthScreen
        onLoginSuccess={(session, isNewUser) => {
          setUserSession(session);
          if (isNewUser) {
            setShowOnboarding(true);
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 2. INTERFACE PRINCIPAL AUTENTICADA DO SOUNDLOG
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen soundlog-paper paper-texture flex flex-col pb-16 md:pb-0">
      
      {/* CONTAINER PRINCIPAL */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSearchTerm('');
            setSearchResults({ albums: [], tracks: [] });
          }}
          profile={profile}
          onOpenEditProfile={() => setShowEditProfile(true)}
          onLogout={handleLogout}
          onSearch={(term) => {
            handleSearch(term);
            if (term.trim() && activeTab !== 'explore') {
              setActiveTab('explore');
            }
          }}
          searchTerm={searchTerm}
        />

        {/* =================================================================== */}
        {/* ABA: INÍCIO (HOME EDITORIAL & PERSONALIZADO) */}
        {/* =================================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            
            {/* ESTADO 1: USUÁRIO NOVO SEM AVALIAÇÕES */}
            {reviews.length === 0 ? (
              <>
                {/* MASTHEAD DE PRIMEIRO USO */}
                <section className="p-8 sm:p-10 bg-[#FAF8F5] border-2 border-[#151413] shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center gap-2 font-mono-meta text-xs">
                    <span className="editorial-badge editorial-badge-accent">BEM-VINDO AO SOUNDLOG</span>
                    <span className="editorial-badge">ARQUIVO MUSICAL PESSOAL</span>
                  </div>

                  <div className="max-w-3xl space-y-3">
                    <h1 className="font-editorial-serif text-3xl sm:text-5xl font-bold text-[#151413] tracking-tight leading-tight">
                      Seu Diário e Arquivo Crítico de Música.
                    </h1>
                    <p className="font-reading-serif text-base sm:text-lg text-[#454038] leading-relaxed">
                      O Soundlog foi feito para quem escuta música com atenção. Registre suas impressões sobre discos e canções, atribua notas de 0.5 a 5.0 estrelas e descubra novas obras personalizadas estritamente conforme o seu gosto.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-4 font-mono-meta text-xs">
                    <button
                      onClick={() => {
                        setActiveTab('explore');
                        setSearchFilter('tracks');
                      }}
                      className="btn-editorial-primary py-3 px-6 text-sm flex items-center gap-2"
                    >
                      <span>★</span>
                      <span>Avaliar uma música</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('explore');
                        setSearchFilter('albums');
                      }}
                      className="btn-editorial-secondary py-3 px-6 text-sm flex items-center gap-2"
                    >
                      <span>★</span>
                      <span>Avaliar um álbum</span>
                    </button>
                  </div>
                </section>

                {/* SUGESTÕES GERAIS PARA INICIAR O ARQUIVO */}
                {trendingAlbums.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-baseline justify-between border-b border-rule pb-2">
                      <div>
                        <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">
                          Sugestões para Iniciar seu Arquivo
                        </h3>
                        <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                          Discos essenciais e referências da música brasileira e internacional
                        </p>
                      </div>
                      <span className="editorial-badge">SELEÇÃO EDITORIAL</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {trendingAlbums.slice(0, 6).map((alb) => (
                        <div key={alb.album_id} className="space-y-2 group">
                          <div
                            onClick={() => setSelectedAlbum(alb)}
                            className="aspect-square bg-[#151413] border border-[#151413] shadow-sm overflow-hidden cursor-pointer"
                          >
                            <img
                              src={alb.cover_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                            />
                          </div>
                          <div>
                            <h4
                              onClick={() => setSelectedAlbum(alb)}
                              className="font-editorial-serif text-sm font-bold text-[#151413] truncate cursor-pointer hover:text-[#BA3822]"
                            >
                              {alb.album_title}
                            </h4>
                            <p className="font-mono-meta text-xs text-[#58534C] truncate">{alb.artist_name}</p>
                            <div className="pt-2 flex items-center gap-2 font-mono-meta text-[11px]">
                              <button
                                onClick={() => handleOpenAlbumReview(alb)}
                                className="text-[#BA3822] font-bold hover:underline"
                              >
                                ★ Avaliar
                              </button>
                              <span className="text-[#888075]">·</span>
                              <button
                                onClick={() => setSelectedAlbum(alb)}
                                className="text-[#58534C] hover:underline"
                              >
                                Ver ficha
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* ESTADO 2: USUÁRIO COM AVALIAÇÕES (EXPERIÊNCIA 100% PERSONALIZADA) */
              <>
                {/* DISCO HERO PERSONALIZADO */}
                {(() => {
                  const hero = personalizedHome.heroAlbum || trendingAlbums[0];
                  if (!hero) return null;
                  return (
                    <section className="border-b-2 border-[#151413] pb-10">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        <div className="md:col-span-5">
                          <div
                            onClick={() => setSelectedAlbum(hero)}
                            className="cursor-pointer group aspect-square bg-[#151413] border-2 border-[#151413] shadow-md overflow-hidden relative"
                          >
                            <img
                              src={hero.cover_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2 font-mono-meta text-xs">
                              <span className="editorial-badge editorial-badge-accent">
                                {personalizedHome.isPersonalized ? 'RECOMENDADO PARA VOCÊ' : 'DISCO EM EVIDÊNCIA'}
                              </span>
                              <span className="editorial-badge">{hero.release_year || '1972'}</span>
                              <span className="editorial-badge">{hero.genre || 'MPB / PSICODELIA'}</span>
                            </div>

                            <h2 className="font-editorial-serif text-3xl sm:text-4xl font-black text-[#151413] tracking-tight leading-tight">
                              {hero.album_title}
                            </h2>
                            <h3 className="font-editorial-serif text-xl text-[#58534C] font-semibold mt-1">
                              {hero.artist_name}
                            </h3>

                            {personalizedHome.contextReason && (
                              <div className="mt-4 p-3 bg-[#FAF8F5] border-l-2 border-[#BA3822] font-reading-serif text-xs text-[#454038] italic">
                                ✦ {personalizedHome.contextReason}
                              </div>
                            )}

                            <p className="font-reading-serif text-sm text-[#454038] mt-3 leading-relaxed">
                              Obra recomendada com base nas suas afinidades musicais e notas atribuídas no diário. Explore as faixas, ouça prévias e registre sua avaliação.
                            </p>
                          </div>

                          <div className="pt-4 border-t border-rule flex flex-wrap items-center gap-3 font-mono-meta text-xs">
                            <button
                              onClick={() => setSelectedAlbum(hero)}
                              className="btn-editorial-primary text-xs py-2 px-4"
                            >
                              Ver Ficha Completa
                            </button>
                            <button
                              onClick={() => handleOpenAlbumReview(hero)}
                              className="btn-editorial-secondary text-xs py-2 px-4"
                            >
                              + Avaliar / Diário
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* SEÇÃO: MAIS OBRAS SEMELHANTES PERSONALIZADAS */}
                {personalizedHome.recommendedAlbums?.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-baseline justify-between border-b border-rule pb-2">
                      <div>
                        <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">
                          Mais Obras Semelhantes
                        </h3>
                        <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                          Discos alinhados com suas preferências e notas mais altas
                        </p>
                      </div>
                      <span className="editorial-badge">POR AFINIDADE</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {personalizedHome.recommendedAlbums.slice(0, 6).map((alb) => (
                        <div
                          key={alb.album_id}
                          onClick={() => setSelectedAlbum(alb)}
                          className="space-y-2 cursor-pointer group"
                        >
                          <div className="aspect-square bg-[#151413] border border-[#151413] shadow-sm overflow-hidden">
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
                            <p className="font-mono-meta text-xs text-[#58534C] truncate">{alb.artist_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* SEÇÃO: MÚSICAS SUGERIDAS POR AFINIDADE (COM PRÉVIA 30S) */}
                {personalizedHome.recommendedTracks?.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-baseline justify-between border-b border-rule pb-2">
                      <div>
                        <h3 className="font-editorial-serif text-2xl font-bold text-[#151413]">
                          Músicas Sugeridas por Afinidade
                        </h3>
                        <p className="text-xs font-mono-meta text-[#58534C] mt-0.5">
                          Canções individuais selecionadas com base no seu diário musical
                        </p>
                      </div>
                      <span className="editorial-badge editorial-badge-accent">PRÉVIA DE ÁUDIO</span>
                    </div>

                    <div className="font-mono-meta text-xs divide-y divide-rule border-b border-rule bg-[#FAF8F5] border border-rule">
                      {personalizedHome.recommendedTracks.slice(0, 6).map((tr) => (
                        <div
                          key={tr.track_id}
                          className="py-3 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#EFEAE1] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {tr.preview_url ? (
                              <button
                                onClick={() => setCurrentTrack(tr)}
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
                                onClick={() => setSelectedTrack(tr)}
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
                              onClick={() => setSelectedTrack(tr)}
                              className="btn-editorial-secondary text-[11px] py-1 px-2.5"
                            >
                              Ver música →
                            </button>
                            <button
                              onClick={() => handleOpenTrackReview(tr)}
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
              </>
            )}

            {/* SEÇÃO DUPLA: ATIVIDADE REAL DO USUÁRIO & MAIS OUVIDOS NA SEMANA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* ATIVIDADE DO USUÁRIO (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-baseline justify-between border-b border-rule pb-2">
                  <h3 className="font-editorial-serif text-xl font-bold text-[#151413]">
                    Sua Atividade Recente
                  </h3>
                  <span className="text-xs font-mono-meta text-[#888075]">DIÁRIO PESSOAL</span>
                </div>

                {reviews.length === 0 ? (
                  <div className="p-8 border border-rule bg-[#FAF8F5] text-center space-y-3">
                    <span className="font-editorial-serif text-base font-bold text-[#151413] block">
                      Sua atividade aparecerá aqui quando você começar a avaliar músicas ou álbuns.
                    </span>
                    <p className="font-reading-serif text-xs text-[#58534C] max-w-sm mx-auto">
                      Explore o acervo musical para começar a construir seu histórico crítico.
                    </p>
                    <div className="pt-1 flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setActiveTab('explore');
                          setSearchFilter('tracks');
                        }}
                        className="btn-editorial-primary text-xs py-2 px-4"
                      >
                        Avaliar faixa
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('explore');
                          setSearchFilter('albums');
                        }}
                        className="btn-editorial-secondary text-xs py-2 px-4"
                      >
                        Avaliar disco
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((rev) => {
                      const isTrack = rev.item_type === 'track';
                      return (
                        <article key={rev.id} className="border-b border-rule pb-4 flex gap-4 items-start">
                          <img
                            src={rev.cover_url || 'https://via.placeholder.com/300'}
                            alt=""
                            className="w-14 h-14 object-cover border border-[#151413] shrink-0 cursor-pointer"
                            onClick={() => {
                              if (isTrack) {
                                setSelectedTrack({
                                  track_id: rev.track_id,
                                  track_name: rev.track_name,
                                  artist_name: rev.artist_name,
                                  album_id: rev.album_id,
                                  album_title: rev.album_title,
                                  cover_url: rev.cover_url,
                                  duration_formatted: rev.duration_formatted,
                                  release_year: rev.release_year
                                });
                              } else {
                                setSelectedAlbum({
                                  album_id: rev.album_id,
                                  album_title: rev.album_title,
                                  artist_name: rev.artist_name,
                                  cover_url: rev.cover_url,
                                  release_year: rev.release_year,
                                  genre: rev.genre
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

                            {rev.review_text && (
                              <p className="font-reading-serif text-xs text-[#38332C] line-clamp-2">
                                "{rev.review_text}"
                              </p>
                            )}

                            <div className="text-[10px] font-mono-meta text-[#888075]">
                              {rev.user_username && (
                                <span className="font-bold text-[#BA3822] mr-1">
                                  @{rev.user_username} ·
                                </span>
                              )}
                              {isTrack
                                ? `Avaliação de música ${rev.album_title ? `(Álbum: ${rev.album_title})` : ''} · Ouvido em ${rev.listened_date || 'Hoje'}`
                                : `Avaliação do álbum · Ouvido em ${rev.listened_date || 'Hoje'} (${rev.media_format || 'Vinil'})`
                              }
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MAIS OUVIDOS NA SEMANA (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-baseline justify-between border-b border-rule pb-2">
                  <h3 className="font-editorial-serif text-xl font-bold text-[#151413]">
                    Mais Ouvidos na Semana
                  </h3>
                  <span className="text-[10px] font-mono-meta text-[#888075]">SELEÇÃO SOUNDLOG</span>
                </div>

                <div className="space-y-2 bg-[#EFEAE1] p-4 border border-rule font-mono-meta text-xs">
                  {trendingAlbums.slice(1, 6).map((alb, idx) => (
                    <div
                      key={alb.album_id}
                      onClick={() => setSelectedAlbum(alb)}
                      className="py-2.5 flex items-center justify-between gap-3 border-b border-rule last:border-0 cursor-pointer hover:bg-[#FAF8F5] px-2 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[#888075] font-bold">0{idx + 2}</span>
                        <div className="truncate">
                          <div className="font-bold text-[#151413] truncate">{alb.album_title}</div>
                          <div className="text-[11px] text-[#58534C] truncate">{alb.artist_name}</div>
                        </div>
                      </div>
                      <span className="text-[#BA3822] font-bold shrink-0">→</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* ABA: EXPLORAR */}
        {/* =================================================================== */}
        {activeTab === 'explore' && (
          <ExploreView
            trendingAlbums={trendingAlbums}
            personalizedData={personalizedExplore}
            communityUsers={communityUsers}
            followingIds={followingIds}
            onSelectAlbum={(alb) => setSelectedAlbum(alb)}
            onSelectTrack={(tr) => setSelectedTrack(tr)}
            onSelectUser={(u) => setSelectedUser(u)}
            onToggleFollow={handleToggleFollow}
            onRateAlbum={(alb) => handleOpenAlbumReview(alb)}
            onRateTrack={(tr) => handleOpenTrackReview(tr)}
            searchTerm={searchTerm}
            searchResults={searchResults}
            isSearching={isSearching}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            onPlayTrack={(track) => setCurrentTrack(track)}
            currentTrack={currentTrack}
            onSearchTag={(tag) => {
              setSearchTerm(tag);
              handleSearch(tag);
            }}
          />
        )}

        {/* =================================================================== */}
        {/* ABA: AVALIAÇÕES */}
        {/* =================================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="border-b-2 border-[#151413] pb-3 flex justify-between items-baseline">
              <h1 className="font-editorial-serif text-3xl font-bold text-[#151413]">Suas Avaliações & Críticas</h1>
              <span className="text-xs font-mono-meta text-[#888075]">{myReviews.length} REGISTROS</span>
            </div>

            {myReviews.length === 0 ? (
              <div className="p-10 border border-rule bg-[#FAF8F5] text-center space-y-3">
                <span className="font-editorial-serif text-xl font-bold text-[#151413] block">
                  Você ainda não avaliou nenhuma música ou álbum.
                </span>
                <p className="font-reading-serif text-xs text-[#58534C]">
                  Pesquise no catálogo para atribuir sua primeira nota de 0.5 a 5.0 estrelas.
                </p>
                <div className="pt-2">
                  <button onClick={() => setActiveTab('explore')} className="btn-editorial-primary text-xs py-2 px-6">
                    Explorar catálogo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {myReviews.map((rev) => {
                  const isTrack = rev.item_type === 'track';
                  return (
                    <article key={rev.id} className="p-4 bg-[#FAF8F5] border border-rule flex flex-col sm:flex-row gap-4 items-start">
                      <img
                        src={rev.cover_url || 'https://via.placeholder.com/300'}
                        alt=""
                        className="w-16 h-16 object-cover border border-[#151413] shrink-0 cursor-pointer"
                        onClick={() => {
                          if (isTrack) {
                            setSelectedTrack({
                              track_id: rev.track_id,
                              track_name: rev.track_name,
                              artist_name: rev.artist_name,
                              album_id: rev.album_id,
                              album_title: rev.album_title,
                              cover_url: rev.cover_url
                            });
                          } else {
                            setSelectedAlbum({
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
                            <h4 className="font-editorial-serif text-lg font-bold text-[#151413] truncate">
                              {isTrack ? rev.track_name : rev.album_title}
                              <span className="text-xs text-[#58534C] font-normal ml-1">· {rev.artist_name}</span>
                            </h4>
                          </div>
                          <span className="text-sm font-mono-meta font-bold text-[#BA3822] shrink-0 pl-2">
                            ★ {Number(rev.rating).toFixed(1)}
                          </span>
                        </div>
                        {rev.review_text && (
                          <p className="font-reading-serif text-sm text-[#38332C]">"{rev.review_text}"</p>
                        )}
                        <div className="flex justify-between items-center text-xs font-mono-meta text-[#888075] pt-2 border-t border-rule">
                          <span>{rev.listened_date} ({rev.media_format || 'Streaming'})</span>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                if (isTrack) handleOpenTrackReview(rev);
                                else handleOpenAlbumReview(rev);
                              }}
                              className="text-[#BA3822] hover:underline"
                            >
                              Editar
                            </button>
                            <button onClick={() => handleDeleteReview(rev.id)} className="text-[#9E2A1B] hover:underline">
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA: LISTAS */}
        {/* =================================================================== */}
        {activeTab === 'lists' && (
          <ListsView
            lists={lists}
            onOpenCreateList={() => setShowCreateList(true)}
            onDeleteList={handleDeleteList}
          />
        )}

        {/* =================================================================== */}
        {/* ABA: DIÁRIO */}
        {/* =================================================================== */}
        {activeTab === 'diary' && (
          <DiaryView
            reviews={myReviews}
            onSelectAlbum={(alb) => setSelectedAlbum(alb)}
            onSelectTrack={(tr) => setSelectedTrack(tr)}
            onNavigateExplore={() => setActiveTab('explore')}
          />
        )}

        {/* =================================================================== */}
        {/* ABA: PERFIL DO USUÁRIO */}
        {/* =================================================================== */}
        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            reviews={myReviews}
            diaryLogs={myReviews}
            lists={lists}
            followingIds={followingIds}
            followersCount={followersCount}
            communityUsers={communityUsers}
            onSelectAlbum={(alb) => setSelectedAlbum(alb)}
            onSelectTrack={(tr) => setSelectedTrack(tr)}
            onSelectUser={(u) => setSelectedUser(u)}
            onToggleFollow={handleToggleFollow}
            onOpenEditProfile={() => setShowEditProfile(true)}
            onDeleteReview={handleDeleteReview}
            onOpenCreateList={() => setShowCreateList(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

      </div>

      {/* MINI PLAYER FLUTUANTE DE ÁUDIO */}
      {currentTrack && (
        <MiniPlayer
          track={currentTrack}
          onClose={() => setCurrentTrack(null)}
        />
      )}

      {/* MODAL DE DETALHES DO ÁLBUM */}
      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          userReview={reviews.find(r => (r.item_type === 'album' || !r.item_type) && String(r.album_id) === String(selectedAlbum.album_id))}
          allReviews={reviews}
          onClose={() => setSelectedAlbum(null)}
          onOpenReview={(alb) => handleOpenAlbumReview(alb)}
          onSelectTrack={(tr) => setSelectedTrack(tr)}
          onOpenTrackReview={(tr) => handleOpenTrackReview(tr)}
          onDeleteReview={handleDeleteReview}
          onPlayTrack={(tr) => setCurrentTrack(tr)}
          currentPlayingTrack={currentTrack}
        />
      )}

      {/* MODAL DE DETALHES DA MÚSICA / FAIXA */}
      {selectedTrack && (
        <TrackDetailModal
          track={selectedTrack}
          userReview={reviews.find(r => r.item_type === 'track' && String(r.track_id) === String(selectedTrack.track_id))}
          trackReviews={reviews.filter(r => r.item_type === 'track' && String(r.track_id) === String(selectedTrack.track_id))}
          onClose={() => setSelectedTrack(null)}
          onOpenReview={(tr) => handleOpenTrackReview(tr)}
          onOpenAlbum={(alb) => setSelectedAlbum(alb)}
          onPlayTrack={(tr) => setCurrentTrack(tr)}
          currentPlayingTrack={currentTrack}
          onDeleteReview={handleDeleteReview}
        />
      )}

      {/* MODAL DE PERFIL PÚBLICO DE OUTRO USUÁRIO (COM SEGUIR/DEIXAR DE SEGUIR) */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isFollowing={followingIds.includes(selectedUser.id)}
          onToggleFollow={handleToggleFollow}
          onClose={() => setSelectedUser(null)}
          onSelectAlbum={(alb) => {
            setSelectedUser(null);
            setSelectedAlbum(alb);
          }}
          onSelectTrack={(tr) => {
            setSelectedUser(null);
            setSelectedTrack(tr);
          }}
        />
      )}

      {/* MODAL DE AVALIAÇÃO / RESENHA (MÚSICA OU ÁLBUM) */}
      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          type={reviewType}
          existingReview={reviews.find(r => {
            if (reviewType === 'track') {
              return r.item_type === 'track' && String(r.track_id) === String(reviewItem.track_id);
            }
            return (r.item_type === 'album' || !r.item_type) && String(r.album_id) === String(reviewItem.album_id);
          })}
          onClose={() => setReviewItem(null)}
          onSaveReview={handleSaveReview}
          onDeleteReview={handleDeleteReview}
        />
      )}

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* MODAL DE CRIAR LISTA */}
      {showCreateList && (
        <CreateListModal
          onClose={() => setShowCreateList(false)}
          onSave={handleSaveList}
        />
      )}

      {/* MODAL DE ONBOARDING INICIAL */}
      {showOnboarding && (
        <OnboardingModal
          userSession={userSession}
          onFinish={(updated) => {
            setProfile(updated);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* BOTTOM NAVIGATION (MOBILE) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchTerm('');
        }}
      />

      {/* RODAPÉ EDITORIAL COMPACTO */}
      <footer className="border-t-2 border-[#151413] mt-auto py-8 bg-[#EFEAE1] text-xs font-mono-meta text-[#58534C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="Soundlog"
              className="h-8 w-auto object-contain mix-blend-multiply"
            />
            <span className="text-[10px] text-[#888075] border-l border-rule pl-3">
              ARQUIVO CRÍTICO & MEMÓRIA MUSICAL
            </span>
          </div>


          <div className="flex items-center gap-6 text-[11px]">
            <a href="javascript:void(0)" onClick={() => alert('Termos de Uso: O Soundlog é uma plataforma cultural comunitária.')} className="hover:text-[#BA3822]">Termos</a>
            <a href="javascript:void(0)" onClick={() => alert('Privacidade: Seus dados pertencem a você e não são comercializados.')} className="hover:text-[#BA3822]">Privacidade</a>
            <a href="javascript:void(0)" onClick={() => alert('Contato: contato@soundlog.fm')} className="hover:text-[#BA3822]">Contato</a>
            <a href="javascript:void(0)" onClick={() => alert('Manifesto: Pela audição de álbuns completos e valorização da crítica musical independente.')} className="hover:text-[#BA3822]">Manifesto</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

