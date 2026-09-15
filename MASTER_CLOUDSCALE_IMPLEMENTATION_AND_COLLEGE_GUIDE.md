# CloudScale: Enterprise High-Availability Auto-Scaling Cloud Infrastructure & Live Control Plane
## Comprehensive Step-by-Step Implementation Guide & Academic Project Master Manual

---

## 1. Executive Summary & Project Objectives

### 1.1 Academic Project Overview
**CloudScale** is an enterprise-grade cloud computing project engineered to demonstrate dynamic horizontal auto-scaling, high availability across multiple Availability Zones (Multi-AZ), traffic load distribution, and operational telemetry on Amazon Web Services (AWS). 

Modern cloud architectures must accommodate sudden surges in customer demand while maintaining low operating costs during idle periods. CloudScale showcases how modern DevOps engineering solves this challenge using containerized micro-frontends, a resilient Node.js backend, and native AWS infrastructure services (VPC, ALB, ASG, EC2, CloudWatch, IAM, EFS, Route 53).

### 1.2 Core Project Objectives
1. **Automated Elasticity**: Dynamically scale EC2 compute capacity out (expand from 2 to 6 instances) under high CPU load (>70%), and scale in (contract to 2 instances) when idle (<30%) without human intervention.
2. **Multi-AZ High Availability**: Guarantee zero downtime and uninterrupted service by distributing compute nodes across multiple isolated Availability Zones (`ap-south-1a`, `ap-south-1b`).
3. **Dual-Application Isolation**:
   - **Website 1 (Public Portal - Port 80)**: High-speed customer-facing marketing and application portal capable of receiving and generating real HTTP transaction volume.
   - **Website 2 (Admin Control Plane - Port 8080)**: Dedicated operations and infrastructure dashboard providing real-time telemetry (CPU utilization, active instance count, healthy target status, ALB request rate) and interactive controls to trigger synthetic CPU stress tests and override ASG capacity.
4. **State Persistence Across Ephemeral Compute**: Utilize Amazon Elastic File System (EFS) mounted across all ASG instances so that dynamic scale-in/scale-out does not lose shared user uploads or application logs.
5. **Least-Privilege Cloud Security**: Strict network isolation through public/private subnet segmentation, security group chaining, IAM role-based authentication (IAM Instance Profiles) without hardcoded access keys, and HTTPS readiness.
6. **Live Demonstration & Chaos Engineering**: Provide repeatable, verifiable stress testing and failure simulation protocols (terminating instances, spiking CPU) to prove fault tolerance in front of evaluators and academic professors.

---

## 2. Technology Stack & Module Descriptions

### 2.1 Technology Stack Breakdown

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | 18.2+ | Single Page Application (SPA) providing component modularity and reactive state management. |
| **Styling & UI** | Tailwind CSS | 3.4+ | Utility-first, responsive design with dark mode aesthetic and metric gauges. |
| **Icons & Visuals** | Lucide React | Latest | Modern vector iconography for server nodes, cloud metrics, and status badges. |
| **Telemetry Charts** | Recharts | 2.12+ | High-performance SVG time-series charts visualizing real-time CPU & request metrics. |
| **Reverse Proxy / Web Server** | Node.js / Express | 20 LTS | Serves frontend SPA assets, manages routing, and powers REST API endpoints. |
| **Backend Runtime** | Node.js | 20 LTS | Asynchronous, non-blocking runtime powering API endpoints and CPU load generators. |
| **API Framework** | Express.js | 4.19+ | REST API gateway exposing health checks, scaling endpoints, and AWS SDK operations. |
| **AWS Cloud SDK** | AWS SDK for JavaScript v3 | `@aws-sdk/client-*` | Modular SDK for interacting directly with Auto Scaling, CloudWatch, and EC2 APIs via IAM instance profiles. |
| **Containerization** | Docker & Docker Compose | 24+ / v2 | Encapsulates frontend, backend, and reverse proxy into portable, reproducible environments. |
| **Base Operating System** | Amazon Linux 2023 | Kernel 6.1+ | AWS-optimized, security-hardened Linux distribution with native SSM, AWS CLI v2, and EFS utils. |
| **Cloud Provider** | Amazon Web Services (AWS) | Global | Cloud infrastructure hosting VPC, ALB, ASG, EC2, EFS, CloudWatch, Route 53, and IAM. |

### 2.2 Functional Module Descriptions

1. **Module 1: Public Customer Portal (Website 1)**
   - Delivers interactive UI explaining cloud auto-scaling architecture.
   - Includes real API transaction triggers (contact form submissions, ping tools) that hit backend endpoints to simulate user traffic.
   - Embeds a real-time cluster health badge showing active nodes and region.
2. **Module 2: Infrastructure Control Plane (Website 2)**
   - Acts as the operational cockpit for cloud engineers.
   - Displays real-time cluster telemetry: Current desired/min/max capacity, healthy host count, CPU gauge (0–100%), and request rate.
   - Provides live controls: `[Start Load Test]` (fires CPU stress engine), `[Stop Load Test]`, `[Scale Up +1]`, `[Scale Down -1]`.
   - Supports dual-mode operation:
     - **Live AWS Mode**: Makes authentic API calls to CloudWatch and Auto Scaling Groups via IAM instance profile credentials.
     - **Simulated Cloud Mode**: Emulates AWS state changes in-memory when testing locally without incurring AWS costs.
3. **Module 3: In-Instance Stress Engine & Load Simulator**
   - Implements computational busy-wait loops in Node.js worker threads to drive EC2 vCPU utilization to >85% on demand.
   - Triggers CloudWatch alarms naturally without relying on external third-party traffic generation tools.
4. **Module 4: AWS Multi-AZ Auto-Scaling Infrastructure**
   - Application Load Balancer (ALB) acting as single public entry point.
   - Auto Scaling Group managing compute instances across 2 Availability Zones.
   - Target Group performing automated health checks against `/api/health`.

---

## 3. Architecture Overview & Diagrams

### 3.1 End-to-End Cloud Architecture Diagram (Mermaid)

