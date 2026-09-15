# CloudScale — Multi-Stage Docker, Golden AMI & AWS Auto-Scaling Guide

This guide provides an end-to-end blueprint for building a **single multi-stage Docker container** (containing both Frontend React SPA and Backend Express API) and deploying it on AWS using **EC2, Golden AMI, Auto Scaling Groups (ASG), and an Application Load Balancer (ALB)** serving **Port 80 (Public Website)** and **Port 8080 (Admin Cockpit)**.

---

## 1. High-Level Architecture

```
                               Internet Traffic
                                      │
                                      ▼
                       Application Load Balancer (ALB)
                       ├── Listener Port 80   ──► Target Group: TG-Public-80
                       └── Listener Port 8080 ──► Target Group: TG-Admin-8080
                                      │
                                      ▼
                       AWS Auto Scaling Group (ASG Fleet)
                       [Min: 2 | Desired: 2 | Max: 6]
                       ┌───────────────────────────────────────────────┐
                       │           EC2 Instance (t3.micro)             │
                       │             (From Golden AMI)                 │
                       │                                               │
                       │   ┌───────────────────────────────────────┐   │
                       │   │   Single Multi-Stage Docker Container │   │
                       │   │   • Port 80:   Public Web & API       │   │
                       │   │   • Port 8080: Admin Cockpit & Auth   │   │
                       │   │   • /api/health for ALB Health Checks │   │
                       │   │   • Built React Production Bundle     │   │
                       │   └───────────────────────────────────────┘   │
                       └───────────────────────────────────────────────┘
```

---

## 2. Multi-Stage Dockerfile Blueprint

Save this as `Dockerfile` in the root of your project:

```dockerfile
# ==============================================================================
# Multi-Stage Dockerfile for CloudScale Platform
# Serves both Public Website (Port 80) and Admin Cockpit (Port 8080) + API
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend React SPA
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Install Backend Production Dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime Image (~120 MB total)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV ADMIN_PORT=8080
ENV SIMULATE_AWS=true
ENV FRONTEND_DIST_PATH=/app/dist

# Copy backend node_modules & code
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./dist

# Expose both AWS Target Group ports
EXPOSE 80 8080

WORKDIR /app/backend

CMD ["node", "src/server.js"]
```

---

## 3. Node.js Multi-Port Server Configuration

In `backend/src/server.js`, configure Express to listen on **both ports** simultaneously:

```javascript
import app from './app.js';
import { config } from './config/index.js';

const PORT = parseInt(process.env.PORT || '80', 10);
const ADMIN_PORT = parseInt(process.env.ADMIN_PORT || '8080', 10);

// Listener 1: Port 80 (Public Website & API)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`CloudScale Multi-Port Server Online`);
  console.log(`- Public Web & REST API: http://0.0.0.0:${PORT}`);
  console.log(`- Health Check Endpoint: http://0.0.0.0:${PORT}/health`);
});

// Listener 2: Port 8080 (Admin Cockpit & Telemetry)
if (ADMIN_PORT && ADMIN_PORT !== PORT) {
  app.listen(ADMIN_PORT, '0.0.0.0', () => {
    console.log(`- Admin Cockpit Portal:  http://0.0.0.0:${ADMIN_PORT}`);
    console.log(`========================================`);
  });
}
```

---

## 4. Step-by-Step AWS Implementation

### Step 1: Launch Base EC2 Instance (Session 3 in Playlist)
1. Open **AWS Management Console** ➔ **EC2** ➔ Click **Launch Instances**.
2. **Name**: `CloudScale-Base-Setup-Server`
3. **AMI**: Amazon Linux 2023 (64-bit x86).
4. **Instance Type**: `t3.micro` (Free Tier).
5. **Key Pair**: Select your `.pem` key pair.
6. **Security Group (`cloudscale-base-sg`)**:
   - Inbound SSH (Port 22): `My IP`
   - Inbound HTTP (Port 80): `0.0.0.0/0`
   - Inbound Custom TCP (Port 8080): `0.0.0.0/0`
7. Click **Launch Instance**.

---

### Step 2: Install Docker & Build Container on EC2
Connect via SSH to your base instance:
```bash
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

Run setup commands:
```bash
# Update system and install tools
sudo dnf update -y
sudo dnf install docker git -y

# Start and enable Docker service
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
newgrp docker

# Clone your repository
git clone <YOUR-GITHUB-REPO-URL>
cd AwsCloudScal

# Build the unified multi-stage container
docker build -t cloudscale-app:latest .

# Run container on both Port 80 and Port 8080
docker run -d \
  --restart unless-stopped \
  --name cloudscale \
  -p 80:80 \
  -p 8080:8080 \
  cloudscale-app:latest
```

---

### Step 3: Test Local Ports on EC2
```bash
# Test Port 80 (Public Website & Health)
curl -I http://localhost:80/health
curl -I http://localhost:80/

# Test Port 8080 (Admin Portal)
curl -I http://localhost:8080/
```

---

### Step 4: Configure Auto-Start on Boot (Systemd)
Create a systemd unit file so any auto-scaled instance automatically starts the container on boot:

