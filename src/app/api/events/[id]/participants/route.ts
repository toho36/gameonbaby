import { NextRequest, NextResponse } from "next/server";
import prisma from "~/lib/db";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "~/server/service/userService";

// Define interface for waiting list entries
interface WaitingListEntry {
  first_name: string;
  last_name: string | null;
  created_at: Date;
  email?: string;
}

// Create a separate client for raw queries
const prismaRaw = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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

    // Fetch registrations with email for identification
    // Use raw query to filter out deleted registrations
    const registrationsRaw = await prismaRaw.$queryRaw`
      SELECT first_name, last_name, created_at, email
      FROM "Registration"
      WHERE event_id = ${eventId} AND deleted = false
      ORDER BY created_at ASC
    `;

    const registrations = registrationsRaw as {
      first_name: string;
      last_name: string | null;
      created_at: Date;
      email: string;
    }[];

    // Fetch waiting list entries with raw query
    let waitingList: WaitingListEntry[] = [];
    try {
      waitingList = await prismaRaw.$queryRaw<WaitingListEntry[]>`
        SELECT first_name, last_name, created_at, email 
        FROM "WaitingList"
        WHERE event_id = ${eventId}
        ORDER BY created_at ASC
      `;
    } catch (error) {
      console.error("Error fetching waiting list:", error);
      waitingList = [];
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

    return NextResponse.json({
      success: true,
      registrations,
      waitingList,
      registrationCount,
      waitingListCount: waitingList.length,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch participants" },
      { status: 500 },
    );
  }
}
