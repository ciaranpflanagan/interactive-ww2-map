// One-time bootstrap. Run by a human (with Owner on the subscription and rights
// to create Entra app registrations) via ./bootstrap.sh. Everything after this
// is deployed by GitHub Actions using the identities created here.
targetScope = 'subscription'

extension microsoftGraphV1

@description('GitHub repository in owner/name form.')
param githubRepo string

@description('Short project name used for resource naming.')
param project string = 'ww2-map'

@description('Azure region for the resource group and Static Web App (Free tier: westeurope, eastus2, centralus, westus2, eastasia).')
param location string = 'westeurope'

var rgName = 'rg-${project}'
var oidcIssuer = 'https://token.actions.githubusercontent.com'
var oidcAudience = 'api://AzureADTokenExchange'

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: rgName
  location: location
}

// Identity 1: "deployer" — trusted only for workflows running on main.
// Contributor on the project resource group (deploys Bicep + publishes production).
resource deployerApp 'Microsoft.Graph/applications@v1.0' = {
  displayName: '${project}-github-deployer'
  uniqueName: '${project}-github-deployer'

  resource mainBranch 'federatedIdentityCredentials' = {
    name: '${deployerApp.uniqueName}/github-main'
    issuer: oidcIssuer
    audiences: [oidcAudience]
    subject: 'repo:${githubRepo}:ref:refs/heads/main'
  }
}

resource deployerSp 'Microsoft.Graph/servicePrincipals@v1.0' = {
  appId: deployerApp.appId
}

// Identity 2: "previewer" — trusted for pull_request workflows. It can ONLY read the
// Static Web App's deployment token (to publish PR preview environments), nothing else.
resource previewerApp 'Microsoft.Graph/applications@v1.0' = {
  displayName: '${project}-github-previewer'
  uniqueName: '${project}-github-previewer'

  resource pullRequests 'federatedIdentityCredentials' = {
    name: '${previewerApp.uniqueName}/github-pull-request'
    issuer: oidcIssuer
    audiences: [oidcAudience]
    subject: 'repo:${githubRepo}:pull_request'
  }
}

resource previewerSp 'Microsoft.Graph/servicePrincipals@v1.0' = {
  appId: previewerApp.appId
}

module rbac 'rbac.bicep' = {
  scope: rg
  name: 'rbac'
  params: {
    project: project
    deployerPrincipalId: deployerSp.id
    previewerPrincipalId: previewerSp.id
  }
}

output resourceGroup string = rg.name
output tenantId string = tenant().tenantId
output subscriptionId string = subscription().subscriptionId
output deployerClientId string = deployerApp.appId
output previewerClientId string = previewerApp.appId
