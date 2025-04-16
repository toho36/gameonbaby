import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";
import { PaymentType } from "~/app/constant/paymentType";
import { sendRegistrationEmail } from "~/server/service/emailService";
import { generateQRCodeURL } from "~/utils/qrCodeUtils";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse the request body
    const data = await request.json();
    const { eventId, paymentPreference } = data;

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Missing event ID" },
        { status: 400 },
      );
    }

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { Registration: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    // Check if the event is at capacity
    if (event._count.Registration >= event.capacity) {
      return NextResponse.json(
        { success: false, message: "Event is full" },
        { status: 400 },
      );
    }

    // Check if user has already registered for this event
    const userEmail = user.email || "";
    const firstName = user.given_name || "";
    const lastName = user.family_name || "";

    // Check if this user is already registered for this event
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email: userEmail,
        // @ts-ignore - deleted field exists in database but not yet in TypeScript types
        deleted: false,
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message: "You are already registered for this event",
        },
        { status: 400 },
      );
    }

    // Check if there's a deleted registration to reactivate
    const deletedRegistration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email: userEmail,
        // @ts-ignore - deleted field exists in database but not yet in TypeScript types
        deleted: true,
      },
    });

    // Get payment type from payment preference
    const paymentType =
      paymentPreference === "CARD" ? PaymentType.CARD : PaymentType.CASH;

    // Get user's phone number from profile if available using direct database access
    type UserRecord = { phoneNumber: string | null };
    const userRecords = await prisma.$queryRaw<UserRecord[]>`
      SELECT "phoneNumber" FROM "User" WHERE "email" = ${userEmail}
    `;
    const userPhoneNumber =
      userRecords && userRecords.length > 0
        ? userRecords[0]?.phoneNumber
        : null;

    let newRegistration;

    if (deletedRegistration) {
      // Reactivate the deleted registration
      newRegistration = await prisma.registration.update({
        where: { id: deletedRegistration.id },
        data: {
          // @ts-ignore - deleted field exists in database but not yet in TypeScript types
          deleted: false,
          phone_number: userPhoneNumber,
          payment_type: paymentType,
          created_at: new Date(),
        },
      });

      // Record history
      await prisma.$executeRaw`
        INSERT INTO "RegistrationHistory" (
          id, event_id, registration_id, 
          first_name, last_name, email, phone_number, 
          action_type, timestamp
        ) VALUES (
          ${Math.random().toString(36).substring(2, 15)}, 
          ${eventId}, 
          ${newRegistration.id},
          ${firstName}, 
          ${lastName || null}, 
          ${userEmail}, 
          ${userPhoneNumber || null},
          'REACTIVATED', 
          ${new Date()}
        );
      `;
    } else {
      // Create the registration
      newRegistration = await prisma.registration.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          email: userEmail,
          phone_number: userPhoneNumber,
          payment_type: paymentType,
          created_at: new Date(),
          event: { connect: { id: eventId } },
        },
      });

      // Record history
      await prisma.$executeRaw`
        INSERT INTO "RegistrationHistory" (
          id, event_id, registration_id, 
          first_name, last_name, email, phone_number, 
          action_type, timestamp
        ) VALUES (
          ${Math.random().toString(36).substring(2, 15)}, 
          ${eventId}, 
          ${newRegistration.id},
          ${firstName}, 
          ${lastName || null}, 
          ${userEmail}, 
          ${userPhoneNumber || null},
          'REGISTERED', 
          ${new Date()}
        );
      `;
    }

    // Send confirmation email
    try {
      // Format date and time for email
      const eventDate = new Date(event.from).toLocaleDateString("cs-CZ");
      const eventTime = `${new Date(event.from).toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${new Date(event.to).toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      // Generate QR code for the email
      const qrCodeUrl = generateQRCodeURL(
        `${firstName} ${lastName}`,
        eventDate,
        event.price,
      );

      // Send confirmation email
      await sendRegistrationEmail(
        userEmail,
        firstName,
        qrCodeUrl,
        eventDate,
        eventTime,
        event.place || "TJ JM Chodov",
        event.title,
        event.price,
      );

      console.log("Confirmation email sent to:", userEmail);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Continue with the response even if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      registration: {
        id: newRegistration.id,
        firstName: newRegistration.first_name,
        lastName: newRegistration.last_name,
        email: newRegistration.email,
        paymentType: newRegistration.payment_type,
        createdAt: newRegistration.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error registering:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register for the event",
      },
      { status: 500 },
    );
  }
}
