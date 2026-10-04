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

export const DEFAULT_COMMUNITY_USERS = [
  {
    id: 'user-rodrigo-clube',
    username: 'clube_da_esquina',
    full_name: 'Rodrigo Alencar',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Colecionador de prensagens originais da MPB e Clube da Esquina. Crítico independente.',
    location: 'Belo Horizonte, MG',
    favorite_artist: 'Milton Nascimento, Lô Borges, Beto Guedes',
    favorite_genres: ['MPB', 'Psicodelia', 'Jazz'],
    reviews_count: 142,
    followers_count: 318,
    recent_reviews: [
      {
        item_type: 'album',
        album_title: 'Clube da Esquina',
        artist_name: 'Milton Nascimento & Lô Borges',
        rating: 5.0,
        review_text: 'O monumento sonoro mais rico e poético já concebido na música universal.'
      },
      {
        item_type: 'track',
        track_name: 'Trem Azul',
        artist_name: 'Lô Borges',
        album_title: 'Clube da Esquina',
        rating: 5.0,
        review_text: 'Arranjo de cordas sublime e guitarra inconfundível de Toninho Horta.'
      }
    ]
  },
  {
    id: 'user-mariana-discoteca',
    username: 'discoteca_basica',
    full_name: 'Mariana Souza',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    bio: 'Jornalista cultural, pesquisadora de Samba-Jazz, Bossa e discos fundamentais do século XX.',
    location: 'Rio de Janeiro, RJ',
    favorite_artist: 'Arthur Verocai, Elis Regina, Quarteto em Cy',
    favorite_genres: ['Samba-Jazz', 'Bossa Nova', 'MPB'],
    reviews_count: 210,
    followers_count: 540,
    recent_reviews: [
      {
        item_type: 'album',
        album_title: 'Arthur Verocai',
        artist_name: 'Arthur Verocai',
        rating: 5.0,
        review_text: 'Os arranjos orquestrais de Verocai encontram o groove perfeito neste clássico imortal de 1972.'
      },
      {
        item_type: 'track',
        track_name: 'Águas de Março',
        artist_name: 'Elis Regina & Tom Jobim',
        album_title: 'Elis & Tom',
        rating: 5.0,
        review_text: 'A maior química vocal da história da canção brasileira.'
      }
    ]
  },
  {
    id: 'user-joao-groove',
    username: 'joao_groove',
    full_name: 'João Vitor Ribeiro',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Fissurado em Soul brasileiro dos anos 70, Tim Maia, funk de raiz e psicodelia nordestina.',
    location: 'Recife, PE',
    favorite_artist: 'Tim Maia, Alceu Valença, Jorge Ben Jor',
    favorite_genres: ['Soul', 'Funk 70s', 'Tropicália'],
    reviews_count: 98,
    followers_count: 184,
    recent_reviews: [
      {
        item_type: 'album',
        album_title: 'A Tábua de Esmeralda',
        artist_name: 'Jorge Ben Jor',
        rating: 5.0,
        review_text: 'Alquimia pura gravada em fita analógica. A batida do violão transcende qualquer época.'
      }
    ]
  },
  {
    id: 'user-beatriz-som',
    username: 'beatriz_som',
    full_name: 'Beatriz Lima',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    bio: 'Resenhas de lançamentos independentes, indie nacional e discos esquecidos da Tropicália.',
    location: 'São Paulo, SP',
    favorite_artist: 'Tim Bernardes, Gal Costa, O Terno',
    favorite_genres: ['Indie', 'MPB', 'Folk'],
    reviews_count: 175,
    followers_count: 420,
    recent_reviews: [
      {
        item_type: 'album',
        album_title: 'Recomeçar',
        artist_name: 'Tim Bernardes',
        rating: 4.5,
        review_text: 'Voz, violão, orquestrações intimistas e composições de doer a alma.'
      },
      {
        item_type: 'track',
        track_name: 'Baby',
        artist_name: 'Gal Costa',
        album_title: 'Gal Costa (1969)',
        rating: 5.0,
        review_text: 'A delicadeza e a vanguarda tropicalista em seu auge absoluto.'
      }
    ]
  },
  {
    id: 'user-carlos-caetano',
    username: 'caetano_archive',
    full_name: 'Carlos Eduardo',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    bio: 'Documentando tudo da era de ouro da Tropicália e rock psicodélico latino-americano.',
    location: 'Salvador, BA',
    favorite_artist: 'Caetano Veloso, Os Mutantes, Gilberto Gil',
    favorite_genres: ['Tropicália', 'Psicodelia', 'Rock Brasileiro'],
    reviews_count: 133,
    followers_count: 290,
    recent_reviews: [
      {
        item_type: 'album',
        album_title: 'Transa',
        artist_name: 'Caetano Veloso',
        rating: 5.0,
        review_text: 'O exílio em Londres transformado em poesia crua, groove e saudade.'
      }
    ]
  },
  {
    id: 'user-lucas-vinil',
    username: 'vinil_critico',
    full_name: 'Lucas Mendes',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    bio: 'Ouvinte focado em formatos físicos, fitas cassete e pós-punk nacional e internacional.',
    location: 'Curitiba, PR',
    favorite_artist: 'Portishead, Joy Division, Legião Urbana',
    favorite_genres: ['Pós-Punk', 'Trip-Hop', 'Rock Alternativo'],
    reviews_count: 164,
    followers_count: 360,
    recent_reviews: [
      {
        item_type: 'album',
        album_title: 'Dummy',
        artist_name: 'Portishead',
        rating: 5.0,
        review_text: 'Clima noir, scratches hipnóticos e a voz inigualável de Beth Gibbons.'
      }
    ]
  }
];

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

  // Combina perfis do Supabase com os usuários da comunidade editorial
  const allUsersMap = new Map();

  // Adiciona usuários do Supabase
  supabaseUsers.forEach((u) => {
    if (u.id !== currentUserId) {
      allUsersMap.set(u.id, {
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
        recent_reviews: []
      });
    }
  });

  // Adiciona e filtra usuários da comunidade editorial
  DEFAULT_COMMUNITY_USERS.forEach((u) => {
    if (u.id !== currentUserId && !allUsersMap.has(u.id)) {
      const matchUsername = u.username.toLowerCase().includes(normalized);
      const matchName = u.full_name.toLowerCase().includes(normalized);
      const matchBio = u.bio.toLowerCase().includes(normalized);
      const matchArtist = u.favorite_artist?.toLowerCase().includes(normalized);
      const matchGenres = u.favorite_genres?.some((g) => g.toLowerCase().includes(normalized));

      if (matchUsername || matchName || matchBio || matchArtist || matchGenres) {
        allUsersMap.set(u.id, u);
      }
    }
  });

  const followingList = getLocalFollows(currentUserId);
  const results = Array.from(allUsersMap.values()).map((user) => ({
    ...user,
    is_following: followingList.includes(user.id)
  }));

  return results;
};

