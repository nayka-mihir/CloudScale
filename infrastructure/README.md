# CloudScale Multi-Tier Infrastructure Architecture (Enterprise Pattern A)

This directory follows **Enterprise Multi-Tier Lifecycle Architecture**. Infrastructure is split into two independent modules so that your Docker registry remains alive permanently at $0.00/hour, while your expensive compute resources (EC2, NAT Gateway, ALB) can be destroyed and recreated whenever you want to save 100% on cloud costs.

---

## Architecture Overview

```
infrastructure/
├── 01-base/                  <-- APPLIED ONCE (Never Destroyed)
│   ├── main.tf               (Amazon ECR Registry & Lifecycle Policies)
│   ├── variables.tf
│   └── outputs.tf
│
└── 02-compute/               <-- DYNAMIC (Apply when working, Destroy to save $)
    ├── main.tf               (VPC, Subnets, NAT Gateway, ALB, ASG, EC2)
    ├── variables.tf
    └── outputs.tf
```

---

## 1. `01-base` — Foundation Layer (Run ONCE)

- **What it creates:** Amazon ECR Private Container Registry (`cloudscale-app`) with automatic vulnerability scanning on push and 10-image retention lifecycle policy.
- **Cost when running / idle:** **$0.00 / hour** (Costs nothing to keep alive).
- **Lifecycle:** Apply once. **Never destroy.**

### Commands:
```bash
cd infrastructure/01-base
terraform init
terraform apply
```

---

## 2. `02-compute` — Compute & Networking Layer (Ephemeral)

- **What it creates:** Custom VPC (`192.168.0.0/24`), Public & Private Subnets, NAT Gateway, Application Load Balancer, EC2 Auto-Scaling Group, Target Tracking Policy (CPU > 70%), and IAM Roles.
- **Dynamic Discovery (Option A):** Uses `data "aws_ecr_repository" "app"` to dynamically query the ECR repository created by `01-base` without needing complex remote state!
- **Cost when running:** ~$2.20 / day (NAT Gateway + ALB + 2x t3.micro EC2).
- **Lifecycle:** Apply when you want to run tests or demos. **Destroy when you want to stop paying.**

### To Start the Cluster:
```bash
cd infrastructure/02-compute
terraform init
terraform apply
```

### To Destroy the Cluster & Save 100% on Costs:
```bash
cd infrastructure/02-compute
terraform destroy
```
*(Your VPC, ALB, NAT Gateway, and EC2 instances are deleted, returning billing to $0.00, while your built Docker images in `01-base` remain 100% safe!)*

---

## 3. Comparison of Lifecycles

| Layer | Resources | Hourly Cost | Destroy Frequency | Impact on CI/CD |
|---|---|---|---|---|
| **`01-base`** | Amazon ECR | **$0.00 / hr** | **Never** | GitHub Actions can push Docker images 24/7 without fail. |
| **`02-compute`** | VPC, NAT, ALB, ASG, EC2 | **~$0.09 / hr** | **Destroy when idle** | Can be torn down and recreated in ~3 minutes without losing images. |
