import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://wqgkouxgstnokzbyjbfd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_ML629Jm3cBZKIloXPi88oA_X-eb5bdn';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('soundlog_sb_url') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('soundlog_sb_key') || DEFAULT_SUPABASE_ANON_KEY;
const SESSION_PREFERENCE_KEY = 'soundlog_remember_session';

const authStorage = {
  getItem: async (key) => {
    const storage = localStorage.getItem(SESSION_PREFERENCE_KEY) === 'false' ? sessionStorage : localStorage;
    return storage.getItem(key);
  },
  setItem: async (key, value) => {
    const rememberSession = localStorage.getItem(SESSION_PREFERENCE_KEY) !== 'false';
    const storage = rememberSession ? localStorage : sessionStorage;
    const otherStorage = rememberSession ? sessionStorage : localStorage;
    otherStorage.removeItem(key);
    storage.setItem(key, value);
  },
  removeItem: async (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 10
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { storage: authStorage } })
  : null;

const getAuthenticatedUser = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user || null;
};

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ---------------------------------------------------------------------------
// PROFILE STORAGE HELPERS
// ---------------------------------------------------------------------------
export const getLocalProfile = () => {
  const sessionData = localStorage.getItem('soundlog_session');
  const session = sessionData ? JSON.parse(sessionData) : null;
  const data = localStorage.getItem('soundlog_profile');
  
  if (data) {
    return JSON.parse(data);
  }
  
  if (session && session.username) {
    const userProfile = {
      id: session.id || generateUUID(),
      username: session.username,
      full_name: session.full_name || session.display_name || session.username,
      avatar_url: session.avatar_url || '',
      bio: '',
      location: '',
      website: '',
      favorite_artist: '',
      favorite_genres: []
    };
    localStorage.setItem('soundlog_profile', JSON.stringify(userProfile));
    return userProfile;
  }

  return null;
};

export const saveLocalProfile = (profileData) => {
  const current = getLocalProfile() || {};
  const updated = { ...current, ...profileData };
  localStorage.setItem('soundlog_profile', JSON.stringify(updated));
  return updated;
};

export const isUsernameAvailable = async (username) => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const normalizedUsername = username.trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (error) throw error;
  return data === null;
};

// ---------------------------------------------------------------------------
// REVIEWS & RATINGS STORAGE HELPERS (SUPPORTS INDEPENDENT ALBUM & TRACK RATINGS)
// ---------------------------------------------------------------------------
export const getLocalReviews = () => {
  const data = localStorage.getItem('soundlog_reviews');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveLocalReviews = (reviews) => {
  localStorage.setItem('soundlog_reviews', JSON.stringify(reviews));
};

// Lists storage helpers
export const getLocalLists = () => {
  const data = localStorage.getItem('soundlog_lists');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveLocalList = (newList) => {
  const lists = getLocalLists();
  const existingIdx = lists.findIndex((l) => l.id === newList.id);
  let updatedLists;
  if (existingIdx >= 0) {
    updatedLists = [...lists];
    updatedLists[existingIdx] = newList;
  } else {
    updatedLists = [newList, ...lists];
  }
  localStorage.setItem('soundlog_lists', JSON.stringify(updatedLists));
  return updatedLists;
};

export const deleteList = (listId) => {
  const lists = getLocalLists();
  const updated = lists.filter((l) => l.id !== listId);
  localStorage.setItem('soundlog_lists', JSON.stringify(updated));
  return updated;
};

// ---------------------------------------------------------------------------
// SUPABASE OPERATIONS FOR ALBUMS & TRACKS
// ---------------------------------------------------------------------------

export const fetchReviews = async () => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      const reviews = data || [];
      saveLocalReviews(reviews);
      return reviews;
    } catch (err) {
      console.warn('Erro ao buscar reviews no Supabase, usando local:', err);
      return getLocalReviews();
    }
  }
  return getLocalReviews();
};

