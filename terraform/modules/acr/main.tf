# ACR Module - Azure Container Registry

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

variable "sku" {
  description = "ACR SKU"
  type        = string
  default     = "Basic"
}

variable "admin_enabled" {
  description = "Enable admin user"
  type        = bool
  default     = true
}

resource "azurerm_container_registry" "main" {
  name                = "${var.prefix}acrsamir"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = var.admin_enabled
}

output "login_server" {
  value = azurerm_container_registry.main.login_server
}

output "admin_username" {
  value = azurerm_container_registry.main.admin_username
}

output "admin_password" {
  value     = azurerm_container_registry.main.admin_password
  sensitive = true
}

output "acr_id" {
  description = "The ID of the container registry"
  value       = azurerm_container_registry.main.id
}
