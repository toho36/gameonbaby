import { NextResponse } from "next/server";
import { ApiError } from "~/utils/ApiError";
import { type ErrorResponse } from "~/utils/ErrorResponse";

export function withErrorHandling(
  handler: (req: Request) => Promise<NextResponse>,
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      // Call the actual route handler
      return await handler(req);
    } catch (error: unknown) {
      console.error("API Error:", error);

      // If the error is an instance of HTTPError, return a custom response
      if (error instanceof ApiError) {
        return NextResponse.json<ErrorResponse>(
          {
            message: error.message,
            code: error.internalCode,
          },
          { status: error.status },
        );
      }

      // Generic error handling
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      return NextResponse.json<ErrorResponse>(
        {
          message: errorMessage,
          code: "0",
          stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        },
        { status: 500 },
      );
    }
  };
}