export const createOrUpdateReview = async (evalData, userSession = null) => {
  const itemType = evalData.item_type || (evalData.track_id ? 'track' : 'album');
  const authenticatedUser = await getAuthenticatedUser().catch(() => null);
  if (supabase && userSession?.id && !authenticatedUser) {
    throw new Error('Sua sessão expirou. Entre novamente para salvar a avaliação.');
  }
  if (authenticatedUser && userSession?.id && authenticatedUser.id !== userSession.id) {
    throw new Error('A sessão ativa não corresponde ao usuário atual. Entre novamente.');
  }

  const evalToSave = {
    ...evalData,
    item_type: itemType,
    id: evalData.id || generateUUID(),
    user_id: authenticatedUser?.id || userSession?.id || null,
    user_username: userSession?.username || evalData.user_username || 'ouvinte',
    user_name: userSession?.full_name || userSession?.username || evalData.user_name || 'Ouvinte',
    user_avatar: userSession?.avatar_url || evalData.user_avatar || '',
    created_at: evalData.created_at || new Date().toISOString()
  };

  if (authenticatedUser && isSupabaseConfigured() && supabase) {
    const cloudReview = Object.fromEntries(
      Object.entries(evalToSave).filter(([key]) =>
        !['user_username', 'user_name', 'user_avatar'].includes(key)
      )
    );
    const { data, error } = await supabase
      .from('reviews')
      .upsert(cloudReview)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('O Supabase não confirmou a avaliação.');
    const localReviews = getLocalReviews().filter((review) => review.id !== data.id);
    saveLocalReviews([data, ...localReviews]);
    return data;
  }

  // Local Storage Save
  const localReviews = getLocalReviews();
  const existingIndex = localReviews.findIndex((r) => r.id === evalToSave.id);
  let updated;
  if (existingIndex >= 0) {
    updated = [...localReviews];
    updated[existingIndex] = evalToSave;
  } else {
    updated = [evalToSave, ...localReviews];
  }
  saveLocalReviews(updated);
  return evalToSave;
};

export const deleteReview = async (reviewId) => {
  const authenticatedUser = await getAuthenticatedUser().catch(() => null);
  if (supabase && !authenticatedUser) {
    throw new Error('Sua sessão expirou. Entre novamente para excluir a avaliação.');
  }
  if (authenticatedUser && isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', authenticatedUser.id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('A avaliação não foi encontrada ou não pertence à sua conta.');
  }

  const localReviews = getLocalReviews();
  const updated = localReviews.filter((review) => review.id !== reviewId);
  saveLocalReviews(updated);
  return updated;
};

export const fetchProfile = async (userSession) => {
  if (!userSession) return null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userSession.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        saveLocalProfile(data);
        return data;
      }
    } catch (err) {
      console.warn('Erro ao buscar perfil no Supabase:', err);
    }
  }

  return getLocalProfile();
};

export const updateProfile = async (profileData, { strict = false } = {}) => {
  const authenticatedUser = await getAuthenticatedUser().catch(() => null);
  if (authenticatedUser && isSupabaseConfigured() && supabase) {
    const payload = {
      id: authenticatedUser.id,
      username: profileData.username,
      display_name: profileData.full_name || profileData.display_name || profileData.username,
      avatar_url: profileData.avatar_url || '',
      bio: profileData.bio || '',
      location: profileData.location || '',
      website: profileData.website || '',
      favorite_artist: profileData.favorite_artist || '',
      favorite_genres: profileData.favorite_genres || [],
      is_public_reviews: profileData.is_public_reviews ?? true,
      is_public_diary: profileData.is_public_diary ?? true,
      allow_followers: profileData.allow_followers ?? true
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Erro ao salvar perfil no Supabase:', error);
      if (strict) throw error;
    } else if (data) {
      saveLocalProfile(data);
      return data;
    }
  } else if (strict) {
    throw new Error('Não foi possível salvar o perfil no Supabase. Entre novamente e tente outra vez.');
  }

  return saveLocalProfile(profileData);
};

// ---------------------------------------------------------------------------
// 4. SISTEMA DE SEGUIDORES E DESCOBERTA DE USUÁRIOS
// ---------------------------------------------------------------------------

export const DEFAULT_COMMUNITY_USERS = [];

/**
 * Busca perfis reais de usuários cadastrados no Supabase para sugestão na comunidade
 */
export const fetchCommunityProfiles = async (currentUserId = null) => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);

      if (!error && data) {
        const followingList = getLocalFollows(currentUserId);
        return data
          .filter((u) => u.id !== currentUserId)
          .map((u) => ({
            id: u.id,
            username: u.username || 'usuario',
            full_name: u.full_name || u.display_name || u.username,
            avatar_url: u.avatar_url || '',
            bio: u.bio || '',
            location: u.location || '',
            favorite_artist: u.favorite_artist || '',
            favorite_genres: u.favorite_genres || [],
            reviews_count: u.reviews_count || 0,
            followers_count: u.followers_count || 0,
            recent_reviews: [],
            is_following: followingList.includes(u.id)
          }));
      }
    } catch (err) {
      console.warn('Erro ao carregar perfis da comunidade no Supabase:', err);
    }
  }
  return [];
};

