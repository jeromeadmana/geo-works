# geo-works

Branded subdomain site for U.S. land parcel listings. Interactive Mapbox map,
per-parcel detail pages, and an admin CMS for non-technical staff.

## Stack

- Next.js 16 (App Router, Turbopack, Server Components)
- TypeScript + Tailwind CSS v4
- Drizzle ORM + `postgres` driver → Aiven Postgres
- NextAuth v5 (credentials, JWT sessions) — Phase 3
- Mapbox GL JS — Phase 2
- Cloudinary (signed uploads) — Phase 3
- Deploys to Vercel Hobby

## Status

Phases 0–3 complete. Phase 0: scaffold + shared-DB safety. Phase 1: public
listings at `/parcels`. Phase 2: interactive map at `/map`. Phase 3: admin
CMS at `/admin` with NextAuth credentials, parcel CRUD, bulk status changes,
Cloudinary photo uploads, Mapbox lat/lng picker, and an audit log. Remaining
phases (brand polish, deploy, hardening) are scheduled in [tasks/todo.md](tasks/todo.md).

## Demo admin credentials

After `npm run db:seed`, a demo admin is available:

- URL: `http://localhost:3000/admin/login`
- Email: `admin@geoworks.local`
- Password: `geoworks-admin`

The credentials are re-upserted on every `npm run db:seed`, so you can reset
at any time.

## Prerequisites

- Node.js 20.9+ (LTS)
- An Aiven Postgres URI you can share with this project
- A Mapbox account (free tier)
- A Cloudinary account (free tier)

## Setup

```bash
# 1. install deps (already done during scaffold)
npm install

# 2. fill .env.local with real values (see .env.local.example for each field)
#    - DATABASE_URL: Aiven URI, must include ?sslmode=require
#    - NEXTAUTH_SECRET: any 32+ char random string
#    - NEXT_PUBLIC_MAPBOX_TOKEN: Mapbox public token (pk.*)
#    - CLOUDINARY_*: from your Cloudinary dashboard

# 3. generate the initial migration from src/db/schema.ts
npm run db:generate

# 4. REVIEW the generated SQL under src/db/migrations/ before applying
#    (this is a shared database — every statement must target geo_* only)

# 5. apply the migration
npm run db:migrate

# 6. start the dev server
npm run dev
```

Then open [http://localhost:3000/api/health](http://localhost:3000/api/health).
A healthy response looks like:

```json
{
  "status": "ok",
  "db": "connected",
  "ping": { "ok": 1 },
  "geoTables": ["geo_audit_log", "geo_parcel_photos", "geo_parcels", "geo_users"],
  "geoTableCount": 4,
  "timestamp": "..."
}
```

## Shared database safety

This project runs against a Postgres instance shared with other apps. The
guardrails in place — and that you must keep in place — are:

1. **Every table is prefixed `geo_`** in `src/db/schema.ts`. Never create an
   unprefixed table, enum, or index.
2. **Drizzle is scoped** via `tablesFilter: ['geo_*']` in `drizzle.config.ts`.
   Introspection and `drizzle-kit pull` only see our tables.
3. **Migrations are reviewed before applying.** `db:generate` writes SQL to
   `src/db/migrations/`. Open the `.sql` file and confirm every statement
   names a `geo_*` object before running `db:migrate`.
4. **Never run `db:push` against the production/shared database.** `push`
   diffs the live schema against code and applies changes directly with no
   migration file. Use `generate` -> review -> `migrate` instead.
5. **The health endpoint reports which `geo_*` tables it can see.** Compare
   that list against the schema when diagnosing issues.
6. **Recommended (not required yet):** create a dedicated Postgres role that
   only has privileges on `geo_*` tables and use it in `DATABASE_URL`. SQL
   for this will be added once we move toward production.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack by default in Next 16) |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Write a new migration from `schema.ts` diffs |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Drizzle Studio (browses only `geo_*` tables) |
| `npm run db:drop` | Mark a migration as reverted (does not drop tables) |

## Project layout

```
src/
  app/
    api/health/route.ts    # DB connectivity probe + geo_* table listing
    layout.tsx             # root layout (scaffold default, rebranded in Phase 4)
    page.tsx               # home (scaffold default, replaced in Phase 1)
    globals.css            # Tailwind entry
  db/
    schema.ts              # All geo_* tables, enums, relations, types
    index.ts               # Drizzle client (single pooled connection, prepare: false)
    migrations/            # generated SQL — review before applying
  lib/
    env.ts                 # zod-validated environment variables
drizzle.config.ts          # tablesFilter: ['geo_*']
```

## Roadmap

| Phase | Scope |
| --- | --- |
| 0 (now) | Scaffold, shared-DB safety, schema, health check |
| 1 | Seed data, `/parcels`, `/parcels/[slug]` |
| 2 | `/map` — Mapbox clustering, filters, mobile bottom-sheet |
| 3 | `/admin` — auth, CRUD, Cloudinary uploads, audit log |
| 4 | Brand system, responsive polish |
| 5 | SEO, sitemap, subdomain deploy on Vercel |
| 6 | Rate limiting, backups, operator docs |
