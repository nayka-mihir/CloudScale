variable "aws_region" {
  description = "AWS Region to deploy CloudScale infrastructure"
  type        = string
  default     = "ap-southeast-2"
}

variable "ecr_repository_name" {
  description = "Name of the Amazon ECR private repository created by 01-base"
  type        = string
  default     = "cloudscale-app"
}

variable "vpc_cidr" {
  description = "CIDR block for the custom VPC"
  type        = string
  default     = "192.168.0.0/24"
}

variable "subnet_1_cidr" {
  description = "CIDR block for Public Subnet 1 in AZ-a"
  type        = string
  default     = "192.168.0.0/26"
}

variable "subnet_2_cidr" {
  description = "CIDR block for Public Subnet 2 in AZ-b"
  type        = string
  default     = "192.168.0.64/26"
}

variable "subnet_priv_1_cidr" {
  description = "CIDR block for Private Subnet 1 in AZ-a"
  type        = string
  default     = "192.168.0.128/26"
}

variable "subnet_priv_2_cidr" {
  description = "CIDR block for Private Subnet 2 in AZ-b"
  type        = string
  default     = "192.168.0.192/26"
}

variable "az_1" {
  description = "Primary Availability Zone"
  type        = string
  default     = "ap-southeast-2a"
}

variable "az_2" {
  description = "Secondary Availability Zone"
  type        = string
  default     = "ap-southeast-2b"
}

variable "instance_type" {
  description = "EC2 instance type for cluster nodes"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of existing EC2 Key Pair for SSH access (optional)"
  type        = string
  default     = ""
}

variable "admin_ssh_cidr" {
  description = "CIDR block allowed to SSH into cluster nodes"
  type        = string
  default     = "0.0.0.0/0"
}

variable "ami_id" {
  description = "Optional explicit AMI ID (leave empty to dynamically discover official AL2023)"
  type        = string
  default     = ""
}

variable "min_capacity" {
  description = "Minimum number of EC2 instances in the Auto Scaling Group"
  type        = number
  default     = 2
}

variable "desired_capacity" {
  description = "Desired number of EC2 instances in the Auto Scaling Group"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of EC2 instances in the Auto Scaling Group"
  type        = number
  default     = 6
}

variable "cpu_target_threshold" {
  description = "Target average CPU utilization percentage to trigger auto-scaling"
  type        = number
  default     = 70.0
}
