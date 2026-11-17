import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export class HttpRequestError extends Error {
  statusCode: number | null;
  code: string | null;

  constructor(message: string, statusCode: number | null, code: string | null = null) {
    super(message);
    this.name = 'HttpRequestError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  'https://api-mystme-production.up.railway.app'
)
  .trim()
  .replace(/\/+$/, '');

const CSRF_COOKIE_NAME = 'mystme_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const AUTH_STORAGE_KEY = 'mystme_token';
let csrfTokenMemory: string | null = null;
let authTokenMemory: string | null = null;
let authTokenStorageUnavailable = false;

/* ── Token helpers (unchanged public API) ── */

export function setCsrfToken(token: string | null) {
  csrfTokenMemory = token;
}

function localStorageSafe(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

function sessionStorageSafe(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

function readStorageToken(storage: Storage | null): string | null | undefined {
  if (!storage) return undefined;
  try {
    return storage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return undefined;
  }
}

function writeStorageToken(storage: Storage | null, token: string): boolean {
  try {
    storage?.setItem(AUTH_STORAGE_KEY, token);
    return storage !== null;
  } catch {
    return false;
  }
}

function removeStorageToken(storage: Storage | null) {
  try {
    storage?.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function readStoredToken(): string | null {
  const persistentToken = readStorageToken(localStorageSafe());
  if (persistentToken) {
    authTokenMemory = persistentToken;
    authTokenStorageUnavailable = false;
    return persistentToken;
  }

  const legacyToken = readStorageToken(sessionStorageSafe());
  if (legacyToken) {
    if (writeStorageToken(localStorageSafe(), legacyToken)) {
      removeStorageToken(sessionStorageSafe());
    }
    authTokenMemory = legacyToken;
    authTokenStorageUnavailable = false;
    return legacyToken;
  }

  if (authTokenStorageUnavailable) return authTokenMemory;
  if (persistentToken !== undefined || legacyToken !== undefined) {
    authTokenMemory = null;
    return null;
  }
  return authTokenMemory;
}

export function setAuthToken(token: string | null) {
  authTokenMemory = token;
  const persistentStorage = localStorageSafe();
  const sessionStorage = sessionStorageSafe();
  if (token == null) {
    authTokenStorageUnavailable = false;
    removeStorageToken(persistentStorage);
    removeStorageToken(sessionStorage);
    return;
  }

  if (writeStorageToken(persistentStorage, token)) {
    authTokenStorageUnavailable = false;
    removeStorageToken(sessionStorage);
  } else {
    authTokenStorageUnavailable = !writeStorageToken(sessionStorage, token);
  }
}

export function getAuthToken(): string | null {
  return readStoredToken();
}

function getCookie(name: string): string | null {
  const prefix = `${name}=`;
  const c = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith(prefix));
  return c ? decodeURIComponent(c.slice(prefix.length)) : null;
}

const isSafe = (m?: string) => /^(GET|HEAD|OPTIONS)$/i.test(m || 'GET');

/* ── Axios instance ── */

const api = axios.create({ baseURL: API_BASE, withCredentials: true });

async function issueSessionToken(): Promise<string | null> {
  try {
    const { data } = await axios.get<{ token?: string }>(`${API_BASE}/identity/session-token`, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return typeof data?.token === 'string' && data.token ? data.token : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

// Request interceptor — inject auth + CSRF
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = readStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (!isSafe(config.method)) {
    let csrf = csrfTokenMemory;
    if (!csrf) csrf = await refreshCsrfToken();
    if (!csrf) csrf = getCookie(CSRF_COOKIE_NAME);
    if (csrf) config.headers[CSRF_HEADER_NAME] = csrf;
  }
  return config;
});

// Response interceptor — CSRF retry + bearer-token refresh
api.interceptors.response.use(undefined, async (error: AxiosError<{ message?: string; code?: string }>) => {
  const original = error.config;
  if (!original) return Promise.reject(error);

  // CSRF 403 — refresh token and retry once
  if (error.response?.status === 403
    && error.response.data?.message === 'CSRF token invalide'
    && !(original as { _csrfRetried?: boolean })._csrfRetried) {
    (original as { _csrfRetried?: boolean })._csrfRetried = true;
    const csrf = (await refreshCsrfToken()) || getCookie(CSRF_COOKIE_NAME);
    if (csrf) original.headers[CSRF_HEADER_NAME] = csrf;
    return api(original);
  }

  // 401 — refresh the bearer token from the existing cookie session, retry once
  if (error.response?.status === 401
    && !(original as { _authRetried?: boolean })._authRetried) {
    (original as { _authRetried?: boolean })._authRetried = true;
    const sessionToken = await issueSessionToken();
    if (sessionToken) {
      setAuthToken(sessionToken);
      original.headers.Authorization = `Bearer ${sessionToken}`;
      return api(original);
    }
    setAuthToken(null);
  }

  const msg = error.response?.data?.message || `HTTP ${error.response?.status ?? 0}`;
  const code = error.response?.data?.code ?? (typeof error.code === 'string' ? error.code : null);
  return Promise.reject(new HttpRequestError(msg, error.response?.status ?? null, code));
});

async function refreshCsrfToken(): Promise<string | null> {
  try {
    const { data } = await axios.get<{ csrfToken?: string }>(`${API_BASE}/identity/csrf`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        ...(readStoredToken() ? { Authorization: `Bearer ${readStoredToken()}` } : {}),
      },
    });
    csrfTokenMemory = typeof data?.csrfToken === 'string' ? data.csrfToken : null;
    return csrfTokenMemory;
  } catch { return null; }
}

/* ── Public helpers (same signatures as before) ── */

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { data } = await api.request<T>({
    url: path,
    method: (options.method || 'GET') as string,
    data: options.body,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });
  return data;
}

export async function requestFormData<T>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  onProgress?: (progress: number) => void,
): Promise<T> {
  const { data } = await api.request<T>({
    url: path,
    method,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => { if (e.total) onProgress(Math.min(1, e.loaded / e.total)); }
      : undefined,
  });
  if (onProgress) onProgress(1);
  return data;
}
