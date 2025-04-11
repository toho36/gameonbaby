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
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (error: any) {
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
      return NextResponse.json<ErrorResponse>(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        {
          message: error.message || "Internal Server Error",
          code: "0",
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 },
      );
    }
  };
}
