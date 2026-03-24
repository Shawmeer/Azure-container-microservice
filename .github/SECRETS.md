# GitHub Secrets Configuration

This document describes the required secrets to configure in GitHub for the CI/CD pipeline to work properly.

## Required Secrets

### Azure Authentication (OIDC)
Configure these secrets in your GitHub repository settings under **Settings > Secrets and variables > Actions**:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AZURE_CLIENT_ID` | Azure Service Principal Client ID | 1. Go to Azure Portal > App Registrations<br>2. Select your app registration<br>3. Copy the **Application (client) ID** |
| `AZURE_TENANT_ID` | Azure Tenant ID | 1. Go to Azure Portal > App Registrations<br>2. Select your app registration<br>3. Copy the **Directory (tenant) ID** |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | 1. Go to Azure Portal > Subscriptions<br>2. Copy the **Subscription ID** |

### Azure Service Principal Configuration
The Service Principal needs the following permissions:

1. **Contributor** role on the subscription or resource group
2. **Owner** role if you want to manage role assignments

To create a Service Principal with OIDC support:

```bash
# Login to Azure
az login

# Create Service Principal with OIDC federation
az ad sp create-for-rbac \
  --name "GitHubActions-SP" \
  --role Contributor \
  --scopes "/subscriptions/<SUBSCRIPTION_ID>" \
  --federated-credential "https://token.actions.githubusercontent.com"
```

### Terraform Backend (Optional)
| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `TF_API_TOKEN` | Terraform Cloud API token | 1. Go to Terraform Cloud<br>2. Create a new token in User Settings > Tokens |

> Note: This is only required if using Terraform Cloud as a backend. The workflow uses local backend by default.

## OIDC Configuration in Azure

### Option 1: Azure Portal
1. Go to **Azure Portal > App Registrations**
2. Select your app registration
3. Go to **Certificates & secrets > Federated credentials**
4. Add a new federated credential:
   - **Issuer**: `https://token.actions.githubusercontent.com`
   - **Subject**: `repo:<OWNER>/<REPOSITORY>:ref:refs/heads/main`
   - **Audience**: `api://AzureADTokenExchange`

### Option 2: Azure CLI
```bash
# Get your app registration object ID
APP_OBJ_ID=$(az ad app show --id <CLIENT_ID> --query id -o tsv)

# Add federated credential
az ad app federated-credential add \
  --id $APP_OBJ_ID \
  --credential-id "github-actions-cred" \
  --issuer "https://token.actions.githubusercontent.com" \
  --subject "repo:<OWNER>/<REPOSITORY>:ref:refs/heads/main" \
  --audiences "api://AzureADTokenExchange"
```

## Environment-Specific Configuration

The pipeline supports three environments:
- `development`
- `staging`
- `production`

Each environment can have different:
- Resource naming conventions
- Size/scale settings
- Access restrictions

To configure environment-specific variables, use GitHub environment secrets:

1. Go to **Settings > Environments**
2. Create or select an environment (e.g., `production`)
3. Add environment-specific secrets

## Key Vault Integration

The pipeline fetches secrets from Azure Key Vault during deployment:

1. **db-password**: Database password for PostgreSQL
2. **acr-password**: Container Registry admin password

Ensure these secrets exist in your Key Vault before deployment.

## Verification

To verify your secrets are configured correctly:

1. Go to your repository in GitHub
2. Click on **Actions** tab
3. Select the **Deploy to Azure Container Apps** workflow
4. Click **Run workflow**
5. Select an environment and run

The workflow will use OIDC to authenticate with Azure without storing long-lived secrets.