```mermaid
flowchart TD
    subgraph Clients["Users & Administrators"]
        User["Public Visitors\n(Internet)"] -->|HTTP/HTTPS Port 80| DNS["Route 53 DNS\n(e.g., cloudscale.yourdomain.com)"]
        Admin["DevOps / Professor\n(Admin Access)"] -->|HTTP/HTTPS Port 8080| DNS
    end

    subgraph AWS_Cloud["AWS Region: ap-south-1 (Mumbai)"]
        DNS --> ALB["Application Load Balancer (ALB)\nInternet-Facing | Multi-AZ\nSecurity Group: cloudscale-alb-sg"]

        subgraph VPC["Custom VPC: 10.0.0.0/16"]
            IGW["Internet Gateway (cloudscale-igw)"]

            subgraph Public_Subnets["Public Subnets (ALB & Bastion Ingress)"]
                PubSub1["Public Subnet 1\n10.0.1.0/24 (ap-south-1a)\nALB Node A"]
                PubSub2["Public Subnet 2\n10.0.2.0/24 (ap-south-1b)\nALB Node B"]
            end

            subgraph Target_Groups["Target Groups"]
                TG80["tg-cloudscale-80\nHealth check: /api/health\nPort: 80"]
                TG8080["tg-cloudscale-8080\nHealth check: /api/health\nPort: 8080"]
            end

            ALB -->|Listener :80 Forward| TG80
            ALB -->|Listener :8080 Forward| TG8080

            subgraph Storage["Shared Storage Layer"]
                EFS["Amazon EFS File System\nfs-xxxx (Encrypted at rest)\nMount Targets in Subnet 1 & Subnet 2"]
            end

            subgraph ASG_Subnets["Auto Scaling Group (ASG): cloudscale-asg\nMin: 2 | Desired: 2 | Max: 6"]
                direction LR
                subgraph AZ_1A["Availability Zone: ap-south-1a"]
                    EC2_1["EC2 Instance 1 (t3.micro)\nNode.js / Express App\nAPI: 5000 | Web: 3000\nMounted EFS: /mnt/efs/data"]
                end

                subgraph AZ_1B["Availability Zone: ap-south-1b"]
                    EC2_2["EC2 Instance 2 (t3.micro)\nNode.js / Express App\nAPI: 5000 | Web: 3000\nMounted EFS: /mnt/efs/data"]
                end

                subgraph AZ_Scale["Auto-Scaled On Demand"]
                    EC2_3["EC2 Instance 3..6\nLaunched automatically\nwhen Avg CPU > 70%"]
                end
            end

            TG80 -->|Distribute HTTP:80| EC2_1
            TG80 -->|Distribute HTTP:80| EC2_2
            TG80 -->|Distribute HTTP:80| EC2_3

            TG8080 -->|Distribute HTTP:8080| EC2_1
            TG8080 -->|Distribute HTTP:8080| EC2_2
            TG8080 -->|Distribute HTTP:8080| EC2_3

            EC2_1 -.->|NFS Port 2049| EFS
            EC2_2 -.->|NFS Port 2049| EFS
            EC2_3 -.->|NFS Port 2049| EFS
        end

        subgraph Monitoring["AWS Telemetry & Scaling Loop"]
            CW_Metrics["Amazon CloudWatch Metrics\nCPUUtilization (Average)"]
            CW_Alarm_High["CloudWatch Alarm: HighCPU (>70%)\nEvaluated: 1 min, 2 periods"]
            CW_Alarm_Low["CloudWatch Alarm: LowCPU (<30%)\nEvaluated: 5 min, 1 period"]
            
            EC2_1 -.->|Publish Telemetry| CW_Metrics
            EC2_2 -.->|Publish Telemetry| CW_Metrics
            EC2_3 -.->|Publish Telemetry| CW_Metrics

            CW_Metrics --> CW_Alarm_High
            CW_Metrics --> CW_Alarm_Low

            CW_Alarm_High -->|Scale Out (+1 Instance)| ASG_Subnets
            CW_Alarm_Low -->|Scale In (-1 Instance)| ASG_Subnets
        end
    end
```

### 3.2 Network Traffic & Security Segmentation Diagram (ASCII)

```
===================================================================================================
                                      INTERNET (PUBLIC CLIENTS)
===================================================================================================
                                          │                   │
                            Port 80 (Public Web)    Port 8080 (Admin Ops)
                                          │                   │
                                          ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LOAD BALANCER (ALB) - cloudscale-alb                             │
│                    Security Group: cloudscale-alb-sg                                            │
│                    Inbound: 80 from 0.0.0.0/0, 8080 from 0.0.0.0/0 (or Admin IP)                │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                          │                   │
                    Forward to Target Group 80      Forward to Target Group 8080
                                          │                   │
                                          ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                 AWS AUTO SCALING GROUP (ASG) - Multi-AZ EC2 Instances                           │
│                 Security Group: cloudscale-ec2-sg                                               │
│                 Inbound:                                                                        │
│                   - TCP 80   ONLY from cloudscale-alb-sg                                        │
│                   - TCP 8080 ONLY from cloudscale-alb-sg                                        │
│                   - TCP 22   from My IP (Bastion / SSH Admin)                                   │
│                 IAM Role: CloudScale-EC2-ASG-Role (No static credentials stored on disk)        │
│                                                                                                 │
│   ┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐   │
│   │ EC2 Instance: ap-south-1a (Subnet 1)    │     │ EC2 Instance: ap-south-1b (Subnet 2)    │   │
│   │ • Frontend App (Port 3000)              │     │ • Frontend App (Port 3000)              │   │
│   │ • Node.js Backend API (Port 5000)       │     │ • Node.js Backend API (Port 5000)       │   │
│   │ • Stress Generator Engine               │     │ • Stress Generator Engine               │   │
│   │ • Mount: /mnt/efs/data                  │     │ • Mount: /mnt/efs/data                  │   │
│   └────────────────────┬────────────────────┘     └────────────────────┬────────────────────┘   │
└────────────────────────┼───────────────────────────────────────────────┼────────────────────────┘
                         │                                               │
                         │ NFS Port 2049 (SG: cloudscale-efs-sg)         │ NFS Port 2049
                         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          AMAZON EFS (ELASTIC FILE SYSTEM)                                       │
│                          Shared logs, persistent media, and cluster state                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Comprehensive AWS Services Catalog

| AWS Service | Exact Project Role | Free Tier / Cost Optimization Details |
| :--- | :--- | :--- |
| **Amazon VPC** | Provides an isolated software-defined network with private and public CIDR ranges. | Free. No charge for VPC, subnets, route tables, or Internet Gateways. |
| **Amazon EC2** | Compute instances (`t3.micro` or `t2.micro`) running containerized frontend, backend, and stress workers. | Free Tier includes 750 hours/month of `t2.micro` or `t3.micro`. |
| **Auto Scaling Group (ASG)** | Automatically manages EC2 fleet size (Min: 2, Desired: 2, Max: 6) in response to health checks and CloudWatch alarms. | Free service. You only pay for the underlying EC2 compute nodes launched. |
| **Application Load Balancer (ALB)** | Distributes incoming HTTP requests across healthy EC2 targets in multiple AZs on port 80 and 8080. | Free Tier includes 750 hours/month of shared load balancer + 15 LCU hours. |
| **Amazon CloudWatch** | Monitors aggregate CPU utilization and request rates; triggers scale-out and scale-in alarms. | 10 free custom metrics and 10 alarms included in AWS Free Tier. |
| **Amazon EFS** | Network-attached POSIX-compliant shared file system mounted simultaneously by all EC2 instances. | 5 GB of standard storage free per month for 12 months. |
| **AWS IAM** | Identity management granting least-privilege EC2 Instance Profiles for Auto Scaling and CloudWatch access. | Completely free service. |
| **Amazon Route 53 (Optional)** | Managed DNS service mapping custom domains to the ALB DNS name. | ~$0.50/month per hosted zone (can use ALB direct DNS if domain is unavailable). |
| **Amazon Linux AMI** | Base operating system image customized with Docker and Node.js to create the Golden AMI. | Included with EC2. |

---

## 5. AWS Account & Prerequisites Setup

### 5.1 Account Requirements
1. **Active AWS Account**: Ensure credit card verification is complete.
2. **AWS Region Selection**: Select `ap-south-1` (Mumbai) or `us-east-1` (N. Virginia). *This guide defaults to `ap-south-1` (Mumbai).*
3. **IAM Admin User**: Do NOT use the AWS Root account for day-to-day work. Create an IAM user named `cloudscale-admin` with `AdministratorAccess`.
4. **Billing Alert Setup**:
   - In AWS Console ➔ Search **Billing and Cost Management**.
   - Navigate to **Budgets** ➔ Click **Create budget** ➔ Select **Zero spend budget** or set a threshold of **$5.00 USD**.
   - Enter your email address to receive immediate warning if free tier is exceeded.

### 5.2 Local Development Machine Prerequisites
Install the following tools on your local Windows/Linux/Mac workstation:
- **Git**: `git --version`
- **Node.js**: `node -v` (v18.x or v20.x LTS)
- **Docker Desktop**: `docker --version` and `docker compose version`
- **AWS CLI v2**:
  ```powershell
  # Check if installed
  aws --version
  ```
  If not installed, download from [AWS CLI Official Installer](https://aws.cli.amazonaws.com/AWSCLIV2.msi).

Configure your AWS CLI locally:
```bash
aws configure
# AWS Access Key ID [None]: <YOUR_IAM_USER_ACCESS_KEY>
# AWS Secret Access Key [None]: <YOUR_IAM_USER_SECRET_KEY>
# Default region name [None]: ap-south-1
# Default output format [None]: json
```

---

## 6. Identity & Access Management (IAM): Roles, Policies & Permissions

### 6.1 Why IAM Roles Matter for CloudScale
Instead of hardcoding AWS secret keys inside `.env` files or committing them to GitHub (a major security violation), CloudScale utilizes an **IAM Instance Profile**. When an EC2 instance launches, AWS STS automatically provides temporary credentials to the Node.js backend to query CloudWatch metrics and adjust Auto Scaling capacity.

### 6.2 IAM Role: `CloudScale-EC2-Instance-Role`
- **Entity Type**: AWS Service
- **Use Case**: EC2
- **Instance Profile Name**: `CloudScale-EC2-Instance-Profile`

#### Trust Relationship Policy Document (`TrustPolicy.json`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### Custom Inline / Managed Policy: `CloudScale-Backend-Policy` (`BackendPolicy.json`):
This policy grants the backend running on EC2 the precise permissions required to read and modify Auto Scaling, fetch CloudWatch telemetry, and read EC2 instance metadata:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AutoScalingTelemetryAndManagement",
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:SetDesiredCapacity"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchMetricsAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2MetadataAndDescribe",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeTargetGroups",
        "ec2:DescribeTargetHealth"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ElasticFileSystemMountAccess",
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:DescribeFileSystems",
        "elasticfilesystem:DescribeMountTargets",
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite"
      ],
      "Resource": "*"
    }
  ]
}
```

