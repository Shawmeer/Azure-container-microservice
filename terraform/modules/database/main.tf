# Database Module - PostgreSQL Flexible Server

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

variable "db_username" {
  description = "Database admin username"
  type        = string
  default     = "appuser"
}

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "sku_name" {
  description = "SKU name"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  description = "Storage in MB"
  type        = number
  default     = 32768
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "${var.prefix}dbsamir"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_name            = var.sku_name
  
  administrator_login    = var.db_username
  administrator_password = var.db_password
  
  storage_mb = var.storage_mb
  version    = var.postgres_version
  
  lifecycle {
    ignore_changes = [zone, high_availability]
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "appdb"
  server_id = azurerm_postgresql_flexible_server.main.id
}

output "hostname" {
  value = azurerm_postgresql_flexible_server.main.name
}

output "fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  value = "appdb"
}
