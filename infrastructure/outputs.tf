# ------------------------------------------------------------------------------
# Terraform Outputs
# ------------------------------------------------------------------------------

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.app.dns_name}"
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for assets"
  value       = aws_s3_bucket.assets.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.app.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for container logs"
  value       = aws_cloudwatch_log_group.app.name
}

output "openai_secret_arn" {
  description = "ARN of the OpenAI API key secret"
  value       = aws_secretsmanager_secret.openai_api_key.arn
}

output "elevenlabs_secret_arn" {
  description = "ARN of the ElevenLabs API key secret"
  value       = aws_secretsmanager_secret.elevenlabs_api_key.arn
}
