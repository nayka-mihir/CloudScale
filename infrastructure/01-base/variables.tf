variable "aws_region" {
  description = "AWS Region to deploy CloudScale Base Infrastructure"
  type        = string
  default     = "ap-southeast-2"
}

variable "ecr_repository_name" {
  description = "Name of the Amazon ECR private repository"
  type        = string
  default     = "cloudscale-app"
}
