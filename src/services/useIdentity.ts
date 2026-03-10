import { useCallback, useEffect, useState } from 'react';
import { identityApi, UserResponse } from './api';
import { getAuthToken, setAuthToken, setCsrfToken } from './http';

export interface IdentityState {
  /** Current user (null while loading or if not yet init'd) */
  user: UserResponse | null;
  /** JWT token is managed server-side via HttpOnly cookie */
  token: string | null;
  /** True while the first request is in-flight */
  loading: boolean;
  /** Non-null if something went wrong */
  error: string | null;
  /** True once identity is ready */
  ready: boolean;
  /** Clear current session and create a fresh anonymous identity */
  signOut: () => Promise<void>;
}

/**
 * Hook that manages the anonymous identity lifecycle:
 * 1. Try /identity/me using cookie or bearer credentials
 * 2. If a cookie-backed session exists but no bearer is cached, issue one
 * 3. Otherwise create a new anonymous identity
 */
export function useIdentity(): IdentityState {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    try {
      const existingToken = getAuthToken();

      try {
        const me = await identityApi.me();
        setUser(me);

        if (existingToken) {
          setToken(existingToken);
          return;
        }

        const session = await identityApi.sessionToken();
        if (session.token) {
          setAuthToken(session.token);
          setToken(session.token);
        }
        return;
      } catch {
        setAuthToken(null);
      }

      // No valid session → create a new anonymous identity
      const { user: newUser, token: newToken, csrfToken } = await identityApi.init();
      setAuthToken(newToken);
      if (csrfToken) setCsrfToken(csrfToken);
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await identityApi.logout();
      setAuthToken(null);
      setCsrfToken(null);
      setToken(null);
      const { user: newUser, token: newToken, csrfToken } = await identityApi.init();
      setAuthToken(newToken);
      if (csrfToken) setCsrfToken(csrfToken);
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    token,
    loading,
    error,
    ready: !loading && !!user,
    signOut,
  };
}
