# Azure Provider Configuration
terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Enable Remote Backend for State Persistence
  # Configuration is passed via CLI in GitHub Actions
}

provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
  client_id       = var.client_id
  client_secret   = var.client_secret
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.prefix}-rg"
  location = var.location
}

# Module: Virtual Network and Networking
module "networking" {
  source = "./modules/networking"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  prefix              = var.prefix
  address_space       = ["10.0.0.0/16"]

  subnet_config = [
    {
      name           = "container-apps-subnet"
      address_prefix = "10.0.1.0/24"
    },
    {
      name           = "database-subnet"
      address_prefix = "10.0.2.0/24"
    }
  ]
}

# Container Apps Environment (Consumption - Free Tier) - With VNet integration
resource "azurerm_container_app_environment" "main" {
  name                = "${var.prefix}env"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  # Uncomment for VNet integration
  # vnet_configuration {
  #   internal_load_balancer_enabled = true
  #   subnet_id                      = module.networking.container_apps_subnet_id
  # }
}

# Module: Azure Container Registry (Basic SKU - $0.05/day)
module "acr" {
  source = "./modules/acr"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  prefix              = var.prefix
  sku                 = "Standard"
  admin_enabled       = true
}

# Module: Azure Key Vault
module "keyvault" {
  source = "./modules/keyvault"

  resource_group_name       = azurerm_resource_group.main.name
  location                  = azurerm_resource_group.main.location
  prefix                    = var.prefix
  sku_name                  = "standard"
  enable_rbac_authorization = true

  db_password  = var.db_password
  acr_password = module.acr.admin_password
}

# Module: Database (PostgreSQL Flexible - Free Tier)
module "database" {
  source = "./modules/database"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  prefix              = var.prefix
  db_username         = "appuser"
  db_password         = var.db_password
}

# Module: Container Apps (set create_container_apps to true to create via Terraform)
module "container_apps" {
  count  = var.create_container_apps ? 1 : 0
  source = "./modules/container_apps"

  resource_group_name = azurerm_resource_group.main.name
  prefix              = var.prefix
  environment_id      = azurerm_container_app_environment.main.id

  acr_login_server   = module.acr.login_server
  acr_admin_username = module.acr.admin_username
  acr_admin_password = module.acr.admin_password

  db_config = {
    hostname = module.database.hostname
    port     = "5432"
    name     = module.database.database_name
    username = "appuser"
    password = var.db_password
  }

  image_tag = var.image_tag
}

# Grant ACR Pull access to Container Apps via managed identity
resource "azurerm_role_assignment" "user_service_acr_pull" {
  count                = var.create_container_apps ? 1 : 0
  scope                = module.acr.acr_id
  role_definition_name = "AcrPull"
  principal_id         = module.container_apps[0].user_service_identity
}

resource "azurerm_role_assignment" "product_service_acr_pull" {
  count                = var.create_container_apps ? 1 : 0
  scope                = module.acr.acr_id
  role_definition_name = "AcrPull"
  principal_id         = module.container_apps[0].product_service_identity
}

resource "azurerm_role_assignment" "api_gateway_acr_pull" {
  count                = var.create_container_apps ? 1 : 0
  scope                = module.acr.acr_id
  role_definition_name = "AcrPull"
  principal_id         = module.container_apps[0].api_gateway_identity
}

resource "azurerm_role_assignment" "frontend_acr_pull" {
  count                = var.create_container_apps ? 1 : 0
  scope                = module.acr.acr_id
  role_definition_name = "AcrPull"
  principal_id         = module.container_apps[0].frontend_identity
}

# Grant Key Vault Reader access to Container Apps managed identities
resource "azurerm_role_assignment" "container_apps_key_vault_reader" {
  count                = var.create_container_apps ? 1 : 0
  scope                = module.keyvault.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.container_apps[0].user_service_identity
}

resource "azurerm_role_assignment" "product_service_key_vault_reader" {
  count                = var.create_container_apps ? 1 : 0
  scope                = module.keyvault.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.container_apps[0].product_service_identity
}

# Outputs
output "acr_login_server" {
  value = module.acr.login_server
}

output "acr_admin_username" {
  value = module.acr.admin_username
}

output "admin_password" {
  value     = module.acr.admin_password
  sensitive = true
}

output "postgres_host" {
  value = module.database.hostname
}

output "container_apps" {
  value = var.create_container_apps ? module.container_apps[0].container_apps : {}
}

output "frontend_url" {
  value = var.create_container_apps ? module.container_apps[0].frontend_url : ""
}

output "container_apps_environment_name" {
  value = azurerm_container_app_environment.main.name
}

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "key_vault_uri" {
  value = module.keyvault.vault_uri
}

output "key_vault_name" {
  value = module.keyvault.vault_name
}

output "vnet_id" {
  value = module.networking.vnet_id
}

output "vnet_name" {
  value = module.networking.vnet_name
}