```bash
sudo bash -c 'cat <<EOF > /etc/systemd/system/cloudscale.service
[Unit]
Description=CloudScale Multi-Port Container
Requires=docker.service
After=docker.service

[Service]
Restart=always
ExecStartPre=-/usr/bin/docker stop cloudscale
ExecStartPre=-/usr/bin/docker rm cloudscale
ExecStart=/usr/bin/docker run --rm --name cloudscale -p 80:80 -p 8080:8080 cloudscale-app:latest
ExecStop=/usr/bin/docker stop cloudscale

[Install]
WantedBy=multi-user.target
EOF'

# Reload and enable the service
sudo systemctl daemon-reload
sudo systemctl enable cloudscale.service

# Clean bash history before creating snapshot
sudo rm -rf /tmp/*
history -c
```

---

### Step 5: Create the Golden AMI
1. In the **AWS Console** ➔ **EC2** ➔ **Instances**.
2. Select `CloudScale-Base-Setup-Server`.
3. Click **Actions** ➔ **Image and templates** ➔ **Create image**.
4. **Image Name**: `CloudScale-Golden-AMI-v1`.
5. **Image Description**: `Production AMI with Docker and CloudScale pre-built`.
6. Click **Create image**.
7. Wait 2–4 minutes until status changes to **Available**.
8. Note down your **AMI ID** (e.g., `ami-0abc1234def567890`).

*(You can now Stop the Base EC2 server to conserve Free Tier hours).*

---

### Step 6: Create Application Load Balancer (ALB) & Target Groups

#### 1. Create Target Group 1: `TG-Public-80`
- **Target Type**: Instances
- **Protocol**: HTTP
- **Port**: `80`
- **VPC**: Select your Custom VPC
- **Health Check Path**: `/health`

#### 2. Create Target Group 2: `TG-Admin-8080`
- **Target Type**: Instances
- **Protocol**: HTTP
- **Port**: `8080`
- **VPC**: Select your Custom VPC
- **Health Check Path**: `/health`

#### 3. Create Application Load Balancer: `cloudscale-alb`
- **Scheme**: Internet-facing
- **IP address type**: IPv4
- **VPC & Subnets**: Select both Multi-AZ public subnets (`ap-south-1a`, `ap-south-1b`).
- **Security Group (`cloudscale-alb-sg`)**: Inbound `80` and `8080` from `0.0.0.0/0`.
- **Listeners & Routing**:
  - Listener 1: HTTP `80` ➔ Forward to `TG-Public-80`.
  - Listener 2: HTTP `8080` ➔ Forward to `TG-Admin-8080`.

---

### Step 7: Create EC2 Launch Template & Auto Scaling Group (ASG)

#### 1. Launch Template: `cloudscale-launch-template`
- **AMI**: Select `CloudScale-Golden-AMI-v1`.
- **Instance Type**: `t3.micro`.
- **Security Group (`cloudscale-ec2-sg`)**:
  - Inbound TCP `80` ➔ Source: `cloudscale-alb-sg` (Security Group Chaining).
  - Inbound TCP `8080` ➔ Source: `cloudscale-alb-sg`.
  - Inbound TCP `22` ➔ Source: `My IP`.
- **IAM Instance Profile**: Attach `CloudScale-EC2-ASG-Role` (Permissions for Auto Scaling & CloudWatch).

#### 2. Auto Scaling Group: `cloudscale-asg`
- **Launch Template**: `cloudscale-launch-template`.
- **VPC & Subnets**: Multi-AZ subnets.
- **Load Balancing**: Attach to existing load balancer target groups:
  - Select both `TG-Public-80` and `TG-Admin-8080`.
- **Health Check Grace Period**: `180` seconds.
- **Group Size**:
  - **Desired Capacity**: `2`
  - **Minimum Capacity**: `2`
  - **Maximum Capacity**: `6`
- **Scaling Policy (Target Tracking)**:
  - Metric: **Average CPU Utilization**.
  - Target Value: **`70%`**.

---

## 5. Live Demonstration & Verification

1. **Public Website**:
   - Open `http://<ALB-DNS-NAME>:80/`
   - You should see the Public Landing page (`Home`, `About`, `Features`, `Contact`).
2. **Admin Cockpit**:
   - Open `http://<ALB-DNS-NAME>:8080/`
   - Enter credentials (`admin` / `cloudscale2026` / PIN `9988`).
3. **Auto Scaling Stress Test**:
   - Click **"Start Load Test"** on the Admin Dashboard.
   - The in-memory stress engine will drive CPU utilization to ~85%.
   - AWS CloudWatch triggers the scale-out alarm.
   - ASG automatically spins up instance 3 and instance 4.
   - ALB starts distributing requests across all healthy instances!
4. **Scale Down**:
   - Click **"Stop Load Test"**. CPU normalizes, and ASG scales back to 2 instances after the cooldown period.

---

## 6. Summary Comparison Table

| Architecture Pattern | Nginx + Multi-Container | Single Multi-Stage Docker Container (This Guide) |
| :--- | :--- | :--- |
| **Complexity** | 2-3 Dockerfiles, reverse proxy configs | **1 clean Multi-Stage Dockerfile** |
| **Ports Handled** | Requires Nginx virtual hosts | **Direct Node.js multi-port binding (80 & 8080)** |
| **Boot Speed** | ~2–3 minutes | **< 30 seconds from Golden AMI** |
| **AWS ALB Compatibility** | Compatible | **100% Native Dual Target Group Integration** |
| **Security** | Requires managing proxy rules | **Layer 7 ALB Chaining + IMDSv2 IAM Roles** |
