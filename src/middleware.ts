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
      console.log("Created new user for:", email);
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
      console.log("Updated kindeId for user:", email);
    }
  } catch (error) {
    console.error("Error syncing user:", error);
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

  // If authenticated, sync user to database
  if (kindeUser && kindeUser.id) {
    const name =
      `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim();

    // Don't await this to avoid slowing down response
    syncUser(kindeUser.id, kindeUser.email, name).catch(console.error);
  }

  return NextResponse.next();
}

// Only protect these routes
export const config = {
  matcher: ["/dashboard/:path*", "/createEvent/:path*"],
};
