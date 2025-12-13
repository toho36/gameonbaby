import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

// Check if user has moderator/admin access
async function checkPermission(kindeUser: { id: string }) {
    const user = await prisma.user.findFirst({
        where: { kindeId: kindeUser.id },
        select: { role: true },
    });
    return user?.role === "MODERATOR" || user?.role === "ADMIN";
}

// GET - List past events for the dropdown
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

        // Fetch past events
        const events = await prisma.event.findMany({
            where: {
                to: { lt: new Date() }, // Events in the past
            },
            select: {
                id: true,
                title: true,
                from: true,
            },
            orderBy: { from: "desc" },
            take: 50, // Limit to recent 50 past events
        });

        return NextResponse.json({
            success: true,
            events,
        });
    } catch (error) {
        console.error("Error fetching past events:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch events" },
            { status: 500 }
        );
    }
}
