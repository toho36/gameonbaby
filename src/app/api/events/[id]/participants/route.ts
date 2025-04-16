import { NextRequest, NextResponse } from "next/server";
import prisma from "~/lib/db";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser, isUserModerator } from "~/server/service/userService";

// Define interface for waiting list entries
interface WaitingListEntry {
  first_name: string;
  last_name: string | null;
  created_at: Date;
  email?: string;
  payment_type?: string;
}

// Create a separate client for raw queries
const prismaRaw = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get current user (might be null for unauthenticated users)
    const currentUser = await getCurrentUser();
    const eventId = params.id;

    // Fetch event to make sure it exists
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    // Get active registration count (non-deleted registrations)
    const registrationCountResult = await prismaRaw.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Registration"
      WHERE event_id = ${eventId} AND deleted = false
    `;

    const registrationCount = Number(
      (registrationCountResult as any)[0]?.count || 0,
    );

    // Get waiting list count
    const waitingListCountResult = await prismaRaw.$queryRaw`
      SELECT COUNT(*) as count
      FROM "WaitingList"
      WHERE event_id = ${eventId}
    `;

    const waitingListCount = Number(
      (waitingListCountResult as any)[0]?.count || 0,
    );

    // Check if user is admin or moderator (will be false for unauthenticated users)
    const hasPermission = currentUser ? await isUserModerator() : false;

    // For the current user, check if they're registered
    let isCurrentUserRegistered = false;

    if (currentUser?.email) {
      const userRegistration = await prisma.registration.findFirst({
        where: {
          event_id: eventId,
          email: currentUser.email,
          deleted: false,
        },
      });

      isCurrentUserRegistered = !!userRegistration;
    }

    // If user is admin or moderator, fetch full participant data including emails
    if (hasPermission) {
      // Fetch registrations with email for identification
      const registrationsRaw = await prismaRaw.$queryRaw`
        SELECT first_name, last_name, created_at, email, payment_type
        FROM "Registration"
        WHERE event_id = ${eventId} AND deleted = false
        ORDER BY created_at ASC
      `;

      const registrations = registrationsRaw as {
        first_name: string;
        last_name: string | null;
        created_at: Date;
        email: string;
        payment_type: string;
      }[];

      // Fetch waiting list entries with raw query
      let waitingList: WaitingListEntry[] = [];
      try {
        waitingList = await prismaRaw.$queryRaw<WaitingListEntry[]>`
          SELECT first_name, last_name, created_at, email, payment_type 
          FROM "WaitingList"
          WHERE event_id = ${eventId}
          ORDER BY created_at ASC
        `;
      } catch (error) {
        console.error("Error fetching waiting list:", error);
        waitingList = [];
      }

      return NextResponse.json({
        success: true,
        registrations,
        waitingList,
        registrationCount,
        waitingListCount,
        isCurrentUserRegistered,
      });
    }
    // For regular users and unauthenticated users, fetch participant data without emails
    else {
      // Fetch registrations without sensitive information
      const registrationsRaw = await prismaRaw.$queryRaw`
        SELECT first_name, last_name, created_at
        FROM "Registration"
        WHERE event_id = ${eventId} AND deleted = false
        ORDER BY created_at ASC
      `;

      const registrations = registrationsRaw as {
        first_name: string;
        last_name: string | null;
        created_at: Date;
      }[];

      // Fetch waiting list entries without sensitive information
      let waitingList: WaitingListEntry[] = [];
      try {
        waitingList = await prismaRaw.$queryRaw<WaitingListEntry[]>`
          SELECT first_name, last_name, created_at
          FROM "WaitingList"
          WHERE event_id = ${eventId}
          ORDER BY created_at ASC
        `;
      } catch (error) {
        console.error("Error fetching waiting list:", error);
        waitingList = [];
      }

      return NextResponse.json({
        success: true,
        registrations,
        waitingList,
        registrationCount,
        waitingListCount,
        isCurrentUserRegistered,
      });
    }
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch participants" },
      { status: 500 },
    );
  }
}
