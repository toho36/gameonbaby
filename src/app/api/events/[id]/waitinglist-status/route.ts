import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";
import { PrismaClient } from "@prisma/client";

// Create a separate client for raw queries
const prismaRaw = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Extract user info
    const userEmail = user.email || "";
    const firstName = user.given_name || "";
    const lastName = user.family_name || "";

    // Check if user is on the waiting list for this event
    const waitingListEntries = await prismaRaw.$queryRaw`
      SELECT * FROM "WaitingList" 
      WHERE event_id = ${params.id} 
      AND email = ${userEmail}
      AND first_name = ${firstName}
      AND last_name = ${lastName || ""}
    `;

    if (!Array.isArray(waitingListEntries) || waitingListEntries.length === 0) {
      return NextResponse.json({
        success: true,
        isOnWaitingList: false,
      });
    }

    const waitingListEntry = waitingListEntries[0];

    return NextResponse.json({
      success: true,
      isOnWaitingList: true,
      waitingList: {
        id: waitingListEntry.id,
        firstName: waitingListEntry.first_name,
        lastName: waitingListEntry.last_name,
        email: waitingListEntry.email,
        createdAt: waitingListEntry.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error checking waiting list status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check waiting list status",
      },
      { status: 500 },
    );
  }
}
