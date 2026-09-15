# Docker & Docker Compose — Master Engineering & Production Guide

This document is a permanent, standalone reference guide on **Docker and Docker Compose** concepts, line-by-line file explanations, multi-stage optimization strategies, and real-world production practices.

---

## 1. Why Docker? The Core Problem Solved

### The Problem in Traditional Deployments
- **Environment Inconsistency**: Code runs fine on developer's laptop (macOS/Windows) but crashes on the server (Linux) due to different library versions or OS paths.
- **Dependency Conflicts**: Two services requiring different Node.js or Python versions on the same server.
- **Slow Scalability**: Setting up a new server from scratch takes 15–30 minutes (installing OS packages, cloning, building).

### The Docker Solution
Docker packages your **code, runtime engine, system libraries, and environment settings** into an isolated container. If it runs in Docker, it runs **identically** on your local machine, staging, AWS EC2, AWS ECS, or Kubernetes.

---

## 2. Core Mental Model: Images vs. Containers

| Entity | Analogy | Characteristics |
| :--- | :--- | :--- |
| **Dockerfile** | The Recipe / Blueprint | A plain text file defining step-by-step instructions to create an image. |
| **Docker Image** | The Baked Cake (Snapshot) | An immutable, read-only package containing OS layers, libraries, and built code. |
| **Docker Container** | An Active Instance | A running process instantiated from an image. You can run 5 identical containers from 1 image. |
| **Docker Compose** | The Orchestrator | A YAML configuration coordinating multiple interconnected containers, networks, and volumes. |

---

## 3. Deep Dive: Dockerfile Instructions & Optimization

### 3.1 Understanding Key Instructions

| Instruction | Purpose | Production Best Practice |
| :--- | :--- | :--- |
| `FROM` | Defines the base image layer. | Use minimal variants like `node:20-alpine` (~50MB) instead of full OS (~1GB). |
| `WORKDIR` | Sets the working directory inside container. | Always set an explicit path like `/app` instead of building in root `/`. |
| `COPY` | Copies files from host machine into container. | Copy `package*.json` first to leverage **Layer Caching**. |
| `RUN` | Executes build commands during image creation. | Use `npm ci` (clean install from lockfile) instead of `npm install`. |
| `ENV` | Sets environment variables inside container. | Set `NODE_ENV=production` for faster runtime performance. |
| `EXPOSE` | Documents ports the container listens on. | Informs developers and cloud load balancers of open ports. |
| `CMD` | Default command executed when container starts. | Use JSON array format: `CMD ["node", "src/server.js"]`. |

---

### 3.2 The Secret of Docker Layer Caching
Docker builds images layer by layer. If a layer hasn't changed, Docker reuses the cached version.

```dockerfile
# ❌ BAD PRACTICE (Cache gets invalidated on every code edit):
COPY . .
RUN npm install

# ✅ PRODUCTION BEST PRACTICE (Leverages Layer Caching):
COPY package*.json ./
RUN npm ci          # <-- Docker caches this! Re-runs ONLY if package.json changes.
COPY . .            # <-- Only this layer rebuilds when you edit code.
```

---

## 4. Multi-Stage Builds: Why & How

In production, your source code, build tools (Vite, TypeScript, Babel), and `devDependencies` should **never** be shipped into the final container.

### Visualizing Multi-Stage Architecture:
```
┌────────────────────────────────────────────────────────┐
│ Stage 1: Frontend Builder (node:20-alpine)             │
│ • Runs Vite compiler                                   │
│ • Outputs static bundle to: /app/frontend/dist         │
└───────────────────────────┬────────────────────────────┘
                            │ (Copies only /dist)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Stage 2: Backend Dependencies (node:20-alpine)         │
│ • Runs: npm ci --omit=dev                              │
│ • Creates clean production node_modules/               │
└───────────────────────────┬────────────────────────────┘
                            │ (Copies only node_modules)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Stage 3: Final Lean Production Runner (~120 MB total)   │
│ • Has built static assets                              │
│ • Has backend server code & production dependencies    │
│ • Discards all compiler tools and temp files           │
└────────────────────────────────────────────────────────┘
```

