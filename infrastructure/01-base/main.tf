terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CloudScale"
      Environment = "Production"
      ManagedBy   = "Terraform-Base"
    }
  }
}

# ==============================================================================
# BASE INFRASTRUCTURE: Amazon Elastic Container Registry (Amazon ECR)
# This layer is APPLIED ONCE and NEVER destroyed.
# Hourly idle cost: $0.00 / hour.
# ==============================================================================

resource "aws_ecr_repository" "app" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"
  force_delete         = false # Protect against accidental deletion

  image_scanning_configuration {
    scan_on_push = true # Free automatic vulnerability scanning
  }

  tags = {
    Name = "cloudscale-app-ecr"
  }
}

# ECR Lifecycle Policy: Automatically cleans up untagged / old images (saves storage $)
resource "aws_ecr_lifecycle_policy" "cleanup" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the last 10 tagged production images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
