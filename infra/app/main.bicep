// Application infrastructure. Deployed by .github/workflows/infra.yml on every
// change to infra/app/** on main. Never edit resources in the portal.
targetScope = 'resourceGroup'

param project string = 'ww2-map'
param location string = resourceGroup().location

resource site 'Microsoft.Web/staticSites@2024-04-01' = {
  name: 'swa-${project}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled' // PR preview environments
    allowConfigFileUpdates: true
    // No repositoryUrl: deployments are pushed by GitHub Actions, not pulled by Azure.
  }
  tags: {
    project: project
    managedBy: 'bicep'
  }
}

output siteName string = site.name
output defaultHostname string = site.properties.defaultHostname
