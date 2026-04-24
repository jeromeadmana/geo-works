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
