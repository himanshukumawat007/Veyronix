import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, HardHat, Lock } from 'lucide-react';
import { usePlatformAuth } from '../../context/AuthContext';
import { Button, Card, cx } from '../../components/ui';
import type { Role } from '../../services/types';

const ROLES: Array<{ key: 'authority' | 'operator'; role: Role; label: string; icon: React.ComponentType<{ className?: string }>; demoUser: string; demoPass: string; desc: string }> = [
  { key: 'authority', role: 'AUTHORITY', label: 'Authority / Disaster Management', icon: Building2, demoUser: 'authority', demoPass: 'authority@123', desc: 'Multi-region monitoring, alerts, incidents and reports' },
  { key: 'operator', role: 'MINE_OPERATOR', label: 'Mine Operator', icon: HardHat, demoUser: 'operator', demoPass: 'operator@123', desc: 'Node telemetry, sensor & gateway health, zone management' },
];

export default function LoginPage() {
  const [params, setParams] = useSearchParams();
  const which = params.get('role') === 'operator' ? 'operator' : 'authority';
  const cfg = ROLES.find((r) => r.key === which)!;
  const { login, user } = usePlatformAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setUsername('');
    setPassword('');
  }, [which]);

  const home = (r: Role) => (r === 'AUTHORITY' ? '/authority/dashboard' : '/operator/dashboard');

  useEffect(() => {
    if (user && user.role === cfg.role) navigate(params.get('next') || home(user.role), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await login(username.trim(), password, cfg.role);
      navigate(params.get('next') || home(u.role), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="grid grid-cols-2 gap-2 mb-5" role="tablist" aria-label="Login type">
        {ROLES.map((r) => (
          <button
            key={r.key}
            role="tab"
            aria-selected={which === r.key}
            onClick={() => setParams({ role: r.key })}
            className={cx('flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm border', which === r.key ? 'bg-ink-700 border-white/25 text-fg' : 'bg-ink-800 border-white/10 text-fg-3 hover:text-fg')}
          >
            <r.icon className="w-4 h-4" aria-hidden /> {r.key === 'authority' ? 'Authority' : 'Mine Operator'}
          </button>
        ))}
      </div>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-10 h-10 rounded-lg bg-signal/12 text-signal grid place-items-center">
            <cfg.icon className="w-5 h-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-semibold text-lg leading-tight">{cfg.label}</h1>
            <p className="text-xs text-fg-3">{cfg.desc}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="u" className="text-xs text-fg-2">Username</label>
            <input id="u" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-signal outline-none" />
          </div>
          <div>
            <label htmlFor="p" className="text-xs text-fg-2">Password</label>
            <input id="p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full bg-ink-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-signal outline-none" />
          </div>
          {error && <p role="alert" className="text-sm text-risk-critical">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" size="lg" busy={busy}>
            <Lock className="w-4 h-4" aria-hidden /> Sign in
          </Button>
        </form>
        <div className="mt-5 rounded-lg bg-ink-900 border border-white/10 p-3 text-xs text-fg-3">
          <div className="font-semibold text-fg-2 mb-1">Prototype demo credentials</div>
          <div className="bd-num">
            {cfg.demoUser} / {cfg.demoPass}
          </div>
          <button type="button" className="text-signal hover:underline mt-1" onClick={() => { setUsername(cfg.demoUser); setPassword(cfg.demoPass); }}>
            Fill demo credentials
          </button>
          <p className="mt-2">Prototype authentication only — not production-secure. Change credentials via server environment variables.</p>
        </div>
      </Card>
    </div>
  );
}
