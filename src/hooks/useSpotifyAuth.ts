import { useState, useEffect, useCallback } from 'react';
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

  const login = useCallback(() => {
    setError(null);
    initiateAuth();
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
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');

    if (hasCode) {
      handleCallback().then((t) => {
        if (t) {
          setToken(t);
          setStatus('authenticated');
          fetchUser(t).then(setUser);
        } else {
          setStatus('unauthenticated');
        }
      });
      return;
    }

    getValidToken().then((t) => {
      if (t) {
        setToken(t);
        setStatus('authenticated');
        fetchUser(t).then(setUser);
      } else {
        setStatus('unauthenticated');
      }
    });
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
