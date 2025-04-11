import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";
import { PaymentType } from "~/app/constant/paymentType";

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

    const existingRegistration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
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

    // Get payment type from payment preference
    const paymentType =
      paymentPreference === "CARD" ? PaymentType.CARD : PaymentType.CASH;

    // Create the registration
    const newRegistration = await prisma.registration.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        phone_number: null,
        payment_type: paymentType,
        created_at: new Date(),
        event: { connect: { id: eventId } },
      },
    });

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
