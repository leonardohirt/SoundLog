let cachedToken;
let tokenExpiresAt = 0;

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return response.status(503).json({ error: 'Spotify is not configured' });
  }

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return response.setHeader('Cache-Control', 'no-store').status(200).json({
      access_token: cachedToken,
      expires_in: Math.floor((tokenExpiresAt - Date.now()) / 1000)
    });
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const spotifyResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!spotifyResponse.ok) {
      return response.status(502).json({ error: 'Spotify authentication failed' });
    }

    const tokenData = await spotifyResponse.json();
    cachedToken = tokenData.access_token;
    tokenExpiresAt = Date.now() + Math.max(0, tokenData.expires_in - 60) * 1000;

    return response.setHeader('Cache-Control', 'no-store').status(200).json({
      access_token: cachedToken,
      expires_in: tokenData.expires_in
    });
  } catch {
    return response.status(502).json({ error: 'Spotify authentication failed' });
  }
}