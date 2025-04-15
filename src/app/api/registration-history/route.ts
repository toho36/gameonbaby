import { NextRequest, NextResponse } from "next/server";
import {
  getRegistrationHistory,
  getEventRegistrationHistory,
} from "~/utils/registrationHistory";
import { getCurrentUser } from "~/server/service/userService";

export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();

    // Check if user is authenticated and has admin permissions
    if (!user || !user.id || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");

    // If eventId is provided, get history for that event
    if (eventId) {
      const history = await getEventRegistrationHistory(eventId);
      return NextResponse.json({
        success: true,
        history,
      });
    }

    // Otherwise, get all history
    const history = await getRegistrationHistory();
    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Error retrieving registration history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve registration history" },
      { status: 500 },
    );
  }
}
