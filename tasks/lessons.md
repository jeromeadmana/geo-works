# Lessons — geo-works

Corrections and instructions captured from the user. Review at the start of each session before doing any work.

---

## 2026-04-25 · No AI attribution in commits

**Rule:** Never add `Co-Authored-By` trailers, "Generated with …" lines, or emoji signatures to commit messages. Commit messages are the user's voice only.

**Why:** User instruction when asking for the first push: *"no ai signature or co author or ai metadata."*

**How to apply:** Every commit — no `--trailer`, no HEREDOC footers, no bot names. Plain, human-voice messages.

---

## 2026-04-25 · No AI-specific directories in version control

**Rule:** `.claude/`, `.cursor/`, and any AI tooling directory must be gitignored. If already tracked, `git rm --cached` immediately.

**Why:** Part of the *No AI Footprint* principle in the Development Operating Protocol. The first commit leaked `.claude/settings.local.json`; the user's protocol flagged `./claude` as a violation.

**How to apply:** On every project, add `.claude/`, `.cursor/`, `.aider*` patterns to `.gitignore` during initial setup. On inherited repos, audit `git ls-files` for any AI-tooling dirs and untrack them in the same commit.

---

## 2026-04-25 · JWT sessions must tolerate DB rows vanishing

**Rule:** Any table that FK-references `geo_users.id` (or any user table) must gracefully degrade when the session's JWT carries a user id that no longer exists. Don't assume `session.user.id` is always a valid FK target.

**Why:** After migrating the DB from Aiven to Supabase and reseeding, a user with a still-valid JWT (signed by unchanged `NEXTAUTH_SECRET`) tried to upload a photo. The `logAudit` insert into `geo_audit_log` failed with FK violation `23503` on `actor_id → geo_users.id` because the reseeded user had a new UUID. The JWT was still trusted; the ID it carried was stale. This bubbled up as a 500 on the server action and a generic "This page couldn't load" to the user.

**How to apply:**
- `logAudit` now does a cheap `SELECT id FROM geo_users WHERE id = $1` and nulls out `actor_id` if the user is gone. The snapshot `actor_email` string (no FK) still records who did it.
- For any new FK referencing `geo_users.id`, either (a) allow NULL + degrade like this, or (b) add a JWT callback that evicts sessions whose user id is missing.
- Consider adding this guard to any future table that FKs user identity — audit / favorites / notifications / comments.

---

## 2026-04-25 · Serverless DB needs a transaction pooler, not a direct connection

**Rule:** On Vercel (or any serverless host), `DATABASE_URL` must point at a **transaction-mode connection pooler**, not the direct Postgres port. Locally, direct or session pooler are fine. Never use direct in production serverless.

**Why:** Each Vercel serverless invocation spins up its own Node process with its own `postgres` client, holding a connection. Aiven free tier (~10–20 slots) saturated in minutes; Supabase free direct connection is also capped and often IPv6-only. Symptom: `remaining connection slots are reserved for roles with the SUPERUSER attribute` (code 53300) → generic 500 pages on any DB-touching route.

**How to apply:**
- **Local `.env.local`:** direct URI (or session pooler if direct is IPv6-only). Needed for migrations (DDL) + seeds.
- **Vercel `DATABASE_URL`:** transaction pooler URI (Supabase port 6543 / Aiven PgBouncer port). The driver config I use (`max: 1`, `prepare: false`) is already transaction-pooler-compatible.
- If migrations are ever to run on Vercel (they shouldn't — run locally or in CI), use a one-off session URI for those jobs only.

---

## 2026-04-25 · Autonomous browser verification beats reload ping-pong

**Rule:** When a UI bug doesn't reproduce from `curl`-able evidence (CSS cascade, client-side rendering, canvas sizing, WebGL), **use Playwright to inspect the live DOM** instead of asking the user for screenshots and DevTools readouts.

**Why:** Phase 2 map debugging went through 5+ rounds of "hard-reload and paste the console" because I couldn't see the browser. The user finally asked *"how about using playwright to check autonomously?"* — and the very first Playwright run surfaced the exact issue (`.mapboxgl-map` computed to `position: relative, height: 0`) in one pass. Reload loops waste the user's time and my context.

**How to apply:**
- Project has `scripts/diagnose-map.ts` + `npm run diagnose:map` as the template.
- For any new UI feature I can't verify via `curl` of HTML/CSS, write a targeted Playwright diagnostic before asking the user. Cost: ~60s per run. Payoff: ground-truth DOM + console + network + screenshot.
- tsx-compiled `page.evaluate` callbacks need `__name` shim — `context.addInitScript(() => { globalThis.__name = (fn) => fn; })` handles it.

---

## 2026-04-25 · Don't share class names with library-owned classes

**Rule:** Never put a Tailwind (or any utility) class on the exact element a third-party library decorates with its own class. Wrap the library's target in a separately-styled div.

**Why:** Mapbox's CSS has `.mapboxgl-map { position: relative }`. Tailwind's `.absolute` utility has the same specificity (0,1,0). Because `mapbox-gl.css` imported *after* `globals.css`, Mapbox won the cascade and silently overrode `position: absolute` back to `relative`, collapsing the container to `height: 0`. Symptom: `load` event fires, tiles fetch (HTTP 200), but canvas is 0px tall and invisible. Zero errors in the console.

**How to apply:**
- Wrapping, not tagging: put positioning/layout utilities on a *wrapper* div, and give the library's mount target just `className="h-full w-full"` (or similar non-positional utilities).
- Alternative if wrapping isn't practical: use Tailwind's `!important` modifier (`!absolute`) to override same-specificity library rules. Last resort.
- General heuristic: any element whose class list will end up looking like `my-util library-class` (e.g. `.absolute.mapboxgl-map`) is a cascade booby-trap. Split them.

---

## 2026-04-25 · Plan-first with Go/No-Go checkpoint

**Rule:** For any non-trivial task (3+ steps / architectural decision), write a detailed plan to `tasks/todo.md` — including pre-flight blast-radius analysis, verification plan, and edge cases — **before** writing implementation code. Then wait for the user's explicit Go/No-Go.

**Why:** Section I.1 of the Development Operating Protocol.

**How to apply:** Treat tasks/todo.md as the contract for the upcoming work. No code until the user says "go." Mark items complete in real time as work progresses. Add a review/validation section at the bottom upon completion.
