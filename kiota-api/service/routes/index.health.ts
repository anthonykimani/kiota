import { Router } from 'express';
import HealthController from '../controllers/health.controller';

const router = Router();

/**
 * Health Check Routes
 *
 * These endpoints are used by:
 * - Load balancers (readiness/liveness probes)
 * - Monitoring systems (Datadog, New Relic, etc.)
 * - Uptime monitors (Pingdom, UptimeRobot, etc.)
 */

// Basic health check (no authentication required)
router.get('/', HealthController.basic);

// Detailed health check with all subsystem status
router.get('/detailed', HealthController.detailed);

// Queue metrics
router.get('/metrics/queues', HealthController.queueMetrics);

// Kubernetes-style readiness probe
router.get('/ready', HealthController.readiness);

// Kubernetes-style liveness probe
router.get('/live', HealthController.liveness);

export default router;
