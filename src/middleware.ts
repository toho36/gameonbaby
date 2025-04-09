import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  return withAuth(req, {
    isReturnToCurrentPage: true,
    authUrl: process.env.NEXT_PUBLIC_KINDE_AUTH_URL,
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/createEvent/:path*", "/api/auth/:path*"],
};
