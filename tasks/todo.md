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

## Phase 3 — Admin CMS · ⏳ scheduled

Auth, `/admin` CRUD for parcels, Cloudinary uploader, audit log. Plan will be drafted after Phase 2 review.

## Phase 4 — Brand system + responsive polish · ⏳ scheduled
## Phase 5 — SEO, sitemap, Vercel subdomain deploy · ⏳ scheduled
## Phase 6 — Rate limits, backups, operator docs · ⏳ scheduled
