# Generation Log — docs/PROJECT_OVERVIEW.md

This is the audit trail for `docs/PROJECT_OVERVIEW.md`: what was actually read, what was produced, and what was verified, across every pass that built it. It exists so you can confirm the doc was built by reading real files rather than checking all 1600+ lines of the main doc by hand.

**Honesty note on sourcing**: some research in Pass 1 and Pass 3 was delegated to sub-agents (Claude Code's `Explore` agent type), which read files and reported structured findings back rather than me reading every file directly myself. Their reports were cross-checked where practical (e.g. re-running key greps myself), but "read" below means "read by me or by a sub-agent whose report I incorporated," not "personally read by the orchestrating session" in every single case. Pass 3's dedicated verification-pass agent specifically re-checked Pass 1's claims against source as its whole job — see that pass's counts below.

---

## Pass 1 — Initial creation (2026-08-06)

`docs/PROJECT_OVERVIEW.md` did not exist. Built from scratch via 3 parallel `Explore` sub-agents plus direct reads.

**Files read directly by the orchestrating session:**
- `CLAUDE.md`
- `docs/` directory listing (found existing `ARCHITECTURE.md`, `DEVELOPER_GUIDE.md`, `USER_GUIDE.md`, `README.md`, `CHANGELOG_TEMPLATE.md` — none named `PROJECT_OVERVIEW.md`)
- `au-marketing-api/` top-level directory listing
- `au-marketing-api/QUICK_START.md`, `au-marketing-api/setup.sh`
- `git log -1` (both repos, for the commit-hash header)

**Sub-agent 1 — Frontend inventory** (files read per its own report): `package.json`, `App.tsx` (full), all ~35 files under `pages/` (top-of-file reads), `components/layout/*`, `components/ui/*` (31 files), `UI/*` (15 files), `lib/*.ts` (all 15 files), `store/index.ts`, `store/slices/*.ts` (3 files), `store/middleware.ts`, `hooks/usePresence.ts`, `context/AuthContext.tsx`, `.env.example`, `src/test/setup.ts`, `src/test/setup.test.ts`, `vite.config.ts`, `tsconfig.json`; grepped `import.meta.env.VITE_` and `TODO|FIXME|HACK` across the whole frontend source tree.

**Sub-agent 2 — Backend DB/config inventory** (files read per its own report): `au-marketing-api/requirements.txt`, `app/main.py` (full), `app/config.py` (full `Settings` class), `app/models.py` (full, 1408 lines, read across multiple offset/limit passes — all 46 models at the time), `app/rbac.py`, `app/rbac_cache.py`, `app/dependencies.py`, `app/scope.py`, `alembic.ini`, `migrations/env.py`, all 3 files in `migrations/versions/`, `run_worker.py`, `app/scheduler.py`, `docker-compose.yml`, grepped for Firebase/Groq/PQ/OneSignal/AWS usage across `app/`, `tests/` directory + `pytest.ini`.

**Sub-agent 3 — Backend API endpoint inventory** (files read per its own report): all 26 files under `au-marketing-api/app/routers/` in full, cross-checked endpoint counts per file via `grep -c`.

**Diagrams produced this pass**: 1 `flowchart TD` (system architecture), 1 `sequenceDiagram` (Inquiry-0 lead creation flow), 1 `sequenceDiagram` (permission-check flow), 1 `erDiagram` (core business entities, ~17 tables), 1 `erDiagram` (Redux store shape). 5 diagrams total.

**Verification pass this run**: none — Pass 1 was first-draft creation, not a verification pass against an existing doc.

---

## Pass 2 — Two small corrections (2026-08-06 → 2026-08-07)

Not a full re-scan. Two targeted follow-ups, both via direct Bash/Read/Edit by the orchestrating session (no sub-agents):

1. **"Anything we miss" sweep**: read `vercel.json`, `metadata.json`, `error_button.txt` (first lines), `ai-context/` listing, `.opencode/` listing and `.opencode/plans/` listing; checked `git ls-files` for tracked secret files (`credentials.json`, `firebase-service-account.json`, `Marketing-api.pem`) in the backend repo; read `.github/workflows/deploy-marketing-api.yml` (full); read `au-marketing-api/scripts/` listing; read `.server-operator/` listing.
2. **PDF-incident correction**: `git log --oneline -8` and `git show --stat -1` in the backend repo to establish that commit `7bf7942` was a follow-up deletion, not a fix; `git ls-tree -r HEAD | grep pdf` to find the 4 still-tracked PDFs; re-checked `.gitignore` for a `marketing/` entry (confirmed still absent).

**Diagrams produced this pass**: none (corrections to prose only).

---

## Pass 3 — Major expansion (2026-08-07)

Full diagram-coverage expansion, Security Notes, How to Extend, and a formal verification pass. 4 research streams, 3 delegated to sub-agents, 1 done directly.

**Sub-agent A — Module dependency graphs**: grepped import statements across all ~35 frontend pages, all `lib/*.ts` files, all `store/slices/*.ts` files; grepped `from app.X import` across all 26 backend routers plus `main.py`, `dependencies.py`, `rbac.py`, `rbac_cache.py`, `scope.py`, `scheduler.py`, `push_notifications.py`, `storage.py`, `audit_utils.py`, `settings_utils.py`, `database.py`, `config.py`, `lead_display.py`; counted `marketingAPI.` method-call occurrences per page for the consumer-tier ranking.

**Sub-agent B — Verification pass on Pass 1's content**: read the full (then-966-line) doc; extracted and diffed all 193 endpoint method+path+permission triples against router source; read every table's full column list in `models.py` and diffed against the doc's ER diagram; diffed both env-var tables against `config.py` and `.env.example`; ran `test -f` on every file path in both Key Modules tables; spot-checked ~35 scattered numeric claims (line counts, interface counts, migration counts, etc.) by direct grep/count.
- **Result: ~370 references checked. 362 confirmed correct. 8 corrected** (table count 41→46; endpoint count 188→193 in two places; `CurrencyInput` usage 14→18 with exact file list; OD-plan route path-converter typing; store folder tree line). **2 flagged ambiguous rather than resolved** (`CORS_ORIGINS` 7-vs-6-distinct; live HRMS runtime behavior for `is_superuser`/`is_staff`, unconfirmable without a real HRMS call).

**Sub-agent C — Security sweep**: grepped both repos for `password=`/`api_key=`/`secret=`/`token=` literal patterns across `.py`/`.ts`/`.tsx`/`.yml`/`.yaml`; read `docker-compose.yml` in full for hardcoded DB credentials and confirmed reuse in `.env`/`.env.example`; read every router file's auth-dependency usage to classify every endpoint as permission-gated vs. auth-only vs. public; read `app/routers/presence.py`'s WebSocket handler in full for the token-in-query-string finding; read `app/routers/auth.py`'s `email/callback` handler; grepped frontend for `VITE_.*SECRET|KEY|TOKEN|PASSWORD`; read `lib/auth-utils.ts` in full (found the dangling `SECURITY.md` reference); grepped both `context/AuthContext.tsx` and `store/slices/authSlice.ts` plus `lib/api.ts` for localStorage key usage; ran `npm ls --depth=0` (frontend) and read `requirements.txt` pins (backend); grepped for `request.json()`/`request.body()`/bare-`dict`-body patterns across all routers; counted `BaseModel` classes in `schemas.py`.

**Direct research (no sub-agent) — state machines and deployment/CI**: grepped `class CampaignStatus`, `class EventStatus`, `class PaymentStatus` in `models.py`; grepped `is_final`/`is_lost` usage in `app/routers/leads.py` and `app/routers/orders.py`; grepped `space_booking_payment_status` across `events.py` and `schemas.py` to confirm it's set-once, never updated; read the full `.github/workflows/deploy-marketing-api.yml` (again, for the deployment diagram this time); grepped `docker-compose.yml` service/port/volume/network structure.

**Diagrams produced this pass** (11 new, on top of Pass 1's 5 — total 16 by end of Pass 3):
- 1 `flowchart TD` — deployment/infrastructure (CI → EC2 → docker-compose)
- 5 new `sequenceDiagram`s — login flow, settings live-reload, lead→won→order conversion, scheduled follow-up notification, (Flow E web-push registration documented as numbered steps, not a diagram, since it had no branching worth a sequence diagram)
- 1 additional `erDiagram` — supporting/operational tables (25 tables not in Pass 1's core diagram)
- 4 `stateDiagram-v2` — Lead status, Order status, Campaign status, Event status
- 2 `graph TD` — frontend module dependency graph, backend router→core-layer dependency graph

**Sections added this pass**: AI Navigation block, Diagram Legend, §12 Security Notes (13 findings), §14 How to Extend (renumbering old §12/§13 to §13/§15).

---

## Pass 4 — Restructuring for navigability (2026-08-07, this pass)

No new code was read — both repos confirmed unchanged (`git log <last-hash>..HEAD` empty on both sides) before starting. This pass restructures Pass 3's already-verified content; it does not re-derive facts.

**Work done, in checkpoints** (per this pass's own instruction to work visibly rather than silently):
1. Added the Quick Start block (top of file) and full Table of Contents (all `##` headings linked, `###` sub-headings nested, the 26 individual router sub-headings collapsed into one `<details>` block rather than 26 separate top-level TOC entries — a deliberate legibility trade-off, noted inline to the user).
2. Added `<!-- keywords: ... -->` HTML comments after every major `##`/`###` heading (~35 tags). Deliberately skipped adding individual keyword comments to the 26 backend router sub-headings, since each heading already contains its own filename and mount path.
3. Added a "Shown in" column to both Key Modules / Files Reference tables (frontend: 19 rows; backend: 15 rows), cross-referencing each file to the Architecture/Data Flow/Security sections it actually appears in.
4. Added `[INFERRED]`/`[UNVERIFIED]` confidence tags at 8 specific spots where confidence genuinely varies (not applied blanket-wide, per the instruction to use them sparingly): the `.pem` file's assumed purpose, the Campaign state-machine enforcement claim, the `space_booking_payment_status` absence-of-evidence claim, `CORS_ORIGINS`'s ambiguous count, `.server-operator/`'s un-audited status, the 15 un-audited `scripts/` files, `metadata.json`'s assumed scaffold origin. Added a one-line legend explaining the tag convention near the Diagram Legend.
5. This file (`docs/GENERATION_LOG.md`) — new this pass.

**Diagrams produced this pass**: 0 (restructuring only — all 16 diagrams from Passes 1 and 3 carried forward unchanged).

**Verification pass this run**: none performed — no code changed since Pass 3's verification pass, so Pass 3's counts (362/8/2 above) still stand as the most recent verification of the doc's factual content. This pass's own additions (TOC anchors, cross-link section references, keyword tags) are structural/navigational, not factual claims about the codebase, so they weren't run through the same grep-verification process — anchor-link accuracy in particular depends on the rendering viewer's slug algorithm and is noted as best-effort in the TOC's own header line, not verified against a specific renderer.

---

## Pass 5 — Brand styling + Mermaid legibility pass (2026-08-07, same day as Pass 4)

No new code read — both repos confirmed unchanged again before starting (same commits as Passes 3–4). This pass restyles Pass 3's diagrams and brands the markdown file itself; it adds no new facts about the codebase.

**Correction to earlier logs**: Passes 1–4 above stated "16 diagrams" as a running total. Recounting directly (`grep -c '^```mermaid$'`) during this pass found the actual total is **18** — the earlier count undercounted by 2. The per-pass diagram lists in Passes 1 and 3 above are accurate as written; only the summary arithmetic was off. Corrected in the cumulative totals below.

**Work done, in checkpoints:**
1. **Branded the markdown header**: added an italic kicker line, restructured the H1/description, and added a 4-column meta table (Prepared By / Prepared For / Date / Version) matching the PDF cover's info structure. Converted two "Key points not obvious from the diagram" bullet lists (frontend and backend Architecture sections) into `>` blockquote callouts. Added one worked `> **EXAMPLE:**` callout in §14 How to Extend, using the real "Inquiry 0" feature as the concrete example (cross-referencing §5 Flow B, already documented — no new fact, just a new presentation of an existing one).
2. **Brand `classDef` styling on diagrams — scoped deliberately, not applied blanket-wide**: Mermaid's `classDef` mechanism is only valid syntax inside `flowchart`/`graph`/`stateDiagram-v2` blocks, not `sequenceDiagram` or `erDiagram`. Applied full brand palette styling (`classDef default`/`store`/`external`/`caution`, subgraph background fills) to all **9** diagrams where it's valid: 3 `flowchart TD` (frontend architecture, backend architecture, deployment), 2 `graph TD` (frontend + backend module dependency graphs), 4 `stateDiagram-v2` (Lead, Order, Campaign, Event). The 6 `sequenceDiagram`s and 3 `erDiagram`s were deliberately left in their existing clean form rather than risk a render failure for cosmetic-only gain — this is stated explicitly in the Diagram Legend now, not a silent omission.
3. **Found and fixed a real bug while restyling**: the deployment diagram had two self-loop edges (`EC2 --> EC2`) — the same rendering-bug class already fixed twice earlier in this doc's history (see the frontend Architecture diagram's fix history in the surrounding conversation, not itself logged in this file since it predates Pass 1). Rewrote the three sequential EC2-side actions (`git pull`, `compose down`+`prune`, `compose up --build`) as one edge label instead of three self-referencing edges.
4. **Fan-in legibility review**: checked all 9 styled diagrams plus the 3 ER diagrams for the "many lines converging on one node" failure mode described in this pass's instructions. Found no additional issues needing fixes — Pass 3's diagrams already handle this (consumer-tier grouping in the frontend graph, an "Others" aggregate node + "15 of 26 total" annotation in the backend graph). Concluded the ER diagrams' multi-edge convergence on entities like `LEAD` is a different, acceptable pattern — each edge is a distinct real foreign-key relationship, not a repetitive "many callers of one shared utility" fact, so compressing it the way the module graphs do would lose real schema information rather than declutter noise. No changes made to the ER diagrams as a result of this review.
5. Updated the Diagram Legend section to document the new brand color-coding convention and explicitly explain why sequence/ER diagrams don't carry it.

**Diagrams produced this pass**: 0 new diagrams — 9 existing diagrams restyled in place, 1 pre-existing bug fixed in the deployment diagram.

**Verification pass this run**: none performed (no code changed). The self-loop bug fix in the deployment diagram was caught by manual re-reading during the styling work, not a scripted verification pass — worth noting since it means the automated self-loop scanner used in Pass 4 (and re-run at the end of Pass 5, see below) did **not** catch this one before it was found by eye, because it was only run after this pass's edits, not before. Re-ran the same Python self-loop scanner and a fence-balance check (`grep -c '^```'`) after all edits: 44 fences (even, balanced, unchanged from Pass 4), zero self-loops found.

---

## Pass 6 — Real-parser validation fix (2026-08-07, same day, reported by user as "Syntax error in text mermaid version 11.15.0" ×4)

User reported 4 Mermaid syntax errors after Pass 5's styling changes went live in their renderer. Rather than guess at the fix from reading the syntax by eye (the approach used for the two earlier self-loop bugs this doc has had), this pass installed the **exact** Mermaid version the user's error message named (`mermaid@11.15.0`, via npm) plus `jsdom`, and ran every one of the 18 extracted diagram blocks through `mermaid.parse()` directly — a real parse check against the real parser, not a guess.

**Result**: 4 of 18 failed, all 4 the `stateDiagram-v2` diagrams (Lead/Order/Campaign/Event status) — exactly matching the user's "×4" report. **Root cause, confirmed by the parser's own error text**: `classDef default fill:...` is valid in `flowchart`/`graph` diagrams (where `default` is a recognized auto-apply-to-all-nodes keyword) but is not valid syntax in `stateDiagram-v2` — `Expecting 'CLASSDEF_ID', 'DEFAULT', got 'DEFAULT_CLASSDEF_ID'`. This is a real Mermaid grammar inconsistency between diagram types, not a typo.

**Fix**: renamed the class from `default` to `normalState` in all 4 state diagrams and applied it explicitly via `class StateA,StateB normalState` to each non-caution state, instead of relying on the auto-apply behavior that only works in flowchart/graph. Verified the fix against the actual parser (not by eye) *before* editing the main doc — built a throwaway test diagram with the proposed fix pattern, confirmed it parsed clean, then applied the same pattern to all 4 real diagrams.

**Final verification**: re-extracted all 18 diagrams from the edited doc and re-ran the full `mermaid.parse()` check. **18 of 18 now pass.**

**Process note for future passes**: this is the first pass that validated diagrams against a real Mermaid parser instead of manual syntax review. Given this caught something manual review missed (the "16→18" arithmetic in Pass 5 was manual, and manual review didn't catch this `classDef default` issue either despite writing it), future diagram-editing passes should run this same `mermaid.parse()` check before considering diagram work done, not just after a user reports a failure.

---

## Cumulative totals (all 6 passes)

- **Diagrams**: 18 total. Breakdown by type: 3 `flowchart TD`, 2 `graph TD`, 3 `erDiagram`, 6 `sequenceDiagram`, 4 `stateDiagram-v2`. 9 of the 18 (all `flowchart`/`graph`/`stateDiagram-v2`) carry brand `classDef` styling; the other 9 (`sequenceDiagram`/`erDiagram`) intentionally don't, per Mermaid syntax constraints. **All 18 confirmed parseable against `mermaid@11.15.0` as of Pass 6** — this is the first time diagram correctness was checked against a real parser rather than by eye.
- **Verification**: ~370 references checked in Pass 3's formal pass; 362 confirmed, 8 corrected, 2 flagged ambiguous. No claims were found and left silently wrong. No further content-verification pass has run since (Passes 4–6 were structural/styling/diagram-syntax only, no new facts asserted).
- **Bugs found and fixed across all passes**: 2 self-loop rendering bugs (frontend Architecture diagram, pre-Pass-1 in this doc's history but within this same conversation; deployment diagram, Pass 5) — both found by manual review. 1 `classDef default` grammar-incompatibility bug across 4 `stateDiagram-v2` diagrams (Pass 5, introduced; Pass 6, found by real-parser validation and fixed). Zero known unfixed diagram bugs as of Pass 6.
- **Files read**: not separately re-counted as a single number across passes (would double-count Pass 1 files re-touched in later passes) — see each pass's own file list above for exact provenance.
- **Known unaudited areas** (carried as `[UNVERIFIED]` in the main doc): 15 of 17 files in `au-marketing-api/scripts/`, all 3 files in `.server-operator/`.
