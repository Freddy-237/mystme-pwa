import { beforeEach, describe, expect, it } from 'vitest';
import { getAuthToken, setAuthToken } from './http';

const authStorageKey = 'mystme_token';

describe('persistent auth token storage', () => {
  beforeEach(() => {
    setAuthToken(null);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores the identity token across tabs and browser sessions', () => {
    setAuthToken('persistent-token');

    expect(window.localStorage.getItem(authStorageKey)).toBe('persistent-token');
    expect(getAuthToken()).toBe('persistent-token');
  });

  it('uses the latest persistent token across tabs', () => {
    setAuthToken('initial-token');
    window.localStorage.setItem(authStorageKey, 'updated-in-another-tab');

    expect(getAuthToken()).toBe('updated-in-another-tab');

    window.localStorage.removeItem(authStorageKey);
    expect(getAuthToken()).toBeNull();
  });

  it('migrates an existing session token to persistent storage', () => {
    window.sessionStorage.setItem(authStorageKey, 'legacy-session-token');

    expect(getAuthToken()).toBe('legacy-session-token');
    expect(window.localStorage.getItem(authStorageKey)).toBe('legacy-session-token');
    expect(window.sessionStorage.getItem(authStorageKey)).toBeNull();
  });

  it('clears tokens from both storage locations on sign out', () => {
    window.localStorage.setItem(authStorageKey, 'persistent-token');
    window.sessionStorage.setItem(authStorageKey, 'legacy-session-token');

    setAuthToken(null);

    expect(window.localStorage.getItem(authStorageKey)).toBeNull();
    expect(window.sessionStorage.getItem(authStorageKey)).toBeNull();
  });
});
