---
name: review-pr
description: Independently review a code PR, fix or request fixes, and mark it review:passed so automerge can merge it. Use when invoked as /review-pr #N or asked to use the review-pr skill.
---

# Review a code PR

1. Check out the PR branch. Read the linked issue's acceptance criteria.
2. Run the `/code-review` skill at `medium` effort against the PR's diff. Also check:
   - Every acceptance criterion is met (not just "the code looks fine").
   - Tests cover the change, and `npm run check && npm run test:e2e` pass.
   - For UI: open the PR preview URL (the Azure bot comments it) or run locally, take a screenshot, and look at it.
   - No new dependencies without a reason, no secrets, nothing under protected paths unless the issue required it.
3. Small, clear fixes: commit them to the branch yourself. Anything larger or arguable: leave review comments and stop
   without the label.
4. When satisfied, add the `review:passed` label. `automerge.yml` merges it once CI is green, unless it touches protected
   paths, in which case it goes to the maintainer.
5. Comment a short review summary: what you checked, what you changed.

If the PR touches `data/`, don't review the data. Remove `review:passed` if you added it and note that a `check-sources` pass is needed.
