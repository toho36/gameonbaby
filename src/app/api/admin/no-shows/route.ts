import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

// Check if user has admin access
async function checkPermission(kindeUser: { id: string }) {
    const user = await prisma.user.findFirst({
        where: { kindeId: kindeUser.id },
        select: { role: true },
    });
    return user?.role === "ADMIN";
}

// GET - List all no-shows with optional filter
export async function GET(request: NextRequest) {
    try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();

        if (!kindeUser?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const hasPermission = await checkPermission(kindeUser);
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        // Get filter from query params
        const { searchParams } = new URL(request.url);
        const feePaidFilter = searchParams.get("feePaid");
        const emailFilter = searchParams.get("email");

        // Build where clause
        const where: Record<string, unknown> = {};
        if (feePaidFilter === "true") {
            where.feePaid = true;
        } else if (feePaidFilter === "false") {
            where.feePaid = false;
        }
        if (emailFilter) {
            where.email = { contains: emailFilter, mode: "insensitive" };
        }

        const noShows = await prisma.noShow.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            noShows,
        });
    } catch (error) {
        console.error("Error fetching no-shows:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch no-shows" },
            { status: 500 }
        );
    }
}

// POST - Create a new no-show record
export async function POST(request: NextRequest) {
    try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();

        if (!kindeUser?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const hasPermission = await checkPermission(kindeUser);
        if (!hasPermission) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { email, eventId, eventTitle, eventDate, firstName, lastName, notes } = body;

        if (!email || !eventId || !eventTitle || !eventDate || !firstName) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        const noShow = await prisma.noShow.create({
            data: {
                email,
                eventId,
                eventTitle,
                eventDate: new Date(eventDate),
                firstName,
                lastName: lastName || null,
                notes: notes || null,
            },
        });

        return NextResponse.json({
            success: true,
            noShow,
        });
    } catch (error) {
        console.error("Error creating no-show:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create no-show record" },
            { status: 500 }
        );
    }
}
