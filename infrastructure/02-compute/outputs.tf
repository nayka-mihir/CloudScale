output "public_website_url" {
  description = "URL for Website 1 (Public Portal & API) on Port 80"
  value       = "http://${aws_lb.alb.dns_name}"
}

output "admin_dashboard_url" {
  description = "URL for Website 2 (Admin Control Plane & Telemetry Cockpit) on Port 8080"
  value       = "http://${aws_lb.alb.dns_name}:8080"
}

output "alb_dns_name" {
  description = "Application Load Balancer Canonical DNS Name"
  value       = aws_lb.alb.dns_name
}

output "vpc_id" {
  description = "Custom CloudScale VPC ID"
  value       = aws_vpc.main.id
}

output "asg_name" {
  description = "Auto Scaling Group Name"
  value       = aws_autoscaling_group.asg.name
}

output "launch_template_id" {
  description = "EC2 Launch Template ID"
  value       = aws_launch_template.lt.id
}

output "resolved_ami_id" {
  description = "The AMI ID used to launch the cluster nodes"
  value       = local.resolved_ami_id
}

output "public_subnet_ids" {
  description = "Public Subnet IDs hosting the ALB and NAT Gateway"
  value       = [aws_subnet.pub_1.id, aws_subnet.pub_2.id]
}

output "private_subnet_ids" {
  description = "Private Subnet IDs hosting the Auto Scaling EC2 instances"
  value       = [aws_subnet.priv_1.id, aws_subnet.priv_2.id]
}

output "nat_gateway_public_ip" {
  description = "Public Elastic IP assigned to NAT Gateway"
  value       = aws_eip.nat_eip.public_ip
}

output "ecr_repository_url" {
  description = "Amazon ECR Repository URL (Queried dynamically via Option A Data Source)"
  value       = data.aws_ecr_repository.app.repository_url
}

output "target_group_80_arn" {
  description = "Target Group ARN for Port 80"
  value       = aws_lb_target_group.tg_80.arn
}

output "target_group_8080_arn" {
  description = "Target Group ARN for Port 8080"
  value       = aws_lb_target_group.tg_8080.arn
}
