import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

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
                { success: false, message: "Both 'from' and 'to' parameters are required" },
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

        // Fetch events within date range with registration stats
        const events = await prisma.event.findMany({
            where: {
                from: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            orderBy: { from: "asc" },
            include: {
                Registration: {
                    where: {
                        deleted: false,
                    },
                    include: {
                        payment: true,
                    },
                },
            },
        });

        // Calculate statistics for each event
        const eventStats: EventStats[] = events.map((event) => {
            const registrations = event.Registration.length;
            const attendees = event.Registration.filter((r) => r.attended).length;
            const paid = event.Registration.filter((r) => r.payment?.paid).length;

            return {
                id: event.id,
                title: event.title,
                from: event.from.toISOString(),
                registrations,
                attendees,
                paid,
            };
        });

        // Calculate summary totals
        const summary = {
            totalEvents: eventStats.length,
            totalRegistrations: eventStats.reduce((sum, e) => sum + e.registrations, 0),
            totalAttendees: eventStats.reduce((sum, e) => sum + e.attendees, 0),
            totalPaid: eventStats.reduce((sum, e) => sum + e.paid, 0),
        };

        return NextResponse.json({
            success: true,
            events: eventStats,
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
