import { useCallback, useEffect, useState } from 'react';
import { identityApi, UserResponse } from './api';

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
 * 1. Try /identity/me using HttpOnly cookie credentials
 * 2. If not authenticated, call /identity/init to create a new user session
 */
export function useIdentity(): IdentityState {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    try {
      try {
        const me = await identityApi.me();
        setUser(me);
        return;
      } catch {
        // No valid auth cookie/session yet → init below.
      }

      // No valid session → create a new anonymous identity
      const { user: newUser } = await identityApi.init();
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
      const { user: newUser } = await identityApi.init();
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
