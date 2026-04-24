import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const parcelStatusEnum = pgEnum('geo_parcel_status', [
  'active',
  'pending',
  'sold',
  'inactive',
]);

export const userRoleEnum = pgEnum('geo_user_role', ['admin', 'editor']);

export const parcels = pgTable(
  'geo_parcels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    price: numeric('price', { precision: 12, scale: 2 }),
    acreage: numeric('acreage', { precision: 10, scale: 3 }),
    apn: text('apn'),
    state: text('state').notNull(),
    county: text('county'),
    addressLine: text('address_line'),
    zipCode: text('zip_code'),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    status: parcelStatusEnum('status').notNull().default('active'),
    terms: jsonb('terms').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    financing: jsonb('financing').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    featured: boolean('featured').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('geo_parcels_status_idx').on(t.status),
    index('geo_parcels_state_idx').on(t.state),
    index('geo_parcels_location_idx').on(t.lat, t.lng),
    index('geo_parcels_featured_idx').on(t.featured),
  ],
);

export const parcelPhotos = pgTable(
  'geo_parcel_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parcelId: uuid('parcel_id')
      .notNull()
      .references(() => parcels.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    publicId: text('public_id'),
    alt: text('alt'),
    width: integer('width'),
    height: integer('height'),
    sortOrder: integer('sort_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('geo_parcel_photos_parcel_idx').on(t.parcelId)],
);

export const users = pgTable('geo_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('editor'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable(
  'geo_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    diff: jsonb('diff').$type<Record<string, unknown>>(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('geo_audit_log_entity_idx').on(t.entityType, t.entityId),
    index('geo_audit_log_actor_idx').on(t.actorId),
    index('geo_audit_log_created_at_idx').on(t.createdAt),
  ],
);

export const parcelRelations = relations(parcels, ({ many }) => ({
  photos: many(parcelPhotos),
}));

export const parcelPhotoRelations = relations(parcelPhotos, ({ one }) => ({
  parcel: one(parcels, {
    fields: [parcelPhotos.parcelId],
    references: [parcels.id],
  }),
}));

export type Parcel = typeof parcels.$inferSelect;
export type NewParcel = typeof parcels.$inferInsert;
export type ParcelPhoto = typeof parcelPhotos.$inferSelect;
export type NewParcelPhoto = typeof parcelPhotos.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
export type ParcelStatus = (typeof parcelStatusEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
