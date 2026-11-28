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
      ManagedBy   = "Terraform-Compute"
    }
  }
}

# ==============================================================================
# DATA SOURCES (Dynamic Discovery)
# ==============================================================================

# Option A: Query the persistent Amazon ECR repository created by 01-base
data "aws_ecr_repository" "app" {
  name = var.ecr_repository_name
}

# Official Amazon Linux 2023 AMI
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-kernel-6.1-x86_64"]
  }
}

locals {
  resolved_ami_id = var.ami_id != "" ? var.ami_id : data.aws_ami.al2023.id
}

# ==============================================================================
# 1. NETWORKING (VPC, Subnets, Internet Gateway & Routing)
# ==============================================================================

# Custom VPC (192.168.0.0/24)
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "cloudscale-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "cloudscale-igw"
  }
}

# Public Subnet 1 (ap-southeast-2a)
resource "aws_subnet" "pub_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_1_cidr
  availability_zone       = var.az_1
  map_public_ip_on_launch = true

  tags = {
    Name = "cloudscale-pub-sub-1"
  }
}

# Public Subnet 2 (ap-southeast-2b)
resource "aws_subnet" "pub_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_2_cidr
  availability_zone       = var.az_2
  map_public_ip_on_launch = true

  tags = {
    Name = "cloudscale-pub-sub-2"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "cloudscale-pub-rt"
  }
}

# Route Table Associations (Public Subnets to IGW)
resource "aws_route_table_association" "pub_1" {
  subnet_id      = aws_subnet.pub_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "pub_2" {
  subnet_id      = aws_subnet.pub_2.id
  route_table_id = aws_route_table.public.id
}

# ------------------------------------------------------------------------------
# Private Subnets & NAT Gateway (Enterprise Defense-in-Depth for EC2 Nodes)
# ------------------------------------------------------------------------------

# Private Subnet 1 (ap-southeast-2a)
resource "aws_subnet" "priv_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_priv_1_cidr
  availability_zone       = var.az_1
  map_public_ip_on_launch = false

  tags = {
    Name = "cloudscale-priv-sub-1"
  }
}

# Private Subnet 2 (ap-southeast-2b)
resource "aws_subnet" "priv_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_priv_2_cidr
  availability_zone       = var.az_2
  map_public_ip_on_launch = false

  tags = {
    Name = "cloudscale-priv-sub-2"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip" {
  domain = "vpc"

  tags = {
    Name = "cloudscale-nat-eip"
  }
}

# NAT Gateway (Resides in Public Subnet 1 to route private subnet outbound traffic)
resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.pub_1.id

  tags = {
    Name = "cloudscale-nat-gw"
  }

  depends_on = [aws_internet_gateway.igw]
}

# Private Route Table (Routes outbound internet via NAT Gateway)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }

  tags = {
    Name = "cloudscale-priv-rt"
  }
}

# Route Table Associations (Private Subnets to NAT Gateway)
resource "aws_route_table_association" "priv_1" {
  subnet_id      = aws_subnet.priv_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "priv_2" {
  subnet_id      = aws_subnet.priv_2.id
  route_table_id = aws_route_table.private.id
}

# ==============================================================================
# 2. SECURITY GROUPS (Strict Security Group Chaining)
# ==============================================================================

# ALB Security Group: Accepts public HTTP traffic on Port 80 and Port 8080
resource "aws_security_group" "alb_sg" {
  name        = "cloudscale-alb-sg"
  description = "Security group for CloudScale Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Public Website & API
  ingress {
    description = "Allow HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Admin Dashboard & Cockpit
  ingress {
    description = "Allow Admin Cockpit HTTP from internet"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound allow-all
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cloudscale-alb-sg"
  }
}

# EC2 Security Group: ONLY accepts application traffic from ALB Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "cloudscale-ec2-sg"
  description = "Security group for CloudScale EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Port 80 allowed ONLY from ALB SG
  ingress {
    description     = "Allow HTTP:80 exclusively from ALB Security Group"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Allow internal cluster HTTP:80 between peer nodes"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  # Port 8080 allowed ONLY from ALB SG
  ingress {
    description     = "Allow HTTP:8080 exclusively from ALB Security Group"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "Allow internal cluster HTTP:8080 between peer nodes"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  # SSH for administration (optional)
  ingress {
    description = "Allow SSH from administrator CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ssh_cidr]
  }

  # Outbound allow-all
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cloudscale-ec2-sg"
  }
}

# ==============================================================================
# 3. IDENTITY & ACCESS MANAGEMENT (IAM Role for EC2 Nodes)
# ==============================================================================

resource "aws_iam_role" "ec2_role" {
  name = "CloudScale-EC2-Instance-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "CloudScale-EC2-Instance-Role"
  }
}

# CloudWatch Read Only Policy Attachment
resource "aws_iam_role_policy_attachment" "cw_ro" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
}

# AWS Systems Manager (SSM) Session Manager Policy Attachment
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Custom Least-Privilege Policy for Auto-Scaling and Metrics API
resource "aws_iam_policy" "asg_policy" {
  name        = "CloudScale-ASG-Telemetry-Policy"
  description = "Permissions for CloudScale backend to inspect and scale ASG"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:SetDesiredCapacity",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "asg_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.asg_policy.arn
}

