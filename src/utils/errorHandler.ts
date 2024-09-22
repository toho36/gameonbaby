import {NextResponse} from "next/server";
import {ApiError} from "~/utils/ApiError";
import {ErrorResponse} from "~/utils/ErrorResponse";

export function withErrorHandling(handler: (req: Request) => Promise<NextResponse>) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      // Call the actual route handler
      return await handler(req);
    } catch (error: any) {
      // If the error is an instance of HTTPError, return a custom response
      if (error instanceof ApiError) {
        return NextResponse.json<ErrorResponse>({
          message: error.message,
          code: error.internalCode
        }, {status: error.status});
      }

      // Generic error handling
      return NextResponse.json<ErrorResponse>(
        {message: error.message || 'Internal Server Error', code: 500},
        {status: 500}
      );
    }
  };
}
