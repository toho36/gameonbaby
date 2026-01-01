import { NextRequest, NextResponse } from "next/server";
import prisma from "~/lib/db";
import { getCurrentUser, isUserModerator } from "~/server/service/userService";

// Define interface for waiting list entries
interface WaitingListEntry {
  first_name: string;
  last_name: string | null;
  created_at: Date;
  email?: string;
  payment_type?: string;
}

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
    const registrationCount = await prisma.registration.count({
      where: {
        event_id: eventId,
        deleted: false,
      },
    });

    // Get waiting list count
    const waitingListCount = await prisma.waitingList.count({
      where: {
        event_id: eventId,
      },
    });

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
      // Fetch registrations with email for identification using findMany + select
      const registrations = await prisma.registration.findMany({
        where: {
          event_id: eventId,
          deleted: false,
        },
        select: {
          first_name: true,
          last_name: true,
          created_at: true,
          email: true,
          payment_type: true,
        },
        orderBy: {
          created_at: "asc",
        },
        take: 100,
      });

      // Fetch waiting list entries using findMany + select
      let waitingList: WaitingListEntry[] = [];
      try {
        waitingList = await prisma.waitingList.findMany({
          where: {
            event_id: eventId,
          },
          select: {
            first_name: true,
            last_name: true,
            created_at: true,
            email: true,
            payment_type: true,
          },
          orderBy: {
            created_at: "asc",
          },
          take: 100,
        });
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
      // Fetch registrations without sensitive information using findMany + select
      const registrations = await prisma.registration.findMany({
        where: {
          event_id: eventId,
          deleted: false,
        },
        select: {
          first_name: true,
          last_name: true,
          created_at: true,
        },
        orderBy: {
          created_at: "asc",
        },
        take: 100,
      });

      // Fetch waiting list entries without sensitive information using findMany + select
      let waitingList: WaitingListEntry[] = [];
      try {
        waitingList = await prisma.waitingList.findMany({
          where: {
            event_id: eventId,
          },
          select: {
            first_name: true,
            last_name: true,
            created_at: true,
          },
          orderBy: {
            created_at: "asc",
          },
          take: 100,
        });
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
