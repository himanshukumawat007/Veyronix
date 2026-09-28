/**
 * Prototype role-based authentication.
 *
 * NOT production-grade: credentials come from environment variables (with demo defaults) and
 * sessions are HMAC-signed tokens held in memory by the browser. Replace with the organisation's
 * identity provider (e.g. the existing Firebase Auth integration, or an SSO/OIDC provider)
 * before any real deployment.
 */
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Role } from './types';

const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.log('[auth] SESSION_SECRET not set — using a random per-process secret (sessions reset on restart).');
}
const TTL_MS = 12 * 60 * 60 * 1000;

interface Account {
  username: string;
  password: string;
  role: Role;
  displayName: string;
  organisation: string;
}

function accounts(): Account[] {
  return [
    {
      username: process.env.AUTHORITY_USERNAME || 'authority',
      password: process.env.AUTHORITY_PASSWORD || 'authority@123',
      role: 'AUTHORITY',
      displayName: 'District Control Room',
      organisation: 'Disaster Management Authority (demo)',
    },
    {
      username: process.env.OPERATOR_USERNAME || 'operator',
      password: process.env.OPERATOR_PASSWORD || 'operator@123',
      role: 'MINE_OPERATOR',
      displayName: 'Mine Safety Engineer',
      organisation: 'Mine Operator (demo)',
    },
  ];
}

export interface Session {
  sub: string;
  role: Role;
  name: string;
  org: string;
  exp: number;
}

const b64 = (s: string) => Buffer.from(s).toString('base64url');

function sign(payload: Session): string {
  const body = b64(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verify(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    if (s.exp < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function login(username: string, password: string, role?: Role) {
  const acc = accounts().find((a) => safeEqual(a.username, String(username || '')) && (!role || a.role === role));
  if (!acc || !safeEqual(acc.password, String(password || ''))) return null;
  const session: Session = { sub: acc.username, role: acc.role, name: acc.displayName, org: acc.organisation, exp: Date.now() + TTL_MS };
  return { token: sign(session), session };
}

export interface AuthedRequest extends Request {
  session?: Session;
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    const s = verify(token);
    if (!s) return res.status(401).json({ error: 'Authentication required' });
    if (roles.length && !roles.includes(s.role)) return res.status(403).json({ error: 'Not permitted for this role' });
    req.session = s;
    next();
  };
}
