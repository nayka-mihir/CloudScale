import * as awsService from '../services/awsService.js';

/**
 * GET /api/infrastructure/status
 * Returns current Auto Scaling Group capacity and healthy instance counts
 */
export async function getInfrastructureStatus(req, res, next) {
  try {
    const status = await awsService.getInfrastructureStatus();
    res.status(200).json({
      instances: status.instances,
      healthyInstances: status.healthyInstances,
      desiredCapacity: status.desiredCapacity,
      minCapacity: status.minCapacity,
      maxCapacity: status.maxCapacity,
      source: status.source,
      ...(status.warning ? { warning: status.warning } : {})
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/scaling/increase
 * Scale Up: Desired capacity + 1
 */
export async function scaleIncrease(req, res, next) {
  try {
    const result = await awsService.scaleUp();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/scaling/decrease
 * Scale Down: Desired capacity - 1
 */
export async function scaleDecrease(req, res, next) {
  try {
    const result = await awsService.scaleDown();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/metrics/cpu
 * Returns CPU utilization telemetry
 */
export async function getCpuMetrics(req, res, next) {
  try {
    const data = await awsService.getCpuMetrics();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/metrics/requests
 * Returns ALB request rate telemetry
 */
export async function getRequestMetrics(req, res, next) {
  try {
    const data = await awsService.getRequestMetrics();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/metrics/instances
 * Returns cluster EC2 instance metadata
 */
export async function getInstancesMetrics(req, res, next) {
  try {
    const data = await awsService.getInstanceMetrics();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
