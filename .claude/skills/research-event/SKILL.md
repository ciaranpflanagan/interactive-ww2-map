---
name: research-event
description: Research and draft (or correct) historical event records with full citations, open a data PR, and hand it to an independent source checker. Use when invoked as /research-event #N or asked to use the research-event skill, for data issues, corrections, or to address review on a data PR.
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
   - `modern`: present-day memorials, museums, cemeteries and surviving fortifications belong in the `modern` array of
     the event they commemorate, **never** as their own event file: the timeline is 1939–45, and a 2004 memorial is not
     a wartime event. A wartime position (e.g. a German strongpoint) can be its own event; its present-day remains go in
     its `modern` array. Take coordinates from OSM (cite `osm` with `node/…`).
   - `zoom.min` by level of detail (see CLAUDE.md). Set `parent` correctly.
   - `review.status`: `"unreviewed"`. Use `review.notes` for open questions.
4. Correcting an imported record: keep the `id`, replace the Wikidata-only cites with better ones, and record what
   was wrong in the PR body (e.g. "Wikidata placed Totalize at Caen centre; CMH map X shows ...").
5. `npm run data:validate && npm run check` must pass.
6. Open the PR: label `data`, body `Closes #n`, plus a table of claim → source → locator for every number and date.
   List anything you could not source and left out. Do not add `data:approved`, `review:passed` or `needs-human`
   (the checker adds `needs-human` once the PR is verified).
7. **Hand off to an independent checker.** Start a new cloud session for the source check:
   - Environment: the one named `ww2-map` (look it up with the list-environments tool).
   - Repository: this repo, at your PR branch.
   - Model: `opus` (see "Models per role" in CLAUDE.md).
   - Prompt, in plain words (a prompt may not start with `/`): "Use the check-sources skill to verify pull request #<PR>
     (branch <branch>)." Add any context the checker needs, but not your conclusions: it must judge the sources itself.
   - Comment on the PR: "Source check started: <session link>".
   - If you have no tool to start sessions, comment "Source check not started: no session tool" instead. The foreman's
     next round picks it up.
8. When addressing review or CI on an existing data PR, finish with step 7 again if you changed any data.
