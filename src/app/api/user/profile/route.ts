import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

// Define user interface with role and createdAt properties
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  createdAt: Date;
  emailVerified: Date | null;
  image: string | null;
  phoneNumber: string | null;
}

export async function GET() {
  try {
    // Get the authenticated user
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the user in our database
    const user = (await prisma.user.findFirst({
      where: {
        OR: [{ email: kindeUser.email }],
      },
    })) as unknown as DbUser;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        image: user.image,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user profile",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Get the authenticated user
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get request body
    const data = await request.json();
    const { name, phoneNumber, image } = data;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        email: kindeUser.email as string,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(image !== undefined && { image }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt.toISOString(),
        image: updatedUser.image,
        phoneNumber: updatedUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user profile",
      },
      { status: 500 },
    );
  }
}
