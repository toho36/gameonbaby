import { NextResponse } from "next/server";
import prisma from "~/lib/db";
import { PaymentType } from "~/app/constant/paymentType";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    const { firstName, lastName, email, phoneNumber, eventId, paymentType } =
      data;

    // Validate required fields
    if (!firstName || !email || !eventId || !paymentType) {
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

    // Check if already on waiting list using findFirst
    const existingWaitingListEntry = await prisma.waitingList.findFirst({
      where: {
        event_id: eventId,
        email: email,
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

    // Add to waiting list using Prisma create
    await prisma.waitingList.create({
      data: {
        id: crypto.randomUUID(),
        event_id: eventId,
        first_name: firstName,
        last_name: lastName || "",
        email: email,
        phone_number: phoneNumber || null,
        payment_type: paymentType,
        created_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Added to waiting list successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding guest to waiting list:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add to waiting list",
      },
      { status: 500 },
    );
  }
}
