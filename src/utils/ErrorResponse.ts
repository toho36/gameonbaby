export class ErrorResponse {
  code: string;
  message: string;
  stack?: string;

  constructor(code: string, message: string, stack?: string) {
    this.code = code;
    this.message = message;
    this.stack = stack;
  }
}
