---
name: research-event
description: Research and draft (or correct) historical event records with full citations, then open a data PR. Use when invoked as /research-event #N, for data issues, corrections, or to address review on a data PR.
---

# Research an event

Accuracy outranks completeness. A short record that is right beats a rich one with a single invented detail.

1. Read the issue, `CLAUDE.md` (sourcing rules and source hierarchy), `schema/event.schema.json`, and any existing
   records it touches (`data/events/`).
2. **Find sources first.** Prefer official histories (US Army CMH, the UK and Canadian official histories) and
   primary documents. Wikipedia is a lead: follow its references and cite what you actually read.
   Register each source in `data/sources/` with a URL you fetched successfully. If the source is offline or blocks
   fetching, you cannot verify it, so don't cite it from memory.
3. **Draft the record(s).** For each field, cite the source and a precise `locator` (page, section, paragraph).
   - Numbers: include `quote`. Where sources disagree: give a range, cite both ends, set `"disputed": true`.
   - Geometry: a polygon or line only if you can tie it to a cited map or description. Otherwise use a point with
     `approximate`. Say in `review.notes` how the shape was derived.
   - `modern`: present-day memorials, museums, cemeteries and fortifications. Take coordinates from OSM (cite `osm` with `node/…`).
   - `zoom.min` by level of detail (see CLAUDE.md). Set `parent` correctly.
   - `review.status`: `"unreviewed"`. Use `review.notes` for open questions.
4. Correcting an imported record: keep the `id`, replace the Wikidata-only cites with better ones, and record what
   was wrong in the PR body (e.g. "Wikidata placed Totalize at Caen centre; CMH map X shows ...").
5. `npm run data:validate && npm run check` must pass.
6. Open the PR: label `data`, body `Closes #n`, plus a table of claim → source → locator for every number and date.
   List anything you could not source and left out. Do not add `data:approved` or `review:passed`.
