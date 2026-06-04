import { Request } from 'express';
import { prisma } from '../db/client';

export function getTenantApiKey(req: Request): string | undefined {
  const headerValue = req.headers['x-tenant-api-key'];
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice('Bearer '.length)
    : undefined;

  return (
    (Array.isArray(headerValue) ? headerValue[0] : headerValue) ||
    req.body?.tenantApiKey ||
    bearer ||
    undefined
  );
}

export async function resolveTenant(req: Request) {
  const tenantId = ((req as any).auth?.tenantId || req.body?.tenantId || req.query.tenantId) as string | undefined;
  const tenantApiKey = getTenantApiKey(req);

  if (tenantId) {
    return prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  if (tenantApiKey) {
    return prisma.tenant.findUnique({ where: { apiKey: tenantApiKey } });
  }

  if (process.env.NODE_ENV !== 'production') {
    return prisma.tenant.findFirst();
  }

  return null;
}
