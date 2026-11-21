# CloudScale Infrastructure as Code (Terraform)

Automated provisioning for the **CloudScale Multi-AZ High-Availability Auto-Scaling Cluster** on AWS.

## What This Code Creates
1. **Custom VPC (`10.0.0.0/16`)** with Internet Gateway.
2. **2 Multi-AZ Public Subnets** (`ap-south-1a` & `ap-south-1b`).
3. **Chained Security Groups** (`ALB SG` -> `EC2 SG`).
4. **IAM Instance Profile** (`CloudWatchReadOnlyAccess` + ASG telemetry permissions).
5. **Application Load Balancer** with dual listeners:
   - Port `80` -> Forward to `tg-cloudscale-80`
   - Port `8080` -> Forward to `tg-cloudscale-8080`
6. **EC2 Launch Template** with Golden AMI & container auto-boot User Data.
7. **Auto Scaling Group** with Target Tracking Policy (Average CPU > 70%).

## Quick Start

### 1. Configure Credentials
```bash
aws configure
```

### 2. (Optional) Custom Settings
Copy the example variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```
Edit `terraform.tfvars` if you want to set your specific `ami_id` or `key_name`.

### 3. Initialize & Deploy
```bash
cd infrastructure
terraform init
terraform plan
terraform apply -auto-approve
```

### 4. View Outputs
At the end of the run, Terraform prints your live endpoints:
- `public_website_url`: `http://<ALB_DNS>`
- `admin_dashboard_url`: `http://<ALB_DNS>:8080`

### 5. Cost Control & Teardown
```bash
# To pause nodes without destroying the ALB/VPC:
terraform apply -var="desired_capacity=0" -var="min_capacity=0"

# To delete everything completely:
terraform destroy -auto-approve
```
