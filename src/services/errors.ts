type ErrorLike = {
  message?: string;
  code?: string;
  statusCode?: number;
  status?: number;
  response?: {
    status?: number;
    data?: {
      message?: string;
      code?: string;
    };
  };
};

function getErrorLike(error: unknown): ErrorLike | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  return error as ErrorLike;
}

function extractStatus(error: unknown): number | null {
  const candidate = getErrorLike(error);
  return candidate?.statusCode
    ?? candidate?.status
    ?? candidate?.response?.status
    ?? null;
}

function extractCode(error: unknown): string {
  const candidate = getErrorLike(error);
  return String(
    candidate?.code
      ?? candidate?.response?.data?.code
      ?? '',
  ).toUpperCase();
}

function extractMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  const candidate = getErrorLike(error);
  return String(
    candidate?.response?.data?.message
      ?? candidate?.message
      ?? '',
  ).trim();
}

function sanitizeMessage(message: string): string {
  const normalized = message
    .replace(/AxiosError:?/gi, '')
    .replace(/Network Error/gi, '')
    .replace(/Failed to fetch/gi, '')
    .replace(/fetch failed/gi, '')
    .replace(/timeout of \d+ms exceeded/gi, '')
    .replace(/HTTP\s*\d+/gi, '')
    .replace(/\bERR_[A-Z_]+\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '';
  }

  if (/^error$/i.test(normalized) || /^erreur$/i.test(normalized)) {
    return '';
  }

  if (normalized.length > 140) {
    return '';
  }

  return normalized;
}

export function toFriendlyErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue. Réessaie dans un instant.',
): string {
  const status = extractStatus(error);
  const code = extractCode(error);
  const rawMessage = extractMessage(error);
  const safeMessage = sanitizeMessage(rawMessage);
  const lower = rawMessage.toLowerCase();

  if (code === 'RATE_LIMITED' || status === 429 || lower.includes('too many requests')) {
    return 'Trop de requetes pour le moment. Reessaie dans quelques instants.';
  }

  if (
    code === 'ERR_NETWORK'
    || lower.includes('network error')
    || lower.includes('failed to fetch')
    || lower.includes('fetch failed')
    || lower.includes('load failed')
    || lower.includes('socket')
  ) {
    return 'Connexion impossible. Verifie ton reseau puis reessaie.';
  }

  if (
    code === 'ECONNABORTED'
    || lower.includes('timeout')
    || lower.includes('timed out')
  ) {
    return 'Le serveur met trop de temps a repondre. Reessaie.';
  }

  if (status === 401) {
    return 'Ta session a expire. Recharge la page pour reprendre.';
  }

  if (status === 403) {
    return 'Cette action n est pas autorisee pour le moment.';
  }

  if (status === 404) {
    return 'Ce contenu est introuvable ou n est plus disponible.';
  }

  if (status === 409) {
    return safeMessage || 'Cette action est deja en cours ou deja appliquee.';
  }

  if (status !== null && status >= 500) {
    return 'Le service est temporairement indisponible. Reessaie plus tard.';
  }

  if (
    lower.includes('csrf')
    || lower.includes('token manquant')
    || lower.includes('authentification requise')
    || lower.includes('session expir')
    || lower.includes('session invalide')
  ) {
    return 'Ta session a expire. Recharge la page pour reprendre.';
  }

  return safeMessage || fallback;
}
/** Machine-readable business code sent by the backend (e.g. WEB_TRIAL_EXPIRED). */
export function getErrorCode(error: unknown): string {
  return extractCode(error);
}
