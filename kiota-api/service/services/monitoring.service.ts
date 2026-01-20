/**
 * Monitoring Service
 *
 * Tracks metrics, logs events, and triggers alerts for critical failures
 */

interface JobMetrics {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  totalStalled: number;
  recentFailures: Array<{
    jobId: string;
    queueName: string;
    error: string;
    timestamp: Date;
  }>;
}

interface AlertConfig {
  enabled: boolean;
  failureThreshold: number; // Alert after N consecutive failures
  stalledThreshold: number; // Alert after N stalled jobs
  webhookUrl?: string; // Slack/Discord webhook
  emailRecipients?: string[];
}

class MonitoringService {
  private metrics: Map<string, JobMetrics> = new Map();
  private alertConfig: AlertConfig;

  constructor(alertConfig?: Partial<AlertConfig>) {
    this.alertConfig = {
      enabled: alertConfig?.enabled ?? true,
      failureThreshold: alertConfig?.failureThreshold ?? 5,
      stalledThreshold: alertConfig?.stalledThreshold ?? 3,
      webhookUrl: alertConfig?.webhookUrl || process.env.ALERT_WEBHOOK_URL,
      emailRecipients: alertConfig?.emailRecipients || [],
    };
  }

  /**
   * Initialize metrics for a queue
   */
  initQueue(queueName: string): void {
    if (!this.metrics.has(queueName)) {
      this.metrics.set(queueName, {
        totalProcessed: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        totalStalled: 0,
        recentFailures: [],
      });
    }
  }

  /**
   * Record successful job completion
   */
  recordSuccess(queueName: string, jobId: string): void {
    const metrics = this.getMetrics(queueName);
    metrics.totalProcessed++;
    metrics.totalSucceeded++;

    // Clear recent failures on success (things are working again)
    if (metrics.recentFailures.length > 0) {
      console.log(`✅ [${queueName}] Recovery detected - clearing failure streak`);
      metrics.recentFailures = [];
    }

    this.logMetrics(queueName);
  }

  /**
   * Record failed job
   */
  recordFailure(queueName: string, jobId: string, error: Error): void {
    const metrics = this.getMetrics(queueName);
    metrics.totalProcessed++;
    metrics.totalFailed++;

    const failure = {
      jobId,
      queueName,
      error: error.message,
      timestamp: new Date(),
    };

    metrics.recentFailures.push(failure);

    // Keep only last 10 failures
    if (metrics.recentFailures.length > 10) {
      metrics.recentFailures.shift();
    }

    console.error(`❌ [${queueName}] Job ${jobId} failed: ${error.message}`);
    this.logMetrics(queueName);

    // Check if we should alert
    this.checkFailureThreshold(queueName);
  }

  /**
   * Record stalled job
   */
  recordStalled(queueName: string, jobId: string): void {
    const metrics = this.getMetrics(queueName);
    metrics.totalStalled++;

    console.warn(`⚠️  [${queueName}] Job ${jobId} stalled (worker may have crashed)`);
    this.logMetrics(queueName);

    // Check if we should alert
    this.checkStalledThreshold(queueName);
  }

