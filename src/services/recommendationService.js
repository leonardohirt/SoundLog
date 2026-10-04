// Soundlog Recommendation & Personalization Engine
// Analisa notas, histórico de avaliações, faixas, álbuns e perfis para gerar recomendações sob medida

import { searchAlbums, searchTracks } from './musicApi';

/**
 * Extrai o perfil detalhado de preferências do usuário a partir das avaliações e perfil
 */
export const extractTasteProfile = (reviews = [], profile = {}) => {
  const evaluatedAlbumIds = new Set();
  const evaluatedTrackIds = new Set();
  const evaluatedTitles = new Set();

  const artistWeights = {};
  const genreWeights = {};

  // Adiciona artistas e gêneros de cabeceira do perfil como sementes iniciais
  if (profile?.favorite_artist) {
    profile.favorite_artist.split(',').forEach((a) => {
      const trimmed = a.trim();
      if (trimmed) {
        artistWeights[trimmed] = (artistWeights[trimmed] || 0) + 3;
      }
    });
  }

  if (profile?.favorite_genres && Array.isArray(profile.favorite_genres)) {
    profile.favorite_genres.forEach((g) => {
      const trimmed = g.trim();
      if (trimmed) {
        genreWeights[trimmed] = (genreWeights[trimmed] || 0) + 3;
      }
    });
  }

  // Analisa cada avaliação real
  reviews.forEach((rev) => {
    if (rev.album_id) evaluatedAlbumIds.add(String(rev.album_id));
    if (rev.track_id) evaluatedTrackIds.add(String(rev.track_id));
    if (rev.album_title) evaluatedTitles.add(rev.album_title.toLowerCase().trim());
    if (rev.track_name) evaluatedTitles.add(rev.track_name.toLowerCase().trim());

    const rating = Number(rev.rating) || 3.0;
    const favoriteMultiplier = rev.is_favorite ? 1.5 : 1.0;
    const score = rating * favoriteMultiplier;

    // Peso do Artista
    if (rev.artist_name) {
      const artists = rev.artist_name.split(/[,/&]/).map(a => a.trim()).filter(Boolean);
      artists.forEach((art) => {
        artistWeights[art] = (artistWeights[art] || 0) + score;
      });
    }

    // Peso do Gênero
    if (rev.genre && rev.genre !== 'Música') {
      const genres = rev.genre.split(/[/,]/).map(g => g.trim()).filter(Boolean);
      genres.forEach((gen) => {
        genreWeights[gen] = (genreWeights[gen] || 0) + score;
      });
    }
  });

  // Ordena artistas por pontuação
  const topArtists = Object.entries(artistWeights)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // Ordena gêneros por pontuação
  const topGenres = Object.entries(genreWeights)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // Encontra a avaliação de maior destaque (nota mais alta e mais recente)
  const sortedReviews = [...reviews].sort((a, b) => {
    const scoreA = (Number(a.rating) || 0) + (a.is_favorite ? 1 : 0);
    const scoreB = (Number(b.rating) || 0) + (b.is_favorite ? 1 : 0);
    return scoreB - scoreA;
  });

  const anchorReview = sortedReviews[0] || null;

  return {
    hasReviews: reviews.length > 0,
    totalEvaluations: reviews.length,
    evaluatedAlbumIds,
    evaluatedTrackIds,
    evaluatedTitles,
    topArtists,
    topGenres,
    anchorReview
  };
};

/**
 * Gera os dados personalizados para a página Início
 */
