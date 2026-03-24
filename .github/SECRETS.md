# GitHub Actions Secrets Configuration

To enable the CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

## Required Secrets

Go to **Settings > Secrets and variables > Actions** and add these secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|----------------|
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | `38df180f-dbb8-4396-b369-3cf314e5e890` |
| `AZURE_TENANT_ID` | Azure Tenant ID | `your-tenant-id` |
| `AZURE_CLIENT_ID` | Service Principal Client ID | `your-client-id` |
| `AZURE_CLIENT_SECRET` | Service Principal Client Secret | `your-client-secret` |
| `REGISTRY_NAME` | Azure Container Registry name | `microserviceacrsamir` |
| `RESOURCE_GROUP` | Azure Resource Group name | `microservice-rg` |
| `ENVIRONMENT` | Container App Environment name | `microserviceenv` |
| `PREFIX` | Prefix for all resources | `microservice` |
| `LOCATION` | Azure region | `centralus` |
| `DB_PASSWORD` | PostgreSQL database password | `YourSecurePassword123` |

## Creating Service Principal

If you don't have a service principal, create one:

```bash
# Login to Azure
az login

# Create service principal with contributor role
az ad sp create-for-rbac --name "github-actions-sp" --role contributor --scope "/subscriptions/YOUR_SUBSCRIPTION_ID"
```

The command output will give you:
- `appId` (use as `AZURE_CLIENT_ID`)
- `password` (use as `AZURE_CLIENT_SECRET`)
- `tenant` (use as `AZURE_TENANT_ID`)

## Getting Subscription ID

```bash
az account show --query id -o tsv
```

## GitHub Actions Workflow

The workflow (`deploy.yml`) runs in three stages:

1. **Build**: Builds and pushes Docker images to Azure Container Registry
2. **Terraform**: Creates Azure infrastructure (Resource Group, ACR, Database, Container Apps Environment)
3. **Update Container Apps**: Updates container apps with real images and environment variables

The workflow triggers on:
- Push to `main` branch (full deployment)
- Pull requests (plan only, no apply)