#!/usr/bin/env bash
set -euo pipefail
[[ -z "${PR:-}" ]] && { echo "No PR for this event."; exit 0; }

# Paths that always require the owner: data, the rules agents follow, CI/CD, infrastructure.
PROTECTED='^(data/|schema/|\.github/|infra/|\.claude/|CLAUDE\.md$|package-lock\.json$)'
REQUIRED_CHECKS=(validate-data build-and-test data-gate)

pr=$(gh pr view "$PR" --repo "$REPO" --json state,isDraft,labels,headRefOid,headRepository,headRepositoryOwner,files)
jqr() { jq -r "$1" <<<"$pr"; }

[[ $(jqr .state) == OPEN ]] || { echo "PR not open."; exit 0; }
[[ $(jqr .isDraft) == false ]] || { echo "Draft PR."; exit 0; }
[[ "$(jqr .headRepositoryOwner.login)/$(jqr .headRepository.name)" == "$REPO" ]] || { echo "Fork PR: never auto-merged."; exit 0; }
jqr '.labels[].name' | grep -qx 'review:passed' || { echo "No 'review:passed' label yet."; exit 0; }

protected=$(jqr '.files[].path' | grep -E "$PROTECTED" || true)
if [[ -n "$protected" ]]; then
  echo "Touches protected paths; owner must merge:"; echo "$protected" | sed 's/^/  /'
  gh pr edit "$PR" --repo "$REPO" --add-label needs-human >/dev/null || true
  exit 0
fi

sha=$(jqr .headRefOid)
checks=$(gh api "repos/$REPO/commits/$sha/check-runs" --paginate --jq '.check_runs[] | "\(.name)=\(.conclusion)"')
for c in "${REQUIRED_CHECKS[@]}"; do
  grep -qx "$c=success" <<<"$checks" || { echo "Check '$c' not green on $sha yet."; exit 0; }
done

gh pr merge "$PR" --repo "$REPO" --squash --delete-branch --match-head-commit "$sha"
echo "Merged #$PR. Dispatching production deploy."
gh workflow run deploy.yml --repo "$REPO" --ref main
