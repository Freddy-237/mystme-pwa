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

/** Store a CSRF token obtained from an init or csrf-refresh response. */
export function setCsrfToken(token: string | null) {
  csrfTokenMemory = token;
}

function safeReadStorage(kind: 'session' | 'local', key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session'
      ? window.sessionStorage.getItem(key)
      : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteStorage(kind: 'session' | 'local', key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const storage = kind === 'session' ? window.sessionStorage : window.localStorage;
    if (value == null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, value);
    }
  } catch {
    // Ignore storage failures (Safari private mode / blocked storage)
  }
}

function readStoredToken(): string | null {
  if (authTokenMemory) return authTokenMemory;
  authTokenMemory =
    safeReadStorage('session', AUTH_STORAGE_KEY) ||
    safeReadStorage('local', AUTH_STORAGE_KEY);
  return authTokenMemory;
}

export function setAuthToken(token: string | null) {
  authTokenMemory = token;
  safeWriteStorage('session', AUTH_STORAGE_KEY, token);
  safeWriteStorage('local', AUTH_STORAGE_KEY, token);
}

export function getAuthToken(): string | null {
  return readStoredToken();
}

function getCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(prefix.length));
}

function isSafeMethod(method?: string): boolean {
  const normalized = (method || 'GET').toUpperCase();
  return normalized === 'GET' || normalized === 'HEAD' || normalized === 'OPTIONS';
}

async function rawRequest(path: string, options: RequestInit, headers: Record<string, string>): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

async function refreshCsrfToken(): Promise<string | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authToken = readStoredToken();
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await rawRequest('/identity/csrf', { method: 'GET' }, headers);
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({} as { csrfToken?: string }));
    const nextToken = typeof body?.csrfToken === 'string' ? body.csrfToken : null;
    csrfTokenMemory = nextToken;
    return nextToken;
  } catch {
    return null;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const authToken = readStoredToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (!isSafeMethod(method)) {
    let csrf = csrfTokenMemory;
    if (!csrf) {
      csrf = await refreshCsrfToken();
    }
    if (!csrf) {
      csrf = getCookie(CSRF_COOKIE_NAME);
    }
    if (csrf) headers[CSRF_HEADER_NAME] = csrf;
  }

  let res = await rawRequest(path, options, headers);

  if (!isSafeMethod(method) && res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    if (body?.message === 'CSRF token invalide') {
      const nextCsrf = await refreshCsrfToken() || getCookie(CSRF_COOKIE_NAME);
      if (nextCsrf) headers[CSRF_HEADER_NAME] = nextCsrf;
      res = await rawRequest(path, options, headers);
    }
  }

  // Handle 401 – clear stale token and re-init
  if (res.status === 401) {
    setAuthToken(null);
    try {
      const initRes = await rawRequest('/identity/init', {
        method: 'POST',
        body: '{}',
      }, { 'Content-Type': 'application/json' });
      if (initRes.ok) {
        const initBody = await initRes.json() as { token?: string; csrfToken?: string };
        if (initBody.token) {
          setAuthToken(initBody.token);
          headers.Authorization = `Bearer ${initBody.token}`;
          // Store CSRF token returned by init (cross-origin can't read cookies)
          if (initBody.csrfToken) csrfTokenMemory = initBody.csrfToken;
          res = await rawRequest(path, options, headers);
        }
      }
    } catch {
      // re-init failed, fall through to error
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function requestFormData<T>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  onProgress?: (progress: number) => void,
): Promise<T> {
  const headers: Record<string, string> = {};

  const authToken = readStoredToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let csrf = csrfTokenMemory;
  if (!csrf) csrf = await refreshCsrfToken();
  if (!csrf) csrf = getCookie(CSRF_COOKIE_NAME);
  if (csrf) headers[CSRF_HEADER_NAME] = csrf;

  const sendWithXhr = () =>
    new Promise<{ status: number; ok: boolean; body: unknown }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, `${API_BASE}${path}`);
      xhr.withCredentials = true;
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          onProgress(Math.max(0, Math.min(1, event.loaded / event.total)));
        };
      }

      xhr.onerror = () => reject(new Error('Erreur réseau'));
      xhr.onload = () => {
        const text = xhr.responseText || '';
        let body: unknown = {};
        try {
          body = text ? JSON.parse(text) : {};
        } catch {
          body = {};
        }
        resolve({
          status: xhr.status,
          ok: xhr.status >= 200 && xhr.status < 300,
          body,
        });
      };

      xhr.send(formData);
    });

  if (onProgress) {
    let res = await sendWithXhr();

    if (res.status === 403 && (res.body as { message?: string })?.message === 'CSRF token invalide') {
      const nextCsrf = (await refreshCsrfToken()) || getCookie(CSRF_COOKIE_NAME);
      if (nextCsrf) headers[CSRF_HEADER_NAME] = nextCsrf;
      res = await sendWithXhr();
    }

    if (!res.ok) {
      const body = res.body as { message?: string };
      throw new Error(body?.message || `HTTP ${res.status}`);
    }

    onProgress(1);
    return res.body as T;
  }

  let res = await rawRequest(
    path,
    {
      method,
      body: formData,
    },
    headers,
  );

  if (res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    if (body?.message === 'CSRF token invalide') {
      const nextCsrf = (await refreshCsrfToken()) || getCookie(CSRF_COOKIE_NAME);
      if (nextCsrf) headers[CSRF_HEADER_NAME] = nextCsrf;
      res = await rawRequest(
        path,
        {
          method,
          body: formData,
        },
        headers,
      );
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
