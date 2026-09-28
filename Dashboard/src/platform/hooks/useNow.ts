import { useEffect, useState } from 'react';

/** Re-render on a fixed cadence (for "updated 5 s ago" labels) without touching data state. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
