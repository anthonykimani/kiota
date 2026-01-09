import { Template } from "../../enums/Template";
import { renderExceptionContent } from "../templates";


export class Exception extends Error {
  private service = process.env.SERVICE_NAME;
  private nodeEnv = process.env.NODE_ENV;

  /**
   * @param error Error | Error message
   * @param errorCode Error code
   * @param severity Severity of error - critical, major, minor, low
   * @param log Error log, stack traces ...
   */
  constructor(
    error: string | unknown,
    errorCode: number,
    severity: "critical" | "major" | "minor" | "low",
    log?: any,
    location?: string
  ) {
    let message = "Unknown";

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }

    super(message);
    this.name = `Exception`;
    this.log(message, errorCode, severity, log, location);
  }

  /**
   * Log custom error
   * @param message
   * @param errorCode
   * @param severity
   * @param log
   * @returns
   */
  private log(
    message: string,
    errorCode: number,
    severity: "critical" | "major" | "minor" | "low",
    log?: any,
    location?: string
  ) {
    // Log error to logs file within the /logs directory
    if (this.nodeEnv != "production") {
      console.log(this.name, message, errorCode, severity, log);
    }

    if (severity === "critical" || severity == "major") {
      this.notify(message, errorCode, severity, log, location);
    }

    if (message) {
      return `${errorCode} | ${severity} | ${message}`;
    } else {
      return `500 | "major" | Unknown error occurred`;
    }
  }

  /**
   *  Send error as email notification
   * @param message
   * @param errorCode
   * @param severity
   * @param log
   */
  private async notify(
    message: string,
    errorCode: number,
    severity: "critical" | "major" | "minor" | "low",
    log?: any,
    location?: string
  ) {
    const subject = `${this.service}: ${severity} ${this.name}`;
    const body = renderExceptionContent(Template.EXCEPTION, {
      service: this.service,
      title: `${this.service}: ${this.name}`,
      message: message,
      errorCode: errorCode,
      severity: severity,
      location: location,
      log: log,
      type: this.name,
      time: new Date(),
    });

    // notifyAdmin(subject, body);
  }
}
