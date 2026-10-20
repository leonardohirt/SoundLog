// Soundlog Spotify API Service
// Gerencia autenticação Client Credentials e endpoints de busca e detalhes de álbuns

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtém ou renova o token de acesso da aplicação no Spotify
 */
export const getSpotifyToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const response = await fetch('/api/spotify-token');

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.access_token) return null;

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + Math.max(0, data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.warn('Token do Spotify indisponível, usando fallback:', error);
    return null;
  }
};

/**
 * Busca álbuns no catálogo global do Spotify
 */
export const searchSpotifyAlbums = async (query) => {
  if (!query || !query.trim()) return [];

  const token = await getSpotifyToken();
  if (!token) {
    console.warn('Token do Spotify indisponível, usando fallback');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=20&market=BR`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na busca do Spotify: ${response.status}`);
    }

    const data = await response.json();
    return (data.albums?.items || []).map((item) => ({
      album_id: item.id,
      album_title: item.name,
      artist_name: (item.artists || []).map(a => a.name).join(', '),
      cover_url: item.images?.[0]?.url || item.images?.[1]?.url || '',
      release_year: item.release_date ? item.release_date.substring(0, 4) : 'N/A',
      release_date: item.release_date || '',
      track_count: item.total_tracks || 0,
      genre: 'Música',
      spotify_url: item.external_urls?.spotify || `https://open.spotify.com/album/${item.id}`
    }));
  } catch (error) {
    console.error('Erro ao buscar álbuns no Spotify:', error);
    return [];
  }
};

/**
 * Busca faixas individuais no Spotify
 */
export const searchSpotifyTracks = async (query) => {
  if (!query || !query.trim()) return [];

  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=25&market=BR`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    return (data.tracks?.items || []).map((track) => ({
      track_id: track.id,
      track_name: track.name,
      artist_name: (track.artists || []).map(a => a.name).join(', '),
      album_id: track.album?.id,
      album_title: track.album?.name,
      cover_url: track.album?.images?.[0]?.url || '',
      duration_ms: track.duration_ms,
      duration_seconds: Math.round(track.duration_ms / 1000),
      preview_url: track.preview_url,
      release_year: track.album?.release_date ? track.album.release_date.substring(0, 4) : 'N/A',
      spotify_url: track.external_urls?.spotify
    }));
  } catch (error) {
    console.error('Erro ao buscar faixas no Spotify:', error);
    return [];
  }
};

/**
 * Obtém detalhes completos do álbum com lista de faixas e áudio preview
 */
export const getSpotifyAlbumDetails = async (albumId) => {
  if (!albumId) return null;

  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}?market=BR`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao obter álbum: ${response.status}`);
    }

    const data = await response.json();

    const tracks = (data.tracks?.items || []).map((t) => ({
      track_id: t.id,
      track_number: t.track_number,
      disc_number: t.disc_number || 1,
      track_name: t.name,
      duration_ms: t.duration_ms,
      duration_formatted: formatDuration(t.duration_ms),
      preview_url: t.preview_url,
      artist_name: (t.artists || []).map(a => a.name).join(', '),
      spotify_url: t.external_urls?.spotify
    }));

    return {
      album_id: data.id,
      album_title: data.name,
      artist_name: (data.artists || []).map(a => a.name).join(', '),
      cover_url: data.images?.[0]?.url || data.images?.[1]?.url || '',
      release_year: data.release_date ? data.release_date.substring(0, 4) : 'N/A',
      release_date: data.release_date,
      genre: data.genres?.length ? data.genres.join(' / ') : 'Música / Álbum',
      record_label: data.label || '',
      copyright: data.copyrights?.[0]?.text || '',
      total_tracks: data.total_tracks || tracks.length,
      spotify_url: data.external_urls?.spotify,
      tracks
    };
  } catch (error) {
    console.error('Erro ao obter detalhes do álbum no Spotify:', error);
    return null;
  }
};

export const formatDuration = (ms) => {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Obtém detalhes completos de uma faixa individual no Spotify
 */
export const getSpotifyTrackDetails = async (trackId) => {
  if (!trackId) return null;

  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}?market=BR`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao obter faixa: ${response.status}`);
    }

    const data = await response.json();
    return {
      track_id: data.id,
      track_name: data.name,
      artist_name: (data.artists || []).map(a => a.name).join(', '),
      album_id: data.album?.id,
      album_title: data.album?.name,
      cover_url: data.album?.images?.[0]?.url || data.album?.images?.[1]?.url || '',
      duration_ms: data.duration_ms,
      duration_formatted: formatDuration(data.duration_ms),
      preview_url: data.preview_url,
      release_year: data.album?.release_date ? data.album.release_date.substring(0, 4) : 'N/A',
      spotify_url: data.external_urls?.spotify
    };
  } catch (error) {
    console.error('Erro ao obter detalhes da faixa no Spotify:', error);
    return null;
  }
};

