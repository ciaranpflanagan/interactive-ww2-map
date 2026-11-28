---
name: build-feature
description: Implement one app/code GitHub issue end to end and open a PR. Use when invoked as /build-feature #N, asked to use the build-feature skill, or asked to fix CI or address review on a code PR.
---

# Build a feature from an issue

1. Read the issue, its comments, `CLAUDE.md` and `ROADMAP.md`. If the acceptance criteria are ambiguous in a way
   that changes the result, comment on the issue with the question, label it `needs-human`, and stop.
2. Branch `agent/<n>-<slug>` from the latest `main`. (When fixing an existing PR, check out its branch instead.)
3. Implement the smallest change that meets every acceptance criterion. Follow existing patterns. Don't add dependencies without saying why.
4. Tests:
   - Logic: add or extend a test.
   - UI: extend `tests/*.spec.ts` with Playwright. Take a screenshot at deviceScaleFactor 1 and **look at it**,
     at desktop and mobile widths, in light and dark mode if you touched styles.
5. `npm run check && npm run test:e2e` must pass locally.
6. Open the PR:
   - Title: imperative, e.g. "Add deep links for selected events"
   - Body: `Closes #n`, what changed, how you verified it (commands, what the screenshot showed), and any follow-ups (open them as issues)
   - Labels: `feature` (or `bug`). Do **not** add `review:passed`; an independent reviewer does that.
7. Start an independent reviewer: a new cloud session in the `ww2-map` environment at your PR branch, model `sonnet`,
   with the plain-words prompt "Use the review-pr skill to review pull request #<PR> (branch <branch>)." (a prompt may
   not start with `/`). Comment the session link on the PR. If you can't start sessions, comment that instead.
8. Final message: the PR link and anything a reviewer should look at closely.

Never touch `data/` in a feature PR. If the feature needs data changes, open a `data` issue.
