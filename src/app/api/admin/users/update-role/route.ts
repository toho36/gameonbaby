import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

// Role types to match the database enum
type UserRole = "USER" | "MODERATOR" | "ADMIN";

interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  emailVerified: Date | null;
  image: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Kinde
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the admin user in database
    const adminUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: kindeUser.email }],
      },
    })) as unknown as DbUser;

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    // Get the request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role || !["USER", "MODERATOR", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 },
      );
    }

    // Update the user's role
    const updatedUser = (await prisma.user.update({
      where: { id: userId },
      data: {
        // @ts-ignore: Property 'role' does not exist
        role: role as UserRole,
      },
    })) as unknown as DbUser;

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user role",
      },
      { status: 500 },
    );
  }
}
