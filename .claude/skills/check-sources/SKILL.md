---
name: check-sources
description: Independently verify every citation in a data PR against its source, fix or remove unsupported claims, and prepare the PR for the maintainer. Use when invoked as /check-sources #N (N = PR number).
---

# Check sources (independent verifier)

You are the skeptic. Assume nothing in the PR is right until you have seen the source say it.
You did not write this PR. Don't trust its PR body; trust only what you fetch.

1. Check out the PR branch. List every changed event record and every `cite` in it.
2. For each claim (field value plus its cites):
   - Fetch the source (URL from `data/sources/<id>.json`) and find the locator.
   - Verdict: **supported**, **partially supported** (e.g. the number differs or the date is off by a day),
     **unsupported** (the source doesn't say it), or **unverifiable** (the source can't be fetched).
   - Check the `quote` actually appears in the source.
   - Check the coordinates against the described place (is "Pointe du Hoc" actually on the cliffs west of Omaha?).
3. Fix what you can on the branch: correct values to match the source, adjust ranges, or remove unsupported
   claims. Never add new claims; that's the researcher's job.
4. If every remaining claim is supported, set `review.status` to `"agent-checked"` on those records. Otherwise leave them `"unreviewed"`.
5. `npm run data:validate && npm run check` must pass. Push.
6. Comment on the PR with a verification table (claim | source | locator | verdict | note) and a summary of the
   fixes you made. Add the `needs-human` label so the maintainer knows it's ready for their decision.
   Never apply `data:approved`.
