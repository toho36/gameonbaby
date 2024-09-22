
export class ApiError extends Error {
  status: number;
  internalCode: string;

  constructor(message: string, status: number, internalCode: string) {
    super(message);
    this.status = status;
    this.internalCode = internalCode;
  }
}
