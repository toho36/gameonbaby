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

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
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

    // Find the user in our database
    const currentUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: kindeUser.email }],
      },
    })) as unknown as DbUser;

    if (
      !currentUser ||
      (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    // Fetch event by ID
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        price: event.price,
        from: event.from.toISOString(),
        to: event.to.toISOString(),
        visible: event.visible,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event",
      },
      { status: 500 },
    );
  }
}
