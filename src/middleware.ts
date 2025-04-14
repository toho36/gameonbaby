import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define paths where we don't need to check authentication
const publicPaths = ["/", "/api/auth", "/login", "/register"];

async function syncUser(
  userId: string,
  email: string | null | undefined,
  name: string,
) {
  try {
    // Check if user exists in our database
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ kindeId: userId }, { email: email || "" }],
      },
    });

    // If not found, create new user
    if (!user) {
      await prisma.user.create({
        data: {
          kindeId: userId,
          email: email || "",
          name: name,
          // @ts-ignore: Property 'role' does not exist
          role: "USER",
        },
      });
    }
    // If found but doesn't have kindeId, update it
    else if (user && !user.kindeId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // @ts-ignore: Property 'kindeId' does not exist
          kindeId: userId,
        },
      });
    }
  } catch (error) {
    // Silently handle error
  }
}

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

  // If authenticated, sync user to database
  const name =
    `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim();

  // Don't await this to avoid slowing down response
  syncUser(kindeUser.id, kindeUser.email, name).catch(console.error);

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
