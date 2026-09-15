# CloudScale — Real AWS Telemetry & Live Code Updates Guide

This guide explains two essential operations for the **CloudScale** project:
1. **How to connect the dashboard to real AWS telemetry** (real EC2 instance IDs, CloudWatch metrics, and Auto Scaling controls).
2. **How to update your application code on live auto-scaled EC2 instances** (rolling updates with zero downtime).

---

## Part 1: Connecting to Real AWS Telemetry

By default, the CloudScale backend runs in **Simulation Mode** so you can develop offline and demo the dashboard without an active AWS bill. 

To switch to **real AWS data** on an active AWS deployment, follow these three steps:

### 1. Create and Attach an IAM Instance Profile Role
Never hardcode AWS Access Keys into the application or `.env` files in production. Instead, AWS uses the default credential provider chain via the EC2 **IAM Instance Profile**:

1. Go to the **AWS Management Console** ➔ **IAM** ➔ **Roles** ➔ Click **Create Role**.
2. **Trusted entity type**: Select **AWS service**.
3. **Use case**: Select **EC2**.
4. **Permissions policies**: Search and attach the following policies:
   - `AutoScalingFullAccess` (allows reading and adjusting ASG desired capacity).
   - `CloudWatchReadOnlyAccess` (allows querying real CPU utilization telemetry).
   - `AmazonEC2ReadOnlyAccess` (allows fetching real instance metadata, states, and IPs).
5. **Role name**: `CloudScale-EC2-Role`.
6. Click **Create role**.
7. Attach this role to your **Base EC2 Instance** and to your **Launch Template**.

### 2. Configure Backend Environment Variables
On your EC2 instance (or in your production `.env` / `docker-compose.yml`), set the following:

```env
PORT=5000
NODE_ENV=production
AWS_REGION=ap-south-1
AWS_ASG_NAME=cloudscale-asg

# Set SIMULATE_AWS to false to enable real AWS SDK calls
SIMULATE_AWS=false
```

### 3. What Happens on Your Dashboard
When `SIMULATE_AWS=false`:
- **Real Instance Metadata**: The backend calls `DescribeInstances` and displays your actual EC2 instance IDs (e.g., `i-0a81b2c3d4e5f001`), private IP addresses, and Availability Zones (`ap-south-1a`, `ap-south-1b`).
- **Real CloudWatch Metrics**: The backend calls `GetMetricData` to fetch 1-minute historical CPU utilization data points directly from CloudWatch.
- **Real Auto-Scaling Actions**: Clicking **[Increase Capacity]** or **[Decrease Capacity]** issues a real `SetDesiredCapacityCommand` to your Auto Scaling Group, visibly launching or terminating EC2 instances in your AWS Console.

---

## Part 2: Updating Application Code on Live AWS Clusters

Because an Auto Scaling Group provisions instances using a **Launch Template** or **AMI**, simply committing code to GitHub will not automatically change already running instances.

Below are the two standard approaches to deploy code updates to your live application:

---

### Method A: Rolling Update via Instance Refresh (Industry Standard / Zero Downtime) ⭐

Use this method when you want to update code in a production environment without dropping any user traffic:

1. **Push your code updates to GitHub**:
   ```bash
   git add .
   git commit -m "Update frontend UI and backend features"
   git push origin main
   ```

2. **Pull and test on your Base EC2 instance**:
   ```bash
   cd /home/ec2-user/CloudScale
   git pull origin main
   cd docker
   sudo docker compose up -d --build
   ```

3. **Create a new AMI**:
   - In EC2 Console ➔ Select your instance ➔ **Actions ➔ Image and templates ➔ Create image**.
   - Name: `CloudScale-Golden-AMI-v2`.

4. **Update the Launch Template**:
   - Go to **EC2 ➔ Launch Templates** ➔ Select `cloudscale-launch-template`.
   - Click **Actions ➔ Modify template (Create new version)**.
   - Update the AMI to `CloudScale-Golden-AMI-v2`.
   - Set this new version as the **Default version**.

5. **Trigger Instance Refresh in Auto Scaling**:
   - Go to **EC2 ➔ Auto Scaling Groups** ➔ Select `cloudscale-asg`.
   - Navigate to the **Instance Refresh** tab ➔ Click **Start Instance Refresh**.
   - Set Minimum healthy percentage to `50%` or `100%`.
   - Click **Start Instance Refresh**.

#### What AWS does automatically:
- AWS launches a new instance running your new AMI.
- Waits for it to pass the ALB health checks on `/api/health`.
- Gracefully terminates one old instance.
- Repeats until all cluster instances are running the new version.
- **Zero downtime**: Users never experience an outage!

---

### Method B: Git Pull on Boot (Fastest for Development & Testing)

If you are developing actively and do not want to create a new AMI for every small change:

1. Configure your **Launch Template User Data** to pull from GitHub whenever an instance boots up:
   ```bash
   #!/bin/bash
   sudo systemctl start docker
   cd /home/ec2-user/CloudScale
   git pull origin main
   cd docker
   sudo docker compose up -d --build
   ```

2. **Deploying updates**:
   - Push your changes to GitHub:
     ```bash
     git push origin main
     ```
   - In the **AWS EC2 Console**, select your running cluster instances and click **Instance state ➔ Terminate instance**.
   - The Auto Scaling Group will immediately detect that the capacity fell below the desired level and will automatically launch replacement instances.
   - The new instances boot up, run `git pull`, build the latest containers, and join the load balancer with your latest changes live!
