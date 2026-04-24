# tasks/todo.md — geo-works

Living document. Each phase gets a plan (pre-flight, checklist, verification, edge cases), a Go/No-Go gate, real-time status, and a closing review. Older completed phases are kept for provenance.

---

## Phase 0 — Scaffold + shared-DB safety · ✅ done 2026-04-25

Scaffold, Drizzle with `geo_*` tablesFilter, schema, lazy env, health endpoint, migration applied to Aiven. Committed as `e1f4caa`.

**Review:** All four `geo_*` tables live on Aiven; `/api/health` returns `geoTableCount: 4`; no non-`geo_*` objects touched on the shared DB; build + typecheck + lint green.

---

## Phase 1 — Seed + /parcels + /parcels/[slug] · ✅ done 2026-04-25

20 seeded parcels across 14 states; landing page; paginated index; detail page with JSON-LD and OG metadata; 404; `/map` Phase-2 placeholder.

**Review:**
- Public surface correctly shows 16 active listings (12 on page 1 + 4 on page 2). Pending/sold/inactive excluded, verified by slug count on `/parcels`.
- Detail page renders price `$59,500`, financing `$5,950 down`, status "Available", full schema.org JSON-LD with `InStock` availability on active parcels.
- `/parcels/does-not-exist` → 404.
- `npm run db:seed` is idempotent: truncates `geo_parcels` (cascades to photos) before insert; only `geo_*` touched.
- `npm run build` green; 6 routes (2 static, 3 dynamic, 1 API).

---

## Phase 2 — Interactive Mapbox map · ✅ done 2026-04-25

**Go/No-Go:** user approved 2026-04-25. Defaults chosen: Mapbox `light-v11`/`dark-v11` auto, default filter = Available, inactive parcels kept off the map entirely.

### Review / validation

**Automated:**
- `npm run lint` → clean (fixed a stray unescaped apostrophe in `src/app/page.tsx`).
- `npm run typecheck` → clean.
- `npm run build` → green. Build output shows `ƒ /api/parcels/map` and `ƒ /map` as expected dynamic routes.
- `curl -sI /api/parcels/map` → `HTTP 200`, `cache-control: public, s-maxage=60, stale-while-revalidate=300`.
- `curl /api/parcels/map | jq` → `FeatureCollection` with **19 features** (16 active + 2 pending + 1 sold; inactive excluded, 0 invalid coords).
- **`npm run diagnose:map` (Playwright):** map container resolves to `1440×796`, `.mapboxgl-canvas` renders at the same size, 7 console messages (no errors), 0 page errors, 0 failed requests. Screenshot `tmp-map-diagnostic.png` confirms the map renders with 16 clustered+unclustered markers across the continental US.

**Deviations from plan:**
1. **API returns all 19 mappable parcels, not 16 active.** Intentional: the client-side filter chips toggle without a round-trip. Inactive still excluded server-side.
2. **Debugging surfaced two architectural lessons** captured in `tasks/lessons.md`:
   - Tailwind utility classes must not co-mount on elements decorated by library CSS (`.mapboxgl-map { position: relative }` silently overrode `.absolute` and collapsed height to 0). Fix: wrap library mount targets in a separately-styled div.
   - When a UI bug is not `curl`-reproducible, reach for Playwright as the first diagnostic, not the last.
3. **`scripts/diagnose-map.ts` + `npm run diagnose:map`** added as a permanent tool for this project.

