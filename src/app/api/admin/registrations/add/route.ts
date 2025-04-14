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

    // Check if a registration with this email and name already exists for this event
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email,
        first_name: firstName,
        last_name: lastName || "",
        // @ts-ignore - deleted field exists in database but not yet in TypeScript types
        deleted: false, // Only check active registrations
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message: `A registration for ${firstName} ${lastName} with this email already exists for this event`,
        },
        { status: 400 },
      );
    }

    // Check if there's a deleted registration with the same details that we can reactivate
    const deletedRegistration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email,
        first_name: firstName,
        last_name: lastName || "",
        // @ts-ignore - deleted field exists in database but not yet in TypeScript types
        deleted: true, // Look for deleted registrations
      },
    });

    // Use a transaction to ensure both operations complete
    const newRegistration = await prisma.$transaction(async (tx) => {
      let registration;

      if (deletedRegistration) {
        // Reactivate the deleted registration instead of creating a new one
        registration = await tx.registration.update({
          where: { id: deletedRegistration.id },
          data: {
            // @ts-ignore - deleted field exists in database but not yet in TypeScript types
            deleted: false,
            phone_number: phoneNumber,
            payment_type: paymentType,
            // Update created_at to reflect reactivation time
            created_at: new Date(),
          },
        });
      } else {
        // Create new registration if no deleted one exists
        registration = await tx.registration.create({
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
      }

      // Record in history
      await (tx as any).registrationHistory.create({
        data: {
          event_id: eventId,
          registration_id: registration.id,
          first_name: firstName,
          last_name: lastName || "",
          email,
          phone_number: phoneNumber || "",
          // @ts-ignore - enum type exists in database but not yet in TypeScript types
          action_type: deletedRegistration ? "REACTIVATED" : "REGISTERED",
          user_id: kindeUser.id,
        },
      });

      return registration;
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
