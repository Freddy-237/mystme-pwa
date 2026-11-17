import { useCallback, useEffect, useRef, useState } from 'react';
import { transferApi } from '../services/api';

/**
 * Fetches a one-time PWA → app transfer code while `enabled`, and renews it
 * shortly before it expires so the links on screen always carry a valid code.
 */
export function useTransferCode(enabled: boolean) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await transferApi.create();
      setCode(res.code);
      setExpiresAt(new Date(res.expiresAt).getTime());
      setError(false);
    } catch {
      setError(true);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (enabled && !code) void refresh();
  }, [enabled, code, refresh]);

  useEffect(() => {
    if (!enabled || !expiresAt) return;
    const delay = Math.max(5_000, expiresAt - Date.now() - 60_000);
    const timer = setTimeout(() => { void refresh(); }, delay);
    return () => clearTimeout(timer);
  }, [enabled, expiresAt, refresh]);

  return { code, error, refresh };
}
