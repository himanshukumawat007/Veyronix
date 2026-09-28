import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from '../services/api';
import type { Role, SessionUser } from '../services/types';

/**
 * Prototype role-based session. The token is kept in sessionStorage (cleared when the tab closes).
 * This is NOT production-secure authentication — see server/platform/auth.ts.
 */
const KEY = 'bhu_drishti_session_v2';

interface AuthCtx {
  user: SessionUser | null;
  ready: boolean;
  login: (username: string, password: string, role: Role) => Promise<SessionUser>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function readStored(): { token: string; user: SessionUser } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user?.role && parsed.user.expiresAt > Date.now()) return parsed;
  } catch {
    /* storage unavailable */
  }
  return null;
}

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    const stored = readStored();
    if (stored) {
      setAuthToken(stored.token);
      api
        .me()
        .then((u) => setUser(u))
        .catch(() => logout())
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (username: string, password: string, role: Role) => {
    const res = await api.login(username, password, role);
    setAuthToken(res.token);
    setUser(res.user);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(res));
    } catch {
      /* ignore */
    }
    return res.user;
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function usePlatformAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlatformAuth must be used inside PlatformAuthProvider');
  return c;
}
