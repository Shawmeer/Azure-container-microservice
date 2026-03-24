# Container Apps Module - Uses custom images from ACR

variable "resource_group_name" {
  type = string
}

variable "environment_id" {
  type = string
}

variable "acr_login_server" {
  type = string
}

variable "acr_admin_username" {
  type        = string
  description = " ACR admin username (for reference only)"
}

variable "acr_admin_password" {
  type        = string
  sensitive   = true
  description = "ACR admin password (for reference only)"
}

variable "prefix" {
  type    = string
  default = "microservice"
}

variable "db_config" {
  type = object({
    hostname = string
    port     = string
    name     = string
    username = string
    password = string
  })
  sensitive = true
}

variable "image_tag" {
  type    = string
  default = "latest"
}

# User Service Container App
resource "azurerm_container_app" "user_service" {
  name                         = "${var.prefix}-user-service"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.environment_id
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server               = var.acr_login_server
    username             = var.acr_admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = var.acr_admin_password
  }

  template {
    container {
      name   = "user-service"
      image  = "${var.acr_login_server}/user-service:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "3001"
      }
      env {
        name  = "DB_HOST"
        value = var.db_config.hostname
      }
      env {
        name  = "DB_PORT"
        value = var.db_config.port
      }
      env {
        name  = "DB_NAME"
        value = var.db_config.name
      }
      env {
        name  = "DB_USER"
        value = var.db_config.username
      }
      env {
        name  = "DB_PASSWORD"
        value = var.db_config.password
      }
    }
  }
}

# Product Service Container App
resource "azurerm_container_app" "product_service" {
  name                         = "${var.prefix}-product-service"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.environment_id
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server               = var.acr_login_server
    username             = var.acr_admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = var.acr_admin_password
  }

  template {
    container {
      name   = "product-service"
      image  = "${var.acr_login_server}/product-service:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "3002"
      }
      env {
        name  = "DB_HOST"
        value = var.db_config.hostname
      }
      env {
        name  = "DB_PORT"
        value = var.db_config.port
      }
      env {
        name  = "DB_NAME"
        value = var.db_config.name
      }
      env {
        name  = "DB_USER"
        value = var.db_config.username
      }
      env {
        name  = "DB_PASSWORD"
        value = var.db_config.password
      }
    }
  }
}

# API Gateway Container App
resource "azurerm_container_app" "api_gateway" {
  name                         = "${var.prefix}-api-gateway"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.environment_id
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server               = var.acr_login_server
    username             = var.acr_admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = var.acr_admin_password
  }

  template {
    container {
      name   = "api-gateway"
      image  = "${var.acr_login_server}/api-gateway:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "8080"
      }
      env {
        name  = "USER_SERVICE_URL"
        value = "http://${azurerm_container_app.user_service.name}.internal.${var.prefix}env"
      }
      env {
        name  = "PRODUCT_SERVICE_URL"
        value = "http://${azurerm_container_app.product_service.name}.internal.${var.prefix}env"
      }
    }
  }
}

# Frontend Container App
resource "azurerm_container_app" "frontend" {
  name                         = "${var.prefix}-frontend"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.environment_id
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server               = var.acr_login_server
    username             = var.acr_admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = var.acr_admin_password
  }

  template {
    container {
      name   = "frontend"
      image  = "${var.acr_login_server}/frontend:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "API_GATEWAY_URL"
        value = "https://${azurerm_container_app.api_gateway.name}.${var.prefix}env.azurecontainerapps.io"
      }
    }
  }
}

output "container_apps" {
  value = {
    user-service    = azurerm_container_app.user_service.name
    product-service = azurerm_container_app.product_service.name
    api-gateway     = azurerm_container_app.api_gateway.name
    frontend        = azurerm_container_app.frontend.name
  }
}

output "frontend_url" {
  value = "https://${azurerm_container_app.frontend.name}.${var.prefix}env.azurecontainerapps.io"
}

output "user_service_identity" {
  description = "Principal ID of user service managed identity"
  value       = azurerm_container_app.user_service.identity[0].principal_id
}

output "product_service_identity" {
  description = "Principal ID of product service managed identity"
  value       = azurerm_container_app.product_service.identity[0].principal_id
}

output "api_gateway_identity" {
  description = "Principal ID of API gateway managed identity"
  value       = azurerm_container_app.api_gateway.identity[0].principal_id
}

output "frontend_identity" {
  description = "Principal ID of frontend managed identity"
  value       = azurerm_container_app.frontend.identity[0].principal_id
}
