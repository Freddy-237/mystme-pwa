const API_BASE = import.meta.env.VITE_API_URL || '';
const CSRF_COOKIE_NAME = 'mystme_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

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

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!isSafeMethod(method)) {
    const csrf = getCookie(CSRF_COOKIE_NAME);
    if (csrf) headers[CSRF_HEADER_NAME] = csrf;
  }

  let res = await rawRequest(path, options, headers);

  if (!isSafeMethod(method) && res.status === 403) {
    const body = await res.clone().json().catch(() => ({}));
    if (body?.message === 'CSRF token invalide') {
      await rawRequest('/identity/csrf', { method: 'GET' }, { 'Content-Type': 'application/json' });
      const nextCsrf = getCookie(CSRF_COOKIE_NAME);
      if (nextCsrf) headers[CSRF_HEADER_NAME] = nextCsrf;
      res = await rawRequest(path, options, headers);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