export const getPersonalizedHomeData = async (reviews = [], profile = {}) => {
  const taste = extractTasteProfile(reviews, profile);

  if (!taste.hasReviews) {
    return {
      isPersonalized: false,
      heroAlbum: null,
      contextReason: null,
      recommendedAlbums: [],
      recommendedTracks: [],
      topGenres: taste.topGenres
    };
  }

  const primaryArtist = taste.topArtists[0] || taste.anchorReview?.artist_name || 'Milton Nascimento';
  const secondaryArtist = taste.topArtists[1] || 'Arthur Verocai';
  const primaryGenre = taste.topGenres[0] || 'MPB';

  // Buscar álbuns e faixas do artista âncora e de artistas semelhantes
  const [artistAlbums, genreAlbums, recommendedTracks] = await Promise.all([
    searchAlbums(primaryArtist),
    searchAlbums(primaryGenre),
    searchTracks(secondaryArtist || primaryArtist)
  ]);

  // Filtrar álbuns já avaliados
  const filteredAlbums = [...artistAlbums, ...genreAlbums].filter((alb) => {
    return (
      !taste.evaluatedAlbumIds.has(String(alb.album_id)) &&
      !taste.evaluatedTitles.has(alb.album_title?.toLowerCase().trim())
    );
  });

  // Remover duplicatas de álbuns
  const uniqueAlbums = [];
  const seenAlbumIds = new Set();
  for (const alb of filteredAlbums) {
    if (!seenAlbumIds.has(alb.album_id)) {
      seenAlbumIds.add(alb.album_id);
      uniqueAlbums.push(alb);
    }
  }

  // Filtrar faixas já avaliadas
  const filteredTracks = recommendedTracks.filter((tr) => {
    return (
      !taste.evaluatedTrackIds.has(String(tr.track_id)) &&
      !taste.evaluatedTitles.has(tr.track_name?.toLowerCase().trim())
    );
  });

  // Selecionar o Disco em Evidência
  const heroAlbum = uniqueAlbums[0] || artistAlbums[0] || null;

  let contextReason = null;
  if (taste.anchorReview) {
    const itemTitle = taste.anchorReview.item_type === 'track'
      ? taste.anchorReview.track_name
      : taste.anchorReview.album_title;
    contextReason = `Baseado na sua avaliação ${taste.anchorReview.rating ? `(★ ${Number(taste.anchorReview.rating).toFixed(1)})` : ''} para "${itemTitle}" de ${taste.anchorReview.artist_name}`;
  }

  return {
    isPersonalized: true,
    heroAlbum,
    contextReason,
    anchorItem: taste.anchorReview,
    primaryArtist,
    recommendedAlbums: uniqueAlbums.slice(1, 7),
    recommendedTracks: filteredTracks.slice(0, 6),
    topGenres: taste.topGenres
  };
};

/**
 * Gera os dados personalizados para a página Explorar com deduplicação estrita
 */
export const getPersonalizedExploreData = async (reviews = [], profile = {}) => {
  const taste = extractTasteProfile(reviews, profile);

  // Mapeamento de consultas baseado no perfil do usuário ou catálogo canônico
  const queriesToRun = [];

  if (taste.topArtists.length > 0) {
    queriesToRun.push(...taste.topArtists.slice(0, 3));
  }
  if (taste.topGenres.length > 0) {
    queriesToRun.push(...taste.topGenres.slice(0, 2));
  }

  // Fallback caso usuário não tenha avaliações
  if (queriesToRun.length === 0) {
    queriesToRun.push(
      'Milton Nascimento',
      'Gal Costa',
      'Tim Bernardes',
      'Juçara Marçal',
      'Arthur Verocai',
      'Portishead'
    );
  }

  // Executa buscas em paralelo
  const albumPromises = queriesToRun.map((q) => searchAlbums(q));
  const trackPromises = queriesToRun.slice(0, 3).map((q) => searchTracks(q));

  const [albumResultsMatrix, trackResultsMatrix] = await Promise.all([
    Promise.all(albumPromises),
    Promise.all(trackPromises)
  ]);

  const rawAlbums = albumResultsMatrix.flat();
  const rawTracks = trackResultsMatrix.flat();

  // Deduplicação estrita: remove álbuns que o usuário já avaliou
  const uniqueAlbums = [];
  const seenAlbumIds = new Set();

  rawAlbums.forEach((alb) => {
    if (
      alb &&
      !seenAlbumIds.has(alb.album_id) &&
      !taste.evaluatedAlbumIds.has(String(alb.album_id)) &&
      !taste.evaluatedTitles.has(alb.album_title?.toLowerCase().trim())
    ) {
      seenAlbumIds.add(alb.album_id);
      uniqueAlbums.push(alb);
    }
  });

  // Deduplicação estrita: remove faixas que o usuário já avaliou
  const uniqueTracks = [];
  const seenTrackIds = new Set();

  rawTracks.forEach((tr) => {
    if (
      tr &&
      !seenTrackIds.has(tr.track_id) &&
      !taste.evaluatedTrackIds.has(String(tr.track_id)) &&
      !taste.evaluatedTitles.has(tr.track_name?.toLowerCase().trim())
    ) {
      seenTrackIds.add(tr.track_id);
      uniqueTracks.push(tr);
    }
  });

  return {
    isPersonalized: taste.hasReviews,
    albums: uniqueAlbums.slice(0, 18),
    tracks: uniqueTracks.slice(0, 15),
    topGenres: taste.topGenres,
    topArtists: taste.topArtists
  };
};
