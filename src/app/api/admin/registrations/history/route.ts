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

    // Fetch registration history entries
    const historyEntries = await (prisma as any).registrationHistory.findMany({
      where: eventId ? { event_id: eventId } : {},
      orderBy: {
        timestamp: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Fetch events information to get titles
    const eventIds = [
      ...new Set([
        ...historyEntries.map((entry: { event_id: string }) => entry.event_id),
      ]),
    ];

    const events = await prisma.event.findMany({
      where: {
        id: {
          in: eventIds,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    // Create a map of event IDs to event titles
    const eventTitleMap = new Map(
      events.map((event) => [event.id, event.title]),
    );

    // Format history entries
    const formattedHistory = historyEntries.map(
      (entry: {
        id: string;
        event_id: string;
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
          eventId: entry.event_id,
          eventTitle: eventTitleMap.get(entry.event_id) || "Unknown Event",
          firstName: entry.first_name,
          lastName: entry.last_name || "",
          email: entry.email,
          phoneNumber: entry.phone_number || "",
          status: status,
          actionType: entry.action_type,
          createdAt: entry.timestamp,
          type: "HISTORY",
        };
      },
    );

    // For now, also include active registrations for compatibility
    const registrations = await prisma.registration.findMany({
      where: {
        ...(eventId ? { event_id: eventId } : {}),
        // @ts-ignore - deleted field exists in database but not yet in TypeScript types
        deleted: false,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        payment: {
          select: {
            paid: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
    });

    // Fetch waiting list entries
    const waitingList = await prisma.waitingList.findMany({
      where: eventId ? { event_id: eventId } : {},
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
    });

    // Format registrations for compatibility
    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      eventId: reg.event_id,
      // @ts-ignore - event should exist due to include statement
      eventTitle: reg.event.title,
      firstName: reg.first_name,
      lastName: reg.last_name || "",
      email: reg.email,
      phoneNumber: reg.phone_number || "",
      paymentType: reg.payment_type,
      // @ts-ignore - payment should exist due to include statement
      status: reg.payment?.paid ? "PAID" : "UNPAID",
      attended: reg.attended,
      createdAt: reg.created_at,
      type: "REGISTRATION",
    }));

    const formattedWaitingList = waitingList.map((entry) => ({
      id: entry.id,
      eventId: entry.event_id,
      eventTitle: entry.event.title,
      firstName: entry.first_name,
      lastName: entry.last_name || "",
      email: entry.email,
      phoneNumber: entry.phone_number || "",
      paymentType: entry.payment_type,
      status: "WAITING",
      attended: false,
      createdAt: entry.created_at,
      type: "WAITING_LIST",
    }));

    // Combine results - prioritize history entries
    const combinedResults = [
      ...formattedHistory,
      ...formattedRegistrations,
      ...formattedWaitingList,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Get total counts for pagination
    const totalHistory = await (prisma as any).registrationHistory.count({
      where: eventId ? { event_id: eventId } : {},
    });
    
    const totalRegistrations = await prisma.registration.count({
      where: { deleted: false, ...(eventId ? { event_id: eventId } : {}) },
    });
    
    const totalWaitingList = await prisma.waitingList.count({
      where: eventId ? { event_id: eventId } : {},
    });

    return NextResponse.json({
      success: true,
      history: combinedResults,
      pagination: {
        page,
        limit,
        offset,
        totalHistory,
        totalRegistrations,
        totalWaitingList,
        total: combinedResults.length,
        hasMore: combinedResults.length === limit,
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
