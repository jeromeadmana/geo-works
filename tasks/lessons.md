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

## 2026-04-25 · Plan-first with Go/No-Go checkpoint

**Rule:** For any non-trivial task (3+ steps / architectural decision), write a detailed plan to `tasks/todo.md` — including pre-flight blast-radius analysis, verification plan, and edge cases — **before** writing implementation code. Then wait for the user's explicit Go/No-Go.

**Why:** Section I.1 of the Development Operating Protocol.

**How to apply:** Treat tasks/todo.md as the contract for the upcoming work. No code until the user says "go." Mark items complete in real time as work progresses. Add a review/validation section at the bottom upon completion.
