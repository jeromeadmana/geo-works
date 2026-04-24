'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { parcelPhotos, parcels, type ParcelStatus } from '@/db/schema';
import { auth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { deleteByPublicId } from '@/lib/cloudinary';
import { slugify } from '@/lib/slug';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  return session;
}

const parcelStatusSchema = z.enum(['active', 'pending', 'sold', 'inactive']);

const parcelInputSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().max(100).optional(),
  description: z.string().max(20000).default(''),
  price: z
    .union([z.string(), z.number()])
    .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))
    .refine((n) => n === null || (Number.isFinite(n) && n >= 0), 'Price must be ≥ 0')
    .nullable(),
  acreage: z
    .union([z.string(), z.number()])
    .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))
    .refine((n) => n === null || (Number.isFinite(n) && n >= 0), 'Acreage must be ≥ 0')
    .nullable(),
  apn: z.string().max(100).optional().nullable(),
  state: z.string().length(2).toUpperCase(),
  county: z.string().max(100).optional().nullable(),
  addressLine: z.string().max(200).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  status: parcelStatusSchema,
  terms: z.record(z.string(), z.unknown()).default({}),
  financing: z.record(z.string(), z.unknown()).default({}),
  featured: z.coerce.boolean().default(false),
});

export type ParcelInput = z.infer<typeof parcelInputSchema>;

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let root = slugify(base).slice(0, 80);
  if (!root) root = 'parcel';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const existing = await db
      .select({ id: parcels.id })
      .from(parcels)
      .where(eq(parcels.slug, candidate))
      .limit(1);
    if (existing.length === 0 || existing[0].id === excludeId) return candidate;
  }
  throw new Error('Could not generate a unique slug.');
}

function toDbNumeric(n: number | null): string | null {
  return n === null ? null : String(n);
}

function invalidatePublicSurface(slug?: string) {
  revalidatePath('/');
  revalidatePath('/parcels');
  revalidatePath('/map');
  if (slug) revalidatePath(`/parcels/${slug}`);
  revalidatePath('/admin/parcels');
}

export async function createParcel(raw: ParcelInput) {
  await requireAuth();
  const data = parcelInputSchema.parse(raw);
  const slug = await ensureUniqueSlug(data.slug || data.title);

  const [row] = await db
    .insert(parcels)
    .values({
      title: data.title,
      slug,
      description: data.description,
      price: toDbNumeric(data.price),
      acreage: toDbNumeric(data.acreage),
      apn: data.apn ?? null,
      state: data.state,
      county: data.county ?? null,
      addressLine: data.addressLine ?? null,
      zipCode: data.zipCode ?? null,
      lat: data.lat,
      lng: data.lng,
      status: data.status,
      terms: data.terms,
      financing: data.financing,
      featured: data.featured,
    })
    .returning({ id: parcels.id, slug: parcels.slug });

  await logAudit({
    action: 'parcel.create',
    entityType: 'parcel',
    entityId: row.id,
    diff: { after: data, slug: row.slug },
  });
  invalidatePublicSurface(row.slug);
  return { id: row.id, slug: row.slug };
}

export async function updateParcel(id: string, raw: ParcelInput) {
  await requireAuth();
  const data = parcelInputSchema.parse(raw);
  const slug = await ensureUniqueSlug(data.slug || data.title, id);

  await db
    .update(parcels)
    .set({
      title: data.title,
      slug,
      description: data.description,
      price: toDbNumeric(data.price),
      acreage: toDbNumeric(data.acreage),
      apn: data.apn ?? null,
      state: data.state,
      county: data.county ?? null,
      addressLine: data.addressLine ?? null,
      zipCode: data.zipCode ?? null,
      lat: data.lat,
      lng: data.lng,
      status: data.status,
      terms: data.terms,
      financing: data.financing,
      featured: data.featured,
      updatedAt: new Date(),
    })
    .where(eq(parcels.id, id));

  await logAudit({
    action: 'parcel.update',
    entityType: 'parcel',
    entityId: id,
    diff: { after: data, slug },
  });
  invalidatePublicSurface(slug);
  return { id, slug };
}

export async function updateParcelStatus(id: string, status: ParcelStatus) {
  await requireAuth();
  const parsed = parcelStatusSchema.parse(status);
  const [existing] = await db
    .select({ slug: parcels.slug, currentStatus: parcels.status })
    .from(parcels)
    .where(eq(parcels.id, id))
    .limit(1);
  if (!existing) throw new Error('Parcel not found');

  await db
    .update(parcels)
    .set({ status: parsed, updatedAt: new Date() })
    .where(eq(parcels.id, id));

  await logAudit({
    action: 'parcel.status_change',
    entityType: 'parcel',
    entityId: id,
    diff: { from: existing.currentStatus, to: parsed },
  });
  invalidatePublicSurface(existing.slug);
}

