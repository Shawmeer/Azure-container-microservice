# Key Vault Module - Azure Key Vault for secrets management

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "prefix" {
  description = "Prefix for naming"
  type        = string
  default     = "microservice"
}

variable "sku_name" {
  description = "Key Vault SKU"
  type        = string
  default     = "standard"
}

variable "enable_rbac_authorization" {
  description = "Enable RBAC authorization for Key Vault"
  type        = bool
  default     = true
}

variable "enable_soft_delete" {
  description = "Enable soft delete for Key Vault"
  type        = bool
  default     = true
}

variable "purge_protection_enabled" {
  description = "Enable purge protection for Key Vault"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                = "${var.prefix}kv"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_name            = var.sku_name

  tenant_id = data.azurerm_client_config.current.tenant_id

  enable_rbac_authorization  = var.enable_rbac_authorization
  purge_protection_enabled   = var.purge_protection_enabled
  soft_delete_retention_days = 7

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }

  tags = var.tags
}

# Get current client config for tenant_id
data "azurerm_client_config" "current" {}

# Key Vault Access Policy for current user (for initial setup)
resource "azurerm_key_vault_access_policy" "current_user" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
    "Recover",
    "Backup",
    "Restore"
  ]

  key_permissions = [
    "Get",
    "List",
    "Create",
    "Delete",
    "Recover",
    "Backup",
    "Restore"
  ]

  certificate_permissions = [
    "Get",
    "List",
    "Create",
    "Delete",
    "Recover",
    "Backup",
    "Restore"
  ]
}

# Key Vault Access Policy for GitHub Actions (via Service Principal)
variable "github_sp_object_id" {
  description = "Object ID of GitHub Actions Service Principal"
  type        = string
  default     = ""
}

resource "azurerm_key_vault_access_policy" "github_actions" {
  count        = var.github_sp_object_id != "" ? 1 : 0
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = var.github_sp_object_id

  secret_permissions = [
    "Get",
    "List"
  ]

  key_permissions = [
    "Get",
    "List"
  ]

  certificate_permissions = [
    "Get",
    "List"
  ]
}

# Default secrets
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.db_password
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

resource "azurerm_key_vault_secret" "acr_password" {
  name         = "acr-password"
  key_vault_id = azurerm_key_vault.main.id
  value        = var.acr_password
}

variable "acr_password" {
  description = "ACR admin password"
  type        = string
  sensitive   = true
}

# Outputs
output "vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}

output "vault_name" {
  value = azurerm_key_vault.main.name
}

output "key_vault_id" {
  value = azurerm_key_vault.main.id
}

output "key_vault_resource_id" {
  value = azurerm_key_vault.main.id
}

output "tenant_id" {
  value = data.azurerm_client_config.current.tenant_id
}