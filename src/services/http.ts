import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

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

/* ── Token helpers (unchanged public API) ── */

export function setCsrfToken(token: string | null) {
  csrfTokenMemory = token;
}

function safeStorage(kind: 'session' | 'local') {
  try { return kind === 'session' ? window.sessionStorage : window.localStorage; } catch { return null; }
}

function readStoredToken(): string | null {
  if (authTokenMemory) return authTokenMemory;
  authTokenMemory =
    safeStorage('session')?.getItem(AUTH_STORAGE_KEY) ??
    safeStorage('local')?.getItem(AUTH_STORAGE_KEY) ??
    null;
  return authTokenMemory;
}

export function setAuthToken(token: string | null) {
  authTokenMemory = token;
  for (const kind of ['session', 'local'] as const) {
    const s = safeStorage(kind);
    if (!s) continue;
    token == null ? s.removeItem(AUTH_STORAGE_KEY) : s.setItem(AUTH_STORAGE_KEY, token);
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

// Response interceptor — CSRF retry + 401 re-init
api.interceptors.response.use(undefined, async (error: AxiosError<{ message?: string }>) => {
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

  // 401 — clear token, re-init identity, retry once
  if (error.response?.status === 401
    && !(original as { _authRetried?: boolean })._authRetried) {
    (original as { _authRetried?: boolean })._authRetried = true;
    setAuthToken(null);
    try {
      const { data } = await api.post<{ token?: string; csrfToken?: string }>(
        '/identity/init', {}, { headers: { 'Content-Type': 'application/json' } },
      );
      if (data.token) {
        setAuthToken(data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        if (data.csrfToken) csrfTokenMemory = data.csrfToken;
        return api(original);
      }
    } catch { /* re-init failed */ }
  }

  const msg = error.response?.data?.message || `HTTP ${error.response?.status ?? 0}`;
  return Promise.reject(new Error(msg));
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
