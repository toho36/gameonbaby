import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

// Check if user has moderator/admin access
async function checkPermission(kindeUser: { id: string }) {
    const user = await prisma.user.findFirst({
        where: { kindeId: kindeUser.id },
        select: { role: true },
    });
    return user?.role === "ADMIN";
}

// GET - List potential no-shows for an event
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const eventId = params.id;

        // Get all registrations for this event
        const registrations = await prisma.registration.findMany({
            where: {
                event_id: eventId,
                attended: false, // Only those who didn't attend
                deleted: false,  // active registrations
            },
            include: {
                payment: true, // to check payment status
            },
            orderBy: { created_at: "asc" },
        });

        // Get existing no-shows for this event to filter them out
        const existingNoShows = await prisma.noShow.findMany({
            where: { eventId: eventId },
            select: { email: true },
        });

        const existingEmails = new Set(existingNoShows.map(ns => ns.email));

        // Filter logic: Not attended AND Not paid AND Not already in NoShow table
        const potentialNoShows = registrations
            .filter((reg) => {
                const isPaid = reg.payment?.paid === true;
                const isAlreadyAdded = existingEmails.has(reg.email);
                return !isPaid && !isAlreadyAdded;
            })
            .map((reg) => ({
                id: reg.id,
                email: reg.email,
                firstName: reg.first_name,
                lastName: reg.last_name,
                createdAt: reg.created_at,
                paymentType: reg.payment_type,
            }));

        return NextResponse.json({
            success: true,
            candidates: potentialNoShows,
        });
    } catch (error) {
        console.error("Error fetching potential no-shows:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch candidates" },
            { status: 500 }
        );
    }
}
