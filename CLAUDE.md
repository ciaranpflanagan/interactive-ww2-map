# Interactive WW2 Map

A public, sourced, interactive map of the Second World War. Scope today: the Normandy campaign, June–August 1944.
Live site: Azure Static Web Apps (see `infra/`). Roadmap: `ROADMAP.md`.

This repository is built mostly by agents ("the factory"). The maintainer is **@ciaranpflanagan**.
Roles live in `.claude/skills/`: `foreman` plans and dispatches work. The worker skills are `build-feature`, `research-event`, `check-sources` and `review-pr`.

## The non-negotiables

1. **No fact without a citation.** Every date, coordinate, number, name or sentence shown to users carries a `cite`.
   `npm run data:validate` enforces the structure; agents enforce the honesty.
2. **Never invent.** If a source can't be found for a claim, leave the claim out. Never fill gaps from memory,
   even when you're "sure". Never fabricate a page number, quote, URL or edition.
3. **Disagreement is data.** When reputable sources disagree (casualties almost always do), record a range,
   cite both ends and set `"disputed": true`. Do not pick a favourite.
4. **Quotes for numbers.** Every numeric fact needs a `quote`: a short excerpt from the source containing the number.
5. **Agents never approve data.** Only the maintainer applies the `data:approved` label. An agent must never add,
   remove or ask a tool to apply that label, and must never set `review.status` to `"approved"` unless the
   maintainer explicitly asked for it in the issue or PR.
6. **No copied prose.** Paraphrase. Short quotes in `cite.quote` only. Wikipedia text is CC BY-SA and copyrighted books are copyrighted.
7. **Neutral, factual tone.** No glorification, no editorialising. Atrocities and civilian losses are recorded with the same care as battles.

## Source hierarchy (prefer higher)

1. **Official histories and primary documents:** US Army Center of Military History "Green Books" and
   American Forces in Action series (public domain), the UK Official History, the Canadian Official History
   (Stacey), war diaries and after-action reports.
2. **Reputable secondary works by named historians**, cited by page.
3. **Tertiary sources:** Wikipedia, encyclopedias. Acceptable as a lead and for uncontroversial facts. Better: cite the reference Wikipedia cites, after reading it.
4. **Databases:** Wikidata, OSM. Good for identifiers and present-day locations. Wikidata-only historical facts stay `unreviewed`.

Register every source once in `data/sources/<id>.json` before citing it. **Every URL must come from a page you actually
fetched in this session**, never from memory or a guessed pattern: two such guesses broke the US Army source links.
A link cited by Wikipedia can also be dead, so fetch it too. If it can't be fetched, say so in `notes` (see `cmh-*.json`).

Wikipedia and Wikidata rate-limit this environment when several agents use them at once. Space out requests, and on
HTTP 429 wait and retry a few times instead of switching to memory.

## Data model

- `data/events/<id>.json`: one event per file, validated by `schema/event.schema.json`. `id` equals the file name.
- `data/sources/<id>.json`: the source register, validated by `schema/source.schema.json`.
- Events form a tree via `parent` (Overlord → Normandy landings → Omaha Beach → Easy Red). `zoom.min` sets
  the level of detail: campaign ~4, operation ~5, battle ~7, beach ~8–9, sector or strongpoint ~11–13.
- `geometry.accuracy`: use `precise` only when the shape or point is drawn from a cited map or source,
  `approximate` for hand placement from a described location, and `representative` for a single point standing in for an area.
- Coordinates are GeoJSON `[longitude, latitude]`. Normandy longitudes are around -1.5 to 0.5 and latitudes around 48.5 to 49.7.
- `review.status`: `unreviewed` (imported or drafted) → `agent-checked` (an independent `check-sources` agent
  verified every cite) → `approved` (the maintainer personally verified it). Every data change merged to `main` has
  also passed the maintainer's `data:approved` gate. That gate is permission to publish at the stated status.
- `npm run data:import-wikidata` seeds coarse records and never overwrites existing files.

## Code

- Vite + React 19 + TypeScript + MapLibre GL 6. Basemap: OpenFreeMap (free, no key). No backend; data is static JSON
  compiled by `scripts/build-data.ts` into `public/data/` (gitignored).
- Keep it simple: no state library, no CSS framework, no new runtime dependencies without a reason in the PR.
- `npm run check` (validate data, typecheck, build) and `npm run test:e2e` must pass before a PR is opened.
  UI changes: add or extend a Playwright test, and look at a screenshot yourself before claiming it works.
- In Claude cloud sessions, Node's `fetch` needs `NODE_USE_ENV_PROXY=1` to reach the internet (e.g. for the Wikidata import).
  `playwright.config.ts` already routes the browser through the proxy.

## Workflow

- Work arrives as GitHub issues. Branch `agent/<issue>-<slug>`, one issue per PR, PR body says `Closes #<n>`.
- Small PRs. If an issue turns out big, finish a coherent slice and open follow-up issues.
- Labels: `agent:ready`, `agent:in-progress`, `needs-human`, `review:passed`, `data`, `feature`, `bug`, `correction`, `infra`, `epic`.
- `needs-human` is the maintainer's to-do list. Add it to anything only they can move forward (a decision, a data PR
  verified by check-sources, a PR touching protected paths). Don't add it to anything that agents can still progress.
- Data PRs flow: `research-event` opens it → it starts `check-sources` → the checker adds `needs-human` → maintainer
  applies `data:approved` and merges.
- Merging: code PRs merge automatically once CI is green and `review:passed` is set (`.github/workflows/automerge.yml`).
  PRs touching `data/`, `schema/`, `.github/`, `infra/`, `.claude/`, `CLAUDE.md` or `package-lock.json` always wait for the maintainer.
- Azure resources are created only from `infra/**/*.bicep`. Never use the portal, and never create resources from CLI commands.
- Use whatever GitHub tooling the session provides (GitHub tools, or `gh` if authenticated). If you have none, stop and report that in your final message instead of guessing.
