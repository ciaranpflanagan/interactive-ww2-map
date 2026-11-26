#!/usr/bin/env bash
# One-time bootstrap. Run from Azure Cloud Shell (has az + gh) or any machine with both,
# logged in to Azure (az login) and GitHub (gh auth login) as the repo owner.
#
#   ./infra/bootstrap/bootstrap.sh <owner/repo> [location]
#
# Deploys infra/bootstrap/main.bicep, then stores the resulting non-secret IDs as
# GitHub Actions *variables*. No secrets are created: CI authenticates with OIDC.
set -euo pipefail
REPO="${1:?usage: bootstrap.sh <owner/repo> [location]}"
LOCATION="${2:-westeurope}"
HERE="$(cd "$(dirname "$0")" && pwd)"

out=$(az deployment sub create \
  --name ww2-map-bootstrap \
  --location "$LOCATION" \
  --template-file "$HERE/main.bicep" \
  --parameters githubRepo="$REPO" location="$LOCATION" \
  --query properties.outputs -o json)

get() { echo "$out" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1']['value'])"; }

gh variable set AZURE_TENANT_ID          --repo "$REPO" --body "$(get tenantId)"
gh variable set AZURE_SUBSCRIPTION_ID    --repo "$REPO" --body "$(get subscriptionId)"
gh variable set AZURE_RESOURCE_GROUP     --repo "$REPO" --body "$(get resourceGroup)"
gh variable set AZURE_DEPLOYER_CLIENT_ID --repo "$REPO" --body "$(get deployerClientId)"
gh variable set AZURE_PREVIEWER_CLIENT_ID --repo "$REPO" --body "$(get previewerClientId)"
gh variable set AZURE_LOCATION           --repo "$REPO" --body "$LOCATION"

"$HERE/../github/configure.sh" "$REPO"
echo "Bootstrap complete. Now run:  gh workflow run infra.yml --repo $REPO"
