import { Request, Response } from 'express';
import Controller from './controller';
import { monitoringService } from '../services/monitoring.service';
import { checkQueueHealth } from '../configs/queue.config';
import AppDataSource from '../configs/ormconfig';

/**
 * Health Controller
 *
 * Provides health check endpoints for monitoring systems
 */
class HealthController extends Controller {
  /**
   * Basic health check
   * Returns 200 if service is running
   */
  public static async basic(req: Request, res: Response) {
    return res.send(
      super.response(super._200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    );
  }

  /**
   * Detailed health check
   * Checks database, Redis, and queue metrics
   */
  public static async detailed(req: Request, res: Response) {
    try {
      const checks: Record<string, any> = {};

      // Check database connection
      try {
        if (AppDataSource.isInitialized) {
          await AppDataSource.query('SELECT 1');
          checks.database = { status: 'healthy', connected: true };
        } else {
          checks.database = { status: 'unhealthy', connected: false };
        }
      } catch (error: any) {
        checks.database = {
          status: 'unhealthy',
          error: error.message,
        };
      }

      // Check Redis/Queue connection
      try {
        const queueHealthy = await checkQueueHealth();
        checks.redis = {
          status: queueHealthy ? 'healthy' : 'unhealthy',
          connected: queueHealthy,
        };
      } catch (error: any) {
        checks.redis = {
          status: 'unhealthy',
          error: error.message,
        };
      }

      // Get queue metrics
      const healthStatus = monitoringService.getHealthStatus();
      checks.queues = healthStatus.queues;

      // Determine overall health
      const allHealthy =
        checks.database.status === 'healthy' &&
        checks.redis.status === 'healthy' &&
        healthStatus.healthy;

      return res.send(
        super.response(allHealthy ? super._200 : super._503, {
          status: allHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          checks,
        })
      );
    } catch (error) {
      return res.send(
        super.response(super._500, {
          status: 'unhealthy',
          error: super.ex(error),
        })
      );
    }
  }

  /**
   * Queue metrics endpoint
   * Returns detailed metrics for all queues
   */
  public static async queueMetrics(req: Request, res: Response) {
    try {
      const metrics = monitoringService.getAllMetrics();

      const formattedMetrics: Record<string, any> = {};
      Object.entries(metrics).forEach(([queueName, queueMetrics]) => {
        formattedMetrics[queueName] = {
          ...queueMetrics,
          successRate: monitoringService.getSuccessRate(queueName),
        };
      });

      return res.send(
        super.response(super._200, {
          timestamp: new Date().toISOString(),
          queues: formattedMetrics,
        })
      );
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * Readiness check
   * Returns 200 when service is ready to accept traffic
   */
  public static async readiness(req: Request, res: Response) {
    try {
      // Check critical dependencies
      const dbReady = AppDataSource.isInitialized;
      const redisReady = await checkQueueHealth();

      if (dbReady && redisReady) {
        return res.send(
          super.response(super._200, {
            status: 'ready',
            database: dbReady,
            redis: redisReady,
          })
        );
      } else {
        return res.send(
          super.response(super._503, {
            status: 'not_ready',
            database: dbReady,
            redis: redisReady,
          })
        );
      }
    } catch (error) {
      return res.send(
        super.response(super._503, {
          status: 'not_ready',
          error: super.ex(error),
        })
      );
    }
  }

  /**
   * Liveness check
   * Returns 200 if process is alive
   */
  public static async liveness(req: Request, res: Response) {
    return res.send(
      super.response(super._200, {
        status: 'alive',
        timestamp: new Date().toISOString(),
      })
    );
  }
}

export default HealthController;
