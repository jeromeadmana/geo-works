import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { parcelPhotos, parcels, type Parcel, type ParcelPhoto } from '@/db/schema';

export type ParcelWithPhotos = Parcel & { photos: ParcelPhoto[] };

const PAGE_SIZE = 12;

export async function listActiveParcels({
  page = 1,
  pageSize = PAGE_SIZE,
}: { page?: number; pageSize?: number } = {}): Promise<{
  items: ParcelWithPhotos[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * pageSize;

  const whereClause = and(eq(parcels.status, 'active'), isNull(parcels.deletedAt));

  const [rows, totalRow] = await Promise.all([
    db.query.parcels.findMany({
      where: whereClause,
      orderBy: [desc(parcels.featured), desc(parcels.createdAt)],
      limit: pageSize,
      offset,
      with: {
        photos: {
          orderBy: [desc(parcelPhotos.isPrimary), asc(parcelPhotos.sortOrder)],
        },
      },
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(parcels)
      .where(whereClause),
  ]);

  const total = totalRow[0]?.count ?? 0;
  return {
    items: rows as ParcelWithPhotos[],
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getParcelBySlug(slug: string): Promise<ParcelWithPhotos | null> {
  const row = await db.query.parcels.findFirst({
    where: and(eq(parcels.slug, slug), isNull(parcels.deletedAt)),
    with: {
      photos: {
        orderBy: [desc(parcelPhotos.isPrimary), asc(parcelPhotos.sortOrder)],
      },
    },
  });
  return (row ?? null) as ParcelWithPhotos | null;
}

export async function getActiveParcelsForMap() {
  return db
    .select({
      id: parcels.id,
      slug: parcels.slug,
      title: parcels.title,
      price: parcels.price,
      acreage: parcels.acreage,
      state: parcels.state,
      county: parcels.county,
      lat: parcels.lat,
      lng: parcels.lng,
      status: parcels.status,
    })
    .from(parcels)
    .where(and(eq(parcels.status, 'active'), isNull(parcels.deletedAt)));
}