  /**
   * Get metrics for a queue
   */
  getMetrics(queueName: string): JobMetrics {
    this.initQueue(queueName);
    return this.metrics.get(queueName)!;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, JobMetrics> {
    const result: Record<string, JobMetrics> = {};
    this.metrics.forEach((metrics, queueName) => {
      result[queueName] = { ...metrics };
    });
    return result;
  }

  /**
   * Get success rate for a queue
   */
  getSuccessRate(queueName: string): number {
    const metrics = this.getMetrics(queueName);
    if (metrics.totalProcessed === 0) return 100;
    return (metrics.totalSucceeded / metrics.totalProcessed) * 100;
  }

  /**
   * Log current metrics
   */
  private logMetrics(queueName: string): void {
    const metrics = this.getMetrics(queueName);
    const successRate = this.getSuccessRate(queueName);

    console.log(
      `📊 [${queueName}] Metrics: ` +
        `${metrics.totalSucceeded}✅ / ${metrics.totalFailed}❌ / ${metrics.totalStalled}⚠️  ` +
        `(${successRate.toFixed(1)}% success)`
    );
  }

  /**
   * Check if failure threshold exceeded and send alert
   */
  private checkFailureThreshold(queueName: string): void {
    if (!this.alertConfig.enabled) return;

    const metrics = this.getMetrics(queueName);
    const recentCount = metrics.recentFailures.length;

    if (recentCount >= this.alertConfig.failureThreshold) {
      this.sendAlert({
        severity: 'critical',
        title: `🚨 Critical: ${queueName} Queue Failures`,
        message:
          `${recentCount} consecutive failures detected in ${queueName} queue.\n\n` +
          `Recent failures:\n` +
          metrics.recentFailures
            .slice(-5)
            .map((f) => `• ${f.jobId}: ${f.error}`)
            .join('\n'),
        metadata: {
          queueName,
          failureCount: recentCount,
          successRate: this.getSuccessRate(queueName),
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Check if stalled threshold exceeded and send alert
   */
  private checkStalledThreshold(queueName: string): void {
    if (!this.alertConfig.enabled) return;

    const metrics = this.getMetrics(queueName);

    if (metrics.totalStalled >= this.alertConfig.stalledThreshold) {
      this.sendAlert({
        severity: 'warning',
        title: `⚠️  Warning: ${queueName} Stalled Jobs`,
        message:
          `${metrics.totalStalled} jobs have stalled in ${queueName} queue.\n` +
          `This may indicate worker crashes or resource issues.`,
        metadata: {
          queueName,
          stalledCount: metrics.totalStalled,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Send alert to configured channels
   */
  private async sendAlert(alert: {
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    console.error('\n' + '═'.repeat(60));
    console.error(`🚨 ALERT [${alert.severity.toUpperCase()}]`);
    console.error(`📋 ${alert.title}`);
    console.error(alert.message);
    if (alert.metadata) {
      console.error('\n📊 Metadata:', JSON.stringify(alert.metadata, null, 2));
    }
    console.error('═'.repeat(60) + '\n');

    // Send to webhook (Slack/Discord)
    if (this.alertConfig.webhookUrl) {
      try {
        await this.sendWebhookAlert(alert);
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }

    // Send email alerts (implement if needed)
    if (this.alertConfig.emailRecipients && this.alertConfig.emailRecipients.length > 0) {
      // TODO: Implement email alerts
      console.log(`📧 Would send email to: ${this.alertConfig.emailRecipients.join(', ')}`);
    }
  }

  /**
   * Send alert to webhook (Slack/Discord)
   */
  private async sendWebhookAlert(alert: {
    severity: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.alertConfig.webhookUrl) return;

    const color = alert.severity === 'critical' ? 'danger' : 'warning';
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';

    // Slack-compatible webhook payload
    const payload = {
      text: `${emoji} ${alert.title}`,
      attachments: [
        {
          color,
          text: alert.message,
          fields: alert.metadata
            ? Object.entries(alert.metadata).map(([key, value]) => ({
                title: key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                short: true,
              }))
            : [],
          footer: 'Kiota API Monitoring',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(this.alertConfig.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(queueName?: string): void {
    if (queueName) {
      this.metrics.delete(queueName);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    healthy: boolean;
    queues: Record<
      string,
      {
        successRate: number;
        recentFailures: number;
        totalStalled: number;
        status: 'healthy' | 'degraded' | 'critical';
      }
    >;
  } {
    const queues: Record<string, any> = {};
    let globalHealthy = true;

    this.metrics.forEach((metrics, queueName) => {
      const successRate = this.getSuccessRate(queueName);
      const recentFailures = metrics.recentFailures.length;

      let status: 'healthy' | 'degraded' | 'critical';
      if (recentFailures >= this.alertConfig.failureThreshold || successRate < 50) {
        status = 'critical';
        globalHealthy = false;
      } else if (recentFailures > 0 || successRate < 90) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      queues[queueName] = {
        successRate: Number(successRate.toFixed(2)),
        recentFailures,
        totalStalled: metrics.totalStalled,
        status,
      };
    });

    return {
      healthy: globalHealthy,
      queues,
    };
  }
}

// Singleton instance
export const monitoringService = new MonitoringService({
  enabled: process.env.ENABLE_ALERTS !== 'false',
  failureThreshold: Number(process.env.FAILURE_ALERT_THRESHOLD || 5),
  stalledThreshold: Number(process.env.STALLED_ALERT_THRESHOLD || 3),
  webhookUrl: process.env.ALERT_WEBHOOK_URL,
});

export default MonitoringService;
