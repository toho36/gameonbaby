import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Define paths where we don't need to check authentication
const publicPaths = ["/", "/api/auth", "/login", "/register"];

export async function middleware(request: NextRequest) {
  // Pass through public routes or auth routes
  if (publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get authenticated user from Kinde
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  // If user is not authenticated, redirect to login
  if (!kindeUser || !kindeUser.id) {
    // Construct login URL - use Kinde's login endpoint
    const baseUrl =
      process.env.KINDE_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    // Store the URL that was attempted to be accessed
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);

    // Redirect to login
    return NextResponse.redirect(
      `${baseUrl}/api/auth/login?post_login_redirect_url=${callbackUrl}`,
    );
  }

  // If authenticated, user sync is handled lazily in userService
  // syncKindeUser() removed to avoid DB query on every request
  // The sync will happen on-demand when user data is actually needed

  return NextResponse.next();
}

// Only protect these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/createEvent/:path*",
    "/profile/:path*",
    "/profile",
  ],
};
