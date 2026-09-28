import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../services/api';
import type { Meta, PublicAlert, PublicSummary, PublicZone, Scenario } from '../services/types';

/**
 * Shared, low-cost public data feed (summary, zones, alerts, meta) used by the public portal and by
 * the status strip in every layout. Private dashboards fetch their own detailed data.
 */
interface LiveCtx {
  summary: PublicSummary | null;
  zones: PublicZone[];
  alerts: PublicAlert[];
  meta: Meta | null;
  updatedAt: number | null;
  error: string | null;
  setScenario: (s: Scenario) => Promise<void>;
  setInternet: (online: boolean) => Promise<void>;
  resetDemo: () => Promise<void>;
  refresh: () => void;
}

const Ctx = createContext<LiveCtx | null>(null);

export const LiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const s = usePolling((sig) => api.getPublicSummary(sig), [], 3000);
  const z = usePolling((sig) => api.getPublicZones(sig), [], 3000);
  const a = usePolling((sig) => api.getPublicAlerts(sig), [], 3000);
  const m = usePolling((sig) => api.getMeta(sig), [], 15000);

  const refresh = useCallback(() => {
    s.refresh();
    z.refresh();
    a.refresh();
    m.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setScenario = useCallback(async (scenario: Scenario) => {
    await api.setDemo({ scenario });
    refresh();
  }, [refresh]);
  const setInternet = useCallback(async (online: boolean) => {
    await api.setDemo({ internetOnline: online });
    refresh();
  }, [refresh]);
  const resetDemo = useCallback(async () => {
    await api.resetDemo();
    refresh();
  }, [refresh]);

  const value = useMemo<LiveCtx>(
    () => ({
      summary: s.data,
      zones: z.data || [],
      alerts: a.data || [],
      meta: m.data,
      updatedAt: s.updatedAt,
      error: s.error || z.error,
      setScenario,
      setInternet,
      resetDemo,
      refresh,
    }),
    [s.data, z.data, a.data, m.data, s.updatedAt, s.error, z.error, setScenario, setInternet, resetDemo, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useLive() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLive must be used inside LiveProvider');
  return c;
}
