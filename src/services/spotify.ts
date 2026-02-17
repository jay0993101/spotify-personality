const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
].join(' ');

function getClientId(): string {
  const id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (!id) {
    throw new Error(
      'Missing VITE_SPOTIFY_CLIENT_ID. Add it to .env - see .env.example'
    );
  }
  return id;
}

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function initiateAuth(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  sessionStorage.setItem('code_verifier', codeVerifier);
  sessionStorage.setItem('auth_state', generateRandomString(16));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    scope: SCOPES,
    redirect_uri: getRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state: sessionStorage.getItem('auth_state')!,
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function handleCallback(): Promise<string | null> {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      return null;
    }

    const savedState = sessionStorage.getItem('auth_state');
    if (state !== savedState || !code) {
      return null;
    }

    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) return null;

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: getClientId(),
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return null;
    }

    const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    sessionStorage.setItem('access_token', data.access_token);
    sessionStorage.setItem('refresh_token', data.refresh_token ?? '');
    sessionStorage.setItem('token_expires_at', String(expiresAt));
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('auth_state');

    const path = window.location.pathname || '/';
    window.history.replaceState({}, '', path);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) return null;

  const expiresAt = Date.now() + data.expires_in * 1000;
  sessionStorage.setItem('access_token', data.access_token);
  sessionStorage.setItem('token_expires_at', String(expiresAt));
  if (data.refresh_token) {
    sessionStorage.setItem('refresh_token', data.refresh_token);
  }

  return data.access_token;
}

export async function getValidToken(): Promise<string | null> {
  try {
    const token = sessionStorage.getItem('access_token');
    const expiresAt = sessionStorage.getItem('token_expires_at');
    const expiresAtNum = expiresAt ? parseInt(expiresAt, 10) : 0;

    if (token && expiresAtNum && Date.now() < expiresAtNum - 60000) {
      return token;
    }

    const refreshed = await refreshAccessToken();
    return refreshed ?? sessionStorage.getItem('access_token');
  } catch {
    return null;
  }
}

async function spotifyFetch<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return spotifyFetch(endpoint, newToken);
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `API error: ${res.status}`);
  }

  return res.json();
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string | null;
  images?: { url: string }[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres?: string[];
  images?: { url: string; height: number; width: number }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists?: { id: string; name: string }[];
  album?: { images: { url: string }[] };
}

export interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  tempo: number;
}

export async function fetchUser(token: string): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>('/me', token);
}

export async function fetchTopArtists(
  token: string,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
): Promise<SpotifyArtist[]> {
  const data = await spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?time_range=${timeRange}&limit=50`,
    token
  );
  return data.items;
}

export async function fetchTopTracks(
  token: string,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?time_range=${timeRange}&limit=50`,
    token
  );
  return data.items;
}

export async function fetchAudioFeatures(
  token: string,
  trackIds: string[]
): Promise<AudioFeatures[]> {
  if (trackIds.length === 0) return [];
  const ids = trackIds.slice(0, 100).join(',');
  const data = await spotifyFetch<{ audio_features: (AudioFeatures | null)[] }>(
    `/audio-features?ids=${ids}`,
    token
  );
  return (data.audio_features ?? []).filter(
    (f): f is AudioFeatures => f !== null
  );
}
