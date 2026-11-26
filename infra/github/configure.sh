#!/usr/bin/env bash
# GitHub repository settings as code. Idempotent; safe to re-run after editing.
#   ./infra/github/configure.sh <owner/repo>
# Needs `gh auth login` as the repository owner.
set -euo pipefail
REPO="${1:?usage: configure.sh <owner/repo>}"
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "Repository settings"
gh api -X PATCH "repos/$REPO" \
  -F has_issues=true -F has_wiki=false -F has_projects=false \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true -F allow_auto_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY >/dev/null

echo "Actions may create and approve PRs: off (agents open PRs through their own GitHub access)"
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false

echo "Labels"
while IFS='|' read -r name color desc; do
  [[ -z "$name" ]] && continue
  gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force >/dev/null
done < "$HERE/labels.txt"

echo "Ruleset for main"
existing=$(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name=="main") | .id')
if [[ -n "$existing" ]]; then
  gh api -X PUT "repos/$REPO/rulesets/$existing" --input "$HERE/ruleset-main.json" >/dev/null
else
  gh api -X POST "repos/$REPO/rulesets" --input "$HERE/ruleset-main.json" >/dev/null
fi
echo "Done."
