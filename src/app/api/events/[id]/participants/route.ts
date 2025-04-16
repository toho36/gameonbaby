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
    // First, check if the user is authenticated
    const currentUser = await getCurrentUser();

    // If there's no authenticated user, return 401 Unauthorized
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to view participants" },
        { status: 401 },
      );
    }

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

    // Check if user is admin or moderator
    const hasPermission = await isUserModerator();

    // If user is not admin or moderator, only return counts
    if (!hasPermission) {
      // For the current user, only check if they're registered
      let isCurrentUserRegistered = false;

      if (currentUser.email) {
        const userRegistration = await prisma.registration.findFirst({
          where: {
            event_id: eventId,
            email: currentUser.email,
            deleted: false,
          },
        });

        isCurrentUserRegistered = !!userRegistration;
      }

      return NextResponse.json({
        success: true,
        registrations: [],
        waitingList: [],
        registrationCount,
        waitingListCount,
        isCurrentUserRegistered,
      });
    }

    // For admins and moderators, fetch full participant data
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
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch participants" },
      { status: 500 },
    );
  }
}
