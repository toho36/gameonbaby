import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and has moderator/admin access
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Verify moderator/admin access
    const dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
    });

    if (!dbUser || (dbUser.role !== "MODERATOR" && dbUser.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    // Get filter parameters from URL
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100); // Max 100 per page
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1); // Start at page 1
    const offset = (page - 1) * limit;

    // Fetch registration history entries (event_title is already in the table)
    const historyEntries = await (prisma as any).registrationHistory.findMany({
      where: eventId ? { event_id: eventId } : {},
      orderBy: {
        timestamp: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Format history entries for frontend
    const formattedHistory = historyEntries.map(
      (entry: {
        id: string;
        event_id: string;
        event_title: string | null;
        first_name: string;
        last_name: string | null;
        email: string;
        phone_number: string | null;
        action_type: string;
        timestamp: Date;
      }) => {
        // Determine status based on action type
        let status = "UNKNOWN";
        switch (entry.action_type) {
          case "REGISTERED":
            status = "REGISTERED";
            break;
          case "UNREGISTERED":
            status = "UNREGISTERED";
            break;
          case "MOVED_TO_WAITLIST":
            status = "WAITING";
            break;
          case "MOVED_FROM_WAITLIST":
            status = "MOVED_FROM_WAITLIST";
            break;
        }

        return {
          id: entry.id,
          timestamp: entry.timestamp,
          action_type: entry.action_type,
          first_name: entry.first_name,
          last_name: entry.last_name || "",
          email: entry.email,
          event_id: entry.event_id,
          event_title: entry.event_title || "Unknown Event",
        };
      },
    );

    // Get total count for pagination
    const totalHistory = await (prisma as any).registrationHistory.count({
      where: eventId ? { event_id: eventId } : {},
    });

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      pagination: {
        page,
        limit,
        offset,
        total: totalHistory,
        totalPages: Math.ceil(totalHistory / limit),
        hasMore: page * limit < totalHistory,
      },
    });
  } catch (error) {
    console.error("Error fetching registration history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch registration history" },
      { status: 500 },
    );
  }
}
