# CloudScale — Sequential Step-by-Step Working Execution Guide
## From Scratch to Fully Working Multi-AZ Auto-Scaling Cluster on AWS

> **How to use this guide:**
> Follow each step sequentially: **First create Step 0, then Step 1, Step 2, and so on until the end.**
> Every step tells you **WHERE** to do it, **WHO** does it, the **EXACT COMMANDS / CLICKS**, the **EXPECTED OUTPUT** to confirm it worked, and **FIXES** if you encounter an error.

---

## 📋 Table of Contents & Roadmap

1. [STEP 0: FIRST CREATE THIS (Prerequisites, Keys & IAM Role)](#step-0-first-create-this)
2. [STEP 1: Create VPC & Multi-AZ Networking Infrastructure](#step-1-create-vpc--multi-az-networking)
3. [STEP 2: Create Security Groups (Chained Firewall Rules)](#step-2-create-security-groups)
4. [STEP 3: Launch Base EC2 Instance (Base Setup Server)](#step-3-launch-base-ec2-instance)
5. [STEP 4: SSH into Base EC2 & Install Software (Docker, Git)](#step-4-install-software-on-base-instance)
6. [STEP 5: Deploy CloudScale Code & Launch Containers](#step-5-deploy-cloudscale-containers)
7. [STEP 6: Test & Verify Website 1, Website 2 & API on Base Instance](#step-6-test--verify-applications)
8. [STEP 7: Configure Auto-Start Service & Create Golden AMI](#step-7-create-the-golden-ami)
9. [STEP 8: Create Target Groups (Port 80 & Port 8080)](#step-8-create-target-groups)
10. [STEP 9: Create Application Load Balancer (ALB)](#step-9-create-application-load-balancer)
11. [STEP 10: Create EC2 Launch Template (with Automated User Data)](#step-10-create-launch-template)
12. [STEP 11: Create Auto Scaling Group (ASG) with Target Tracking](#step-11-create-auto-scaling-group)
13. [STEP 12: Verify Initial Baseline Fleet (2 Healthy Multi-AZ Instances)](#step-12-verify-baseline-fleet)
14. [STEP 13: Trigger Live CPU Stress Test & Observe Auto-Scaling Live](#step-13-trigger-live-auto-scaling)
15. [STEP 14: Stop Stress Test & Observe Cooldown & Scale-In](#step-14-observe-cooldown--scale-in)
16. [STEP 15: Chaos Engineering Lab (Kill Instance & Prove Zero Downtime)](#step-15-chaos-engineering-lab)
17. [STEP 16: How to Safely Pause / Terminate Resources to Save Costs](#step-16-cost-control--cleanup)
18. [STEP 17: Project Viva / Professor Demonstration Script](#step-17-professor-demo-script)

---

<a name="step-0-first-create-this"></a>
## 🚀 STEP 0: FIRST CREATE THIS (Prerequisites, Keys & IAM Role)

Before creating any cloud networks or servers, you **MUST** create your SSH Key Pair and your IAM Instance Profile so EC2 can talk to AWS services.

### 0.1: Create Root Multi-Stage Dockerfile & .dockerignore (Local Setup)
Before deploying or committing code, ensure you have the unified **production multi-stage Dockerfile** and `.dockerignore` created at your project root.

- **Where to create them**:
  ```
  d:\PROJECTS\AwsCloudScal\
  ├── Dockerfile         <-- Create file here (Root Level)
  ├── .dockerignore      <-- Create file here (Root Level)
  ├── backend/
  ├── frontend/
  └── docker/
  ```
- **Who**: You (Local Developer on Laptop / PC)

#### File 1: `d:\PROJECTS\AwsCloudScal\.dockerignore`
Create this file to prevent copying `node_modules` and local artifacts into Docker daemon:
```dockerignore
**/node_modules
**/dist
.git
.gitignore
.vscode
*.md
!README.md
**/.env
**/.env.*
```

#### File 2: `d:\PROJECTS\AwsCloudScal\Dockerfile`
Create this file in the project root to combine React (Stage 1) and Express (Stage 2) into a lean ~120 MB runner (Stage 3):
```dockerfile
# ==============================================================================
# CloudScale — Production Multi-Stage Dockerfile
# Serves both Public Website (Port 80) and Admin Cockpit (Port 8080) + API
# ==============================================================================

# STAGE 1: Build Frontend React SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# STAGE 2: Install Backend Production Dependencies
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# STAGE 3: Final Production Runner Image (~120 MB total)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV ADMIN_PORT=8080
ENV SIMULATE_AWS=true
ENV FRONTEND_DIST_PATH=/app/dist

# Copy backend dependencies & code
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy compiled React frontend assets
COPY --from=frontend-builder /app/frontend/dist ./dist

# Expose both AWS ALB Target Group ports
EXPOSE 80 8080

WORKDIR /app/backend
CMD ["node", "src/server.js"]
```
after this run this command for check or make a image and run container

docker build -t cloudscale-app:latest .

docker run -d \
  --name cloudscale \
  --restart unless-stopped \
  -p 80:80 \
  -p 8080:8080 \
  cloudscale-app:latest
---

### 0.2: Commit and Push Your Local Code to GitHub
- **Where**: Your local laptop/PC terminal (in `d:\PROJECTS\AwsCloudScal`)
- **Who**: You (Local Developer)
- **Command**:
  ```bash
  git add .
  git commit -m "Add production multi-stage Dockerfile and configurations"
  git push origin main
  ```
- **Expected Result**: Git outputs `Everything up-to-date` or lists pushed commits to `github.com/nayka-mihir/CloudScale.git`.



### 0.3: Create IAM Policy & EC2 Instance Profile
This allows the backend running on EC2 to query CloudWatch metrics and trigger Auto Scaling capacity without hardcoding secret keys.

- **Where**: AWS Console ➔ Search **IAM** ➔ Click **Roles**.
- **Who**: Cloud Admin

#### Step-by-Step Instructions:
1. Click **Create role**.
2. **Trusted entity type**: Select **AWS service**.
3. **Use case**: Select **EC2**. Click **Next**.
4. **Add permissions**: Click **Create policy** (opens a new tab).
5. In the new tab, switch to the **JSON** editor and paste the following policy:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
    		"Sid": "AutoScalingTelemetryAndControl",
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
        		"cloudwatch:DescribeAlarms",
        		"cloudwatch:ListMetrics"
    		],
			"Resource": "*"
		},
		{
    		"Sid": "EC2MetadataAccess",
    		"Effect": "Allow",
    		"Action": [
        		"ec2:DescribeInstances",
        		"ec2:DescribeAvailabilityZones"
    		],
    		"Resource": "*"
    	},
    	{
    		"Sid": "ELBTargetGroupAccess",
    		"Effect": "Allow",
    		"Action": [
        		"elasticloadbalancing:DescribeTargetGroups",
    			"elasticloadbalancing:DescribeTargetHealth"
    		],
    		"Resource": "*"
    	}
	]
}
```
6. Click **Next**. Name the policy: `CloudScale-Backend-Policy`.
7. Click **Create policy**. Close this browser tab.
8. Go back to the **Create role** tab. Click the **Refresh** button next to Filter policies.
9. Search for `CloudScale-Backend-Policy` and check the checkbox. Click **Next**.
10. **Role name**: `CloudScale-EC2-Instance-Role`
11. Click **Create role**.
- **Expected Result**: Role `CloudScale-EC2-Instance-Role` appears in IAM with `CloudScale-Backend-Policy` attached.

---


---

### 0.3.1: Create EC2 SSH Key Pair
- **Where**: AWS Console ➔ Search **EC2** ➔ Click **Key Pairs** (left sidebar under Network & Security).
- **Who**: Cloud Admin
- **Click-by-Click Instructions**:
  1. Click **Create key pair** (orange button top right).
  2. **Name**: `cloudscale-key`
  3. **Key pair type**: `RSA`
  4. **Private key file format**:
     - Select `.pem` (if using macOS, Linux, or Windows PowerShell/Git Bash).
     - Select `.ppk` (if using PuTTY).
  5. Click **Create key pair**.
  6. The file `cloudscale-key.pem` will automatically download to your Downloads folder. **Keep this file safe!**

---


<a name="step-1-create-vpc--multi-az-networking"></a>
## 🌐 STEP 1: Create VPC & Multi-AZ Networking

We need an isolated Virtual Private Cloud across two Availability Zones (`ap-south-1a` and `ap-south-1b`).

### 1.1: Create VPC
- **Where**: AWS Console ➔ Search **VPC** ➔ Click **Your VPCs** ➔ Click **Create VPC**.
- **Settings**:
  - Select: **VPC only**
  - **Name tag**: `cloudscale-vpc`
  - **IPv4 CIDR block**: `192.168.0.0/24`
  - Click **Create VPC**.
- **Enable DNS**:
  - Select your newly created `cloudscale-vpc`.
  - Click **Actions** ➔ **Edit VPC settings**.
  - Check **Enable DNS resolution** AND check **Enable DNS hostnames**.
  - Click **Save**.

### 1.2: Create Internet Gateway (IGW)
- **Where**: VPC Console ➔ **Internet Gateways** ➔ Click **Create internet gateway**.
- **Settings**:
  - **Name tag**: `cloudscale-iwg`
  - Click **Create internet gateway**.
- **Attach to VPC**:
  - Click **Actions** ➔ **Attach to VPC**.
  - Select `cloudscale-vpc` and click **Attach internet gateway**.
- **Expected Result**: State turns green: `Attached`.

### 1.3: Create Two Public Subnets (Multi-AZ)
- **Where**: VPC Console ➔ **Subnets** ➔ Click **Create subnet**.
- **Settings**:
  - **VPC ID**: Select `cloudscale-vpc`.
  - **Subnet 1**:
    - **Subnet name**: `cloudscale-pub-sub-1`
    - **Availability Zone**: Select `ap-south-1a` (or your region's first zone `us-east-1a`)
    - **IPv4 CIDR block**: `192.168.0.0/26`
  - Click **Add new subnet** (scroll down).
  - **Subnet 2**:
    - **Subnet name**: `cloudscale-pub-sub-2`
    - **Availability Zone**: Select `ap-south-1b` (or your region's second zone `us-east-1b`)
    - **IPv4 CIDR block**: `192.168.0.64/26`
  - Click **Create subnet**.

- **Enable Auto-Assign Public IP**:
  1. Select `cloudscale-pub-sub-1` ➔ Click **Actions** ➔ **Edit subnet settings** ➔ Check **Enable auto-assign public IPv4 address** ➔ Click **Save**.
  2. Select `cloudscale-pub-sub-2` ➔ Click **Actions** ➔ **Edit subnet settings** ➔ Check **Enable auto-assign public IPv4 address** ➔ Click **Save**.

### 1.4: Configure Route Table
- **Where**: VPC Console ➔ **Route tables** ➔ Click **Create route table**.
- **Settings**:
  - **Name**: `cloudscale-public-rt`
  - **VPC**: Select `cloudscale-vpc`
  - Click **Create route table**.
- **Add Internet Route**:
  - In `cloudscale-public-rt`, click the **Routes** tab ➔ Click **Edit routes**.
  - Click **Add route**:
    - **Destination**: `0.0.0.0/0`
    - **Target**: Select **Internet Gateway** ➔ Select `cloudscale-igw`.
  - Click **Save changes**.
- **Associate Subnets**:
  - Click the **Subnet associations** tab ➔ Click **Edit subnet associations**.
  - Check both `cloudscale-pub-sub-1` and `cloudscale-pub-sub-2`.
  - Click **Save associations**.
- **Expected Result**: Traffic destined for `0.0.0.0/0` routes through `cloudscale-igw` across both subnets.



### 1.4: Create Two Private Subnets (Multi-AZ)
- **Where**: VPC Console ➔ **Subnets** ➔ Click **Create subnet**.
- **Settings**:
  - **VPC ID**: Select `cloudscale-vpc`.
  - **Private Subnet 1**:
    - **Subnet name**: `cloudscale-priv-sub-1`
    - **Availability Zone**: Select `ap-south-1a` (same AZ as Public Subnet 1)
    - **IPv4 CIDR block**: `192.168.0.128/26`
  - Click **Add new subnet** (scroll down).
  - **Private Subnet 2**:
    - **Subnet name**: `cloudscale-priv-sub-2`
    - **Availability Zone**: Select `ap-south-1b` (same AZ as Public Subnet 2)
    - **IPv4 CIDR block**: `192.168.0.192/26`
  - Click **Create subnet**.
- **Note**: Do **NOT** enable auto-assign public IP on private subnets.

---

### 1.5: Allocate Elastic IP & Create NAT Gateway
*(Allows private EC2 instances to download Docker images and packages while remaining hidden from inbound internet traffic)*

1. **Allocate Elastic IP**:
   - Go to **VPC Console** ➔ **Elastic IPs** (under Virtual Private Cloud).
   - Click **Allocate Elastic IP address**.
   - **Tag Name**: `cloudscale-nat-eip`.
   - Click **Allocate**.

2. **Create NAT Gateway**:
   - Go to **VPC Console** ➔ **NAT Gateways** ➔ Click **Create NAT gateway**.
   - **Name**: `cloudscale-nat-gw`
   - **Subnet**: Select `cloudscale-pub-sub-1` *(NAT Gateways MUST reside in a Public Subnet!)*
   - **Connectivity type**: `Public`
   - **Elastic IP allocation ID**: Select the Elastic IP allocated above (`cloudscale-nat-eip`).
   - Click **Create NAT gateway**.
   - ⏳ *Wait 1–2 minutes until State changes from `Pending` to `Available`.*

---

### 1.6: Configure Private Route Table (Route to NAT Gateway)
1. **Create Private Route Table**:
   - Go to **VPC Console** ➔ **Route tables** ➔ Click **Create route table**.
   - **Name**: `cloudscale-private-rt` (or edit the default Main Route Table).
   - **VPC**: Select `cloudscale-vpc`.
   - Click **Create route table**.

2. **Add Route to NAT Gateway**:
   - Select `cloudscale-private-rt` ➔ Click **Routes** tab ➔ Click **Edit routes**.
   - Click **Add route**:
     - **Destination**: `0.0.0.0/0`
     - **Target**: Select **NAT Gateway** ➔ Select `cloudscale-nat-gw`.
   - Click **Save changes**.

3. **Associate Private Subnets**:
   - Click **Subnet associations** tab ➔ Click **Edit subnet associations**.
   - Select both:
     - `cloudscale-priv-sub-1`
     - `cloudscale-priv-sub-2`
   - Click **Save associations**.

- **Expected Result**: 
  - Public Subnets (`192.168.0.0/26`, `192.168.0.64/26`) route through `cloudscale-igw` (ALB / Public facing).
  - Private Subnets (`192.168.0.128/26`, `192.168.0.192/26`) route through `cloudscale-nat-gw` (Secure EC2 instances).


---

<a name="step-2-create-security-groups"></a>
## 🛡️ STEP 2: Create Security Groups (Chained Firewall Rules)

We use **Security Group Chaining**: EC2 compute nodes only accept traffic from the Load Balancer!

### 2.1: Create ALB Security Group (`cloudscale-alb-sg`)
- **Where**: EC2 Console ➔ **Security Groups** ➔ Click **Create security group**.
- **Settings**:
  - **Security group name**: `cloudscale-alb-sg`
  - **Description**: `Public ingress for ALB on ports 80 and 8080`
  - **VPC**: Select `cloudscale-vpc`
  - **Inbound rules** (Click **Add rule** twice):
    - Rule 1: Type `HTTP` | Port `80` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
    - Rule 2: Type `Custom TCP` | Port `8080` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
  - **Outbound rules**: Leave default (All traffic to `0.0.0.0/0`).
  - Click **Create security group**.
  - Note the Group ID (e.g., `sg-01a2b3c4d5e6f7g8h`).

### 2.2: Create EC2 Security Group (`cloudscale-ec2-sg`)
- **Where**: EC2 Console ➔ **Security Groups** ➔ Click **Create security group**.
- **Settings**:
  - **Security group name**: `cloudscale-ec2-sg`
  - **Description**: `Compute nodes ingress restricted to ALB and SSH`
  - **VPC**: Select `cloudscale-vpc`
  - **Inbound rules**:
    - Rule 1: Type `Custom TCP` | Port `80` | Source: Click Custom ➔ Type `sg-` and select `cloudscale-alb-sg`.
    - Rule 2: Type `Custom TCP` | Port `8080` | Source: Select `cloudscale-alb-sg`.
    - Rule 3: Type `Custom TCP` | Port `5000` | Source: Select `cloudscale-alb-sg`.
    - Rule 4: Type `SSH` | Port `22` | Source: Select `My IP` (allows you to SSH from your machine).
  - Click **Create security group**.

---


---

<a name="step-3-launch-base-ec2-instance"></a>
## 🖥️ STEP 3: Launch Base EC2 Instance (Base Setup Server)

We launch ONE base instance to install Docker, clone our repo, verify our containers, and capture the Golden AMI.

- **Where**: EC2 Console ➔ **Instances** ➔ Click **Launch instances**.
- **Settings**:
  - **Name**: `CloudScale-Base-Setup-Server`
  - **Application and OS Images**: Select **Amazon Linux 2023 AMI** (Free tier eligible, x86_64).
  - **Instance type**: `t3.micro` (or `t2.micro`).
  - **Key pair**: Select `cloudscale-key`.
  - **Network settings** (Click **Edit** on the top right of Network settings):
    - **VPC**: Select `cloudscale-vpc`
    - **Subnet**: Select `cloudscale-pub-sub-1`
    - **Auto-assign public IP**: `Enable`
    - **Firewall (security groups)**: Select **Select existing security group** ➔ Select `cloudscale-ec2-sg`.
  - **Advanced details** (Expand this section at the bottom):
    - **IAM instance profile**: Select `CloudScale-EC2-Instance-Role`.
  - Click **Launch instance**.
- **Expected Result**: Instance state changes to `Running` and an IPv4 Public IP is assigned.

---

<a name="step-4-install-software-on-base-instance"></a>
## ⚙️ STEP 4: SSH into Base EC2 & Install Software

### 4.1: Connect via SSH
Open PowerShell, Git Bash, or Terminal on your local machine:

```bash
# Navigate to where your cloudscale-key.pem is stored
cd ~/Downloads    # or your path

# (Linux/macOS only) Set permissions
chmod 400 cloudscale-key.pem

# Connect to EC2
ssh -i "cloudscale-key.pem" ec2-user@<EC2_PUBLIC_IP>
```
*Replace `<EC2_PUBLIC_IP>` with the public IP of your `CloudScale-Base-Setup-Server`.*

### 4.2: Install Software Packages
Run these commands inside the EC2 terminal:

```bash
# 1. Update system packages
sudo yum update -y

# 2. Install Git and Docker
sudo yum install -y git docker

# 3. Start Docker daemon and enable it to boot on startup
sudo systemctl enable docker
sudo systemctl start docker

# 4. Add ec2-user to docker group
sudo usermod -aG docker ec2-user
newgrp docker

# 5. Install Docker Compose v2 CLI plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 6. Verify versions
docker --version
docker compose version
```
- **Expected Result**: Terminal shows `Docker version 24.x+` and `Docker Compose version v2.x+`.

---

<a name="step-5-deploy-cloudscale-containers"></a>
## 📦 STEP 5: Deploy CloudScale Code & Launch Containers

Still inside your EC2 terminal:

### 5.1: Clone the GitHub Repository
```bash
cd /home/ec2-user
git clone https://github.com/nayka-mihir/CloudScale.git
cd CloudScale
```

### 5.2: Configure Backend Environment Variables
```bash
cat <<EOF > /home/ec2-user/CloudScale/backend/.env
PORT=5000
NODE_ENV=production
AWS_REGION=ap-south-1
AWS_ASG_NAME=cloudscale-asg
SIMULATE_AWS=false
EOF
```

### 5.3: Build and Start Containers

You have two execution methods. **Option A is the recommended production approach** that directly binds to Port 80 and Port 8080 for the AWS ALB:

#### Option A: Unified Multi-Stage Container (Recommended for Golden AMI & ALB)
Builds the root `Dockerfile` created in Step 0.1:
```bash
cd /home/ec2-user/CloudScale

# 1. Build the unified production container from root Dockerfile
docker build -t cloudscale-app:latest .

# 2. Run container binding Port 80 (Public Web) and Port 8080 (Admin Portal)
docker run -d \
  --name cloudscale \
  --restart unless-stopped \
  -p 80:80 \
  -p 8080:8080 \
  cloudscale-app:latest
```

#### Option B: Multi-Container via Docker Compose (Alternative)
```bash
cd /home/ec2-user/CloudScale/docker
docker compose up -d --build
```
- **Expected Result**: Docker downloads images, compiles Vite React frontend in Stage 1, prepares Node dependencies in Stage 2, and starts the container on ports 80 and 8080.

---

<a name="step-6-test--verify-applications"></a>
## ✅ STEP 6: Test & Verify Applications on Base Instance

Still inside EC2 terminal, test all three internal endpoints:

```bash
# 1. Test Backend Health Check (Target Group check on Port 80)
curl -s http://localhost:80/api/health
# Expected: {"status":"healthy","uptime":...}

# 2. Test Website 1 (Public Website on Port 80)
curl -I http://localhost:80
# Expected: HTTP/1.1 200 OK

# 3. Test Website 2 (Admin Dashboard on Port 8080)
curl -I http://localhost:8080
# Expected: HTTP/1.1 200 OK

# 4. Test Website 2 Telemetry Health Check (Port 8080)
curl -s http://localhost:8080/api/health
# Expected: {"status":"healthy","uptime":...}
```

If all 3 return `200 OK`, your container stack is completely operational!

---

<a name="step-7-create-the-golden-ami"></a>
## 🏆 STEP 7: Configure Auto-Start Service & Create Golden AMI

Every new instance launched by Auto Scaling must automatically run Docker and launch these containers on boot.

### 7.1: Create Systemd Startup Service
Inside EC2 terminal:

```bash
sudo bash -c 'cat <<EOF > /etc/systemd/system/cloudscale.service
[Unit]
Description=CloudScale Auto-Start on Boot
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/sh -c "/usr/bin/docker start cloudscale || /usr/bin/docker run -d --name cloudscale --restart unless-stopped -p 80:80 -p 8080:8080 cloudscale-app:latest"
ExecStop=/usr/bin/docker stop cloudscale
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF'

# Enable the service to run on boot
sudo systemctl daemon-reload
sudo systemctl enable cloudscale.service

# Clean bash history and exit
sudo rm -rf /tmp/*
history -c
exit
```

### 7.2: Create Golden AMI in AWS Console
1. In the **AWS Console** ➔ **EC2** ➔ **Instances**.
2. Select `CloudScale-Base-Setup-Server`.
3. Click **Actions** ➔ **Image and templates** ➔ **Create image**.
4. **Image name**: `CloudScale-Golden-AMI-v1`.
5. **Image description**: `Production image with Docker, Node.js and CloudScale pre-built`.
6. Click **Create image**.
7. Navigate to **AMIs** on the left menu.
8. Wait ~3 minutes until status changes from `pending` to **`available`**.
9. **Note down your AMI ID**: (e.g., `ami-0123456789abcdef0`).

*(Optional: You can now STOP `CloudScale-Base-Setup-Server` so you don't use up Free Tier hours).*

---

<a name="step-8-create-target-groups"></a>
## 🎯 STEP 8: Create Target Groups (Port 80 & Port 8080)

We need two Target Groups: one for Website 1 (Port 80) and one for Website 2 (Port 8080).

### 8.1: Target Group 1 (`tg-cloudscale-80`)
1. EC2 Console ➔ **Target Groups** ➔ Click **Create target group**.
2. Target type: **Instances**.
3. **Target group name**: `tg-cloudscale-80`.
4. **Protocol / Port**: `HTTP` on Port `80`.
5. **VPC**: Select `cloudscale-vpc`.
6. **Health checks**:
   - Health check protocol: `HTTP`
   - Health check path: `/api/health`
   - Expand **Advanced health check settings**:
     - Healthy threshold: `2`
     - Unhealthy threshold: `2`
     - Timeout: `5` seconds
     - Interval: `15` seconds
7. Click **Next** ➔ Do **NOT** register targets manually ➔ Click **Create target group**.

### 8.2: Target Group 2 (`tg-cloudscale-8080`)
1. Click **Create target group**.
2. Target type: **Instances**.
3. **Target group name**: `tg-cloudscale-8080`.
4. **Protocol / Port**: `HTTP` on Port `8080`.
5. **VPC**: Select `cloudscale-vpc`.
6. **Health check path**: `/api/health`.
7. Advanced settings: Healthy threshold: `2`, Timeout: `5`, Interval: `15`.
8. Click **Next** ➔ Click **Create target group**.

---

<a name="step-9-create-application-load-balancer"></a>
## ⚖️ STEP 9: Create Application Load Balancer (ALB)

- **Where**: EC2 Console ➔ **Load Balancers** ➔ Click **Create load balancer**.
- **Who**: Cloud Admin
- **Click-by-Click Instructions**:
  1. Under **Application Load Balancer**, click **Create**.
  2. **Load balancer name**: `cloudscale-alb`
  3. **Scheme**: `Internet-facing`, IP type: `IPv4`.
  4. **Network mapping**:
     - **VPC**: Select `cloudscale-vpc`.
     - **Mappings**:
       - Zone 1 (`ap-south-1a`): Select `cloudscale-pub-sub-1`.
       - Zone 2 (`ap-south-1b`): Select `cloudscale-pub-sub-2`.
  5. **Security groups**:
     - Remove default.
     - Select **`cloudscale-alb-sg`**.
  6. **Listeners and routing**:
     - **Listener 1**: Protocol `HTTP` | Port `80` ➔ Forward to: `tg-cloudscale-80`.
     - Click **Add listener**.
     - **Listener 2**: Protocol `HTTP` | Port `8080` ➔ Forward to: `tg-cloudscale-8080`.
  7. Click **Create load balancer**.
  8. Wait 2 minutes until State turns green **`Active`**.
  9. **Copy your ALB DNS name**: (e.g., `cloudscale-alb-123456789.ap-south-1.elb.amazonaws.com`).

---

<a name="step-10-create-launch-template"></a>
## 📄 STEP 10: Create EC2 Launch Template

This defines the configuration template for new instances spawned by Auto Scaling.

- **Where**: EC2 Console ➔ **Launch Templates** ➔ Click **Create launch template**.
- **Settings**:
  - **Launch template name**: `cloudscale-launch-template`
  - **Template version description**: `v1 Golden AMI with Docker bootstrap`
  - Under **Application and OS Images (Amazon Machine Image)**:
    - Click **My AMIs** ➔ Select **`CloudScale-Golden-AMI-v1`**.
  - **Instance type**: `t3.micro` (or `t2.micro`).
  - **Key pair**: Select `cloudscale-key`.
  - **Network settings**:
    - Do NOT select a subnet here.
    - **Security groups**: Select `cloudscale-ec2-sg`.
  - **Advanced details** (Expand at bottom):
    - **IAM instance profile**: Select `CloudScale-EC2-Instance-Role`.
    - **Detailed CloudWatch monitoring**: `Enable`.
    - **User data** (Paste this exact script):
      ```bash
      #!/bin/bash
      # Start Docker daemon & ensure CloudScale container runs
      systemctl start docker
      docker start cloudscale || docker run -d --name cloudscale --restart unless-stopped -p 80:80 -p 8080:8080 cloudscale-app:latest
      ```
  - Click **Create launch template**.

---

<a name="step-11-create-auto-scaling-group"></a>
## 📈 STEP 11: Create Auto Scaling Group (ASG)

- **Where**: EC2 Console ➔ **Auto Scaling Groups** ➔ Click **Create Auto Scaling group**.
- **Who**: Cloud Admin
- **Click-by-Click Instructions**:
  1. **Step 1: Choose launch template**:
     - **Auto Scaling group name**: `cloudscale-asg`
     - **Launch template**: Select `cloudscale-launch-template` (Version: Latest).
     - Click **Next**.
  2. **Step 2: Choose instance launch options**:
     - **VPC**: Select `cloudscale-vpc`.
     - **Availability Zones and subnets**: Select both `cloudscale-priv-sub-1` and `cloudscale-priv-sub-2` *(Enterprise Standard: EC2 compute nodes run securely in Private Subnets with zero direct public IP exposure)*.
     - Click **Next**.
  3. **Step 3: Configure advanced options**:
     - **Load balancing**: Select **Attach to an existing load balancer**.
     - Under **Existing load balancer target groups**, select BOTH:
       - `tg-cloudscale-80`
       - `tg-cloudscale-8080`
     - **Health checks**: Check **Turn on Elastic Load Balancing health checks**.
     - **Health check grace period**: Set to `180` seconds.
     - Click **Next**.
  4. **Step 4: Configure group size and scaling policies**:
     - **Desired capacity**: `2`
     - **Minimum capacity**: `2`
     - **Maximum capacity**: `6`
     - **Scaling policies**: Select **Target tracking scaling policy**.
       - **Policy name**: `cloudscale-cpu-target-tracking`
       - **Metric type**: `Average CPU utilization`
       - **Target value**: `70`
       - **Instance warmup**: `180` seconds.
     - Click **Next**.
  5. **Step 5: Notifications & Tags**:
     - Click **Add tag**: Key = `Name`, Value = `CloudScale-Cluster-Node`. Check **Tag new instances**.
  6. Click **Next** ➔ Click **Create Auto Scaling group**.

---

<a name="step-12-verify-baseline-fleet"></a>
## 🔍 STEP 12: Verify Initial Baseline Fleet

Wait 2 to 3 minutes for AWS to launch the cluster nodes:

1. Go to **EC2** ➔ **Instances**:
   - You should see **2 running instances** named `CloudScale-Cluster-Node`:
     - One in `ap-south-1a`
     - One in `ap-south-1b`
2. Go to **EC2** ➔ **Target Groups** ➔ Click `tg-cloudscale-80` ➔ **Targets tab**:
   - Both instances must display status **`Healthy`** with green checkmarks!
3. Click `tg-cloudscale-8080` ➔ **Targets tab**:
   - Both instances must also display status **`Healthy`**!
4. **Open in Browser**:
   - Open: `http://<YOUR_ALB_DNS_NAME>/` ➔ **Website 1 (Public Portal) loads!**
   - Open: `http://<YOUR_ALB_DNS_NAME>:8080/` ➔ **Website 2 (Admin Dashboard) loads!**

---

<a name="step-13-trigger-live-auto-scaling"></a>
## ⚡ STEP 13: Trigger Live CPU Stress Test & Observe Auto-Scaling Live

This is the peak demonstration of your project.

1. In your browser, navigate to the Admin Dashboard: `http://<YOUR_ALB_DNS_NAME>:8080/`.
2. Notice the real-time telemetry cards:
   - **Active Instances**: `2`
   - **Healthy Targets**: `2 / 2`
   - **Average CPU**: `~20%`
3. Click the red button: **`[Start Load Test]`**.
4. **Observe Website 2 Dashboard**:
   - The radial CPU Gauge climbs to **85% – 95%**!
5. **Switch to AWS Console ➔ CloudWatch ➔ Alarms**:
   - Find the alarm created by your ASG: `TargetTracking-cloudscale-asg-AlarmHigh-...`
   - Within 1 to 2 minutes, its state transitions to **`In alarm`** (Red)!
6. **Switch to EC2 ➔ Auto Scaling Groups ➔ `cloudscale-asg` ➔ Activity tab**:
   - Look at the Activity history log:
     > *"Triggering scale-out capacity. Launching a new EC2 instance in response to CloudWatch Alarm."*
7. **Switch to EC2 ➔ Instances**:
   - Watch AWS automatically spin up a **3rd instance** (`CloudScale-Cluster-Node`)!
   - As load continues, it will spin up a **4th instance**!
8. Both newly launched instances automatically register into the Target Groups and begin serving traffic.

---

<a name="step-14-observe-cooldown--scale-in"></a>
## ❄️ STEP 14: Stop Stress Test & Observe Cooldown & Scale-In

1. On the Admin Dashboard (`:8080`), click the green button: **`[Stop Load Test]`**.
2. **Observe CPU Gauge**:
   - CPU utilization immediately falls back down to **10% – 20%**.
3. **Switch to CloudWatch Alarms**:
   - The High CPU alarm returns to `OK`.
   - The Low CPU alarm (`AlarmLow` < 30%) triggers.
4. **Switch to ASG Activity tab**:
   - After the 300-second stabilization cooldown window passes, the ASG executes a **Scale-In activity**:
     > *"Terminating EC2 instance: i-xxxxxx in response to low CPU."*
5. The cluster safely and gracefully scales back down to the baseline of **2 instances**, saving unnecessary cloud billing!

---

<a name="step-15-chaos-engineering-lab"></a>
## 💥 STEP 15: Chaos Engineering Lab (Prove Zero Downtime)

Demonstrate to your evaluator that the cluster survives server crashes:

1. Open your local terminal and run a continuous health ping against the ALB:
   ```bash
   # Windows PowerShell:
   while ($true) { (Invoke-WebRequest -Uri "http://<YOUR_ALB_DNS>/api/health").StatusCode; Start-Sleep -Seconds 1 }

   # Linux / macOS:
   while true; do curl -s -o /dev/null -w "%{http_code}\n" http://<YOUR_ALB_DNS>/api/health; sleep 1; done
   ```
2. In the AWS Console, go to **EC2 Instances**.
3. Pick one of the two running instances, click **Instance state** ➔ **Terminate instance**.
4. **Look at your terminal ping loop**:
   - **Every single request returns `200`!** Not a single request dropped!
   - The Application Load Balancer seamlessly detected the terminating host and forwarded all traffic to the other Availability Zone.
5. Within 60 seconds, the Auto Scaling Group notices that capacity dropped to 1, and **automatically launches a new replacement instance** to maintain the desired count of 2.

---

<a name="step-16-cost-control--cleanup"></a>
## 💰 STEP 16: How to Safely Pause / Terminate Resources to Save Costs

When you are done testing for the day, follow these steps to prevent any billing:

```bash
# 1. Scale ASG to zero (Instantly terminates all paid EC2 nodes)
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name cloudscale-asg \
  --min-size 0 \
  --desired-capacity 0

# 2. When you want to delete everything completely:
# a. Delete Auto Scaling Group:
aws autoscaling delete-auto-scaling-group --auto-scaling-group-name cloudscale-asg --force-delete

# b. Delete Load Balancer:
aws elbv2 delete-load-balancer --load-balancer-arn <ALB_ARN>

# c. Delete Target Groups:
aws elbv2 delete-target-group --target-group-arn <TG80_ARN>
aws elbv2 delete-target-group --target-group-arn <TG8080_ARN>

```

---

<a name="step-17-professor-demo-script"></a>
## 🎓 STEP 17: Project Viva / Professor Demonstration Script

When presenting to your evaluator or professor, deliver this exact narrative:

1. **The Architecture Pitch (30 seconds)**:
   > *"Good morning Professor. This project is **CloudScale**, an enterprise-grade multi-AZ auto-scaling architecture on AWS. We have deployed two isolated applications: Website 1 on Port 80 for public visitors, and Website 2 on Port 8080 as our DevOps infrastructure control plane."*

2. **Demonstrate High Availability (1 minute)**:
   > *"Notice in the AWS Console that our baseline fleet is distributed evenly across two distinct Availability Zones (`ap-south-1a` and `ap-south-1b`). If an entire AWS data center loses power, our Application Load Balancer immediately routes 100% of user traffic to the surviving zone without dropping a single packet."*

3. **Demonstrate Dynamic Elasticity (2 minutes)**:
   > *"Now I will trigger our in-process synthetic stress test on the Admin Dashboard. Watch our radial CPU gauge climb above 85%. CloudWatch evaluates this metric every minute. As our Average CPU exceeds 70%, CloudWatch sounds the alarm, and the Auto Scaling Group automatically provisions new EC2 instances from our pre-baked Golden AMI in under 45 seconds."*

4. **Demonstrate Cost Optimization (1 minute)**:
   > *"When I stop the stress test, the CPU drops back to 15%. After our cooldown window elapses, the ASG terminates the extra compute nodes, returning to our minimum baseline to minimize cloud hosting costs."*

---

5. **Architectural Defense (Why Stateless Architecture over EFS?)**:
   > *"Professor, we intentionally designed CloudScale following the enterprise **12-Factor Stateless App** standard. Instead of mounting a shared network filesystem (Amazon EFS), our frontend and backend are compiled directly into an immutable Docker image on our Golden AMI. This eliminates network file-locking latency, avoids EFS pricing ($0.30/GB vs S3's $0.023/GB), prevents mount-timeout delays during boot, and ensures any EC2 node can be terminated instantly without state corruption."*

---
*End of Sequential Working Execution Guide.*