export const getLocalFollows = (userId = 'default') => {
  const key = `soundlog_follows_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveLocalFollows = (userId = 'default', followingList = []) => {
  const key = `soundlog_follows_${userId}`;
  localStorage.setItem(key, JSON.stringify(followingList));
};

export const fetchFollows = async (userId) => {
  if (!userId) return [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (!error && data) {
        const followingIds = data.map((d) => d.following_id);
        saveLocalFollows(userId, followingIds);
        return followingIds;
      }
    } catch (err) {
      console.warn('Erro ao buscar follows no Supabase:', err);
    }
  }

  return getLocalFollows(userId);
};

export const toggleFollowUser = async (currentUserId, targetUserId) => {
  const authenticatedUser = await getAuthenticatedUser().catch(() => null);
  if (!authenticatedUser || authenticatedUser.id !== currentUserId || !targetUserId || currentUserId === targetUserId) {
    const following = currentUserId ? getLocalFollows(currentUserId) : [];
    return { isFollowing: following.includes(targetUserId), following };
  }

  const currentFollowing = getLocalFollows(currentUserId);
  const isCurrentlyFollowing = currentFollowing.includes(targetUserId);

  let updatedFollowing;
  if (isCurrentlyFollowing) {
    updatedFollowing = currentFollowing.filter((id) => id !== targetUserId);
  } else {
    updatedFollowing = [...currentFollowing, targetUserId];
  }

  saveLocalFollows(currentUserId, updatedFollowing);

  // Sync with Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      let result;
      if (isCurrentlyFollowing) {
        result = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
      } else {
        result = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });
      }
      if (result.error) throw result.error;
    } catch (err) {
      console.warn('Erro ao sincronizar follow no Supabase:', err);
      saveLocalFollows(currentUserId, currentFollowing);
      return { isFollowing: isCurrentlyFollowing, following: currentFollowing, error: err };
    }
  }

  return {
    isFollowing: !isCurrentlyFollowing,
    following: updatedFollowing
  };
};

// ---------------------------------------------------------------------------
// CONTAGEM DE SEGUIDORES E AVALIAÇÕES DE USUÁRIOS REAIS
// ---------------------------------------------------------------------------
export const fetchUserFollowersCount = async (userId) => {
  if (!userId) return 0;
  if (isSupabaseConfigured() && supabase) {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      if (!error && typeof count === 'number') {
        return count;
      }
    } catch (err) {
      console.warn('Erro ao contar seguidores no Supabase:', err);
    }
  }
  return 0;
};

export const fetchUserReviews = async (userId) => {
  if (!userId) return [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Erro ao buscar avaliações do usuário no Supabase:', err);
    }
  }
  return [];
};

/**
 * Sincroniza avaliações salvas localmente para o Supabase caso tenham sido feitas offline
 */
export const syncLocalReviewsToSupabase = async (userSession) => {
  const authenticatedUser = await getAuthenticatedUser().catch(() => null);
  if (!authenticatedUser?.id || authenticatedUser.id !== userSession?.id || !isSupabaseConfigured() || !supabase) return [];
  try {
    const local = getLocalReviews() || [];

    const { data: cloudReviews, error: cloudError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userSession.id)
      .limit(200);
    if (cloudError) throw cloudError;

    const cloudIds = new Set((cloudReviews || []).map((r) => r.id));
    const toUpload = local.filter((r) => r.user_id === authenticatedUser.id && !cloudIds.has(r.id));

    if (toUpload.length > 0) {
      for (const rev of toUpload) {
        await createOrUpdateReview({
          ...rev,
          user_id: authenticatedUser.id
        }, userSession);
      }
    }

    const { data: allFresh } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!allFresh) throw new Error('Não foi possível atualizar as avaliações.');
    saveLocalReviews(allFresh);
    return allFresh;
  } catch (err) {
    console.warn('Erro na sincronização de reviews locais para Supabase:', err);
    return getLocalReviews().filter((review) => review.user_id === authenticatedUser.id);
  }
};

/**
 * Busca ouvintes/usuários do Soundlog pelo termo pesquisado com métricas reais
 */
export const searchUsers = async (term, currentUserId = null) => {
  if (!term || !term.trim()) return [];
  const normalized = term.toLowerCase().trim().replace(/^@/, '').replace(/[^\p{L}\p{N}_ -]/gu, '').trim();
  if (!normalized) return [];

  let supabaseUsers = [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${normalized}%,display_name.ilike.%${normalized}%`)
        .limit(15);

      if (!error && data) {
        supabaseUsers = data;
      }
    } catch (err) {
      console.warn('Erro ao buscar perfis no Supabase:', err);
    }
  }

  const followingList = getLocalFollows(currentUserId);

  // Enriquece os resultados com contagem de seguidores e avaliações reais
  const results = await Promise.all(
    supabaseUsers
      .filter((u) => u.id !== currentUserId)
      .map(async (u) => {
        const [followersCount, reviews] = await Promise.all([
          fetchUserFollowersCount(u.id),
          fetchUserReviews(u.id)
        ]);

        return {
          id: u.id,
          username: u.username || 'usuario',
          full_name: u.display_name || u.full_name || u.username,
          avatar_url: u.avatar_url || '',
          bio: u.bio || '',
          location: u.location || '',
          favorite_artist: u.favorite_artist || '',
          favorite_genres: u.favorite_genres || [],
          reviews_count: reviews.length,
          followers_count: followersCount,
          recent_reviews: reviews,
          is_following: followingList.includes(u.id)
        };
      })
  );

  return results;
};

