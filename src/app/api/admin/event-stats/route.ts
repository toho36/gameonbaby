import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
}

interface EventStats {
  id: string;
  title: string;
  from: string;
  registrations: number;
  attendees: number;
  paid: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the user in our database
    const currentUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: kindeUser.email }],
      },
    })) as unknown as DbUser;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    // Parse date range from query params
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        {
          success: false,
          message: "Both 'from' and 'to' parameters are required",
        },
        { status: 400 },
      );
    }

    const fromDate = new Date(fromParam);
    const toDate = new Date(toParam);
    // Set toDate to end of day
    toDate.setHours(23, 59, 59, 999);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid date format" },
        { status: 400 },
      );
    }

    // Fetch events within date range with aggregated registration stats
    // Using raw SQL for efficient aggregation (avoids N+1 problem)
    const events = (await prisma.$queryRaw`
          SELECT 
            e.id,
            e.title,
            e."from",
            COALESCE(reg_stats.total_registrations, 0) as registrations,
            COALESCE(reg_stats.attendees, 0) as attendees,
            COALESCE(reg_stats.paid, 0) as paid
          FROM "Event" e
          LEFT JOIN LATERAL (
            SELECT 
              r."eventId",
              COUNT(*) as total_registrations,
              COUNT(CASE WHEN r.attended = true THEN 1 END) as attendees,
              COUNT(DISTINCT p.id) as paid
            FROM "Registration" r
            LEFT JOIN "Payment" p ON p."registrationId" = r.id AND p.paid = true
            WHERE r."eventId" = e.id
              AND r.deleted = false
            GROUP BY r."eventId"
          ) reg_stats ON true
          WHERE e."from" >= ${fromDate} AND e."from" <= ${toDate}
          ORDER BY e."from" ASC
        `) as Array<{
      id: string;
      title: string;
      from: Date;
      registrations: number;
      attendees: number;
      paid: number;
    }>;

    // Calculate summary totals
    const summary = {
      totalEvents: events.length,
      totalRegistrations: events.reduce(
        (sum, e) => sum + Number(e.registrations),
        0,
      ),
      totalAttendees: events.reduce((sum, e) => sum + Number(e.attendees), 0),
      totalPaid: events.reduce((sum, e) => sum + Number(e.paid), 0),
    };

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        from: e.from.toISOString(),
        registrations: Number(e.registrations),
        attendees: Number(e.attendees),
        paid: Number(e.paid),
      })),
      summary,
    });
  } catch (error) {
    console.error("Error fetching event stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event statistics",
      },
      { status: 500 },
    );
  }
}
