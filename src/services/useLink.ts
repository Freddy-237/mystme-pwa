import { useCallback, useEffect, useState } from 'react';
import { linkApi, LinkResponse } from './api';

export interface LinkState {
  /** The user's link (null while loading or if none created yet) */
  link: LinkResponse | null;
  loading: boolean;
  error: string | null;
  /** Create a new link (if none exists) */
  createLink: () => Promise<void>;
  /** Deactivate the current link */
  deactivateLink: () => Promise<void>;
  /** Whether a link has been copied to clipboard */
  copied: boolean;
  /** Copy the share URL to clipboard */
  copyLink: () => Promise<void>;
}

export function useLink(ready: boolean): LinkState {
  const [link, setLink] = useState<LinkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // On mount (once identity ready), fetch existing links
  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    setLoading(true);
    linkApi
      .mine()
      .then((links) => {
        if (!mounted) return;
        // Pick the first active link
        const active = links.find((l) => l.is_active);
        setLink(active ?? null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [ready]);

  const createLink = useCallback(async () => {
    try {
      setError(null);
      const newLink = await linkApi.create();
      setLink(newLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, []);

  const deactivateLink = useCallback(async () => {
    if (!link) return;
    try {
      await linkApi.deactivate(link.id);
      setLink(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [link]);

  const copyLink = useCallback(async () => {
    if (!link) return;
    const fullUrl = `${window.location.origin}/c/${link.code}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = fullUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [link]);

  return { link, loading, error, createLink, deactivateLink, copied, copyLink };
}
