import { and, asc, desc, eq, ilike, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  parcelPhotos,
  parcels,
  type Parcel,
  type ParcelPhoto,
  type ParcelStatus,
} from '@/db/schema';

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

export type MapParcel = {
  id: string;
  slug: string;
  title: string;
  price: string | null;
  acreage: string | null;
  state: string;
  county: string | null;
  lat: number;
  lng: number;
  status: ParcelStatus;
};

export type MapFeatureProperties = Omit<MapParcel, 'lat' | 'lng'>;
export type MapFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: MapFeatureProperties;
};
export type MapFeatureCollection = {
  type: 'FeatureCollection';
  features: MapFeature[];
};

/**
 * Returns every parcel eligible for the public map — active, pending, and sold.
 * Inactive and soft-deleted rows are excluded entirely (they never render on
 * the map, per Phase 2 decision).
 */
export async function getMappableParcels(): Promise<MapParcel[]> {
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
    .where(and(ne(parcels.status, 'inactive'), isNull(parcels.deletedAt)));
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export type AdminSort =
  | 'updated_desc'
  | 'created_desc'
  | 'price_asc'
  | 'price_desc'
  | 'title_asc';

export async function listAllParcelsForAdmin({
  statuses,
  state,
  search,
  sort = 'updated_desc',
  page = 1,
  pageSize = 20,
}: {
  statuses?: ParcelStatus[];
  state?: string | null;
  search?: string | null;
  sort?: AdminSort;
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  items: ParcelWithPhotos[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const trimmedSearch = search?.trim();
  const whereClause = and(
    isNull(parcels.deletedAt),
    statuses && statuses.length > 0 ? inArray(parcels.status, statuses) : undefined,
    state ? eq(parcels.state, state.toUpperCase()) : undefined,
    trimmedSearch
      ? or(
          ilike(parcels.title, `%${trimmedSearch}%`),
          ilike(parcels.apn, `%${trimmedSearch}%`),
          ilike(parcels.county, `%${trimmedSearch}%`),
        )
      : undefined,
  );

  const order = (() => {
    switch (sort) {
      case 'created_desc':
        return [desc(parcels.createdAt)];
      case 'price_asc':
        return [asc(parcels.price)];
      case 'price_desc':
        return [desc(parcels.price)];
      case 'title_asc':
        return [asc(parcels.title)];
      default:
        return [desc(parcels.updatedAt)];
    }
  })();

  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * pageSize;

  const [rows, totalRow] = await Promise.all([
    db.query.parcels.findMany({
      where: whereClause,
      orderBy: order,
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

export async function getParcelById(id: string): Promise<ParcelWithPhotos | null> {
  const row = await db.query.parcels.findFirst({
    where: and(eq(parcels.id, id), isNull(parcels.deletedAt)),
    with: {
      photos: {
        orderBy: [desc(parcelPhotos.isPrimary), asc(parcelPhotos.sortOrder)],
      },
    },
  });
  return (row ?? null) as ParcelWithPhotos | null;
}

export function toMapFeatures(rows: MapParcel[]): MapFeatureCollection {
  const features: MapFeature[] = [];
  for (const r of rows) {
    if (!isValidCoord(r.lat, r.lng)) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: {
        id: r.id,
        slug: r.slug,
        title: r.title,
        price: r.price,
        acreage: r.acreage,
        state: r.state,
        county: r.county,
        status: r.status,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}
