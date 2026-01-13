import { IResponse } from "../interfaces/IResponse";

class Controller {
  /**
   * Standard response
   * @param status Response status
   * @param message Response message
   * @param data Response payload
   * @param errors errors
   * @returns Response
   */
  public static response(status: any, data?: any, errors?: string[]) {
    let _res: IResponse = {
      status: status.code,
      message: status.message,
      data: data,
      errors: errors ? errors : [],
    };

    return _res;
  }

  /**
   * Handle exception message
   * @param ex any
   * @returns array
   */
  public static ex(error: any) {
    if (error instanceof Error) {
      return [error.message];
    } else {
      return [Controller._500.message];
    }
  }

  /**
   * Http status codes
   */
  protected static _200 = { code: 200, message: "OK" };
  protected static _201 = { code: 201, message: "Created" };
  protected static _400 = { code: 400, message: "Bad Request" };
  protected static _401 = { code: 401, message: "Unauthorized" };
  protected static _403 = { code: 403, message: "Forbidden" };
  protected static _404 = { code: 404, message: "Not Found" };
  protected static _408 = { code: 408, message: "Request Timeout" };
  protected static _429 = { code: 429, message: "Too Many Requests" };
  protected static _500 = { code: 500, message: "Internal Server Error" };
  protected static _503 = { code: 503, message: "Service Unavailable" };
}

export default Controller;
