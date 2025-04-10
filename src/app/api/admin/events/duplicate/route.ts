import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

// Define user interface with role property
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  emailVerified: Date | null;
  image: string | null;
}

// Helper function to check if user is admin or moderator
async function checkPermission(kindeUser: any) {
  if (!kindeUser || !kindeUser.email) {
    return null;
  }

  // Find the user in our database
  const currentUser = (await prisma.user.findFirst({
    where: {
      email: kindeUser.email,
    },
  })) as unknown as DbUser | null;

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
    const { sourceEventId, title, description, price, from, to, visible } =
      data;

    if (!sourceEventId || !title || !from || !to) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 },
      );
    }

    // Check if source event exists
    const sourceEvent = await prisma.event.findUnique({
      where: { id: sourceEventId },
    });

    if (!sourceEvent) {
      return NextResponse.json(
        { success: false, message: "Source event not found" },
        { status: 404 },
      );
    }

    // Create new event based on the source
    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        price: Number(price),
        from: new Date(from),
        to: new Date(to),
        created_at: new Date(),
        visible: Boolean(visible),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event duplicated successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error duplicating event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to duplicate event",
      },
      { status: 500 },
    );
  }
}
