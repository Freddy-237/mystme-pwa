import { renderHook, waitFor } from '@testing-library/react';
import { useIdentity } from './useIdentity';
import { identityApi } from './api';
import { getAuthToken, setAuthToken, setCsrfToken } from './http';

vi.mock('./api', () => ({
  identityApi: {
    me: vi.fn(),
    init: vi.fn(),
    sessionToken: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('./http', () => ({
  getAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
  setCsrfToken: vi.fn(),
}));

const mockedIdentityApi = vi.mocked(identityApi);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedSetAuthToken = vi.mocked(setAuthToken);
const mockedSetCsrfToken = vi.mocked(setCsrfToken);

const existingUser = {
  id: 'user-1',
  anonymous_uid: 'anon-1',
  pseudo: 'ShadowFox',
  avatar_url: 'https://cdn/avatar.png',
  last_seen_at: '2026-04-11T10:00:00.000Z',
  created_at: '2026-04-11T09:00:00.000Z',
};

beforeEach(() => {
  mockedGetAuthToken.mockReturnValue(null);
  mockedIdentityApi.me.mockReset();
  mockedIdentityApi.init.mockReset();
  mockedIdentityApi.sessionToken.mockReset();
  mockedIdentityApi.logout.mockReset();
  mockedSetAuthToken.mockReset();
  mockedSetCsrfToken.mockReset();
});

describe('useIdentity', () => {
  it('reuses an existing session and stored token when /identity/me succeeds', async () => {
    mockedGetAuthToken.mockReturnValue('stored-token');
    mockedIdentityApi.me.mockResolvedValue(existingUser);

    const { result } = renderHook(() => useIdentity());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ready).toBe(true);
    expect(result.current.user).toEqual(existingUser);
    expect(result.current.token).toBe('stored-token');
    expect(mockedIdentityApi.sessionToken).not.toHaveBeenCalled();
    expect(mockedIdentityApi.init).not.toHaveBeenCalled();
  });

  it('creates a fresh anonymous identity when no valid session exists', async () => {
    mockedIdentityApi.me.mockRejectedValue({ statusCode: 401 });
    mockedIdentityApi.init.mockResolvedValue({
      user: existingUser,
      token: 'new-token',
      csrfToken: 'csrf-token',
    });

    const { result } = renderHook(() => useIdentity());

    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.user).toEqual(existingUser);
    expect(result.current.token).toBe('new-token');
    expect(mockedSetAuthToken).toHaveBeenCalledWith(null);
    expect(mockedSetAuthToken).toHaveBeenCalledWith('new-token');
    expect(mockedSetCsrfToken).toHaveBeenCalledWith('csrf-token');
  });

  it('preserves the current identity when /identity/me fails transiently', async () => {
    mockedGetAuthToken.mockReturnValue('stored-token');
    mockedIdentityApi.me.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useIdentity());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.token).toBe('stored-token');
    expect(result.current.error).toBe('Connexion impossible. Verifie ton reseau puis reessaie.');
    expect(mockedSetAuthToken).not.toHaveBeenCalled();
    expect(mockedIdentityApi.init).not.toHaveBeenCalled();
  });

  it('does not create another identity when session token recovery fails', async () => {
    mockedIdentityApi.me.mockResolvedValue(existingUser);
    mockedIdentityApi.sessionToken.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useIdentity());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(existingUser);
    expect(result.current.error).toBe('Connexion impossible. Verifie ton reseau puis reessaie.');
    expect(mockedIdentityApi.init).not.toHaveBeenCalled();
  });

  it('maps bootstrap failures to a user friendly message', async () => {
    mockedIdentityApi.me.mockRejectedValue({ statusCode: 401 });
    mockedIdentityApi.init.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useIdentity());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBe('Connexion impossible. Verifie ton reseau puis reessaie.');
  });
});