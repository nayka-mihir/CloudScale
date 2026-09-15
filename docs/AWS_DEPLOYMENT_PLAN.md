# CloudScale — AWS Deployment & Auto-Scaling Implementation Guide

This guide provides a comprehensive, step-by-step walkthrough to deploy the **CloudScale** project on Amazon Web Services (AWS) using **EC2, Docker, Application Load Balancers (ALB), and Auto Scaling Groups (ASG)**.

---

## 1. High-Level Architecture

```
                               Internet Users
                                     │
                                     ▼
                      Application Load Balancer (ALB)
                      ├── Port 80   ──► Public Target Group (Public Website)
                      └── Port 8080 ──► Admin Target Group (Admin Control Dashboard)
                                     │
                                     ▼
                      AWS Auto Scaling Group (ASG)
                      [Min: 2 | Desired: 2 | Max: 6]
                      ┌─────────────────────────────┐
                      │    EC2 Instance (t3.micro)  │
                      │    (From Custom Docker AMI) │
                      │  • React Frontend           │
                      │  • Node.js Backend API      │
                      │  • Stress Engine            │
                      └─────────────────────────────┘
```

---

## Stage 1: Push Latest Code to GitHub

Ensure all recent backend, frontend, and Docker files are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Add AWS Control API, Docker orchestration, and deployment configs"
git push origin main
```

---

## Stage 2: Launch the Base EC2 Instance

1. Open the **AWS Management Console** ➔ Navigate to **EC2** ➔ Click **Launch Instances**.
2. **Name**: `CloudScale-Base-Server`
3. **Application and OS Images (AMI)**: Select **Amazon Linux 2023** (or **Amazon Linux 2** / **Ubuntu 22.04**).
4. **Instance Type**: `t3.micro` (AWS Free Tier eligible).
5. **Key Pair**: Select an existing `.pem` key pair or create a new one.
6. **Network Settings / Security Group**:
   - Create a Security Group named `cloudscale-ec2-sg`.
   - Add the following Inbound rules:
     - **SSH (Port 22)**: Source ➔ `My IP` (for secure terminal access).
     - **HTTP (Port 80)**: Source ➔ `Anywhere (0.0.0.0/0)`.
     - **Custom TCP (Port 8080)**: Source ➔ `My IP` (or `0.0.0.0/0` during testing).
     - **Custom TCP (Port 5000)**: Source ➔ `Anywhere (0.0.0.0/0)`.
7. Click **Launch Instance**.

---

## Stage 3: Setup Docker & Create the Custom AMI

1. Connect to your EC2 instance via SSH:
   ```bash
   ssh -i /path/to/your-key.pem ec2-user@<EC2-PUBLIC-IP>
   ```

2. Run the following commands to install Docker, Docker Compose, and launch the application:
   ```bash
   # 1. Update packages and install Docker & Git
   sudo yum update -y
   sudo yum install -y git docker
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker ec2-user

   # 2. Install Docker Compose plugin
   sudo mkdir -p /usr/local/lib/docker/cli-plugins
   sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
   sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

   # 3. Clone your repository
   cd /home/ec2-user
   git clone https://github.com/nayka-mihir/CloudScale.git
   cd CloudScale/docker

   # 4. Build and start containers in the background
   sudo docker compose up -d --build
   ```

3. **Verify the installation in your browser**:
   - Open `http://<EC2-PUBLIC-IP>/` ➔ Public Website loads.
   - Open `http://<EC2-PUBLIC-IP>:8080/` ➔ Admin Dashboard loads.
   - Open `http://<EC2-PUBLIC-IP>:5000/api/health` ➔ Returns `{"status":"healthy"}`.

4. **Create the Golden AMI**:
   - In the AWS EC2 Console ➔ Select your instance.
   - Click **Actions** ➔ **Image and templates** ➔ **Create image**.
   - **Image name**: `CloudScale-Golden-AMI`.
   - **Description**: `Base image with Docker and CloudScale pre-built`.
   - Click **Create image**. Wait 2–3 minutes until status changes to **Available** under **AMIs**.

---

## Stage 4: Create Target Groups & Application Load Balancer (ALB)

### 1. Create the Target Group
1. Go to **EC2** ➔ **Target Groups** ➔ **Create target group**.
2. **Choose target type**: `Instances`.
3. **Target group name**: `tg-cloudscale-80`.
4. **Protocol / Port**: `HTTP` on Port `80`.
5. **VPC**: Select your default VPC.
6. **Health check path**: `/api/health`.
7. Click **Next** ➔ Do **not** register targets manually (Auto Scaling will automatically manage this).
8. Click **Create target group**.

