import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

interface JwtPayload {
  tenantId?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='), 'base64');
}

function verifyJwt(token: string): JwtPayload | null {
  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  const parsed = JSON.parse(base64UrlDecode(payload).toString('utf8')) as JwtPayload;

  if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return parsed;
}

export function dashboardAuth(req: Request, res: Response, next: NextFunction) {
  const authRequired = env.REQUIRE_AUTH || env.NODE_ENV === 'production';

  if (!authRequired) {
    return next();
  }

  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice('Bearer '.length)
    : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const payload = verifyJwt(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    (req as any).auth = payload;
    res.locals.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
