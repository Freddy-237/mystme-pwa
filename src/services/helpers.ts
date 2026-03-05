/**
 * Utility helpers used across PWA screens.
 */

/** Apple App Store ID — set VITE_APPLE_APP_ID in .env for production. */
const APPLE_APP_ID = import.meta.env.VITE_APPLE_APP_ID || 'id000000000';

export function getStoreLink(): string {
  return /android/i.test(navigator.userAgent)
    ? 'https://play.google.com/store/apps/details?id=com.mystme.app'
    : `https://apps.apple.com/app/mystme/${APPLE_APP_ID}`;
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