### 6.3 CLI Creation of IAM Role and Profile
```bash
# 1. Create the IAM Role
aws iam create-role \
  --role-name CloudScale-EC2-Instance-Role \
  --assume-role-policy-document file://TrustPolicy.json

# 2. Attach the Permissions Policy
aws iam put-role-policy \
  --role-name CloudScale-EC2-Instance-Role \
  --policy-name CloudScale-Backend-Policy \
  --policy-document file://BackendPolicy.json

# 3. Create the Instance Profile and Add the Role
aws iam create-instance-profile \
  --instance-profile-name CloudScale-EC2-Instance-Profile

aws iam add-role-to-instance-profile \
  --instance-profile-name CloudScale-EC2-Instance-Profile \
  --role-name CloudScale-EC2-Instance-Role
```

---

## 7. VPC Networking Architecture

### 7.1 Networking Parameters & Subnet Allocation

| Network Component | Identifier / Name | CIDR Block | Availability Zone | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **VPC** | `cloudscale-vpc` | `10.0.0.0/16` | Multi-AZ | Isolated software-defined cloud network (65,536 IPs). |
| **Public Subnet 1** | `cloudscale-pub-sub-1` | `10.0.1.0/24` | `ap-south-1a` | Hosts ALB Node A, Bastion/SSH access, and NAT gateway (256 IPs). |
| **Public Subnet 2** | `cloudscale-pub-sub-2` | `10.0.2.0/24` | `ap-south-1b` | Hosts ALB Node B (Required for ALB Multi-AZ redundancy). |
| **Private Subnet 1** | `cloudscale-priv-sub-1` | `10.0.10.0/24` | `ap-south-1a` | Primary compute subnet for EC2 Auto Scaling fleet and EFS mount point. |
| **Private Subnet 2** | `cloudscale-priv-sub-2` | `10.0.20.0/24` | `ap-south-1b` | Secondary compute subnet for EC2 Auto Scaling fleet and EFS mount point. |
| **Internet Gateway** | `cloudscale-igw` | `N/A` | Regional | Provides bidirectional internet communication for public subnets. |

*(Note: In AWS Free Tier, to avoid the ~$32/month cost of a NAT Gateway, you can deploy your EC2 instances in Public Subnet 1 & Public Subnet 2 with Auto-assign Public IP enabled, while strictly locking down access via Security Groups).*

### 7.2 Route Tables Configuration

1. **Public Route Table (`cloudscale-public-rt`)**:
   - Destination: `10.0.0.0/16` ➔ Target: `local`
   - Destination: `0.0.0.0/0` ➔ Target: `cloudscale-igw`
   - Subnet Associations: `cloudscale-pub-sub-1`, `cloudscale-pub-sub-2`

2. **Private Route Table (`cloudscale-private-rt`)**:
   - Destination: `10.0.0.0/16` ➔ Target: `local`
   - Destination: `0.0.0.0/0` ➔ Target: NAT Gateway (or IGW if running in free-tier public subnet setup)
   - Subnet Associations: `cloudscale-priv-sub-1`, `cloudscale-priv-sub-2`

### 7.3 Security Groups Specification (Security Group Chaining)

#### Security Group 1: `cloudscale-alb-sg` (ALB Ingress)
- **Description**: Allows public internet access to ports 80 and 8080.
- **Inbound Rules**:
  - `HTTP` | Port `80` | Protocol `TCP` | Source: `0.0.0.0/0` (Public Web)
  - `Custom TCP` | Port `8080` | Protocol `TCP` | Source: `0.0.0.0/0` (or restricted to your college/home IP)
- **Outbound Rules**:
  - All Traffic | All Ports | Destination: `0.0.0.0/0`

#### Security Group 2: `cloudscale-ec2-sg` (Compute Nodes)
- **Description**: Strict ingress allowed ONLY from the Application Load Balancer.
- **Inbound Rules**:
  - `Custom TCP` | Port `80` | Source: Select `cloudscale-alb-sg` (Security Group ID reference)
  - `Custom TCP` | Port `8080` | Source: Select `cloudscale-alb-sg` (Security Group ID reference)
  - `Custom TCP` | Port `5000` | Source: Select `cloudscale-alb-sg` (Optional backend direct check)
  - `SSH` | Port `22` | Source: `My IP` (For debugging & base server setup)
- **Outbound Rules**:
  - All Traffic | All Ports | Destination: `0.0.0.0/0` (Allows downloading packages & CloudWatch telemetry)

#### Security Group 3: `cloudscale-efs-sg` (Shared Storage)
- **Description**: Allows NFS network file system storage access from EC2 compute nodes.
- **Inbound Rules**:
  - `NFS` | Port `2049` | Protocol `TCP` | Source: Select `cloudscale-ec2-sg`
- **Outbound Rules**:
  - All Traffic | All Ports | Destination: `0.0.0.0/0`

---

## 8. Amazon EFS: Shared Storage Configuration & Mount Automation

### 8.1 Why EFS is Critical for Academic/Viva Defense
When EC2 instances scale out (e.g., from 2 to 4) and scale in (back to 2), any local disk files created on a terminated instance are destroyed permanently. Amazon Elastic File System (EFS) provides an elastic, shared POSIX file system mounted simultaneously by all running EC2 instances over NFS (Port 2049). This guarantees:
1. Shared persistent storage for application logs.
2. Synchronized file uploads between Website 1 and Website 2 regardless of which instance handled the request.
3. Proof of enterprise stateless compute design to project evaluators.

### 8.2 Step-by-Step EFS Creation in AWS Console
1. Open AWS Console ➔ Search **EFS** ➔ Click **Create file system**.
2. Click **Customize**.
3. **Name**: `cloudscale-efs`.
4. **Storage class**: Standard (Multi-AZ).
5. **Encryption**: Enable encryption at rest (default AWS KMS key).
6. Click **Next** to Network Settings:
   - **VPC**: Select `cloudscale-vpc`.
   - **Mount targets**:
     - Subnet 1 (`ap-south-1a`): Select `cloudscale-priv-sub-1` (or pub-sub-1). Security Group: Replace default with `cloudscale-efs-sg`.
     - Subnet 2 (`ap-south-1b`): Select `cloudscale-priv-sub-2` (or pub-sub-2). Security Group: Replace default with `cloudscale-efs-sg`.
7. Click **Next** ➔ **Next** ➔ **Create**.
8. Note down your **File System ID** (e.g., `fs-0123456789abcdef0`).

