import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";
import { PrismaClient } from "@prisma/client";
import { sendWaitingListPromotionEmail } from "~/server/service/emailService";
import {
  recordRegistrationHistory,
  RegistrationAction,
} from "~/utils/registrationHistory";

// Create a separate client for raw queries
const prismaRaw = new PrismaClient();

// Define the DbUser interface
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();

    if (!(await isAuthenticated()) || !user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the user in our database
    const currentUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: user.email }],
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

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        { status: 404 },
      );
    }

    // Fetch waiting list entries for this event
    const waitingListEntries = await prismaRaw.$queryRaw`
      SELECT * FROM "WaitingList"
      WHERE event_id = ${params.id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        price: event.price,
        from: event.from.toISOString(),
        to: event.to.toISOString(),
        created_at: event.created_at.toISOString(),
      },
      waitingList: Array.isArray(waitingListEntries)
        ? waitingListEntries.map((entry: any) => ({
            id: entry.id,
            firstName: entry.first_name,
            lastName: entry.last_name,
            email: entry.email,
            phoneNumber: entry.phone_number,
            paymentType: entry.payment_type,
            createdAt: entry.created_at.toISOString(),
          }))
        : [],
    });
  } catch (error) {
    console.error("Error fetching waiting list:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch waiting list",
      },
      { status: 500 },
    );
  }
}

// DELETE endpoint to remove a waiting list entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();

    if (!(await isAuthenticated()) || !user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the user in our database
    const currentUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: user.email }],
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

    // Parse the request body to get the waiting list entry ID
    const searchParams = request.nextUrl.searchParams;
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json(
        { success: false, message: "Missing waiting list entry ID" },
        { status: 400 },
      );
    }

    // Delete the waiting list entry
    await prismaRaw.$executeRaw`
      DELETE FROM "WaitingList"
      WHERE id = ${entryId}
    `;

    return NextResponse.json({
      success: true,
      message: "Waiting list entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting waiting list entry:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete waiting list entry",
      },
      { status: 500 },
    );
  }
}

// POST endpoint to promote a waiting list entry to a registration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();

    if (!(await isAuthenticated()) || !user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the user in our database
    const currentUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: user.email }],
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

    // Get the event ID and waiting list entry ID
    const data = await request.json();
    const { entryId } = data;

    if (!entryId) {
      return NextResponse.json(
        { success: false, message: "Missing waiting list entry ID" },
        { status: 400 },
      );
    }

    // Get the waiting list entry
    const waitingListEntriesResult = await prismaRaw.$queryRaw`
      SELECT * FROM "WaitingList"
      WHERE id = ${entryId}
    `;

    if (
      !Array.isArray(waitingListEntriesResult) ||
      waitingListEntriesResult.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Waiting list entry not found" },
        { status: 404 },
      );
    }

    const waitingListEntry = waitingListEntriesResult[0];

    // Check if there's capacity in the event
    const event = await prisma.event.findUnique({
      where: { id: params.id },
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

    // Capacity check removed to allow admin override
    // if (event._count.Registration >= event.capacity) {
    //   return NextResponse.json(
    //     { success: false, message: "Event is at capacity" },
    //     { status: 400 },
    //   );
    // }

    // Create a registration for this user
    const registration = await prisma.registration.create({
      data: {
        first_name: waitingListEntry.first_name,
        last_name: waitingListEntry.last_name,
        email: waitingListEntry.email,
        phone_number: waitingListEntry.phone_number,
        payment_type: waitingListEntry.payment_type,
        created_at: new Date(),
        event: { connect: { id: params.id } },
      },
    });

    // Delete the waiting list entry
    await prismaRaw.$executeRaw`
      DELETE FROM "WaitingList"
      WHERE id = ${entryId}
    `;

    // Record in registration history
    await recordRegistrationHistory({
      eventId: params.id,
      registrationId: registration.id,
      waitingListId: entryId,
      firstName: waitingListEntry.first_name,
      lastName: waitingListEntry.last_name,
      email: waitingListEntry.email,
      phoneNumber: waitingListEntry.phone_number,
      actionType: RegistrationAction.MOVED_FROM_WAITLIST,
      eventTitle: event.title,
    });

    // Send notification email
    try {
      const formattedDate = new Date(event.from).toLocaleDateString("cs-CZ", {
        timeZone: "Europe/Prague",
      });

      // Format time directly in Prague timezone (handles DST automatically)
      const startTime = new Date(event.from).toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Prague",
      });
      const endTime = new Date(event.to).toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Prague",
      });

      await sendWaitingListPromotionEmail(
        waitingListEntry.email,
        waitingListEntry.first_name,
        event.title,
        formattedDate,
        `${startTime} - ${endTime}`,
        event.place || "See event details online",
        waitingListEntry.payment_type,
      );
    } catch (emailError) {
      console.error("Failed to send waiting list promotion email:", emailError);
      // Continue with the operation even if email fails
    }

    return NextResponse.json({
      success: true,
      message: "User promoted from waiting list to registered",
      registration: {
        id: registration.id,
        firstName: registration.first_name,
        lastName: registration.last_name,
        email: registration.email,
        phoneNumber: registration.phone_number,
        paymentType: registration.payment_type,
        createdAt: registration.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error promoting waiting list entry:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to promote waiting list entry",
      },
      { status: 500 },
    );
  }
}
