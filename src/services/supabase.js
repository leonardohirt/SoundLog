import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('soundlog_sb_url') || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('soundlog_sb_key') || '';

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 10
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        saveLocalReviews(data);
        return data;
      }
      return getLocalReviews();
    } catch (err) {
      console.warn('Erro ao buscar reviews no Supabase, usando local:', err);
      return getLocalReviews();
    }
  }
  return getLocalReviews();
};

export const createOrUpdateReview = async (evalData) => {
  const itemType = evalData.item_type || (evalData.track_id ? 'track' : 'album');

  const evalToSave = {
    ...evalData,
    item_type: itemType,
    id: evalData.id || generateUUID(),
    created_at: evalData.created_at || new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .upsert(evalToSave)
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      console.warn('Erro ao salvar no Supabase, salvando localmente:', err);
    }
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
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    } catch (err) {
      console.warn('Erro ao deletar no Supabase, deletando local:', err);
    }
  }

  const localReviews = getLocalReviews();
  const updated = localReviews.filter((r) => r.id !== reviewId);
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

export const updateProfile = async (profileData) => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        saveLocalProfile(data[0]);
        return data[0];
      }
    } catch (err) {
      console.warn('Erro ao salvar perfil no Supabase:', err);
    }
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
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { isFollowing: false, following: [] };
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
      if (isCurrentlyFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });
      }
    } catch (err) {
      console.warn('Erro ao sincronizar follow no Supabase:', err);
    }
  }

  return {
    isFollowing: !isCurrentlyFollowing,
    following: updatedFollowing
  };
};

/**
 * Busca ouvintes/usuários do Soundlog pelo termo pesquisado
 */
export const searchUsers = async (term, currentUserId = null) => {
  if (!term || !term.trim()) return [];
  const normalized = term.toLowerCase().trim().replace(/^@/, '');

  let supabaseUsers = [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${normalized}%,full_name.ilike.%${normalized}%,bio.ilike.%${normalized}%,favorite_artist.ilike.%${normalized}%`)
        .limit(10);

      if (!error && data) {
        supabaseUsers = data;
      }
    } catch (err) {
      console.warn('Erro ao buscar perfis no Supabase:', err);
    }
  }

  // Retorna única e exclusivamente usuários reais cadastrados no Supabase
  const results = supabaseUsers
    .filter((u) => u.id !== currentUserId)
    .map((u) => {
      const followingList = getLocalFollows(currentUserId);
      return {
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
      };
    });

  return results;
};

