/**
 * Utility helpers used across PWA screens.
 */

/** Apple App Store ID — set VITE_APPLE_APP_ID in .env for production. */
const APPLE_APP_ID = import.meta.env.VITE_APPLE_APP_ID || 'id000000000';

const ANDROID_PACKAGE = 'com.mystme.app';

/**
 * Store link. On Android the transfer code rides along in the Play install
 * referrer, so the freshly installed app can pick the conversation up by itself.
 */
export function getStoreLink(transferCode?: string | null): string {
  if (/android/i.test(navigator.userAgent)) {
    const base = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
    return transferCode
      ? `${base}&referrer=${encodeURIComponent(`transfer=${transferCode}`)}`
      : base;
  }
  return `https://apps.apple.com/app/mystme/${APPLE_APP_ID}`;
}

/** Deep link opening the installed app straight on the transfer. */
export function getTransferDeepLink(transferCode?: string | null): string {
  return transferCode
    ? `mystme://transfer?code=${encodeURIComponent(transferCode)}`
    : 'mystme://home';
}

/**
 * Copy the code so the app can offer it on first launch (iOS has no install
 * referrer). Must run inside a user gesture. Never throws.
 */
export async function copyTransferCode(transferCode?: string | null): Promise<boolean> {
  if (!transferCode) return false;
  try {
    await navigator.clipboard?.writeText(`MYSTME:${transferCode}`);
    return true;
  } catch {
    return false;
  }
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0j';
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
