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
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    // Get user info
    const userEmail = user.email || "";
    const firstName = user.given_name || "";
    const lastName = user.family_name || "";

    // Check if user is already registered for this event
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

    // Check if user is already on the waiting list for this event using findFirst
    const existingWaitingListEntry = await prisma.waitingList.findFirst({
      where: {
        event_id: eventId,
        email: userEmail,
        first_name: firstName,
        last_name: lastName || "",
      },
    });

    if (existingWaitingListEntry) {
      return NextResponse.json(
        {
          success: false,
          message: "You are already on the waiting list for this event",
        },
        { status: 400 },
      );
    }

    // Get payment type from payment preference
    const paymentType =
      paymentPreference === "QR"
        ? PaymentType.QR
        : paymentPreference === "CARD"
          ? PaymentType.CARD
          : PaymentType.CASH;

    // Add to waiting list using Prisma create
    await prisma.waitingList.create({
      data: {
        id: crypto.randomUUID(),
        event_id: eventId,
        first_name: firstName,
        last_name: lastName || "",
        email: userEmail,
        phone_number: null,
        payment_type: paymentType,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Added to waiting list successfully",
    });
  } catch (error) {
    console.error("Error adding to waiting list:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add to waiting list",
      },
      { status: 500 },
    );
  }
}
