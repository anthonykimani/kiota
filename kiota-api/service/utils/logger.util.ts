/**
 * Logger Utility
 *
 * Provides structured logging with levels and context
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string;
  transactionId?: string;
  depositSessionId?: string;
  jobId?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext;
  private service: string;

  constructor(service: string, context: LogContext = {}) {
    this.service = service;
    this.context = context;
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(this.service, { ...this.context, ...additionalContext });
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | string, meta?: Record<string, any>): void {
    const errorMeta = error instanceof Error
      ? { error: error.message, stack: error.stack, ...meta }
      : { error, ...meta };

    this.log(LogLevel.ERROR, message, errorMeta);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.service,
      message,
      ...this.context,
      ...meta,
    };

    // Format based on environment
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse in log aggregators)
      console.log(JSON.stringify(logEntry));
    } else {
      // Human-readable format for development
      const emoji = this.getLevelEmoji(level);
      const contextStr = Object.keys({ ...this.context, ...meta }).length > 0
        ? ` ${JSON.stringify({ ...this.context, ...meta })}`
        : '';

      console.log(`${emoji} [${timestamp}] [${this.service}] ${message}${contextStr}`);
    }
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  /**
   * Log async operation start
   */
  async withTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    meta?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    this.info(`Starting: ${operation}`, meta);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed: ${operation}`, { ...meta, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${operation}`, error as Error, { ...meta, duration });
      throw error;
    }
  }
}

/**
 * Create logger for a service
 */
export function createLogger(service: string, context?: LogContext): Logger {
  return new Logger(service, context);
}

/**
 * Default logger instance
 */
export const logger = new Logger('kiota-api');

export default Logger;
