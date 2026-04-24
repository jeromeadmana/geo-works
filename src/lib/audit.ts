import { headers } from 'next/headers';
import { db } from '@/db';
import { auditLog } from '@/db/schema';
import { auth } from '@/lib/auth';

export type AuditAction =
  | 'parcel.create'
  | 'parcel.update'
  | 'parcel.delete'
  | 'parcel.restore'
  | 'parcel.status_change'
  | 'parcel.bulk_status_change'
  | 'photo.add'
  | 'photo.remove'
  | 'photo.set_primary'
  | 'photo.reorder';

export async function logAudit(params: {
  action: AuditAction;
  entityType: 'parcel' | 'photo';
  entityId?: string | null;
  diff?: Record<string, unknown> | null;
}): Promise<void> {
  const [session, hdrs] = await Promise.all([auth(), headers()]);
  const fwd = hdrs.get('x-forwarded-for');
  const ip = (fwd ? fwd.split(',')[0]?.trim() : null) ?? hdrs.get('x-real-ip') ?? null;
  const userAgent = hdrs.get('user-agent');

  await db.insert(auditLog).values({
    actorId: session?.user?.id ?? null,
    actorEmail: session?.user?.email ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    diff: params.diff ?? null,
    ip,
    userAgent,
  });
}
