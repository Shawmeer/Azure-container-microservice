variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  default     = ""
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  default     = ""
}

variable "client_id" {
  description = "Azure Client ID (Service Principal)"
  type        = string
  default     = ""
}

variable "client_secret" {
  description = "Azure Client Secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "prefix" {
  description = "Prefix for all resources"
  type        = string
  default     = "microservice"
}

variable "location" {
  description = "Azure region (use a region available in your subscription)"
  type        = string
  default     = "centralus"
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}

variable "create_container_apps" {
  description = "Whether to create container apps via Terraform (set to false to use Azure CLI)"
  type        = bool
  default     = false
}