### 8.3 EFS Mount Command (Embedded in Launch Template UserData)
```bash
sudo mkdir -p /mnt/efs/data
sudo yum install -y amazon-efs-utils
# Mount using EFS DNS
sudo mount -t efs -o tls <FILE_SYSTEM_ID>:/ /mnt/efs/data
# Add to /etc/fstab for automatic remounting on boot:
echo "<FILE_SYSTEM_ID>:/ /mnt/efs/data efs _netdev,tls 0 0" | sudo tee -a /etc/fstab
```

---

## 9. Base EC2 Instance Setup & Configuration

To create our **Golden AMI** (pre-baked image), we first launch a single standalone base EC2 instance to configure the runtime environment.

### 9.1 Base Instance Launch Parameters
- **Instance Name**: `CloudScale-Base-Setup-Server`
- **AMI**: Amazon Linux 2023 AMI (64-bit x86)
- **Instance Type**: `t3.micro` (or `t2.micro`)
- **Key Pair**: Create a key pair named `cloudscale-key.pem` and download it.
- **Network**:
  - VPC: `cloudscale-vpc`
  - Subnet: `cloudscale-pub-sub-1`
  - Auto-assign Public IP: `Enable`
  - Security Group: Select `cloudscale-ec2-sg` (ensure Port 22 is open to your IP)
- **IAM Instance Profile**: Attach `CloudScale-EC2-Instance-Profile`
- Click **Launch Instance**.

### 9.2 SSH Connection & Package Installation
Open PowerShell or your terminal:
```bash
chmod 400 cloudscale-key.pem   # Linux/macOS only
ssh -i "cloudscale-key.pem" ec2-user@<EC2_PUBLIC_IP>
```

Run the base provisioning commands:
```bash
# 1. Update OS packages
sudo yum update -y

# 2. Install Git, Docker, and EFS Utilities
sudo yum install -y git docker amazon-efs-utils

# 3. Start and enable Docker daemon
sudo systemctl enable docker
sudo systemctl start docker

# 4. Add ec2-user to docker group to run docker without sudo
sudo usermod -aG docker ec2-user
newgrp docker

# 5. Install Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 6. Verify installations
docker --version
docker compose version
```

---

## 10. Website 1 & Backend Deployment

### 10.1 Clone and Build Application on Base EC2
```bash
cd /home/ec2-user
git clone https://github.com/nayka-mihir/CloudScale.git
cd CloudScale

# Check directory structure
ls -la
```

### 10.2 Configure Environment Variables
Create or verify the production `.env` in `/home/ec2-user/CloudScale/backend/.env`:
```ini
PORT=5000
NODE_ENV=production
AWS_REGION=ap-south-1
AWS_ASG_NAME=cloudscale-asg
SIMULATE_AWS=false
EFS_STORAGE_PATH=/mnt/efs/data
```

### 10.3 Build and Launch Docker Containers
```bash
cd /home/ec2-user/CloudScale/docker
docker compose up -d --build
```

### 10.4 Verify Container Health Locally
```bash
# Check running containers
docker ps

# Expected output:
# CONTAINER ID   IMAGE                     COMMAND                  PORTS                                            NAMES
# a1b2c3d4e5     docker-frontend           "/docker-entrypoint.…"   0.0.0.0:80->80/tcp, 0.0.0.0:8080->8080/tcp       cloudscale-frontend
# f6g7h8i9j0     docker-backend            "docker-entrypoint.s…"   0.0.0.0:5000->5000/tcp                           cloudscale-backend

# Test API health locally:
curl http://localhost:5000/api/health
# Response: {"status":"healthy","uptime":...,"timestamp":...}

# Test Website 1:
curl -I http://localhost:80
# Response: HTTP/1.1 200 OK

# Test Website 2:
curl -I http://localhost:8080
# Response: HTTP/1.1 200 OK
```

---

## 11. Website 2: Control/Management Website & AWS Integration Flow

### 11.1 Control Website Architecture
Website 2 serves as the administrative mission-control center for the cluster. It exposes:
1. **Cluster Capacity Counters**: Desired, Minimum, and Maximum instances.
2. **Dynamic Live Gauges**: Real-time CPU utilization gauge showing average CPU across the ASG.
3. **Instance Fleet Table**: Displays each active EC2 node, its internal IP, Availability Zone (`ap-south-1a` vs `ap-south-1b`), health status, and uptime.
4. **Interactive Cloud Trigger Controls**:
   - `[Scale Capacity +1]`: Directly triggers the Auto Scaling API.
   - `[Scale Capacity -1]`: Decrements desired capacity down to minimum baseline.
   - `[Start Load Test]`: Invokes backend stress worker to spike CPU.
   - `[Stop Load Test]`: Releases computational load.

### 11.2 How Website 2 Communicates with AWS Services

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Browser Client: Website Admin Dashboard                                 │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP POST /api/scaling/increase
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Express.js Backend API Container (Port 5000)                            │
│  Handles controller request in `infrastructureController.js`             │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ Invokes `awsService.scaleUp()`
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  AWS SDK for JavaScript v3 (`@aws-sdk/client-auto-scaling`)             │
│  Queries AWS EC2 Instance Metadata Service (IMDSv2) for IAM Role Tokens  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ Signed SigV4 AWS API Call
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  AWS Auto Scaling Group Service (`ap-south-1`)                           │
│  Executes `SetDesiredCapacityCommand({ DesiredCapacity: N + 1 })`        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 12. CPU Stress / Scaling Mechanism & IAM Permissions

### 12.1 CPU Stress Generation Mechanism
To demonstrate authentic horizontal auto-scaling to an evaluator without running complex external load-generation software, the backend includes an in-process computational stress generator:

- **Endpoint**: `POST /api/stress/start`
- **Mechanism**: The backend initiates an asynchronous worker loop that calculates prime numbers or hash matrices in memory.
- **Effect**: Compute consumption rapidly pushes instance vCPU utilization to 85–95%.
- **CloudWatch Reaction**: AWS CloudWatch evaluates the metric `AWS/EC2/CPUUtilization` over a 1-minute period. As the average exceeds 70%, CloudWatch sounds the alarm and triggers the ASG Scale-Out policy.
- **Cooling Down**: Calling `POST /api/stress/stop` clears the loop, CPU drops back to 5–15%, and CloudWatch triggers scale-in after the stabilization period.

### 12.2 IAM Permissions Required for This Mechanism
The EC2 instance role requires:
- `autoscaling:SetDesiredCapacity`
- `autoscaling:DescribeAutoScalingGroups`
- `cloudwatch:GetMetricData`
- `ec2:DescribeInstances`

---

## 13. Golden AMI Creation

### 13.1 Why Create a Golden AMI?
In standard deployments, launching a raw EC2 instance requires running `yum install`, cloning git repositories, and building Docker containers on every single auto-scaling event. This causes a slow boot time (5 to 8 minutes per new instance).
By creating a **Golden AMI**, the operating system, Docker daemon, cloned repository, and built Docker images are **pre-baked onto the EBS snapshot**. A newly launched auto-scaled instance becomes healthy and ready to take traffic in **under 45 seconds**!

### 13.2 Automated Systemd Service Configuration
Before taking the AMI snapshot, configure a systemd service to ensure Docker and our CloudScale containers automatically start whenever AWS Auto Scaling launches an instance:

On the base EC2 terminal:
```bash
sudo bash -c 'cat <<EOF > /etc/systemd/system/cloudscale.service
[Unit]
Description=CloudScale Multi-Container Auto-Start
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/CloudScale/docker
ExecStart=/usr/local/lib/docker/cli-plugins/docker-compose up -d
ExecStop=/usr/local/lib/docker/cli-plugins/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF'

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable cloudscale.service
```

### 13.3 Clean Up Temporary Artifacts
```bash
# Clean bash history and temporary files
sudo rm -rf /tmp/*
history -c
```

