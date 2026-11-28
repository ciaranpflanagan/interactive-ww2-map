---
name: foreman
description: Run one round of the agent software factory for this repo. Triage open PRs, keep the issue backlog stocked from ROADMAP.md, and dispatch worker sessions. Use when the maintainer says "run a round", "/foreman", or asks what the factory should do next.
---

# Foreman: one round

You coordinate; you do not write features or data yourself. Each round is bounded. Do the steps below, then report and stop.

## 0. Limits

- At most **3** worker sessions running at once. The Azure Free tier allows only 3 PR preview environments.
- At most **5** new issues created per round.
- Never apply `data:approved`. Never merge PRs yourself (`automerge.yml` and the maintainer do that).

## 1. Read state

- `ROADMAP.md`, and open issues with their labels.
- Open PRs with their labels, check status, and latest comments.
- Your own earlier worker sessions (list your child sessions) to see which are still running.

## 2. Triage PRs (cheapest first)

| Situation | Action |
|---|---|
| CI failing, worker session finished | Dispatch `build-feature` (or `research-event` for data) with "fix CI on PR #N" |
| Code PR, CI green, no `review:passed` | Dispatch `review-pr #N` |
| Data PR with no `<!-- check-sources -->` comment and no "Source check started" comment (or that session has ended without one) | Dispatch `check-sources` for it |
| Data PR verified by check-sources | Ensure `needs-human` is set; list it in your report for the maintainer |
| Data PR with `data:approved` but no check-sources comment | Dispatch `check-sources`; tell the maintainer the approval came before verification |
| Maintainer left review comments | Dispatch the original worker type with "address review on PR #N" |
| Stale (no activity 7+ days, not waiting on the maintainer) | Comment asking why; close it if it's abandoned |

## 3. Keep the backlog stocked

If fewer than 3 issues are labelled `agent:ready`, take the first unfinished milestone in `ROADMAP.md` and split it into
issues. Each issue gets:
- A title in imperative form, and a `data` or `feature` label (plus `agent:ready`)
- **Context**: why it matters, and links to the roadmap item and related issues
- **Acceptance criteria**: a checklist a reviewer can verify
- **For data issues**: which events and fields to cover, and the preferred sources from CLAUDE.md
- Size: about one PR, a few hours of agent work. Split anything bigger.

If a decision is genuinely the maintainer's (scope, tone, licensing, money), open an issue labelled `needs-human` instead of guessing.

## 4. Dispatch workers

Workers are cloud sessions. If you have no tool to start sessions (for example, you're running locally), do steps 1–3,
then stop and say so in your report: the maintainer can run the round from a cloud session instead.

For each free worker slot, pick the oldest `agent:ready` issue (corrections and bugs first) and start a new session:
- Environment: the one named **ww2-map** (look it up with the list-environments tool; never hardcode its id).
- Model: per the "Models per role" table in CLAUDE.md (`sonnet` for most workers, `opus` for `check-sources`).
- Don't exceed 3 running workers even when asked for one more issue: queue it and say so, unless the maintainer insists.
- Repository: this repo.
- Prompt, in plain words: "Use the <skill> skill to work on issue #<n>" (or "...to verify pull request #<n>"), plus one
  line of context. A session prompt may not start with `/`, so never write `/<skill>`. Skills: `build-feature`,
  `research-event`, `check-sources`, `review-pr`. For work on an existing PR, start the session at the PR's branch.
- Workers that touch the same file must be told which fields each may change, or run one after the other.
- Swap the issue's `agent:ready` label for `agent:in-progress` and comment with the session link.

## 5. Report

Everything that needs the maintainer must carry the `needs-human` label, so that one filter is their whole to-do list.
End with a short report for the maintainer:
- What you dispatched (issue, then session)
- **Waiting on you:** data PRs needing `data:approved`, `needs-human` issues and PRs, with links
- Anything that looks wrong: repeated CI failures, a worker going in circles, roadmap ambiguity
