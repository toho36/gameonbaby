import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

export async function POST(
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
      return NextResponse.json(
        {
          success: false,
          message: "You are not on the waiting list for this event",
        },
        { status: 404 },
      );
    }

    // Remove user from waiting list using Prisma delete
    await prisma.waitingList.delete({
      where: { id: waitingListEntry.id },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully removed from waiting list",
    });
  } catch (error) {
    console.error("Error leaving waiting list:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to leave waiting list",
      },
      { status: 500 },
    );
  }
}
