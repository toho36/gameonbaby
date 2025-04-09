import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest } from "next/server";

// Export a simple middleware function
export default function middleware(req: NextRequest) {
  return withAuth(req);
}

// Only protect these routes
export const config = {
  matcher: ["/dashboard/:path*", "/createEvent/:path*"],
};