# Amazon ECR Read-Only Policy Attachment for EC2 Nodes
resource "aws_iam_role_policy_attachment" "ecr_ro" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "CloudScale-EC2-Instance-Profile"
  role = aws_iam_role.ec2_role.name
}

# ==============================================================================
# 4. APPLICATION LOAD BALANCER & TARGET GROUPS
# ==============================================================================

# Target Group 1: Website 1 & Public API (Port 80)
resource "aws_lb_target_group" "tg_80" {
  name        = "tg-cloudscale-80"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 3600
    enabled         = true
  }

  tags = {
    Name = "tg-cloudscale-80"
  }
}

# Target Group 2: Admin Dashboard & Telemetry Cockpit (Port 8080)
resource "aws_lb_target_group" "tg_8080" {
  name        = "tg-cloudscale-8080"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 3600
    enabled         = true
  }

  tags = {
    Name = "tg-cloudscale-8080"
  }
}

# Application Load Balancer
resource "aws_lb" "alb" {
  name               = "cloudscale-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.pub_1.id, aws_subnet.pub_2.id]

  enable_deletion_protection = false

  tags = {
    Name = "cloudscale-alb"
  }
}

# ALB Listener 1 (Port 80) -> tg-cloudscale-80
resource "aws_lb_listener" "listener_80" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg_80.arn
  }
}

# ALB Listener 2 (Port 8080) -> tg-cloudscale-8080
resource "aws_lb_listener" "listener_8080" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 8080
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg_8080.arn
  }
}

# ==============================================================================
# 5. EC2 LAUNCH TEMPLATE
# ==============================================================================

resource "aws_launch_template" "lt" {
  name_prefix   = "cloudscale-lt-"
  image_id      = local.resolved_ami_id
  instance_type = var.instance_type
  key_name      = var.key_name != "" ? var.key_name : null

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  monitoring {
    enabled = true
  }

  # Cloud-Init User Data: Pulls pre-built image from ECR (Option A data source)
  user_data = base64encode(<<-EOF
    #!/bin/bash
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    echo "=== CloudScale Bootstrap Starting ==="

    # 1. Update OS packages & install Docker + Git + AWS CLI
    dnf update -y
    dnf install -y docker git aws-cli
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # 2. Authenticate and pull pre-built image from Amazon ECR (Fast ~20-30s)
    ECR_URL="${data.aws_ecr_repository.app.repository_url}"
    AWS_REGION="${var.aws_region}"
    echo "Attempting to pull from Amazon ECR ($ECR_URL)..."
    
    if aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL && docker pull $ECR_URL:latest; then
      echo "=== Successfully pulled pre-built image from ECR ==="
      IMAGE_TO_RUN="$ECR_URL:latest"
    else
      echo "=== ECR image not ready yet, falling back to Git clone & local build ==="
      if [ ! -d "/home/ec2-user/CloudScale" ]; then
        echo "Cloning CloudScale repository from GitHub..."
        git clone https://github.com/nayka-mihir/CloudScale.git /home/ec2-user/CloudScale
        chown -R ec2-user:ec2-user /home/ec2-user/CloudScale
      fi
      cd /home/ec2-user/CloudScale
      docker build -t cloudscale-app:latest .
      IMAGE_TO_RUN="cloudscale-app:latest"
    fi

    # 3. Start CloudScale Container
    echo "Starting CloudScale application container with $IMAGE_TO_RUN..."
    docker rm -f cloudscale 2>/dev/null || true
    docker run -d --name cloudscale --restart unless-stopped -p 80:80 -p 8080:8080 $IMAGE_TO_RUN

    echo "=== CloudScale Bootstrap Completed Successfully ==="
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "CloudScale-Cluster-Node"
      Project = "CloudScale"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================================================
# 6. AUTO SCALING GROUP & TARGET TRACKING SCALING POLICY
# ==============================================================================

resource "aws_autoscaling_group" "asg" {
  name_prefix         = "cloudscale-asg-"
  vpc_zone_identifier = [aws_subnet.priv_1.id, aws_subnet.priv_2.id]
  target_group_arns   = [aws_lb_target_group.tg_80.arn, aws_lb_target_group.tg_8080.arn]

  min_size         = var.min_capacity
  desired_capacity = var.desired_capacity
  max_size         = var.max_capacity

  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "CloudScale-Cluster-Node"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = "CloudScale"
    propagate_at_launch = true
  }

  depends_on = [
    aws_nat_gateway.nat_gw,
    aws_route_table_association.priv_1,
    aws_route_table_association.priv_2
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Target Tracking Scaling Policy (Average CPU > 70%)
resource "aws_autoscaling_policy" "cpu_target_tracking" {
  name                      = "cloudscale-cpu-target-tracking"
  autoscaling_group_name    = aws_autoscaling_group.asg.name
  policy_type               = "TargetTrackingScaling"
  estimated_instance_warmup = 180

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.cpu_target_threshold
  }
}
