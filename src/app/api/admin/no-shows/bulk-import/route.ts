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

// POST - Bulk create no-show records
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
        const { candidates, eventId, eventTitle, eventDate } = body;

        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return NextResponse.json(
                { success: false, message: "No candidates provided" },
                { status: 400 }
            );
        }

        if (!eventId || !eventTitle || !eventDate) {
            return NextResponse.json(
                { success: false, message: "Missing event details" },
                { status: 400 }
            );
        }

        const eventDateObj = new Date(eventDate);

        // Filter duplicates one last time just in case
        const existingNoShows = await prisma.noShow.findMany({
            where: {
                eventId: eventId,
                email: { in: candidates.map((c: any) => c.email) },
            },
            select: { email: true },
        });

        const existingEmails = new Set(existingNoShows.map(ns => ns.email));

        const newCandidates = candidates.filter((c: any) => !existingEmails.has(c.email));

        if (newCandidates.length === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                message: "No new candidates to add (all already exist)",
            });
        }

        // Create many records
        // Prisma createMany is supported in Postgres
        await prisma.noShow.createMany({
            data: newCandidates.map((c: any) => ({
                email: c.email,
                eventId: eventId,
                eventTitle: eventTitle,
                eventDate: eventDateObj,
                firstName: c.firstName,
                lastName: c.lastName || null,
                feePaid: false,
                notes: "Bulk imported from non-attendance",
            })),
        });

        return NextResponse.json({
            success: true,
            count: newCandidates.length,
        });
    } catch (error) {
        console.error("Error bulk importing no-shows:", error);
        return NextResponse.json(
            { success: false, message: "Failed to import no-shows" },
            { status: 500 }
        );
    }
}
