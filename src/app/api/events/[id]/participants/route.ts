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
      select: {
        _count: {
          select: {
            Registration: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    // Fetch registrations with email for identification
    const registrations = await prisma.registration.findMany({
      where: {
        event_id: eventId,
      },
      select: {
        first_name: true,
        last_name: true,
        created_at: true,
        email: true, // Include email for user identification
      },
      orderBy: {
        created_at: "asc",
      },
    });

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

    return NextResponse.json({
      success: true,
      registrations,
      waitingList,
      registrationCount: event._count.Registration,
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
