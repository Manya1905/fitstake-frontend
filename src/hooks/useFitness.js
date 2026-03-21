import { useState, useCallback, useEffect } from 'react';
import { BACKEND_URL } from '../utils/constants';

const STORAGE_KEY = 'fitstake_fitness';

function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useFitness() {
  const [stored, setStored] = useState(loadStoredData);
  const [loading, setLoading] = useState(false);

  // Which provider is connected (if any)
  const connectedProvider = stored.provider || null;
  const athleteName = stored.athleteName || null;

  // Persist to localStorage when stored changes
  useEffect(() => {
    saveStoredData(stored);
  }, [stored]);

  // Check for OAuth callback params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state'); // 'strava' or 'fitbit'

    if (code && state) {
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
      handleOAuthCallback(state, code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOAuthCallback = async (provider, code) => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      const res = await fetch(`${BACKEND_URL}/api/${provider}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });

      const data = await res.json();

      if (data.accessToken) {
        const newStored = {
          provider,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt || (Date.now() / 1000 + (data.expiresIn || 3600)),
          athleteName: data.athlete
            ? `${data.athlete.firstname} ${data.athlete.lastname}`
            : data.userId || provider,
        };
        setStored(newStored);
      }
    } catch (error) {
      console.error(`${provider} OAuth callback error:`, error);
    }
    setLoading(false);
  };

  const connectStrava = useCallback(async () => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const res = await fetch(
        `${BACKEND_URL}/api/strava/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`
      );
      const data = await res.json();

      if (data.url) {
        // Add state param so we know which provider on callback
        const url = new URL(data.url);
        url.searchParams.set('state', 'strava');
        window.location.href = url.toString();
      }
    } catch (error) {
      console.error('Strava connect error:', error);
      setLoading(false);
    }
  }, []);

  const connectFitbit = useCallback(async () => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const res = await fetch(
        `${BACKEND_URL}/api/fitbit/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`
      );
      const data = await res.json();

      if (data.url) {
        const url = new URL(data.url);
        url.searchParams.set('state', 'fitbit');
        window.location.href = url.toString();
      }
    } catch (error) {
      console.error('Fitbit connect error:', error);
      setLoading(false);
    }
  }, []);

  const getTokens = useCallback((provider) => {
    if (stored.provider !== provider) return null;
    return {
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
    };
  }, [stored]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStored({});
  }, []);

  return {
    connectedProvider,
    athleteName,
    loading,
    connectStrava,
    connectFitbit,
    getTokens,
    disconnect,
  };
}
