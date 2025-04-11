export class ApiError extends Error {
  status: number;
  internalCode: string;

  constructor(message: string, status: number, internalCode: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.internalCode = internalCode;

    // Captures the stack trace in modern JavaScript engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}
