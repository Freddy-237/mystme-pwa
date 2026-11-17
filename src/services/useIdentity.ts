import { useCallback, useEffect, useState } from 'react';
import { identityApi, UserResponse } from './api';
import { getErrorCode, toFriendlyErrorMessage } from './errors';
import { getAuthToken, setAuthToken, setCsrfToken } from './http';

export interface IdentityState {
  /** Current user (null while loading or if not yet init'd) */
  user: UserResponse | null;
  /** Bearer token is cached in browser storage; the HttpOnly cookie backs session refresh. */
  token: string | null;
  /** True while the first request is in-flight */
  loading: boolean;
  /** Non-null if something went wrong */
  error: string | null;
  /** True once identity is ready */
  ready: boolean;
  /** Clear current session and create a fresh anonymous identity */
  signOut: () => Promise<void>;
  /** This browser's web identity was moved into the app (PWA → app transfer). */
  transferred: boolean;
  /** Start over on the web with a brand-new anonymous identity. */
  continueOnWeb: () => void;
}

// Remembered so a reload does not silently create a new web identity
// (which would duplicate the conversation) after a transfer.
const TRANSFERRED_KEY = 'mystme_transferred';

function readTransferredFlag(): boolean {
  try { return window.localStorage.getItem(TRANSFERRED_KEY) === '1'; } catch { return false; }
}

function writeTransferredFlag(value: boolean) {
  try {
    if (value) window.localStorage.setItem(TRANSFERRED_KEY, '1');
    else window.localStorage.removeItem(TRANSFERRED_KEY);
  } catch {
    // storage unavailable: the in-memory state still covers this visit
  }
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    error.statusCode === 401
  );
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
  const [transferred, setTransferred] = useState<boolean>(() => readTransferredFlag());

  const bootstrap = useCallback(async () => {
    setError(null);
    if (readTransferredFlag()) {
      setLoading(false);
      return;
    }
    try {
      let existingUser: UserResponse | null = null;
      try {
        existingUser = await identityApi.me();
      } catch (err) {
        if (getErrorCode(err) === 'IDENTITY_TRANSFERRED') {
          setAuthToken(null);
          setToken(null);
          writeTransferredFlag(true);
          setTransferred(true);
          return;
        }
        if (!isUnauthorizedError(err)) throw err;
        setAuthToken(null);
        setToken(null);
      }

      if (existingUser) {
        setUser(existingUser);
        const existingToken = getAuthToken();
        if (existingToken) {
          setToken(existingToken);
          return;
        }

        const session = await identityApi.sessionToken();
        if (!session.token) {
          throw new Error('Impossible de recuperer le jeton de session.');
        }
        setAuthToken(session.token);
        setToken(session.token);
        return;
      }

      // No valid session → create a new anonymous identity
      const { user: newUser, token: newToken, csrfToken } = await identityApi.init();
      setAuthToken(newToken);
      if (csrfToken) setCsrfToken(csrfToken);
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      setError(toFriendlyErrorMessage(err, 'Impossible de preparer ta session. Reessaie.'));
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
      setError(toFriendlyErrorMessage(err, 'Impossible de relancer ta session. Reessaie.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const continueOnWeb = useCallback(() => {
    writeTransferredFlag(false);
    setTransferred(false);
    setLoading(true);
    void bootstrap();
  }, [bootstrap]);

  return {
    user,
    token,
    loading,
    error,
    ready: !loading && !!user,
    signOut,
    transferred,
    continueOnWeb,
  };
}
