# CloudScale — High-Availability Auto-Scaling Web Application
## Phase 0: Planning & Requirements Specification

This document defines the complete system requirements, architecture, technology stack, scaling policies, security model, and page structures for the **CloudScale** project.

---

## 1. Project Overview & Objectives
**CloudScale** is a resilient cloud demonstration platform showcasing automated elasticity, high availability, and multi-AZ load balancing on AWS. The system consists of two core applications:
1. **Public Website (`cloudscale.com`)**: A high-performance, responsive customer-facing website designed to serve marketing content and generate measurable traffic to trigger auto-scaling events.
2. **Admin Dashboard (`admin.cloudscale.com`)**: An operational control plane providing real-time infrastructure visibility (EC2 health, ALB requests, CPU utilization) and management capabilities (manual capacity overrides and synthetic load-testing triggers).

---

## 2. User Personas & Permissions

| Role | Target Endpoint | Description & Access Level |
| :--- | :--- | :--- |
| **Public User** | `cloudscale.com` | Anonymous visitors browsing landing pages, reading about features, submitting contact inquiries, and driving HTTP request load. |
| **Admin / DevOps** | `admin.cloudscale.com` | Authenticated operators monitoring AWS ASG metrics, CloudWatch alarms, ALB telemetry, modifying target capacities, and running stress tests. |

---

## 3. Application Structure & Pages

### 3.1 Application A: Public Website (`cloudscale.com`)
A modern, high-conversion, responsive web application built with React, JavaScript, and Tailwind CSS.

- **`/` (Home)**:
  - Hero section highlighting high-availability cloud architecture.
  - Interactive "Live Cluster Status" badge (healthy instances count, regional uptime).
  - Quick CTAs: Explore features, test application response speed.
- **`/about` (About)**:
  - Project architecture narrative and scalability philosophy.
  - Interactive diagram showing how multi-AZ resilience works.
- **`/features` (Features)**:
  - Feature matrix: Dynamic Auto-Scaling, Multi-AZ Failover, Zero-Downtime Rolling Deployments, Real-Time CloudWatch Monitoring.
  - Live latency / API health ping tool.
- **`/contact` (Contact)**:
  - Interactive contact and feedback form.
  - Form submission sends API request to backend (adds real transactional request load to the cluster).

### 3.2 Application B: Admin Dashboard (`admin.cloudscale.com`)
An operations dashboard for infrastructure management and auto-scaling demonstrations.

- **Top Metrics Bar**:
  - `EC2 Instances`: Active instance count (e.g., 3)
  - `Healthy Instances`: Target group healthy host count (e.g., 3 / 3)
  - `Avg CPU Usage`: Real-time aggregated cluster CPU % (e.g., 65%)
  - `ALB Requests`: Live incoming request rate (e.g., 250 req/min)
  - `Capacity Configuration`: Desired: 2 | Min: 2 | Max: 6
- **Real-Time Telemetry & Charts**:
  - Historical CPU utilization chart (CloudWatch 1-minute metric intervals).
  - Target Group response latency and request count graphs.
  - Instance Health Table: Instance ID, Availability Zone (`us-east-1a`, `us-east-1b`), State (`running`, `healthy`), Launch Time, CPU %.
- **Operational Controls & Actions**:
  - `[ Increase Capacity (+1) ]`: Triggers AWS Auto Scaling `SetDesiredCapacity` API call.
  - `[ Decrease Capacity (-1) ]`: Reduces ASG desired capacity safely down to Min.
  - `[ Start Load Test ]`: Launches CPU stress / synthetic traffic worker (generates compute load to trigger CloudWatch alarm).
  - `[ Stop Load Test ]`: Halts synthetic load generation immediately.

---

## 4. Architecture Diagram

```mermaid
flowchart TD
    subgraph Users["End Users & Operators"]
        U[Public Visitors] -->|HTTPS: cloudscale.com| R53[Amazon Route 53]
        A[Admin / DevOps] -->|HTTPS: admin.cloudscale.com| R53
    end

    subgraph AWS_Cloud["AWS Cloud Region (e.g., us-east-1)"]
        R53 --> ACM[AWS Certificate Manager\nSSL/TLS Certificate]
        R53 --> ALB[Application Load Balancer\n(Internet-Facing / Multi-AZ)]
        
        subgraph VPC["Virtual Private Cloud (VPC) 10.0.0.0/16"]
            subgraph Public_Subnets["Public Subnets"]
                ALB_1["ALB Node (AZ-a)"]
                ALB_2["ALB Node (AZ-b)"]
                NAT_GW["NAT Gateway"]
            end
            
            subgraph Private_Subnets["Private Subnets (Auto-Scaling Group)"]
                EC2_1["EC2 Instance (AZ-a)\nDocker: Web + Node API"]
                EC2_2["EC2 Instance (AZ-b)\nDocker: Web + Node API"]
                EC2_3["EC2 Instance (AZ-a/b)\nAuto-Scaled Instance"]
            end
        end

        ALB -->|Port 80/3000| EC2_1
        ALB -->|Port 80/3000| EC2_2
        ALB -->|Port 80/3000| EC2_3

        subgraph Monitoring_Scaling["Telemetry & Auto Scaling"]
            CW[Amazon CloudWatch\nAlarms & Metrics]
            ASG[AWS Auto Scaling Group\nMin: 2 | Desired: 2 | Max: 6]
            
            EC2_1 -.->|Metrics| CW
            EC2_2 -.->|Metrics| CW
            EC2_3 -.->|Metrics| CW
            
            CW -->|Scale Out: CPU > 70%| ASG
            CW -->|Scale In: CPU < 30%| ASG
            ASG -->|Manages Lifecycle| Private_Subnets
        end
        
        subgraph Storage_Security["Identity & Storage"]
            IAM[IAM Roles & Instance Profiles]
            S3[Amazon S3\nStatic Assets & Logs]
            IAM -.->|Least Privilege| EC2_1
        end
    end
```

