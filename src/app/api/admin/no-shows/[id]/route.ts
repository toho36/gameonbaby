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

// PATCH - Mark no-show as paid
export async function PATCH(
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

        const noShowId = params.id;
        const body = await request.json();
        const { feePaid, notes } = body;

        const updateData: Record<string, unknown> = {};

        if (typeof feePaid === "boolean") {
            updateData.feePaid = feePaid;
            updateData.paidAt = feePaid ? new Date() : null;
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const noShow = await prisma.noShow.update({
            where: { id: noShowId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            noShow,
        });
    } catch (error) {
        console.error("Error updating no-show:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update no-show" },
            { status: 500 }
        );
    }
}

// DELETE - Remove no-show record
export async function DELETE(
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

        const noShowId = params.id;

        await prisma.noShow.delete({
            where: { id: noShowId },
        });

        return NextResponse.json({
            success: true,
            message: "No-show record deleted",
        });
    } catch (error) {
        console.error("Error deleting no-show:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete no-show" },
            { status: 500 }
        );
    }
}