### 13.4 Create AMI in AWS Console
1. In the **AWS Console** ➔ Navigate to **EC2** ➔ **Instances**.
2. Select `CloudScale-Base-Setup-Server`.
3. Click **Actions** ➔ **Image and templates** ➔ **Create image**.
4. **Image name**: `CloudScale-Golden-AMI-v1`.
5. **Image description**: `Production AMI with Docker, Node.js and CloudScale pre-installed`.
6. Leave block device mapping at default (8 GB or 20 GB gp3).
7. Click **Create image**.
8. Navigate to **AMIs** in the left menu. Wait until the status transitions from `pending` to **`available`** (approx. 2–4 minutes).
9. Note your **AMI ID** (e.g., `ami-0a1b2c3d4e5f67890`).

*(Once the AMI is available, you can STOP or terminate the base setup server to save costs).*

---

## 14. Target Groups & Application Load Balancer (ALB)

### 14.1 Target Group 1: Public Website (`tg-cloudscale-80`)
1. Go to **EC2 Console** ➔ **Target Groups** ➔ Click **Create target group**.
2. **Target type**: `Instances`.
3. **Target group name**: `tg-cloudscale-80`.
4. **Protocol**: `HTTP`, **Port**: `80`.
5. **IP address type**: `IPv4`.
6. **VPC**: Select `cloudscale-vpc`.
7. **Protocol version**: `HTTP1`.
8. **Health checks**:
   - **Health check protocol**: `HTTP`
   - **Health check path**: `/api/health`
   - **Advanced health check settings**:
     - Port: `Traffic port`
     - Healthy threshold: `2` (consecutive successful checks)
     - Unhealthy threshold: `2` (consecutive failed checks)
     - Timeout: `5` seconds
     - Interval: `15` seconds
     - Success codes: `200`
9. Click **Next** ➔ Do **not** manually register instances (ASG will register them) ➔ Click **Create target group**.

### 14.2 Target Group 2: Admin Dashboard (`tg-cloudscale-8080`)
1. Click **Create target group**.
2. **Target type**: `Instances`.
3. **Target group name**: `tg-cloudscale-8080`.
4. **Protocol**: `HTTP`, **Port**: `8080`.
5. **VPC**: Select `cloudscale-vpc`.
6. **Health checks**:
   - Path: `/api/health`
   - Interval: `15` seconds, Healthy threshold: `2`, Timeout: `5` seconds.
7. Click **Next** ➔ Click **Create target group**.

### 14.3 Create the Application Load Balancer
1. Go to **EC2 Console** ➔ **Load Balancers** ➔ Click **Create load balancer**.
2. Under **Application Load Balancer**, click **Create**.
3. **Basic configuration**:
   - **Load balancer name**: `cloudscale-alb`
   - **Scheme**: `Internet-facing`
   - **IP address type**: `IPv4`
4. **Network mapping**:
   - **VPC**: Select `cloudscale-vpc`
   - **Mappings (Subnets)**: Select at least two Availability Zones:
     - `ap-south-1a`: Select `cloudscale-pub-sub-1`
     - `ap-south-1b`: Select `cloudscale-pub-sub-2`
5. **Security groups**:
   - Deselect default.
   - Select `cloudscale-alb-sg`.
6. **Listeners and routing**:
   - **Listener 1**: Protocol `HTTP`, Port `80` ➔ Default action: Forward to `tg-cloudscale-80`.
   - Click **Add listener**.
   - **Listener 2**: Protocol `HTTP`, Port `8080` ➔ Default action: Forward to `tg-cloudscale-8080`.
7. Click **Create load balancer**.
8. Wait 2 minutes until State changes from `Provisioning` to **`Active`**.
9. Copy the **DNS name** (e.g., `cloudscale-alb-123456789.ap-south-1.elb.amazonaws.com`).

---

## 15. EC2 Launch Template

The Launch Template defines the exact specification for every instance launched dynamically by the Auto Scaling Group.

### 15.1 Step-by-Step Launch Template Setup
1. Go to **EC2 Console** ➔ **Launch Templates** ➔ Click **Create launch template**.
2. **Launch template name**: `cloudscale-launch-template`.
3. **Template version description**: `v1 - Golden AMI with automated Docker startup`.
4. **Application and OS Images**:
   - Click **My AMIs** ➔ Select `CloudScale-Golden-AMI-v1`.
5. **Instance type**: Select `t3.micro` (or `t2.micro`).
6. **Key pair**: Select `cloudscale-key`.
7. **Network settings**:
   - Do NOT select a subnet here (ASG defines subnets).
   - **Security groups**: Select `cloudscale-ec2-sg`.
8. **Advanced details**:
   - **IAM instance profile**: Select `CloudScale-EC2-Instance-Profile`.
   - **Detailed CloudWatch monitoring**: `Enable` (allows 1-minute metric evaluation).
   - **User data** (paste the following script):

```bash
#!/bin/bash
# -----------------------------------------------------------
# CloudScale Automated Instance Initialization Script
# -----------------------------------------------------------
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting CloudScale Instance Bootstrap at $(date)"

# 1. Mount EFS if EFS ID is configured
EFS_ID="fs-0123456789abcdef0" # Replace with your EFS ID if using EFS
if [ "$EFS_ID" != "fs-0123456789abcdef0" ]; then
    mkdir -p /mnt/efs/data
    mount -t efs -o tls ${EFS_ID}:/ /mnt/efs/data
    echo "${EFS_ID}:/ /mnt/efs/data efs _netdev,tls 0 0" >> /etc/fstab
fi

# 2. Ensure Docker service is running
systemctl start docker

# 3. Pull latest code updates (optional) or launch pre-baked containers
cd /home/ec2-user/CloudScale/docker
/usr/local/lib/docker/cli-plugins/docker-compose up -d

echo "CloudScale Bootstrap completed successfully at $(date)"
```

9. Click **Create launch template**.

---

## 16. Auto Scaling Group (ASG) & Dynamic CloudWatch Scaling Policies

### 16.1 Create the Auto Scaling Group
1. Go to **EC2 Console** ➔ **Auto Scaling Groups** ➔ Click **Create Auto Scaling group**.
2. **Step 1: Choose launch template or configuration**:
   - **Auto Scaling group name**: `cloudscale-asg`
   - **Launch template**: Select `cloudscale-launch-template`. Version: `Default (Latest)`.
   - Click **Next**.
3. **Step 2: Choose instance launch options**:
   - **VPC**: Select `cloudscale-vpc`.
   - **Availability Zones and subnets**:
     - Select `cloudscale-priv-sub-1` (or `cloudscale-pub-sub-1` in Free Tier).
     - Select `cloudscale-priv-sub-2` (or `cloudscale-pub-sub-2` in Free Tier).
   - Click **Next**.
4. **Step 3: Configure advanced options**:
   - **Load balancing**: Select **Attach to an existing load balancer**.
   - Select **Choose from your load balancer target groups**.
   - Add both target groups:
     - `tg-cloudscale-80`
     - `tg-cloudscale-8080`
   - **Health checks**:
     - Check **Turn on Elastic Load Balancing health checks**.
     - **Health check grace period**: `180` seconds.
   - Click **Next**.
5. **Step 4: Configure group size and scaling policies**:
   - **Group size**:
     - **Desired capacity**: `2`
     - **Minimum capacity**: `2`
     - **Maximum capacity**: `6`
   - **Scaling policies**: Select **Target tracking scaling policy**.
     - **Scaling policy name**: `cloudscale-cpu-target-tracking`
     - **Metric type**: `Average CPU utilization`
     - **Target value**: `70`
     - **Instance warmup**: `180` seconds
   - Click **Next**.
6. **Step 5: Notifications & Tags**:
   - Tag key: `Name`, Value: `CloudScale-Cluster-Node` (Enable "Tag new instances").
7. Click **Create Auto Scaling group**.

### 16.2 Verification of Baseline ASG Fleet
Within 2 minutes:
- Navigate to **EC2 Instances**: Notice 2 new instances automatically launched named `CloudScale-Cluster-Node`, one in `ap-south-1a` and one in `ap-south-1b`.
- Navigate to **Target Groups** ➔ `tg-cloudscale-80` ➔ **Targets**: Both instances show as **`Healthy`**.

