import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 4000;

/**
 * Poll an API function. Skips state updates when the payload is unchanged (prevents needless
 * re-renders), pauses while the tab is hidden and aborts in-flight requests on unmount.
 */
export function usePolling<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  intervalMs: number = DEFAULT_INTERVAL,
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const lastJson = useRef<string>('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const ctrlRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    try {
      const result = await fetcherRef.current(ctrl.signal);
      if (ctrl.signal.aborted) return;
      const json = JSON.stringify(result);
      if (json !== lastJson.current) {
        lastJson.current = json;
        setData(result);
      }
      setError(null);
      setUpdatedAt(Date.now());
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e?.message || 'Failed to load data');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    lastJson.current = '';
    setLoading(true);
    run();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') run();
    }, intervalMs);
    const onVis = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      ctrlRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intervalMs, enabled]);

  return { data, error, loading, updatedAt, refresh: run };
}
