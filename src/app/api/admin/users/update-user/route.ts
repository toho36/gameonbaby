import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

// Function to check if user has admin or moderator permission
async function checkPermission(kindeUser: any) {
  const currentUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: kindeUser.email }],
    },
  });

  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")
  ) {
    return null;
  }

  return currentUser;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUser = await checkPermission(kindeUser);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    // Parse the request body
    const data = await request.json();
    const { userId, name, email, phone } = data;

    // Validate required fields
    if (!userId || !name || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user exists by id first, then fallback to email (accept either)
    let userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      // Try finding by email if an id match wasn't found
      userExists = await prisma.user.findFirst({
        where: { email: userId },
      });
    }

    if (!userExists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Update user information (use resolved id)
    const updatedUser = await prisma.user.update({
      where: { id: userExists.id },
      data: {
        name,
        email,
        phoneNumber: phone,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user",
      },
      { status: 500 },
    );
  }
}
