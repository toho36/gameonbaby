import { NextResponse } from "next/server";
import prisma from "~/lib/db";
import { PaymentType } from "~/app/constant/paymentType";
import { PrismaClient } from "@prisma/client";

// Create a separate client for raw queries
const prismaRaw = new PrismaClient();

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

    // Check if already on waiting list
    const existingWaitingListEntries = await prismaRaw.$queryRaw`
      SELECT * FROM "WaitingList" 
      WHERE event_id = ${eventId} 
      AND email = ${email}
      AND first_name = ${firstName}
      AND last_name = ${lastName || ""}
    `;

    if (
      Array.isArray(existingWaitingListEntries) &&
      existingWaitingListEntries.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are already on the waiting list for this event",
        },
        { status: 400 },
      );
    }

    // Add to waiting list using raw query
    await prismaRaw.$executeRaw`
      INSERT INTO "WaitingList" (id, event_id, first_name, last_name, email, phone_number, payment_type, created_at)
      VALUES (${crypto.randomUUID()}, ${eventId}, ${firstName}, ${lastName || ""}, ${email}, ${phoneNumber || null}, ${paymentType}, ${new Date()})
    `;

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
