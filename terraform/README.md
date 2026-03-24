# Azure Deployment Guide

## Prerequisites

1. **Azure Subscription** - Create one at https://portal.azure.com
2. **Azure CLI** - Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
3. **GitHub Account** - For storing your code and CI/CD

## Setup Steps

### 1. Create Azure Service Principal

```bash
# Login to Azure
az login

# Create Service Principal
az ad sp create-for-rbac --name "microservice-deploy" --role Contributor --scope /subscriptions/YOUR_SUBSCRIPTION_ID
```

Save the output - you'll need:
- `appId` (client_id)
- `password` (client_secret)
- `tenant`

### 2. Create GitHub Secrets

Go to your GitHub repo → Settings → Secrets and add:

| Secret Name | Value |
|------------|-------|
| AZURE_SUBSCRIPTION_ID | Your subscription ID |
| AZURE_TENANT_ID | tenant from step 1 |
| AZURE_CLIENT_ID | appId from step 1 |
| AZURE_CLIENT_SECRET | password from step 1 |
| REGISTRY_NAME | Choose a unique name for your container registry |
| REGISTRY_USERNAME | admin (for ACR) |
| REGISTRY_PASSWORD | Run: `az acr credential show -n REGISTRY_NAME --query passwords[0].value` |
| DB_PASSWORD | Your PostgreSQL password (min 8 chars) |

### 3. Run Locally (Optional)

```bash
# Start all services
docker-compose up --build -d

# Access the app
# Frontend: http://localhost:3005
# API: http://localhost:8080
```

### 4. Deploy to Azure

Simply push to main branch:

```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

This will trigger GitHub Actions which will:
1. Build all Docker images
2. Push to Azure Container Registry
3. Deploy infrastructure with Terraform
4. Deploy container apps

### 5. Verify Deployment

After deployment, check:
- Azure Portal → Container Apps
- Get the FQDN from each container app

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Azure Cloud                       │
│                                                      │
│  ┌──────────────┐     ┌──────────────────────────┐ │
│  │ Container    │     │ Container Apps            │ │
│  │ Registry     │     │                          │ │
│  │ (ACR)        │     │  ┌─────────┐ ┌─────────┐ │ │
│  │              │     │  │Frontend │ │  API    │ │ │
│  │ user-service │     │  │  App    │ │ Gateway │ │ │
│  │ product-...  │     │  └────┬────┘ └────┬────┘ │ │
│  │ api-gateway  │     │       │            │      │ │
│  │ frontend     │     │  ┌────┴────┐ ┌────┴────┐ │ │
│  └──────────────┘     │  │  User   │ │ Product │ │ │
│         │            │  │ Service │ │ Service │ │ │
│         └───────────►│  └────┬────┘ └────┬────┘ │ │
│                      │       │            │      │ │
│                      │  ┌────┴────────────┴────┐ │ │
│                      │  │  PostgreSQL Flex    │ │ │
│                      │  │  Server             │ │ │
│                      │  └─────────────────────┘ │ │
│                      └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Troubleshooting

### Check Container App Logs
```bash
az containerapp logs show -n frontend -g microservice-rg
```

### Restart Container
```bash
az containerapp restart -n frontend -g microservice-rg
```

### View Environment Variables
```bash
az containerapp show -n frontend -g microservice-rg --query "template.containers[0].env"
```
