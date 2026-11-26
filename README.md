# Interactive WW2 Map

An interactive map of the Second World War that puts events on present-day geography, with a citation for
every fact. It starts with **Normandy, June–August 1944**.

- Scrub the timeline to see what was happening, and where.
- Zoom in for more detail: campaign → operation → battle → beach → sector.
- Every record shows its sources and its review status (*unreviewed*, *agent-checked* or *approved*), and has a "Report a correction" link.

## How it's built

The app is mostly built and maintained by Claude agents, with the maintainer in the loop where it matters.

```
maintainer ──"run a round"──▶ foreman ──dispatches──▶ build-feature   ─┐
                                 │                    research-event  ─┤──▶ PRs
                                 │                    check-sources   ─┤
                                 │                    review-pr       ─┘
                                 └── reads ROADMAP.md, issues, PR status
PRs ──▶ CI (data validation, typecheck, build, Playwright) ──▶ data-gate ──▶ automerge (code) / maintainer (data, infra)
main ──▶ Azure Static Web Apps (PR previews + production), all infrastructure from Bicep
```

- **The rules agents follow:** [`CLAUDE.md`](CLAUDE.md). **The roles:** [`.claude/skills/`](.claude/skills). **Direction:** [`ROADMAP.md`](ROADMAP.md).
- **Historical data never merges without the maintainer.** The `data-gate` check requires the owner's
  `data:approved` label, and any new push removes it.
- **Code PRs merge on their own** once CI is green and an independent agent review has passed. Changes to data, schema, CI, infrastructure and the agent rules always wait for the maintainer.

## Develop

```bash
npm ci
npm run dev                 # http://localhost:5173
npm run check               # validate data, typecheck, build
npm run test:e2e            # Playwright smoke tests
npm run data:import-wikidata  # seed coarse events (never overwrites curated ones)
```

## Infrastructure (one-time)

Everything in Azure is declared in [`infra/`](infra). There are no portal clicks and no stored secrets: GitHub Actions log in with OIDC.

1. In Azure Cloud Shell: `git clone` this repo, then `./infra/bootstrap/bootstrap.sh ciaranpflanagan/interactive-ww2-map`.
   This creates the resource group and two narrowly scoped deploy identities, sets the repo variables, and applies the
   GitHub settings (`infra/github/`).
2. `gh workflow run infra.yml --repo ciaranpflanagan/interactive-ww2-map` to create the Static Web App.
3. From then on, `main` deploys to production and every PR gets a preview URL.

## Licences

Code: MIT. Data: CC BY-SA 4.0. See [`data/LICENSE.md`](data/LICENSE.md). Basemap © OpenMapTiles © OpenStreetMap contributors, via OpenFreeMap.
