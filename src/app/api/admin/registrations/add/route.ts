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
    const { eventId, firstName, lastName, email, phoneNumber, paymentType } =
      data;

    // Validate required fields
    if (!eventId || !firstName || !email || !paymentType) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    // Check if a registration with this email already exists for this event
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email,
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A registration with this email already exists for this event",
        },
        { status: 400 },
      );
    }

    // Create the registration
    const newRegistration = await prisma.registration.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        payment_type: paymentType,
        created_at: new Date(),
        event: { connect: { id: eventId } },
      },
    });

    return NextResponse.json({
      success: true,
      registration: {
        id: newRegistration.id,
        firstName: newRegistration.first_name,
        lastName: newRegistration.last_name,
        email: newRegistration.email,
        phoneNumber: newRegistration.phone_number,
        paymentType: newRegistration.payment_type,
        createdAt: newRegistration.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error adding registration:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add registration",
      },
      { status: 500 },
    );
  }
}
