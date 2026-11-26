targetScope = 'resourceGroup'

param project string
param deployerPrincipalId string
param previewerPrincipalId string

var contributorRoleId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'

resource deployerContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, deployerPrincipalId, contributorRoleId)
  properties: {
    principalId: deployerPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', contributorRoleId)
  }
}

resource swaTokenReaderRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' = {
  name: guid(resourceGroup().id, 'swa-token-reader')
  properties: {
    roleName: '${project} Static Web App token reader'
    description: 'Read a Static Web App and its deployment token. Used for PR preview deploys.'
    type: 'CustomRole'
    assignableScopes: [resourceGroup().id]
    permissions: [
      {
        actions: [
          'Microsoft.Web/staticSites/read'
          'Microsoft.Web/staticSites/listSecrets/action'
        ]
      }
    ]
  }
}

resource previewerTokenReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, previewerPrincipalId, swaTokenReaderRole.id)
  properties: {
    principalId: previewerPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: swaTokenReaderRole.id
  }
}
