// Unified Music API Layer (Spotify Primary + iTunes Fallback)
import * as spotify from './spotifyApi';

const ITUNES_BASE_URL = 'https://itunes.apple.com';

const getHighResCover = (url) => {
  if (!url) return '';
  return url.replace('100x100bb.jpg', '600x600bb.jpg')
            .replace('100x100bb.png', '600x600bb.jpg')
            .replace('60x60bb.jpg', '600x600bb.jpg');
};

export const searchAlbums = async (term) => {
  if (!term || !term.trim()) return [];

  // Try Spotify First
  const spotifyResults = await spotify.searchSpotifyAlbums(term);
  if (spotifyResults && spotifyResults.length > 0) {
    return spotifyResults;
  }

  // Fallback to iTunes
  try {
    const response = await fetch(
      `${ITUNES_BASE_URL}/search?term=${encodeURIComponent(term)}&entity=album&limit=24&country=BR`
    );
    const data = await response.json();
    return (data.results || []).map((item) => ({
      album_id: String(item.collectionId),
      album_title: item.collectionName || item.collectionCensoredName,
      artist_name: item.artistName,
      cover_url: getHighResCover(item.artworkUrl100),
      release_year: item.releaseDate ? item.releaseDate.substring(0, 4) : 'N/A',
      genre: item.primaryGenreName || 'Música',
      track_count: item.trackCount || 0,
      copyright: item.copyright || '',
      spotify_url: `https://open.spotify.com/search/${encodeURIComponent(item.artistName + ' ' + item.collectionName)}`
    }));
  } catch (error) {
    console.error('Erro no fallback do iTunes:', error);
    return [];
  }
};

export const searchTracks = async (term) => {
  if (!term || !term.trim()) return [];

  const spotifyResults = await spotify.searchSpotifyTracks(term);
  if (spotifyResults && spotifyResults.length > 0) {
    return spotifyResults;
  }

  try {
    const response = await fetch(
      `${ITUNES_BASE_URL}/search?term=${encodeURIComponent(term)}&entity=song&limit=30&country=BR`
    );
    const data = await response.json();
    return (data.results || []).map((item) => ({
      track_id: String(item.trackId),
      track_name: item.trackCensoredName || item.trackName,
      artist_name: item.artistName,
      album_id: String(item.collectionId),
      album_title: item.collectionName || item.collectionCensoredName,
      cover_url: getHighResCover(item.artworkUrl100),
      preview_url: item.previewUrl,
      release_year: item.releaseDate ? item.releaseDate.substring(0, 4) : 'N/A',
      genre: item.primaryGenreName || 'Música',
      spotify_url: `https://open.spotify.com/search/${encodeURIComponent(item.artistName + ' ' + item.trackName)}`
    }));
  } catch (error) {
    console.error('Erro na busca de músicas fallback:', error);
    return [];
  }
};

export const searchAll = async (term) => {
  if (!term || !term.trim()) return { albums: [], tracks: [] };
  const [albums, tracks] = await Promise.all([
    searchAlbums(term),
    searchTracks(term)
  ]);
  return { albums, tracks };
};

export const getAlbumDetails = async (albumId) => {
  if (!albumId) return null;

  // If ID is alphanumeric (Spotify ID format) or standard
  if (albumId.length >= 10 && isNaN(Number(albumId))) {
    const spotifyData = await spotify.getSpotifyAlbumDetails(albumId);
    if (spotifyData) return spotifyData;
  }

  // Fallback / Numeric iTunes Lookup
  try {
    const response = await fetch(
      `${ITUNES_BASE_URL}/lookup?id=${albumId}&entity=song&country=BR`
    );
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      // Try spotify lookup as last resort
      return await spotify.getSpotifyAlbumDetails(albumId);
    }

    const albumInfo = data.results[0];
    const tracks = data.results.slice(1).map((track) => ({
      track_id: String(track.trackId),
      track_number: track.trackNumber,
      disc_number: track.discNumber || 1,
      track_name: track.trackCensoredName || track.trackName,
      duration_ms: track.trackTimeMillis,
      preview_url: track.previewUrl,
      artist_name: track.artistName
    }));

    return {
      album_id: String(albumInfo.collectionId),
      album_title: albumInfo.collectionName,
      artist_name: albumInfo.artistName,
      cover_url: getHighResCover(albumInfo.artworkUrl100),
      release_year: albumInfo.releaseDate ? albumInfo.releaseDate.substring(0, 4) : 'N/A',
      release_date: albumInfo.releaseDate,
      genre: albumInfo.primaryGenreName || 'Música',
      record_label: albumInfo.copyright || '',
      copyright: albumInfo.copyright || '',
      total_tracks: albumInfo.trackCount || tracks.length,
      spotify_url: `https://open.spotify.com/search/${encodeURIComponent(albumInfo.artistName + ' ' + albumInfo.collectionName)}`,
      tracks
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do álbum:', error);
    return await spotify.getSpotifyAlbumDetails(albumId);
  }
};

export const getTrackDetails = async (trackId) => {

  if (!trackId) return null;

  const spotifyData = await spotify.getSpotifyTrackDetails(trackId);
  if (spotifyData) return spotifyData;

  // Fallback iTunes lookup
  try {
    const response = await fetch(
      `${ITUNES_BASE_URL}/lookup?id=${trackId}&country=BR`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const item = data.results[0];
      const durationMs = item.trackTimeMillis || 0;
      return {
        track_id: String(item.trackId),
        track_name: item.trackCensoredName || item.trackName,
        artist_name: item.artistName,
        album_id: String(item.collectionId),
        album_title: item.collectionName || item.collectionCensoredName,
        cover_url: getHighResCover(item.artworkUrl100),
        duration_ms: durationMs,
        duration_formatted: spotify.formatDuration(durationMs),
        preview_url: item.previewUrl,
        release_year: item.releaseDate ? item.releaseDate.substring(0, 4) : 'N/A',
        genre: item.primaryGenreName || 'Música',
        spotify_url: `https://open.spotify.com/search/${encodeURIComponent(item.artistName + ' ' + item.trackName)}`
      };
    }
  } catch (err) {
    console.error('Erro ao buscar detalhes da faixa no fallback:', err);
  }
  return null;
};


export const getTrendingAlbums = async () => {
  const trendingQueries = [
    'Milton Nascimento Clube da Esquina',
    'Juçara Marçal Delta Estácio Blues',
    'Tim Bernardes Mil Coisas Invisíveis',
    'Arthur Verocai',
    'Radiohead In Rainbows',
    'Black Country New Road For the first time',
    'Chico Buarque Construção',
    'Portishead Dummy',
    'SOPHIE OIL OF EVERY PEARL',
    'Daft Punk Random Access Memories'
  ];

  try {
    const promises = trendingQueries.map(q => searchAlbums(q));
    const results = await Promise.all(promises);
    return results.map(r => r[0]).filter(Boolean);
  } catch (err) {
    console.error('Erro ao carregar tendências:', err);
    return [];
  }
};