**Requires your human eye (cannot be curl'd):**
- Load [http://localhost:3000/map](http://localhost:3000/map) and confirm:
  - Map centers on continental US, zoom ~3.4
  - Clusters are visible at default zoom; zooming in over TX/NM/FL breaks them into pins
  - Clicking a cluster eases-in to its children
  - Clicking a pin opens the parcel panel (top-right on desktop, bottom sheet on mobile ≤ 640 px) with price, acreage, location, and a working "View details" link
  - Filter chip flips: `Available` (16), `Pending` (2), `Sold` (1), `All` (19). Empty overlay shows if a filter yields zero.
  - Deep-link: [http://localhost:3000/map?focus=108b68d0-ed72-4a71-ba09-0f08dd490a73](http://localhost:3000/map?focus=108b68d0-ed72-4a71-ba09-0f08dd490a73) should fly to Brewster County, TX and open the panel. (This is the Phase-1 first-seed parcel id — your local id may differ; use one from the curl output.)
  - Dark-mode toggle (system-level) picks the `dark-v11` style on next map load.
- `/parcels/[slug]` → click **"View on map"** → should route to `/map?focus=<that-parcel-id>`.

### Known follow-ups (intentionally out of Phase 2)

- Runtime style switching when the user flips system dark mode mid-session (currently chosen at mount). Not worth the style-reload complexity until Phase 4 brand pass.
- Map occupies `calc(100vh - 3.5rem)` (viewport minus header) so the footer scrolls below. Not broken, but Phase 4 polish may want a dedicated `/map` layout that hides the footer.
- No ISR/CDN testing — `s-maxage=60` will start paying off on Vercel deploy; locally it's just a hint to browsers.

---

## Phase 2 plan (frozen, for provenance)

**Goal:** Let a visitor open `/map`, see every active listing on a clustered U.S. map, click a marker for a mini-card, and jump into the detail page. Mobile gets a bottom sheet; desktop gets a side popup. Status filter chips decide which parcels show.

### Pre-flight — blast radius

| Area | Change | Risk |
| --- | --- | --- |
| `src/app/map/page.tsx` | Replace Phase-1 placeholder with a server component that fetches markers and renders `<ParcelMap>` | Low — route already wired into nav |
| `src/app/api/parcels/map/route.ts` | **NEW** public GET endpoint, returns the minimal marker payload. Cached `s-maxage=60, swr=300` | Low — read-only, no auth, covered by existing rate-limit plans (Phase 6) |
| `src/components/parcel-map.tsx` | **NEW** client component wrapping Mapbox GL (clusters, navigation/geolocate/fullscreen controls, marker click) | Medium — client-only lib, SSR traps |
| `src/components/parcel-map-popup.tsx` | **NEW** mini-card markup shared by desktop popup and mobile sheet | Low |
| `src/components/parcel-bottom-sheet.tsx` | **NEW** mobile sheet wrapper (CSS-driven, no lib) | Low |
| `src/lib/parcels.ts` | Reuse existing `getActiveParcelsForMap`; add `toMapFeatures(rows)` helper that emits GeoJSON | Low |
| `src/app/layout.tsx` / `globals.css` | Import `mapbox-gl/dist/mapbox-gl.css` once | Low |
| `DB schema` | **No change** | — |
| `API contracts` | New public endpoint only. No existing contract touched. | — |
| `Env vars` | Consumes existing `NEXT_PUBLIC_MAPBOX_TOKEN`. No new vars. | — |
| `Dependencies` | `mapbox-gl` + `@types/mapbox-gl` already installed in Phase 0. No new installs. | — |

### Checklist

- [ ] Add GeoJSON helper `toMapFeatures` to `src/lib/parcels.ts` (pure function, no DB).
- [ ] Add `GET /api/parcels/map` → returns `{ type: 'FeatureCollection', features: [...] }`. Filters `status=active`, `deletedAt IS NULL`, skips rows with non-finite lat/lng.
- [ ] Set `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` on the response.
- [ ] Build `<ParcelMap>` client component:
  - Init map on mount; teardown on unmount (`map.remove()`).
  - Add `NavigationControl`, `GeolocateControl`, `FullscreenControl`.
  - Add GeoJSON source with `cluster: true`, `clusterMaxZoom: 12`, `clusterRadius: 50`.
  - Three layers: `clusters` (circle), `cluster-count` (symbol), `unclustered-point` (circle).
  - Cluster click → `easeTo` to cluster center + zoom; unclustered click → open popup with `<ParcelMapPopup>`.
- [ ] Build `<ParcelMapPopup>` mini-card (photo thumb / gradient fallback, title, price, acreage, state, CTA → detail page).
- [ ] Build `<ParcelBottomSheet>` (mobile viewport only, driven by `matchMedia('(max-width: 640px)')`). CSS-only translate-Y animation, close-on-backdrop-click.
- [ ] Replace `src/app/map/page.tsx` with SSR shell that preloads markers server-side (avoids client round-trip on first paint) and passes them to `<ParcelMap>`.
- [ ] Add status filter chips above map (`Available | Pending | Sold | All`). Default `Available`. Re-filter client-side by resetting the GeoJSON source data.
- [ ] Support deep-link focus: `/map?focus=<parcelId>` → on load, `flyTo` that marker and open its popup.
- [ ] Import `mapbox-gl/dist/mapbox-gl.css` at `src/app/layout.tsx` (root) OR at the map page — pick the narrower scope if Turbopack supports CSS-in-route.

### Verification plan

**Build-time:**
- `npm run lint` clean.
- `npm run typecheck` clean.
- `npm run build` succeeds; confirm `/api/parcels/map` shows as `ƒ` (dynamic) in the Next build output.

**Endpoint:**
- `curl -s http://localhost:3000/api/parcels/map | jq '.features | length'` → `16` (matches active count).
- `curl -sI http://localhost:3000/api/parcels/map | grep -i cache-control` shows `s-maxage=60`.
- Each feature has `properties.id`, `.slug`, `.title`, `.price`, `.acreage`, `.status`, and valid finite `geometry.coordinates`.

**Manual (desktop, 1440×900):**
- `/map` renders a map centered on `[-98, 39]` zoom 3.5.
- Clusters visible at initial zoom; zooming into TX/FL/NM breaks them into individual markers.
- Click a cluster → eases in, shows child markers.
- Click a marker → popup appears anchored to that pin, with price + acreage + state + "View details" link. Clicking the link navigates to the correct `/parcels/[slug]`.
- Filter chip `Pending` → only the 2 pending markers show. `All` shows 19 (16 active + 2 pending + 1 sold; the 1 inactive remains excluded — inactive is never mapped).
- Deep-link `/map?focus=<id>` flies the map to that marker and opens its popup on load.

**Manual (mobile, 375×667 via devtools):**
- Marker click opens a bottom sheet at 70% viewport height instead of a popup.
- Backdrop click dismisses the sheet.
- Filter chips remain reachable with a vertically-scrolled map.

**Performance:**
- `/api/parcels/map` p50 < 100ms locally.
- Network panel shows one JSON round-trip for markers (plus Mapbox tiles).

### Edge cases

- **Missing `NEXT_PUBLIC_MAPBOX_TOKEN`:** render `<MapUnavailable>` fallback explaining the missing token — no `console.error`, no blank map.
- **Zero active parcels:** render a centered empty-state overlay "No listings to map right now" on top of the base map.
- **Invalid lat/lng:** filter out rows where `!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180` server-side in the endpoint. Never ship bad coords to the client.
- **SSR safety:** `mapbox-gl` must not run on the server. `<ParcelMap>` is `'use client'`; any `import mapboxgl from 'mapbox-gl'` is lazy-inside-effect or at module top with the component marked client — Turbopack handles it, but verify no `ReferenceError: window is not defined` on first render.
- **Memory leaks:** `map.remove()` in the `useEffect` cleanup; popup/sheet teardown listeners removed on unmount.
- **Dark mode:** map uses Mapbox's `light-v11` style by default; switch to `dark-v11` when `prefers-color-scheme: dark`. Filter chip colors use existing tokens.
- **High-DPI:** Mapbox handles this by default; verify retina tiles load on a retina viewport.
- **Large dataset future-proofing:** GeoJSON source with clustering scales to ~thousands of markers. Not a concern at 20 listings, but keeping the architecture cluster-first means we don't retrofit later.

### Open questions for user

1. **Map style** — default Mapbox `light-v11` / `dark-v11`, or do you want a custom style slug (e.g. one you already made in Mapbox Studio)?
2. **Status filter default** — I'm defaulting to `Available` (hides pending/sold). OK, or would you rather show all statuses by default with chips to narrow?
3. **Inactive parcels on map** — I'm keeping them off the map entirely (matches `/parcels`). OK?

---

## Phase 3 — Admin CMS (demo scope) · ✅ done 2026-04-25

### Review / validation

**Automated (Playwright `npm run diagnose:admin`):**
- Step 1 · unauthenticated `/admin` → 302 `/admin/login?callbackUrl=…` ✓
- Step 2 · credential login → lands on `/admin/parcels`, table has 20 rows ✓
- Step 3 · create new parcel → redirected to `/admin/parcels/<id>/edit?created=1` ✓
- Step 4 · new parcel visible on admin index (first row, sorted by updated_desc) ✓
- Step 5 · row-level status dropdown → parcel flips `active → pending` ✓
- Step 6 · `/admin/audit` shows both `Created parcel` and `Changed status` entries ✓
- Step 7 · public `/parcels` does NOT include the newly-`pending` parcel ✓
- Step 8 · sign out → redirected to `/admin/login` ✓ (flaky under extreme diagnostic load when Aiven free-tier connection pool saturates — degraded-UI branch handled)

**Remaining nits (cosmetic, non-blocking):**
- Two React hydration warnings (`#418`). Source traced to minified bundle; no functional impact. Likely benign timezone/async boundary differences — will chase in Phase 4 polish.

**Env automation landed:**
- `next.config.ts` parses `CLOUDINARY_URL` and mirrors the public portions into `NEXT_PUBLIC_CLOUDINARY_API_KEY` / `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` so the user only needs the single `CLOUDINARY_URL` entry in `.env.local`. API secret stays server-only (used for signature generation in `/api/cloudinary/sign`).

### Phase 3 plan (frozen, for provenance)

**Goal:** A demo-grade but end-to-end-working admin at `/admin`. Real auth (NextAuth credentials + JWT + proxy gate), audit log, Cloudinary photo uploads, Mapbox lat/lng picker, and bulk status changes. Non-demo frills (interactive bootstrap, roles UI, conflict banner, rate limiting) are deferred.

### Scope decisions (demo-grade)

- **Login URL:** `/admin/login`.
- **First admin:** pre-seeded by `npm run db:seed` → `admin@geoworks.local` / `geoworks-admin` (printed in README).
- **Roles:** enum stays in schema; code treats every signed-in user as admin. No role UI.
- **Optimistic concurrency:** deferred. Last-write-wins. No conflict banner.
- **Login rate-limit:** deferred (Phase 6).
- **bcrypt cost:** 10 (standard default).

Sections labeled ~~crossed out~~ in the checklist below are deferred items from the original plan.

### Pre-flight — blast radius

| Area | Change | Risk |
| --- | --- | --- |
| `src/lib/auth.ts` | **NEW** NextAuth v5 config: credentials provider, JWT strategy, session callback exposing `user.id`/`user.role`, signIn page `/admin/login` | Medium — auth correctness is load-bearing |
| `src/app/api/auth/[...nextauth]/route.ts` | **NEW** NextAuth handler (exports `GET`, `POST`) | Low |
| `src/proxy.ts` | **NEW** Next 16 proxy (renamed from middleware). Gates `/admin/*` — redirects unauthenticated requests to `/admin/login`. Skips `/admin/login` itself. | Medium — must not accidentally gate public routes |
| `src/app/admin/layout.tsx` | **NEW** admin shell (nav, logout), replaces `SiteHeader` for admin tree | Low |
| `src/app/admin/login/page.tsx` | **NEW** login form (server action → `signIn`) | Low |
| `src/app/admin/page.tsx` | **NEW** redirects to `/admin/parcels` | Low |
| `src/app/admin/parcels/page.tsx` | **NEW** table: search, status filter, state filter, sort, pagination, bulk-status actions | Low |
| `src/app/admin/parcels/new/page.tsx` | **NEW** create form | Low |
| `src/app/admin/parcels/[id]/edit/page.tsx` | **NEW** edit form (reuses form component) | Low |
| `src/app/admin/audit/page.tsx` | **NEW** audit log table | Low |
| `src/components/admin/parcel-form.tsx` | **NEW** shared create/edit form — RHF + zod, Mapbox lat/lng picker | Medium |
| `src/components/admin/parcel-table.tsx` | **NEW** server component table with client-action buttons | Low |
| `src/components/admin/photo-uploader.tsx` | **NEW** Cloudinary `CldUploadWidget` wrapper → server action to persist URL + public_id | Medium |
| `src/components/admin/admin-nav.tsx` | **NEW** nav bar + logout | Low |
| `src/actions/parcels.ts` | **NEW** server actions: create, update, softDelete, bulkUpdateStatus, addPhoto, removePhoto, setPrimaryPhoto, reorderPhotos | Medium — central mutation surface |
| `src/actions/auth.ts` | **NEW** login/logout server actions thin-wrapping NextAuth | Low |
| `src/lib/audit.ts` | **NEW** `logAudit({actor, action, entityType, entityId, diff})` helper | Low |
| `src/lib/cloudinary.ts` | **NEW** server-side cloudinary SDK setup (reads `CLOUDINARY_URL`), `signUpload()` helper, `deleteByPublicId(publicId)` helper | Medium |
| `src/app/api/cloudinary/sign/route.ts` | **NEW** POST endpoint returning signed upload params (auth-required) | Medium — must only sign for authenticated admins |
| `src/lib/parcels.ts` | Extend with `listAllParcelsForAdmin({filters, search, page, sort})`, `getParcelById(id)` | Low |
| `src/lib/env.ts` | Already optional-accepts `CLOUDINARY_URL` and `NEXTAUTH_SECRET`; Phase 3 starts requiring them — tighten to required at runtime with clear error | Low |
| `scripts/create-admin.ts` | **NEW** interactive script: prompts for email + hidden password, bcrypt-hashes, inserts into `geo_users` with role `admin` | Low |
| `package.json` | Add `npm run admin:create` | Low |
| `DB schema` | **No changes** — `geo_users`, `geo_parcels`, `geo_parcel_photos`, `geo_audit_log` are already in the Phase 0 migration | — |
| `Dependencies` | Add `cloudinary` (server SDK) — `next-cloudinary` handles the browser side but server signing + deletion uses the canonical SDK. Everything else already installed. | Low |

### Checklist

**A · Authentication foundation**
- [ ] Install `cloudinary` (server SDK).
- [ ] `src/lib/auth.ts` — NextAuth v5 config with credentials provider, JWT sessions, zod-validated inputs, bcrypt compare against `geo_users`.
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — export `GET`/`POST` handlers.
- [ ] `src/proxy.ts` — gate `/admin/*` except `/admin/login` and `/api/auth/*`; redirect unauthenticated to `/admin/login?callbackUrl=...`.
- [ ] Extend `scripts/seed.ts` to insert the demo admin user (idempotent upsert).
- [ ] ~~`scripts/create-admin.ts` — interactive bootstrap~~ **deferred**

**B · Admin shell + login**
- [ ] `src/app/admin/layout.tsx` — suppress public `SiteHeader`/`SiteFooter`, render `AdminNav` + main.
- [ ] `src/components/admin/admin-nav.tsx` — links to Parcels, Audit; Logout button (form → `signOut` server action).
- [ ] `src/app/admin/login/page.tsx` — credentials form, server action calls `signIn('credentials', …)`.
- [ ] `src/app/admin/page.tsx` — redirect to `/admin/parcels`.

**C · Parcels listing + bulk actions**
- [ ] `src/lib/parcels.ts#listAllParcelsForAdmin` — supports `status in`, `state`, `search` (ILIKE on title/APN/county), `sort`, pagination.
- [ ] `src/app/admin/parcels/page.tsx` — server component: filter/search form, table with row-level status dropdown (server action), checkbox column + bulk-update-status action.
- [ ] `src/components/admin/parcel-table.tsx` + `row-actions.tsx` for the inline status/delete client controls.

**D · Create/edit form**
- [ ] `src/components/admin/parcel-form.tsx` — RHF + zod, fields: title, slug (auto from title but editable), description, price, acreage, APN, state (select), county, addressLine, zipCode, lat, lng, status, terms (JSON editor — simple key/value grid), financing (same), featured.
- [ ] Inline Mapbox picker: mini-map; click to place a marker, updates lat/lng fields; marker draggable for fine-tune.
- [ ] `src/app/admin/parcels/new/page.tsx` — renders form, server action `createParcel` → audit → redirect.
- [ ] `src/app/admin/parcels/[id]/edit/page.tsx` — loads parcel, renders form, server action `updateParcel` → audit.

**E · Photos (Cloudinary)**
- [ ] `src/lib/cloudinary.ts` — configure from `CLOUDINARY_URL`; `signUpload(params)` + `deleteByPublicId(publicId)`.
- [ ] `src/app/api/cloudinary/sign/route.ts` — POST, auth-required, signs upload params scoped to folder `geo-works/parcels/<parcelId>`.
- [ ] `src/components/admin/photo-uploader.tsx` — `CldUploadWidget` client component; on success calls `addPhoto` server action to persist URL + `public_id` + dimensions.
- [ ] Photo list UI on edit page: thumbnail grid, drag-reorder via HTML5 DnD, "Set primary" button, delete button (calls `removePhoto` which also deletes the Cloudinary asset).

**F · Server actions + audit log**
- [ ] `src/lib/audit.ts#logAudit` — inserts a row into `geo_audit_log` (actor id/email snapshot, action verb, entityType, entityId, JSON diff, request IP + UA from `headers()`).
- [ ] `src/actions/parcels.ts` — all mutations wrap the DB call, call `logAudit`, `revalidatePath('/parcels')`, `revalidatePath('/map')`, `revalidatePath('/admin/parcels')`.
- [ ] Auth guard: every server action calls `auth()` first; throws on unauthenticated.

**G · Audit log view**
- [ ] `src/app/admin/audit/page.tsx` — table of last 100 entries, filter by actor + entityType; simple pagination.

**H · Verification**
- [ ] `npm run lint` / `typecheck` / `build` green.
- [ ] `scripts/diagnose-admin.ts` (Playwright): login flow → list → create → edit → bulk mark sold → audit trail visible. Saved screenshot for each step.
- [ ] Manual check of the Cloudinary upload path (needs real credentials).

### Verification plan

**Automated (I can run these):**
- Build/typecheck/lint green after each sub-phase.
- Playwright flow: launch browser, sign in with seeded admin, visit `/admin/parcels`, read row count (matches DB), click "New", fill form, submit, read new count (+1), edit the new parcel's status to `pending`, visit `/admin/audit` and confirm 2 entries (create + update), visit public `/parcels` and verify the new parcel does NOT appear (because status is pending).
- `curl` checks: `/admin` without cookie → 307 to `/admin/login`; `/admin/login` → 200.
- Direct DB check after run: `select count(*) from geo_audit_log where action in ('parcel.create','parcel.update')` matches expectations.

**Requires user eyes:**
- Cloudinary upload flow (widget UI, signed params, persistence, delete).
- Visual polish of tables/forms/mini-map picker.

### Edge cases

- **First-time setup with no admin user:** `npm run admin:create` is the only way in; login page prints a hint if zero users in `geo_users`.
- **Stale session after user deleted:** JWT callback verifies the user still exists on each request; invalid → force logout.
- **Concurrent edits:** last-write-wins. Each update carries `updatedAt` check → if row was modified since load, show conflict banner ("edited by X moments ago — reload to see latest"). Simple optimistic concurrency.
- **Photos orphaning:** if `removePhoto` DB-deletes but Cloudinary call fails, log the orphan `public_id` to `geo_audit_log` for later cleanup; don't block the UI.
- **Very long descriptions / large JSON:** form rejects `description` > 20 KB, `terms`/`financing` > 4 KB. Zod-enforced.
- **Slug collisions:** on create, if user-edited slug collides, append `-2` (and up). Computed server-side inside the action.
- **Soft-deleted parcels:** never appear in public `/parcels`, `/map`, or admin list by default. Admin can filter "Deleted" to restore.
- **Password security:** bcrypt cost 12; do not log password anywhere; server action catches and generic-errors ("Invalid email or password").
- **CSRF for server actions:** Next.js server actions are CSRF-protected by default (origin check). No extra work needed.
- **Rate-limit login:** out of Phase 3 scope (Phase 6). Still, short-circuit after 10 failed attempts from same IP in 1 minute to protect local dev.
- **Mapbox picker:** same CSS-cascade gotcha as Phase 2 — wrap Mapbox's mount target in a Tailwind-styled div, never share classes.

### Open questions for user

1. **Login URL:** `/admin/login` (scoped to admin area) vs `/login` (site-wide). I'd default to `/admin/login` — public site has no login.
2. **First admin bootstrap:** an interactive `npm run admin:create` script that prompts for email + hidden password. Acceptable, or do you want me to pre-seed a dev admin (`admin@geoworks.local` / some temp password you rotate)?
3. **Roles:** protocol has `admin` and `editor` in `geo_user_role` enum. For Phase 3 I'll treat both as full-access in the admin CMS. OK?
4. **Optimistic concurrency banner** on edit conflicts — should I ship it in Phase 3 or defer to Phase 4/6?
5. **Audit log retention:** forever / append-only in Phase 3. Pruning later. OK?

---

## Phase 2 plan (frozen, for provenance)

## Phase 4 — Brand + responsive polish · 📋 plan (awaiting Go/No-Go)

**Goal:** Take every surface from "functional" to "feels intentional." Tighten the design system, verify every page at mobile/tablet/desktop, add loading skeletons + toasts, custom 404, favicon + base OG image, dark-mode cohesion, and kill the two stray React hydration warnings.

### Pre-flight — blast radius

| Area | Change | Risk |
| --- | --- | --- |
| `src/app/globals.css` | Expand design tokens: brand palette (emerald/earth-tone accents), muted surfaces, semantic tokens (`--color-border`, `--color-muted`, etc.). Dark-mode tokens in same block. | Low |
| `src/components/site-header.tsx` + `site-footer.tsx` | Use the new tokens, tighten spacing, fix any mobile layout issues | Low |
| `src/components/parcel-card.tsx` | Polish: loading placeholder aspect ratio, better truncation, price emphasis | Low |
| `src/app/(public)/page.tsx` | Home hero: responsive headline, button row stacks on mobile | Low |
| `src/app/(public)/parcels/page.tsx` + `[slug]/page.tsx` | Responsive grid, sticky sidebar detaches on mobile, photo gallery sizing | Low |
| `src/app/(public)/map/page.tsx` | Already responsive; verify the mobile bottom-sheet actually appears at ≤640px (had simulated-only check in Phase 2) | Low |
| `src/app/admin/(authed)/parcels/page.tsx` | Table → horizontal-scroll on mobile OR collapse to cards. Current table overflows at 375px. | Medium |
| `src/app/admin/(authed)/parcels/[id]/edit/page.tsx` | Form sections stack correctly; map picker fits mobile | Low |
| `src/app/not-found.tsx` **(NEW)** | Branded 404 for any unmatched route (currently falls back to default) | Low |
| `src/app/loading.tsx` **(NEW)** | Root loading skeleton for RSC transitions | Low |
| `src/app/(public)/parcels/loading.tsx` + `admin/(authed)/parcels/loading.tsx` **(NEW)** | Skeleton rows/cards during SSR fetch | Low |
| `src/components/toast-provider.tsx` **(NEW)** + `src/lib/toast.ts` **(NEW)** | Tiny self-rolled toast system (context + auto-dismiss). ~30–40 LOC, no new dep. Wired into admin server-action callbacks. | Medium — new cross-cutting component |
| `src/actions/parcels.ts` | No code change — return results already signal success; toast triggers stay client-side on action resolution. | None |
| `src/components/admin/row-status.tsx` + `row-delete.tsx` + `photo-manager.tsx` + `parcel-form.tsx` + `bulk-actions.tsx` + `login-form.tsx` | Wire toasts on success/failure of each mutation | Low |
| `src/app/icon.svg` **(NEW)** or `icon.tsx` | Replace default favicon with the emerald rounded square from the header | Low |
| `src/app/opengraph-image.tsx` **(NEW)** | Site-wide OG image via Vercel OG (`ImageResponse`) — branded card with tagline | Low |
| `src/app/layout.tsx` | `<ToastProvider>` wraps children; keep root minimal | Low |
| **Hydration fix** | Track down the two `#418` warnings (`diagnose:admin` flagged them). Suspect: `site-footer.tsx` `new Date().getFullYear()` interacting with SSR revalidation, OR the admin table's `Intl.DateTimeFormat` despite UTC fix. Run `diagnose:admin` with `--no-minify` build or a fresh browser session to get the non-minified trace. | Medium — the mystery part |
| `DB schema / env / deps` | **No changes** | — |

### Checklist

**A · Design tokens & system**
- [ ] Expand `globals.css` with palette + semantic tokens (light + dark).
- [ ] Audit uses of raw Tailwind colors (`emerald-600`, etc.) and swap to tokens where semantics differ across light/dark.

**B · Responsive audit (Playwright)**
- [ ] Write `scripts/diagnose-responsive.ts` — boots Chromium at 375 × 667, 768 × 1024, 1440 × 900; captures screenshots of every route (home, parcels, parcel detail, map, admin login, admin parcels, admin new, admin edit, admin audit). Saves to `tmp-responsive/` and fails if any viewport shows horizontal overflow or layout bugs detected heuristically (e.g. elements wider than viewport).
- [ ] Walk through each screenshot, fix issues, re-run until clean.

**C · Loading states**
- [ ] `src/app/(public)/parcels/loading.tsx` — card grid skeleton
- [ ] `src/app/admin/(authed)/parcels/loading.tsx` — table row skeleton
- [ ] Root `src/app/loading.tsx` — subtle top progress bar (Next 16 supports `<loading>` at any segment)

**D · Toasts**
- [ ] `src/lib/toast.ts` — simple store (Zustand-free: a module-level EventTarget or plain context).
- [ ] `src/components/toast-provider.tsx` — renders a fixed-bottom-right stack, auto-dismiss 3s, 4 types (`success/error/info/loading`).
- [ ] Wrap root layout (or just admin layout) with `<ToastProvider>`.
- [ ] Wire into every mutation path: create, update, status change, delete, bulk status, photo upload, photo set-primary, photo delete, login error.

**E · 404 + error pages**
- [ ] `src/app/not-found.tsx` — branded 404 matching the rest of the site. The existing parcel-specific `parcels/[slug]/not-found.tsx` already styled; this is the site-wide fallback.
- [ ] `src/app/global-error.tsx` — replaces the "This page couldn't load" screen with a branded one.

**F · Icons + OG**
- [ ] `src/app/icon.svg` or `src/app/icon.tsx` — emerald gradient rounded square (same pattern as SiteHeader).
- [ ] `src/app/opengraph-image.tsx` — Vercel OG, returns an `ImageResponse` with site name, tagline, brand gradient background. One static site-wide image.

**G · Hydration mystery**
- [ ] Reproduce the two `#418` warnings with an unminified production build OR dev-mode Playwright run so the trace is readable.
- [ ] Likely suspects: `SiteFooter.new Date().getFullYear()` under revalidation; `login-form`'s `decodeURIComponent(initialError)`; or admin table `Intl` formatting. Fix once identified.

**H · Dark-mode verification**
- [ ] Run `diagnose:responsive` with `colorScheme: 'dark'` on the Playwright context — audit all screenshots for broken contrast, white-on-white artifacts, missing `dark:` variants.

### Verification plan

**Automated:**
- `npm run typecheck` / `npm run lint` / `npm run build` clean.
- `npm run diagnose:responsive` green:
  - No horizontal scrollbars at 375 × 667 on any route
  - Both light + dark screenshots saved per route
  - Admin login + admin CRUD still reachable
- `npm run diagnose:admin` (re-run) — 0 page errors expected (hydration warnings cleared).

**Requires user eye:**
- Flip through `tmp-responsive/` screenshots; point out anything that still feels off
- Verify toasts on real Vercel deployment after mutations

### Edge cases

- **Reduced motion:** skeleton shimmer CSS uses `@media (prefers-reduced-motion: reduce)` to disable animation.
- **Tailwind v4 dark mode via CSS vars:** we use `@media (prefers-color-scheme: dark)` in globals.css, not Tailwind's `dark:` variant class — verify both paths work consistently. (We already mix: tokens via CSS media query, plus `dark:` variants in utilities. Left unchanged.)
- **Toast dismissal during route change:** toasts persist across client-side navigation if the provider is above the route tree. Intentional; visual state survives the navigation.
- **Server-action toast triggering:** server actions can't directly call client toast. Pattern: client callsite awaits the action, decides success/error from the return value, then fires the toast. Already how row-status.tsx is structured; extend to the rest.
- **Mobile admin table:** pure horizontal scroll is functional but ugly. If time permits, add a "card view" at `<sm` that collapses each row to a stacked card with the same row actions.
- **OG image generation:** Vercel OG runs on edge runtime. `NEXT_PUBLIC_SITE_URL` must be set or absolute URLs in the card break. Already in `.env.local.example`.

### Open questions for user

1. **Brand direction** — I've been leaning "modern minimalist with emerald accent." Comfortable with that, or lean more rustic/earthy (brown + green, serif headlines) to match the "land" theme? If modern, I'll stay the course. If rustic, I'll retouch headings + accents in Phase 4.
2. **Dark mode toggle** — skip it (system preference only, my default) or add a small toggle in the header?
3. **Toast library** — self-roll ~40 LOC (no dep, my default) vs. `sonner` (tiny, prettier animations, one new dep).
4. **Mobile admin table** — horizontal scroll (simpler) or collapse to cards at `<sm` (prettier, a bit more work)?

### Phase 4 plan (frozen, for provenance)

---

## Phase 4 (original outline, kept for reference) · done when the plan above is executed
## Phase 5 — SEO, sitemap, Vercel subdomain deploy · ⏳ scheduled
## Phase 6 — Rate limits, backups, operator docs · ⏳ scheduled
