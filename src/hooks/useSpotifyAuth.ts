import { useState, useEffect, useCallback, useRef } from 'react';
import {
  handleCallback,
  getValidToken,
  initiateAuth,
  fetchUser,
  fetchTopArtists,
  fetchTopTracks,
  fetchAudioFeatures,
} from '../services/spotify';
import type { SpotifyUser } from '../services/spotify';
import { buildPersonalityProfile } from '../utils/personality';
import type { PersonalityProfile } from '../utils/personality';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSpotifyAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const mountedRef = useRef(true);

  const login = useCallback(() => {
    setError(null);
    try {
      initiateAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start login');
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expires_at');
    setToken(null);
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');
  }, []);

  const loadProfile = useCallback(async () => {
    const t = token ?? (await getValidToken());
    if (!t) return;

    setLoadingProfile(true);
    setError(null);
    try {
      const [artists, tracks] = await Promise.all([
        fetchTopArtists(t, 'medium_term'),
        fetchTopTracks(t, 'medium_term'),
      ]);
      const trackIds = tracks.map((tr) => tr.id);
      const features = await fetchAudioFeatures(t, trackIds);
      const p = buildPersonalityProfile(artists, tracks, features);
      setProfile(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');

    const setStatusSafe = (s: AuthStatus) => {
      if (mountedRef.current) setStatus(s);
    };

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let fetchUserTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (fetchUserTimeoutId) clearTimeout(fetchUserTimeoutId);
    };

    const handleAuthResult = (t: string | null) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (!t) {
        setStatusSafe('unauthenticated');
        return;
      }
      if (!mountedRef.current) return;
      setToken(t);
      setStatusSafe('authenticated');
      fetchUser(t)
        .then((u) => {
          if (fetchUserTimeoutId) clearTimeout(fetchUserTimeoutId);
          if (mountedRef.current) setUser(u);
        })
        .catch(() => {
          if (fetchUserTimeoutId) clearTimeout(fetchUserTimeoutId);
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('token_expires_at');
          setStatusSafe('unauthenticated');
        });
      fetchUserTimeoutId = setTimeout(() => {
        fetchUserTimeoutId = null;
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('token_expires_at');
        setStatusSafe('unauthenticated');
      }, 10000);
    };

    const fallback = () => {
      cleanup();
      setStatusSafe('unauthenticated');
    };

    const runAuth = () => {
      const p = hasCode ? handleCallback() : getValidToken();
      return p.then(handleAuthResult).catch(fallback);
    };

    if (!hasCode) {
      timeoutId = setTimeout(fallback, 8000);
    }
    runAuth();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  return {
    status,
    token,
    user,
    profile,
    error,
    loadingProfile,
    login,
    logout,
    loadProfile,
  };
}