### Complete Unified Production Dockerfile Example:
```dockerfile
# ==============================================================================
# Multi-Stage Dockerfile for CloudScale Platform
# ==============================================================================

# STAGE 1: Build Frontend React Assets
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

# STAGE 3: Lightweight Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV ADMIN_PORT=8080
ENV SIMULATE_AWS=true
ENV FRONTEND_DIST_PATH=/app/dist

# Copy production dependencies & backend code
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend static assets
COPY --from=frontend-builder /app/frontend/dist ./dist

EXPOSE 80 8080

WORKDIR /app/backend
CMD ["node", "src/server.js"]
```

---

## 5. Deep Dive: Docker Compose (`docker-compose.yml`)

### Line-by-Line Breakdown of `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Service 1: Backend API
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: cloudscale-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
      - AWS_REGION=ap-south-1
      - AWS_ASG_NAME=cloudscale-asg
      - SIMULATE_AWS=true
    networks:
      - cloudscale-net

  # Service 2: Frontend Client
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: cloudscale-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - cloudscale-net

# Dedicated Isolated Bridge Network
networks:
  cloudscale-net:
    driver: bridge
```

### Key Compose Parameters Explained:
1. **`build.context`**: The relative folder path where the source code is located.
2. **`container_name`**: Custom name for the container (visible in `docker ps`).
3. **`restart: unless-stopped`**: Production reliability rule. If the container crashes or the server reboots, Docker automatically restarts it.
4. **`ports: ["HOST:CONTAINER"]`**:
   - Left number: Port on the host machine (e.g. EC2 server).
   - Right number: Port inside the isolated container.
5. **`environment`**: Injects environment variables directly into `process.env`.
6. **`networks` (Bridge Network)**: Allows containers to discover and communicate with each other using **DNS names** (e.g., `http://backend:5000`) rather than brittle dynamic IP addresses.
7. **`depends_on`**: Dictates the boot sequence so dependencies launch first.

---

## 6. The `.dockerignore` File (Crucial)

Always create a `.dockerignore` file alongside your Dockerfile. This prevents huge, host-specific files from being copied into the container:

```
node_modules
dist
build
.git
.env
.DS_Store
npm-debug.log
```

---

## 7. Essential Docker CLI Cheat Sheet

### Building & Running:
```bash
# Build an image with a tag name
docker build -t cloudscale-app:latest .

# Run container in background with port forwarding
docker run -d --name cloudscale -p 80:80 -p 8080:8080 cloudscale-app:latest

# View active containers
docker ps

# View container logs in real time
docker logs -f cloudscale

# Execute an interactive shell inside a running container
docker exec -it cloudscale sh

# Stop and remove container
docker stop cloudscale
docker rm cloudscale
```

### Docker Compose Commands:
```bash
# Build and start all services in background
docker compose up -d --build

# View combined logs of all services
docker compose logs -f

# Check status of compose services
docker compose ps

# Stop and tear down all containers and networks
docker compose down

# Stop and remove volumes as well
docker compose down -v
```

---

## 8. Summary for Production & AWS Deployments

1. **Small Images = Fast Auto-Scaling**:
   Using `node:20-alpine` and multi-stage builds reduces image size to ~120MB, allowing AWS EC2 Auto-Scaling to boot and initialize new instances in **under 30 seconds**.
2. **Stateless Containers**:
   Do not store user-uploaded files or databases inside the container filesystem. Store state in **Amazon S3, Amazon EFS, or Amazon RDS**.
3. **Graceful Restarts**:
   Always set `restart: unless-stopped` or use an OS init system like `systemd` to keep containers running 24/7.
