# Phase 0: Planning & Requirements

## 1. Objectives
Define complete architectural requirements and design specifications before writing infrastructure or deployment code.

## 2. User Personas
- **Public User**: Visits `cloudscale.com` to explore product features, examine live cluster status, and submit inquiries (generating realistic HTTP request load).
- **Admin / DevOps**: Visits `admin.cloudscale.com` to observe real-time telemetry (EC2 nodes, ALB request rates, CPU %) and trigger scaling actions or load stress tests.

## 3. Applications
- **Application A (Public Website)**:
  - Landing pages: Home, About, Features, Contact.
  - Interactive ping latency tool and live serving node identification.
- **Application B (Admin Dashboard)**:
  - 7 Core Metrics: EC2 Instances, Healthy Instances, CPU Usage, Requests/min, Desired Capacity, Min Capacity, Max Capacity.
  - Controls: Increase Capacity (+1), Decrease Capacity (-1), Start/Stop Load Test.

## 4. Technology Stack
- **Frontend**: React (JavaScript/JSX), Vite, Tailwind CSS, Axios, Lucide React, Recharts.
- **Backend**: Node.js (ES modules), Express.js, AWS SDK v3.
- **Infrastructure**: AWS (VPC, Multi-AZ EC2, ALB, ASG, Route 53, CloudWatch, IAM, ACM).
- **DevOps**: Docker, Docker Compose, Git, GitHub Actions.

## 5. Scaling Rules
- **Capacity Bounds**: Min = 2, Desired = 2/3, Max = 6.
- **Scale-Out**: Average CPU &gt; 70% (eval 2 mins, adds +1 node, 300s cooldown).
- **Scale-In**: Average CPU &lt; 30% (eval 5 mins, drains -1 node, 300s stabilization).

## 6. Security Model
- Isolated private subnets for compute instances.
- ALB in public subnets as single ingress point.
- Security Group chaining with strict ingress restriction.
