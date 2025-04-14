import { NextRequest, NextResponse } from "next/server";
import prisma from "~/lib/db";
import { getCurrentUser } from "~/server/service/userService";

export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();

    // Check if user is authenticated
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Fetch all events
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        from: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
