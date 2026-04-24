import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from '@/db';
import { auditLog, users } from '@/db/schema';
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

  // Stale-JWT safety: if the session carries a user id that no longer exists
  // in geo_users (e.g. DB was reseeded mid-session), fall back to a null
  // actor_id so the FK doesn't block the audit insert. actor_email is a
  // snapshot string with no FK, so who-did-it is still recorded.
  let actorId: string | null = session?.user?.id ?? null;
  if (actorId) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, actorId))
      .limit(1);
    if (!user) actorId = null;
  }

  await db.insert(auditLog).values({
    actorId,
    actorEmail: session?.user?.email ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    diff: params.diff ?? null,
    ip,
    userAgent,
  });
}