---

## 17. Route 53 & DNS Routing Architecture

### 17.1 Architecture Flow
If you have a domain (e.g., `yourdomain.com`), configure Amazon Route 53 to point user traffic to the ALB.

### 17.2 Route 53 Record Configuration
1. Open **Route 53 Console** ➔ **Hosted zones** ➔ Select your domain.
2. Click **Create record**:
   - **Record name**: `cloudscale` (creates `cloudscale.yourdomain.com` for Website 1).
   - **Record type**: `A - Routes traffic to an IPv4 address and some AWS resources`.
   - Toggle **Alias**: `ON`.
   - **Route traffic to**:
     - Choose endpoint: `Alias to Application and Classic Load Balancer`.
     - Region: `ap-south-1`.
     - Load Balancer: Select `cloudscale-alb`.
   - **Routing policy**: `Simple routing`.
   - Click **Create records**.
3. Create record for Admin Control Plane:
   - **Record name**: `admin-cloudscale` (creates `admin-cloudscale.yourdomain.com`).
   - Alias to `cloudscale-alb`.
   - Listen on Port 8080 (or use ALB path routing rules to map `admin.yourdomain.com` directly to `tg-cloudscale-8080`).

*(If testing without a custom domain, simply access the ALB directly via its AWS DNS name: `http://<ALB_DNS_NAME>:80` and `http://<ALB_DNS_NAME>:8080`).*

---

## 18. CloudWatch Monitoring, Alarms & Metrics Dashboard

### 18.1 Key CloudWatch Metrics Monitored

| Metric Name | Namespace | Dimensions | Target Threshold |
| :--- | :--- | :--- | :--- |
| `CPUUtilization` | `AWS/EC2` | `AutoScalingGroupName = cloudscale-asg` | Scale Out if > 70%; Scale In if < 30% |
| `HealthyHostCount` | `AWS/ApplicationELB` | `TargetGroup = tg-cloudscale-80` | Min 2 healthy targets required |
| `RequestCount` | `AWS/ApplicationELB` | `LoadBalancer = cloudscale-alb` | Monitor real-time throughput spikes |
| `TargetResponseTime` | `AWS/ApplicationELB` | `TargetGroup = tg-cloudscale-80` | Alert if p95 response time > 1.5s |

### 18.2 Creating a Custom CloudWatch Dashboard
1. Open **CloudWatch Console** ➔ **Dashboards** ➔ Click **Create dashboard**.
2. **Dashboard name**: `CloudScale-Live-Telemetry`.
3. Add **Line Widget**:
   - Select `AWS/EC2` ➔ `By Auto Scaling Group` ➔ `cloudscale-asg` ➔ `CPUUtilization`.
   - Graph Period: `1 minute`.
4. Add **Number Widget**:
   - Select `AWS/ApplicationELB` ➔ `HealthyHostCount`.
5. Add **Line Widget**:
   - Select `AWS/ApplicationELB` ➔ `RequestCount`.
6. Click **Save dashboard**.

---

## 19. End-to-End Security Architecture

### 19.1 Defense-in-Depth Implementation

```
[Layer 1: Edge & DNS]      Route 53 / AWS Shield Standard (Free DDoS mitigation)
                                     │
[Layer 2: Perimeter]       ALB Security Group (Only ports 80 and 8080 open to public)
                                     │
[Layer 3: Network Seg]     VPC Private Subnets (EC2 instances have no public IPs)
                                     │
[Layer 4: Compute Firewall] EC2 Security Group (Accepts connections ONLY from ALB SG)
                                     │
[Layer 5: IAM Identity]    IAM Instance Profile (No AWS credentials stored in code)
                                     │
[Layer 6: Storage]         EFS encrypted at rest with AWS KMS (AES-256)
```

### 19.2 Security Checklist
- [x] No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` committed to Git.
- [x] SSH Port 22 closed to the public internet (`0.0.0.0/0`); restricted to Admin IP or handled via AWS Systems Manager (SSM).
- [x] Security Group Chaining: EC2 instances only accept traffic originating from the ALB Security Group.
- [x] IMDSv2 (Instance Metadata Service Version 2) enforced on Launch Template to prevent SSRF credential theft.

---

## 20. Step-by-Step Execution Guide: Console Click-by-Click + CLI Commands

### Phase A: Network & Security Setup
```bash
# 1. Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=cloudscale-vpc

# 2. Enable DNS Support & Hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# 3. Create Internet Gateway & Attach
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
aws ec2 create-tags --resources $IGW_ID --tags Key=Name,Value=cloudscale-igw

# 4. Create Public Subnet 1 (AZ a) & Public Subnet 2 (AZ b)
SUB1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone ap-south-1a --query 'Subnet.SubnetId' --output text)
SUB2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone ap-south-1b --query 'Subnet.SubnetId' --output text)
aws ec2 modify-subnet-attribute --subnet-id $SUB1_ID --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $SUB2_ID --map-public-ip-on-launch

