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
| Data PR, status still `unreviewed` drafts, no verification comment | Dispatch `check-sources #N` |
| Data PR verified by check-sources | Ensure `needs-human` is set; list it in your report for the maintainer |
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

For each free worker slot, pick the oldest `agent:ready` issue (corrections and bugs first) and start a new session:
- Environment: the one named **ww2-map** (look it up with the list-environments tool; never hardcode its id).
- Repository: this repo.
- Prompt: `/<skill> #<issue>` plus one line of context. Skills: `build-feature`, `research-event`, `check-sources`, `review-pr`.
- Swap the issue's `agent:ready` label for `agent:in-progress` and comment with the session link.

## 5. Report

End with a short report for the maintainer:
- What you dispatched (issue, then session)
- **Waiting on you:** data PRs needing `data:approved`, `needs-human` issues and PRs, with links
- Anything that looks wrong: repeated CI failures, a worker going in circles, roadmap ambiguity
