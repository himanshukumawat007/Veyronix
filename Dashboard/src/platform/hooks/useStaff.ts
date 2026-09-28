import { useCallback, useState } from 'react';
import { usePlatformAuth } from '../context/AuthContext';
import { useLive } from '../context/LiveContext';
import { api } from '../services/api';

/** Role-aware route bases so shared pages link to the right dashboard. */
export function useRoleBase() {
  const { user } = usePlatformAuth();
  const isAuthority = user?.role === 'AUTHORITY';
  return {
    isAuthority,
    base: isAuthority ? '/authority' : '/operator',
    zoneBase: isAuthority ? '/authority/zone' : '/operator/zone',
    nodeBase: isAuthority ? null : '/operator/node',
  };
}

/** Acknowledge / resolve with busy + error state, refreshing callers afterwards. */
export function useAlertActions(after?: () => void) {
  const live = useLive();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const act = useCallback(
    async (kind: 'ack' | 'res', id: string) => {
      setBusy(`${kind}:${id}`);
      setError(null);
      try {
        if (kind === 'ack') await api.acknowledgeAlert(id);
        else await api.resolveAlert(id);
        after?.();
        live.refresh();
      } catch (e: any) {
        setError(e?.message || 'Action failed');
      } finally {
        setBusy(null);
      }
    },
    [after, live],
  );
  return { busy, error, ack: (id: string) => act('ack', id), resolve: (id: string) => act('res', id) };
}
