#!/usr/bin/env bash
set -euo pipefail
LABEL="data:approved"

changed=$(gh api --paginate "repos/$REPO/pulls/$PR/files" --jq '.[].filename')
data_changes=$(grep -E '^data/' <<<"$changed" || true)
if [[ -z "$data_changes" ]]; then
  echo "No changes under data/. Gate passes."
  exit 0
fi
echo "Data files changed:"; echo "$data_changes" | sed 's/^/  /'

if [[ "$ACTION" == "synchronize" ]]; then
  if gh api "repos/$REPO/issues/$PR/labels" --jq '.[].name' | grep -qx "$LABEL"; then
    if [[ "$IS_FORK" == "false" ]]; then
      gh api -X DELETE "repos/$REPO/issues/$PR/labels/$LABEL" >/dev/null
      echo "New commits pushed: removed '$LABEL'. The owner must re-approve."
    else
      echo "New commits on a fork PR while '$LABEL' is set. The owner must remove and re-apply the label."
    fi
  fi
  exit 1
fi

# Who applied the label most recently? Must be the repository owner.
last_labeler=$(gh api --paginate "repos/$REPO/issues/$PR/events" \
  --jq "[.[] | select(.event==\"labeled\" and .label.name==\"$LABEL\")] | last | .actor.login // empty" | tail -n1)
present=$(gh api "repos/$REPO/issues/$PR/labels" --jq '.[].name' | grep -cx "$LABEL" || true)

if [[ "$present" == "1" && "$last_labeler" == "$OWNER" ]]; then
  echo "'$LABEL' applied by $OWNER. Gate passes."
  exit 0
fi
echo "::error::This PR changes historical data and needs the owner (@$OWNER) to review it and apply the '$LABEL' label."
exit 1
