# Networking Module - Virtual Network and Subnets

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

variable "address_space" {
  description = "Virtual Network address space"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_config" {
  description = "Subnet configuration"
  type = list(object({
    name           = string
    address_prefix = string
  }))
  default = [
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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "${prefix}vnet"
  resource_group_name = var.resource_group_name
  location            = var.location
  address_space       = var.address_space

  tags = var.tags
}

# Subnets
resource "azurerm_subnet" "subnets" {
  count = length(var.subnet_config)

  name                 = var.subnet_config[count.index].name
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_config[count.index].address_prefix]

  # Allow Container Apps delegation
  delegation {
    name = "containerappdelegation"

    service_delegation {
      name = "Microsoft.App/containerApps"
      actions = [
        "Microsoft.App/containerApps/authConfigs/read",
        "Microsoft.App/containerApps/listAuthSecrets/read",
        "Microsoft.App/containerApps/read",
        "Microsoft.App/containerApps/write"
      ]
    }
  }
}

# Private DNS Zone for Container Apps
resource "azurerm_private_dns_zone" "container_apps" {
  name = "internal.${var.prefix}env.azurecontainerapps.io"

  resource_group_name = var.resource_group_name
}

# Link Private DNS Zone to Virtual Network
resource "azurerm_private_dns_zone_virtual_network_link" "container_apps" {
  name                  = "${var.prefix}dnslink"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.container_apps.name
  virtual_network_id    = azurerm_virtual_network.main.id
}

# Database subnet delegation
resource "azurerm_subnet" "database_subnet" {
  name                 = "database-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]

  # Allow PostgreSQL Flexible Server delegation
  delegation {
    name = "postgresqldelegation"

    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.DBforPostgreSQL/flexibleServers/*"
      ]
    }
  }
}

# Outputs
output "vnet_id" {
  value = azurerm_virtual_network.main.id
}

output "vnet_name" {
  value = azurerm_virtual_network.main.name
}

output "vnet_address_space" {
  value = azurerm_virtual_network.main.address_space
}

output "subnet_ids" {
  value = { for subnet in azurerm_subnet.subnets : subnet.name => subnet.id }
}

output "container_apps_subnet_id" {
  value = azurerm_subnet.subnets[0].id
}

output "database_subnet_id" {
  value = azurerm_subnet.subnets[1].id
}

output "private_dns_zone_id" {
  value = azurerm_private_dns_zone.container_apps.id
}