### 2. Create the Application Load Balancer
1. Go to **EC2** ➔ **Load Balancers** ➔ **Create load balancer**.
2. Select **Application Load Balancer (ALB)**.
3. **Load balancer name**: `cloudscale-alb`.
4. **Scheme**: `Internet-facing`, IP address type: `IPv4`.
5. **Network mapping**:
   - Select your default VPC.
   - Under Subnets, select **at least two Availability Zones** (e.g., `ap-south-1a` and `ap-south-1b`).
6. **Security Groups**:
   - Create/select an ALB security group (`cloudscale-alb-sg`) allowing:
     - Inbound `HTTP:80` from `0.0.0.0/0`.
     - Inbound `Custom TCP:8080` from `My IP` (or `0.0.0.0/0`).
7. **Listeners and routing**:
   - Protocol `HTTP`, Port `80` ➔ Forward to: `tg-cloudscale-80`.
8. Click **Create load balancer**.

---

## Stage 5: Create Launch Template & Auto Scaling Group (ASG)

### 1. Create Launch Template
1. Go to **EC2** ➔ **Launch Templates** ➔ **Create launch template**.
2. **Template name**: `cloudscale-launch-template`.
3. **Application and OS Images**:
   - Click **My AMIs** ➔ Select your **`CloudScale-Golden-AMI`**.
4. **Instance Type**: `t3.micro`.
5. **Key Pair**: Select your key pair.
6. **Network settings**:
   - Assign security group: select `cloudscale-ec2-sg`.
7. **Advanced details ➔ User data**:
   Add this small script to guarantee Docker and containers auto-start on every new instance:
   ```bash
   #!/bin/bash
   sudo systemctl start docker
   cd /home/ec2-user/CloudScale/docker
   sudo docker compose up -d
   ```
8. Click **Create launch template**.

### 2. Create the Auto Scaling Group
1. Go to **EC2** ➔ **Auto Scaling Groups** ➔ **Create Auto Scaling group**.
2. **Auto Scaling group name**: `cloudscale-asg`.
3. **Launch template**: Select `cloudscale-launch-template` (Version: Latest). Click **Next**.
4. **Network**:
   - Select your VPC.
   - Choose the **same 2 Availability Zones** selected for the ALB. Click **Next**.
5. **Load balancing**:
   - Select **Attach to an existing load balancer**.
   - Choose your Target Group: `tg-cloudscale-80`.
   - Enable **Elastic Load Balancing health checks** (Health check grace period: `300` seconds). Click **Next**.
6. **Configure group size and scaling policies**:
   - **Desired capacity**: `2`
   - **Minimum capacity**: `2`
   - **Maximum capacity**: `6`
   - **Scaling policies**: Select **Target tracking scaling policy**.
     - **Metric type**: `Average CPU utilization`.
     - **Target value**: `70%`.
     - **Warm-up period**: `300` seconds. Click **Next**.
7. Skip Notifications and Tags ➔ Click **Create Auto Scaling group**.

---

## Stage 6: The Live Demonstration & Verification

### 1. Verify Baseline Load Balancing
- Copy your **ALB DNS Name** from the Load Balancer dashboard (e.g., `http://cloudscale-alb-12345.ap-south-1.elb.amazonaws.com`).
- Open it in your browser.
- Refresh the page: the ALB distributes incoming traffic across your active healthy EC2 instances!

### 2. Trigger the Auto-Scaling Demonstration
1. Open the **Admin Dashboard** (visit `http://<ALB-DNS-NAME>:8080/` or use the toggle on the top navigation bar).
2. Click **[Start Load Test]**.
3. Watch the **Avg CPU Utilization** gauge climb above **70%**.
4. Switch to your AWS Console ➔ Go to **Auto Scaling Groups** ➔ **Activity** tab.
5. You will observe:
   > *"Triggering scale-out policy in response to CloudWatch High CPU Alarm. Launching a new EC2 instance."*
6. A 3rd instance automatically launches and joins the Target Group!

### 3. Trigger Scale-In Cooldown
1. Click **[Stop Load Test]** on the Admin Dashboard.
2. The CPU load drops back to idle baseline (10–30%).
3. Once the CloudWatch cooldown expires, AWS Auto Scaling automatically terminates the extra instance, safely returning the cluster to its minimum baseline of 2 instances.