export async function bulkUpdateStatus(ids: string[], status: ParcelStatus) {
  await requireAuth();
  if (ids.length === 0) return { updated: 0 };
  const parsed = parcelStatusSchema.parse(status);
  const result = await db
    .update(parcels)
    .set({ status: parsed, updatedAt: new Date() })
    .where(and(inArray(parcels.id, ids), isNull(parcels.deletedAt)))
    .returning({ id: parcels.id });

  await logAudit({
    action: 'parcel.bulk_status_change',
    entityType: 'parcel',
    diff: { ids, status: parsed, updated: result.length },
  });
  invalidatePublicSurface();
  return { updated: result.length };
}

export async function softDeleteParcel(id: string) {
  await requireAuth();
  const [existing] = await db
    .select({ slug: parcels.slug })
    .from(parcels)
    .where(eq(parcels.id, id))
    .limit(1);
  if (!existing) throw new Error('Parcel not found');

  await db
    .update(parcels)
    .set({ deletedAt: new Date(), status: 'inactive', updatedAt: new Date() })
    .where(eq(parcels.id, id));

  await logAudit({ action: 'parcel.delete', entityType: 'parcel', entityId: id });
  invalidatePublicSurface(existing.slug);
}

const addPhotoSchema = z.object({
  parcelId: z.string().uuid(),
  url: z.string().url(),
  publicId: z.string().min(1),
  alt: z.string().max(200).optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
});

export async function addPhoto(input: z.infer<typeof addPhotoSchema>) {
  await requireAuth();
  const data = addPhotoSchema.parse(input);

  const siblings = await db
    .select({ id: parcelPhotos.id })
    .from(parcelPhotos)
    .where(eq(parcelPhotos.parcelId, data.parcelId));

  const [row] = await db
    .insert(parcelPhotos)
    .values({
      parcelId: data.parcelId,
      url: data.url,
      publicId: data.publicId,
      alt: data.alt ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      sortOrder: siblings.length,
      isPrimary: siblings.length === 0,
    })
    .returning({ id: parcelPhotos.id });

  await logAudit({
    action: 'photo.add',
    entityType: 'photo',
    entityId: row.id,
    diff: { parcelId: data.parcelId, url: data.url, publicId: data.publicId },
  });
  revalidatePath('/admin/parcels');
  revalidatePath(`/admin/parcels/${data.parcelId}/edit`);
  return { id: row.id };
}

export async function removePhoto(photoId: string) {
  await requireAuth();
  const [photo] = await db
    .select()
    .from(parcelPhotos)
    .where(eq(parcelPhotos.id, photoId))
    .limit(1);
  if (!photo) throw new Error('Photo not found');

  await db.delete(parcelPhotos).where(eq(parcelPhotos.id, photoId));

  if (photo.publicId) {
    await deleteByPublicId(photo.publicId);
  }

  // If we removed the primary photo, promote the next-sorted one (if any).
  if (photo.isPrimary) {
    const [next] = await db
      .select({ id: parcelPhotos.id })
      .from(parcelPhotos)
      .where(eq(parcelPhotos.parcelId, photo.parcelId))
      .orderBy(parcelPhotos.sortOrder)
      .limit(1);
    if (next) {
      await db
        .update(parcelPhotos)
        .set({ isPrimary: true })
        .where(eq(parcelPhotos.id, next.id));
    }
  }

  await logAudit({
    action: 'photo.remove',
    entityType: 'photo',
    entityId: photoId,
    diff: { parcelId: photo.parcelId, publicId: photo.publicId },
  });
  revalidatePath(`/admin/parcels/${photo.parcelId}/edit`);
  revalidatePath('/parcels');
}

// Form-action wrapper for the bulk table form (uses FormData).
export async function bulkUpdateStatusFormAction(formData: FormData) {
  const ids = formData.getAll('selected').map(String).filter(Boolean);
  const status = parcelStatusSchema.parse(formData.get('status'));
  await bulkUpdateStatus(ids, status);
}

export async function setPrimaryPhoto(parcelId: string, photoId: string) {
  await requireAuth();
  await db
    .update(parcelPhotos)
    .set({ isPrimary: false })
    .where(eq(parcelPhotos.parcelId, parcelId));
  await db
    .update(parcelPhotos)
    .set({ isPrimary: true })
    .where(eq(parcelPhotos.id, photoId));
  await logAudit({
    action: 'photo.set_primary',
    entityType: 'photo',
    entityId: photoId,
    diff: { parcelId },
  });
  revalidatePath(`/admin/parcels/${parcelId}/edit`);
  revalidatePath('/parcels');
}
