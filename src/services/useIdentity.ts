import { useCallback, useEffect, useState } from 'react';
import { identityApi, UserResponse } from './api';

export interface IdentityState {
  /** Current user (null while loading or if not yet init'd) */
  user: UserResponse | null;
  /** JWT token stored in localStorage */
  token: string | null;
  /** True while the first request is in-flight */
  loading: boolean;
  /** Non-null if something went wrong */
  error: string | null;
  /** True once identity is ready */
  ready: boolean;
}

const TOKEN_KEY = 'mystme_token';

/**
 * Hook that manages the anonymous identity lifecycle:
 * 1. On mount, checks localStorage for a JWT
 * 2. If found → calls /identity/me to restore the session
 * 3. If not found → calls /identity/init to create a new user
 * 4. Stores the JWT in localStorage for future visits
 */
export function useIdentity(): IdentityState {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    try {
      const existing = localStorage.getItem(TOKEN_KEY);

      if (existing) {
        // Try to restore session with existing token
        try {
          const me = await identityApi.me();
          setUser(me);
          setToken(existing);
          return;
        } catch {
          // Token expired or invalid → create fresh identity
          localStorage.removeItem(TOKEN_KEY);
        }
      }

      // No valid token → create a new anonymous identity
      const { user: newUser, token: newToken } = await identityApi.init();
      localStorage.setItem(TOKEN_KEY, newToken);
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

  return {
    user,
    token,
    loading,
    error,
    ready: !loading && !!user,
  };
}
