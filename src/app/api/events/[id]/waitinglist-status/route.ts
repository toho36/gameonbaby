import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

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

    // Check if user is on the waiting list for this event using findFirst
    const waitingListEntry = await prisma.waitingList.findFirst({
      where: {
        event_id: params.id,
        email: userEmail,
        first_name: firstName,
        last_name: lastName || "",
      },
    });

    if (!waitingListEntry) {
      return NextResponse.json({
        success: true,
        isOnWaitingList: false,
      });
    }

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