---

## 5. Technology Stack Breakdown

| Layer | Technology | Rationale & Usage |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, JavaScript | Component-driven UI for public site and dashboard |
| **Styling** | Tailwind CSS | Modern aesthetic, utility-first design, dark mode, responsive layout |
| **HTTP Client** | Axios | Resilient API calls with request/response interceptors |
| **Icons & Charts** | Lucide React, Recharts | Premium aesthetic icons and real-time interactive time-series charts |
| **Backend API** | Node.js, Express.js | Lightweight, event-driven REST API serving traffic and telemetry |
| **Cloud SDK** | AWS SDK for JavaScript v3 | Modular `@aws-sdk/client-auto-scaling`, `@aws-sdk/client-cloudwatch`, `@aws-sdk/client-ec2` |
| **Containerization** | Docker, Docker Compose | Consistent local dev & multi-stage production container builds |
| **CI/CD** | GitHub Actions | Automated linting, testing, Docker build, and deployment automation |
| **Cloud Infrastructure** | AWS Services: | |
| ↳ *Networking* | VPC, 2x Public Subnets, 2x Private Subnets, NAT GW, Internet GW | Isolated private network architecture |
| ↳ *Compute & Balance* | EC2 (t3.micro/small), Application Load Balancer (ALB) | Resilient load balancing across multi-AZ instances |
| ↳ *Elasticity* | Auto Scaling Group (ASG), Launch Template | Elastic capacity responding to traffic spikes |
| ↳ *DNS & Security* | Route 53, ACM (SSL/TLS), Security Groups, IAM | Zero exposed ports except ALB HTTPS/80; strict least privilege |
| ↳ *Telemetry* | CloudWatch Metrics, Alarms & Logs | Aggregated CPU and request rate triggers |

---

## 6. Scaling Rules & Auto-Scaling Policies

### 6.1 Capacity Limits
- **Minimum Capacity**: `2` (Guarantees multi-AZ high availability at all times)
- **Desired Capacity**: `2` (Default baseline steady-state)
- **Maximum Capacity**: `6` (Upper ceiling to prevent runaway AWS billing)

### 6.2 Scaling Triggers
- **Scale-Out Policy (High Load)**:
  - Metric: `Average CPU Utilization > 70%` (evaluated over 2 consecutive 1-minute periods)
  - Action: Add `+1` instance (or `+2` instances if CPU > 85%)
  - Cooldown: `300 seconds` (prevents premature scaling triggers)
- **Scale-In Policy (Low Load)**:
  - Metric: `Average CPU Utilization < 30%` (evaluated over 5 consecutive 1-minute periods)
  - Action: Terminate `-1` instance (safely draining connections via ALB)
  - Cooldown: `300 seconds` (stabilization window preventing rapid thrashing/oscillation)

### 6.3 Target Tracking Alternative
- Target metric: ALB Request Count Per Target = 1500 req/target/minute, or Average CPU = 50%.

---

## 7. Security Requirements

1. **Network Isolation**:
   - EC2 instances live exclusively in **Private Subnets**.
   - No public IPv4 addresses assigned to EC2 compute nodes.
   - ALB lives in **Public Subnets** and acts as the sole internet ingress.
2. **Security Group Rules**:
   - `ALB Security Group`: Ingress `80` (HTTP redirect) and `443` (HTTPS) from `0.0.0.0/0`.
   - `EC2 Security Group`: Ingress only on application port `3000` (or `80`) strictly sourced from `ALB Security Group ID`. No direct public SSH or HTTP.
   - Admin remote access managed via **AWS Systems Manager (SSM) Session Manager** without open port 22.
3. **IAM Least Privilege**:
   - EC2 Instance Profile granted only required CloudWatch metric publishing and read-only tags.
   - Admin API IAM role scoped to `autoscaling:Describe*`, `autoscaling:SetDesiredCapacity`, `cloudwatch:GetMetricData`.
4. **Encryption**:
   - SSL/TLS termination on ALB using AWS Certificate Manager (ACM).
   - In-transit encryption and encrypted EBS root volumes (AES-256 / KMS).

---

## 8. Implementation Timeline & Phase Roadmap

| Phase | Milestone | Focus Areas |
| :--- | :--- | :--- |
| **Phase 0** | **Planning & Requirements** *(Completed)* | Architecture design, technical stack, scaling specs, and structure documentation |
| **Phase 1** | **Core Applications Development** | Build Public Website (Home, About, Features, Contact) & Admin Dashboard with mock/live mode |
| **Phase 2** | **Backend & AWS Integration API** | Node/Express backend with AWS SDK v3, metric aggregation, and stress testing endpoint |
| **Phase 3** | **Containerization & CI/CD** | Dockerfile, Docker Compose local orchestration, and GitHub Actions workflow |
| **Phase 4** | **AWS Cloud Infrastructure Provisioning** | VPC, Subnets, ALB, Target Groups, Launch Templates, Auto Scaling Group, CloudWatch Alarms |
| **Phase 5** | **Load Testing, Validation & Verification** | Execute synthetic stress tests, verify scale-out/scale-in cycles, ALB health checks & zero-downtime |

---
*(Refer to this file at any time to review the website structure and requirements: `WEBSITE_STRUCTURE.md`)*
