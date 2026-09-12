# Phase 1: Build the Applications

## 1. Objectives
Build and verify the applications locally before deploying cloud infrastructure.
Ensure clean modular codebase structure in pure JavaScript, with containerization files and instance identification endpoints ready.

## 2. Directory Structure Implemented
```
cloudscale/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, UI elements
│   │   ├── pages/            # Home, About, Features, Contact, AdminDashboard
│   │   ├── layouts/          # MainLayout
│   │   ├── services/         # Axios API client (api.js)
│   │   ├── App.jsx           # App routing & telemetry coordination
│   │   └── index.css         # Tailwind CSS imports & glassmorphism
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── controllers/      # healthController, metricsController
│   │   ├── routes/           # apiRoutes
│   │   ├── services/         # instanceService, scalingService
│   │   ├── middleware/       # requestLogger, errorHandler
│   │   ├── config/           # index.js environment configuration
│   │   ├── app.js            # Express app assembly
│   │   └── server.js         # HTTP listener entrypoint
│   ├── package.json
│   └── Dockerfile
│
├── infrastructure/           # AWS architecture blueprints
├── docker/                   # docker-compose.yml
├── scripts/                  # start-local.ps1, start-local.sh
├── docs/                     # Persistent documentation across all phases
└── README.md
```

## 3. Basic & Instance Identification Endpoints

### 3.1 `GET /api/health`
Validates container and instance operational readiness for ALB target group probes.
```json
{
  "status": "healthy",
  "hostname": "Dell-15",
  "version": "1.0.0",
  "uptime": 45,
  "timestamp": "2026-09-12T07:00:21.007Z"
}
```

### 3.2 `GET /api/info`
Returns general application and environment metadata.
```json
{
  "status": "healthy",
  "hostname": "ip-10-0-2-15",
  "version": "1.0.0",
  "environment": "development",
  "region": "ap-south-1"
}
```

### 3.3 `GET /api/server-info`
Provides unique instance identification for demonstrating ALB load distribution across instances and availability zones.
```json
{
  "instanceId": "i-0123456789",
  "hostname": "ip-10-0-1-25",
  "availabilityZone": "ap-south-1a",
  "privateIp": "10.0.1.25",
  "loadBalancedVia": "AWS ALB Target Group"
}
```

#### Why Hostname & Instance ID Matter
When an Application Load Balancer distributes requests across the auto-scaling fleet:
- Request 1 ➔ `EC2-A` (`i-0123456789`, `ap-south-1a`)
- Request 2 ➔ `EC2-B` (`i-0987654321`, `ap-south-1b`)
- Request 3 ➔ `EC2-C` (`i-0456789123`, `ap-south-1a`)

Users and evaluators can visually observe live traffic routing in action.

## 4. Frontend Application Integration
- **Public Website (`cloudscale.com`)**:
  - `Home`: Features a live "Serving Target Node" badge querying `/api/server-info` with a "Next Request" button to demonstrate ALB round-robin.
  - `About`: Outlines AWS high-availability philosophy and private subnet isolation.
  - `Features`: Includes an interactive latency ping tool and instance inspector.
  - `Contact`: Real transactional form dispatching `POST /api/contact` to generate request load.
- **Admin Dashboard (`admin.cloudscale.com`)**:
  - Monitors all 7 metrics (EC2 Instances, Healthy Instances, CPU Usage, Requests/min, Desired/Min/Max Capacity).
  - Provides controls to adjust capacity and trigger simulated CPU load tests (`CPU > 70%`).