# 5. Create Route Table & Associate
RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $SUB1_ID --route-table-id $RT_ID
aws ec2 associate-route-table --subnet-id $SUB2_ID --route-table-id $RT_ID
```

### Phase B: Security Groups Creation
```bash
# 1. Create ALB Security Group
ALB_SG=$(aws ec2 create-security-group --group-name cloudscale-alb-sg --description "ALB Public SG" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 8080 --cidr 0.0.0.0/0

# 2. Create EC2 Security Group (Chained to ALB SG)
EC2_SG=$(aws ec2 create-security-group --group-name cloudscale-ec2-sg --description "EC2 Private SG" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 80 --source-group $ALB_SG
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 8080 --source-group $ALB_SG
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 5000 --source-group $ALB_SG
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 22 --cidr $(curl -s https://checkip.amazonaws.com)/32
```

### Phase C: Target Groups and Load Balancer
```bash
# 1. Create Target Group for Port 80
TG80_ARN=$(aws elbv2 create-target-group \
  --name tg-cloudscale-80 \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --health-check-path /api/health \
  --health-check-interval-seconds 15 \
  --healthy-threshold-count 2 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# 2. Create Target Group for Port 8080
TG8080_ARN=$(aws elbv2 create-target-group \
  --name tg-cloudscale-8080 \
  --protocol HTTP \
  --port 8080 \
  --vpc-id $VPC_ID \
  --health-check-path /api/health \
  --health-check-interval-seconds 15 \
  --healthy-threshold-count 2 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# 3. Create Application Load Balancer
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name cloudscale-alb \
  --subnets $SUB1_ID $SUB2_ID \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# 4. Create ALB Listeners
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG80_ARN
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 8080 --default-actions Type=forward,TargetGroupArn=$TG8080_ARN
```

---

## 21. Systematic Failure-Testing Labs (Chaos Engineering)

To earn high distinction in an academic viva, you must demonstrate failure resilience under controlled fault injection.

### Lab 1: Multi-AZ Single-Node Chaos Termination
- **Objective**: Prove that terminating an active EC2 instance causes ZERO downtime for public visitors.
- **Action**:
  1. Open Website 1 in your browser: `http://<ALB-DNS-NAME>/`.
  2. Open terminal and run a continuous curl ping loop:
     ```bash
     while true; do curl -s -o /dev/null -w "%{http_code} - %{time_total}s\n" http://<ALB-DNS-NAME>/api/health; sleep 1; done
     ```
  3. In AWS EC2 Console, manually select one of the running instances in `cloudscale-asg` and click **Instance state** ➔ **Terminate instance**.
- **Expected Result**:
  - The curl loop continues returning `200 - 0.04s` without dropping a single packet.
  - The ALB detects target failure, marks it `Unhealthy`, and routes 100% of traffic to the surviving healthy instance in the other Availability Zone.
  - The ASG notices desired capacity is 2 but actual count is 1. It immediately provisions a brand new replacement instance!

### Lab 2: Availability Zone Outage Simulation
- **Objective**: Prove system survivability if an entire AWS data center fails.
- **Action**: Detach one subnet from the ASG or terminate all instances in `ap-south-1a`.
- **Expected Result**: ASG shifts capacity automatically to `ap-south-1b`.

---

## 22. "Demo to Your Professor" Presentation Script & Live Scaling Walkthrough

Follow this scripted 5-minute walkthrough during your project demonstration:

### Step 1: Show the Steady-State Baseline (1 Minute)
1. Open the **AWS Console** on screen: Show `cloudscale-asg` with **2 healthy instances** running across 2 different Availability Zones (`ap-south-1a` and `ap-south-1b`).
2. Show the **Target Groups** screen: Both instances display green **`Healthy`** status badges.
3. Open **Website 1** (`http://<ALB-DNS-NAME>/`):
   - *"Professor, this is our customer-facing public portal. As I refresh, the Application Load Balancer distributes requests alternately between our active nodes."*
4. Open **Website 2** (`http://<ALB-DNS-NAME>:8080/`):
   - *"And this is our Admin Control Dashboard. Notice the real-time cluster telemetry: Current Desired: 2, Active Instances: 2, Average CPU: ~25%."*

### Step 2: Trigger the Live Auto-Scaling Spike (2 Minutes)
1. On Website 2, click the **`[Start Load Test]`** button.
2. Watch the live **CPU Utilization Gauge** in the dashboard climb to **85–95%**.
3. Tell your professor:
   - *"By clicking this button, our backend stress engine is generating computational load on the instance vCPUs. CloudWatch monitors this metric every minute."*
4. Switch to AWS Console ➔ **CloudWatch Alarms**:
   - Show the alarm `TargetTracking-cloudscale-asg-AlarmHigh` switching to **`In alarm`** state.
5. Switch to **Auto Scaling Groups** ➔ **Activity tab**:
   - Point out the live activity log:
     > *"Triggering scale-out capacity. Launching a new EC2 instance in response to CloudWatch Alarm."*
6. Refresh the **EC2 Instances** list: Instance count increases from 2 ➔ 3 ➔ 4!

### Step 3: Demonstrate Automatic Scale-In & Cooldown (2 Minutes)
1. On Website 2, click **`[Stop Load Test]`**.
2. Show the CPU gauge dropping back down to **15%**.
3. Explain to your professor:
   - *"Now that user load has dropped below 30%, CloudWatch will evaluate the low threshold. Once the cooldown window elapses, the Auto Scaling Group gracefully terminates the unneeded instances to protect the organization against unnecessary cloud billing."*

---

## 23. Comprehensive Troubleshooting & Common Errors + Fixes

| Problem / Error Message | Root Cause | Exact Step-by-Step Fix |
| :--- | :--- | :--- |
| **ALB returns `502 Bad Gateway`** | Containers are not running or port 80/8080 is blocked by EC2 Security Group. | 1. SSH into instance and run `docker ps` to verify containers are running.<br>2. Verify `cloudscale-ec2-sg` allows ports 80 & 8080 from `cloudscale-alb-sg`. |
| **Target Group shows `Unhealthy` (Status 404 or Timeout)** | Health check path `/api/health` is returning non-200 or backend crashed. | 1. Check health check path in Target Group settings (must be `/api/health`, not `/`).<br>2. Run `curl http://localhost:5000/api/health` inside instance.<br>3. Verify backend container logs: `docker logs cloudscale-backend`. |
| **ASG does not scale out despite clicking Load Test** | Target Tracking warm-up period is active or metric evaluation period has not elapsed (CloudWatch standard evaluation is 1-3 mins). | 1. Enable **Detailed Monitoring** on the Launch Template.<br>2. Verify CloudWatch Alarm threshold is set to 70% with 1-minute period.<br>3. Verify IAM Instance Profile has `autoscaling:SetDesiredCapacity`. |
| **Website 2 shows "Failed to load AWS telemetry"** | EC2 instance cannot contact AWS API because it lacks an IAM Instance Profile or VPC has no internet access. | 1. Attach `CloudScale-EC2-Instance-Profile` to the EC2 instances.<br>2. In `backend/.env`, set `SIMULATE_AWS=true` if testing offline/locally, or ensure instance has outbound internet access to AWS endpoints. |
| **Docker containers do not start on auto-scaled instance** | Systemd service was not enabled on Golden AMI before image creation. | Add explicit startup command to the Launch Template **User data** script:<br>`cd /home/ec2-user/CloudScale/docker && docker compose up -d`. |
| **`Permission Denied` when mounting EFS** | Security Group `cloudscale-efs-sg` is missing NFS inbound rule from `cloudscale-ec2-sg`. | Go to **Security Groups** ➔ `cloudscale-efs-sg` ➔ Add Inbound Rule: `Type: NFS`, `Port: 2049`, `Source: cloudscale-ec2-sg`. |

---

## 24. Project Directory Structure & Code Manifest

```
AwsCloudScal/
├── backend/
│   ├── src/
│   │   ├── app.js                     # Express app configuration & middleware
│   │   ├── server.js                  # Server bootstrap & port listener (5000)
│   │   ├── config/
│   │   │   └── awsConfig.js           # AWS SDK v3 client initialization
│   │   ├── controllers/
│   │   │   ├── healthController.js    # /api/health target check endpoint
│   │   │   ├── infrastructureController.js # Real AWS ASG & CloudWatch controllers
│   │   │   └── metricsController.js   # Telemetry, stress triggers & contact API
│   │   ├── middleware/
│   │   │   └── errorHandler.js        # Global exception handling
│   │   ├── routes/
│   │   │   ├── healthRoutes.js        # Health check router
│   │   │   ├── infrastructureRoutes.js# CloudScale AWS management router
│   │   │   └── metricsRoutes.js       # Stress testing & metrics router
│   │   └── services/
│   │       ├── awsService.js          # AWS SDK v3 Auto Scaling & CloudWatch logic
│   │       ├── instanceService.js     # EC2 metadata resolver
│   │       └── scalingService.js      # In-memory cluster simulator & stress worker
│   ├── .env.example                   # Environment configuration template
│   ├── Dockerfile                     # Multi-stage production Node.js container
│   └── package.json                   # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root React router & state provider
│   │   ├── main.jsx                   # React DOM entry point
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Navigation bar with port/website toggle
│   │   │   ├── Footer.jsx             # Footer with system uptime & AWS badge
│   │   │   ├── ArchitectureDiagram.jsx# Interactive multi-AZ SVG diagram
│   │   │   ├── CpuGauge.jsx           # Animated radial CPU utilization meter
│   │   │   ├── MetricsBar.jsx         # Summary KPI cards (desired/healthy/CPU)
│   │   │   ├── MetricsChart.jsx       # Recharts time-series CPU & request chart
│   │   │   └── InstanceTable.jsx      # Live EC2 instance fleet status table
│   │   └── pages/
│   │       ├── Home.jsx               # Website 1: Public landing page
│   │       ├── About.jsx              # Website 1: Architecture documentation
│   │       ├── Features.jsx           # Website 1: Cloud features matrix
│   │       ├── Contact.jsx            # Website 1: Live request generation form
│   │       └── AdminDashboard.jsx     # Website 2: Operational cockpit
│   ├── Dockerfile                     # Multi-stage Vite build + Node static server
│   └── package.json                   # Frontend dependencies
├── docker/
│   └── docker-compose.yml             # Local and production container orchestration
├── scripts/
│   └── stress-cpu.sh                  # Optional standalone bash stress script
├── AWS_DEPLOYMENT_PLAN.md             # High-level AWS deployment plan
├── WEBSITE_STRUCTURE.md               # Technical specification and requirements
└── MASTER_CLOUDSCALE_IMPLEMENTATION_AND_COLLEGE_GUIDE.md # This master document
```

---

## 25. Future Enhancements & Production Hardening

1. **Serverless Edge CDN (Amazon CloudFront)**: Place CloudFront in front of the ALB to cache static assets (React bundle, CSS, images) at 450+ global Edge Locations, offloading up to 80% of HTTP traffic from the EC2 cluster.
2. **Container Orchestration with Amazon ECS/EKS**: Migrate from standalone Docker Compose on EC2 to AWS Fargate (serverless container compute) or Amazon Elastic Kubernetes Service (EKS) using Horizontal Pod Autoscaler (HPA).
3. **Infrastructure as Code (Terraform / AWS CDK)**: Automate the entire provisioning of the VPC, ALB, ASG, and CloudWatch alarms using declarative Terraform HCL scripts for one-click environment replication.
4. **Database Integration with Amazon Aurora Multi-AZ**: Integrate an auto-scaling serverless database (Amazon Aurora Serverless v2) for enterprise data persistence with automated read-replica scaling.
5. **AWS WAF (Web Application Firewall)**: Attach AWS WAF to the ALB to protect Website 1 and Website 2 against SQL injection, cross-site scripting (XSS), and rate-limiting DDoS attacks.

---

## 26. Comprehensive Viva Voce / Technical Interview Questions & Answers

### Q1: What is the difference between Vertical Scaling (Scaling Up) and Horizontal Scaling (Scaling Out)?
**Answer**: 
- **Vertical Scaling (Scale Up)** means increasing the hardware specifications (CPU, RAM, Disk) of a single server (e.g., resizing from `t3.micro` to `t3.2xlarge`). It requires downtime/reboot, has a hard hardware ceiling, and creates a single point of failure.
- **Horizontal Scaling (Scale Out)** means adding more identical server instances in parallel behind a load balancer. It provides near-infinite scaling, enables zero downtime, and eliminates single points of failure. CloudScale demonstrates Horizontal Auto-Scaling.

### Q2: Why did you use an Application Load Balancer (ALB) instead of a Network Load Balancer (NLB)?
**Answer**:
- An **Application Load Balancer (ALB)** operates at **Layer 7 (Application Layer)** of the OSI model. It understands HTTP/HTTPS headers, paths, and ports. CloudScale relies on ALB features such as:
  1. Routing Port 80 to Website 1 and Port 8080 to Website 2.
  2. Health checks against a specific HTTP REST endpoint (`/api/health`).
- An **NLB** operates at **Layer 4 (Transport Layer)**; while extremely fast for TCP/UDP, it lacks Layer 7 content-based routing and deep HTTP health check evaluation.

### Q3: What is the purpose of the Target Group Health Check Grace Period?
**Answer**:
When a new EC2 instance launches in an Auto Scaling Group, it takes time to boot the operating system, mount EFS, start Docker, and launch the Node.js backend. The **Health Check Grace Period** (set to 180–300 seconds in CloudScale) instructs the ASG to ignore failed health checks during this startup window, preventing AWS from mistakenly terminating a healthy instance before its applications finish initializing.

### Q4: How does Security Group Chaining work in CloudScale?
**Answer**:
Instead of opening EC2 compute instances to the public internet (`0.0.0.0/0`), the EC2 Security Group (`cloudscale-ec2-sg`) specifies the ALB Security Group (`cloudscale-alb-sg`) as its ingress source. This guarantees that **only traffic that passes through the load balancer can physically reach our EC2 instances**. Any attempt by an external attacker to bypass the ALB and hit the EC2 IP directly is blocked at the hypervisor level.

### Q5: Why is IMDSv2 preferred over IMDSv1 on AWS EC2?
**Answer**:
The **Instance Metadata Service Version 2 (IMDSv2)** is a session-oriented authentication method designed to mitigate Server-Side Request Forgery (SSRF) vulnerabilities. Unlike IMDSv1 which allows simple HTTP GET requests to retrieve IAM role credentials, IMDSv2 requires creating a session token via `PUT /latest/api/token` with a `X-aws-ec2-metadata-token-ttl-seconds` header, preventing unauthorized proxying of credential endpoints.

### Q6: What is the role of Amazon EFS compared to Amazon EBS?
**Answer**:
- **Amazon EBS (Elastic Block Store)** is a block-level storage volume attached to a **single** EC2 instance at a time within a single Availability Zone.
- **Amazon EFS (Elastic File System)** is a managed, shared network file system (NFSv4) that can be mounted concurrently by **hundreds of EC2 instances across multiple Availability Zones**. CloudScale uses EFS to store shared logs and persistent application assets so that data survives instance terminations.

### Q7: Explain what an ASG Cooldown Period is and why it is critical.
**Answer**:
The **Cooldown Period** (typically 300 seconds) is a configurable pause after a scaling activity completes. It gives newly launched instances sufficient time to start handling real traffic and stabilize metric readings before CloudWatch evaluates further scaling actions. Without a cooldown period, the ASG could enter a state of **thrashing/oscillation** (rapid, uncontrolled launching and terminating of instances).

### Q8: What is a Golden AMI, and what advantages does it offer?
**Answer**:
A **Golden AMI** is a customized Amazon Machine Image that contains the base OS, software dependencies, runtime engines (Docker, Node.js), and application builds already pre-installed and configured. 
- **Advantage**: It drastically cuts instance spin-up time from 5–8 minutes down to under 45 seconds, allowing the Auto Scaling Group to react rapidly to unexpected traffic spikes.

### Q9: How does Website 2 securely execute AWS SDK commands without storing secret keys?
**Answer**:
Website 2's backend utilizes an **IAM Instance Profile** attached to the EC2 instances. The AWS SDK for JavaScript automatically retrieves rotating temporary security credentials (access key, secret key, session token) from the local EC2 Instance Metadata Service. This adheres to the AWS Well-Architected Security Pillar by eliminating static credentials from the codebase.

### Q10: What happens if an entire AWS Availability Zone experiences an outage?
**Answer**:
Because CloudScale's Application Load Balancer and Auto Scaling Group span two distinct Availability Zones (`ap-south-1a` and `ap-south-1b`), the ALB automatically detects that targets in the failing AZ are unhealthy and redirects 100% of user traffic to the surviving AZ. Simultaneously, the ASG launches replacement instances in the healthy AZ to restore the desired cluster capacity.

---

## 27. Roles & Responsibilities Matrix: "Who Writes / Executes What"

| Phase / Task | Responsible Role | Execution Location | Command / Action |
| :--- | :--- | :--- | :--- |
| **Phase 1: Code Development & Push** | Software Developer | Local Workstation | `git commit -am "..." && git push origin main` |
| **Phase 2: AWS IAM & VPC Provisioning** | Cloud Architect / DevOps | AWS CLI or Console | Run Phase A & B commands in Section 20 |
| **Phase 3: Base EC2 & Docker Build** | DevOps Engineer | Base EC2 SSH Shell | `cd CloudScale/docker && docker compose up -d` |
| **Phase 4: Golden AMI Creation** | Cloud Engineer | AWS EC2 Console | EC2 Console ➔ Actions ➔ Create Image |
| **Phase 5: ALB & Target Groups Setup** | Network / Cloud Engineer | AWS EC2 Console | Create Target Groups (`80`, `8080`) and ALB |
| **Phase 6: Launch Template & ASG** | DevOps Engineer | AWS EC2 Console | Create Launch Template with User Data + ASG |
| **Phase 7: CloudWatch & Scaling Policies**| Infrastructure Engineer | AWS CloudWatch Console| Configure Target Tracking CPU at 70% |
| **Phase 8: Live Evaluation & Demonstration**| Project Presenter / Student | Browser / Projector | Open Website 1 (Port 80) and Website 2 (Port 8080) and trigger `[Start Load Test]` |

---
*End of Master Implementation Guide. Keep this document in your project repository as `MASTER_CLOUDSCALE_IMPLEMENTATION_AND_COLLEGE_GUIDE.md`.*
