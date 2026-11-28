output "ecr_repository_url" {
  description = "Amazon ECR Repository URL to push and pull Docker images"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "Amazon ECR Repository ARN"
  value       = aws_ecr_repository.app.arn
}

output "ecr_repository_name" {
  description = "Amazon ECR Repository Name"
  value       = aws_ecr_repository.app.name
}
