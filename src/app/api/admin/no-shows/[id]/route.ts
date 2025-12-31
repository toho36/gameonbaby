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



        // Propagate payment status to the original registration if it exists
        if (typeof feePaid === "boolean") {
            try {
                // Find the registration for this user and event
                console.log(`Attempting to propagate to registration. EventId: ${noShow.eventId}, Email: ${noShow.email}, Name: ${noShow.firstName} ${noShow.lastName}`);

                const matchCriteria: any = {
                    event_id: noShow.eventId,
                    email: {
                        equals: noShow.email,
                        mode: 'insensitive'
                    },
                    first_name: {
                        equals: noShow.firstName,
                        mode: 'insensitive'
                    }
                };

                if (noShow.lastName) {
                    matchCriteria.last_name = {
                        equals: noShow.lastName,
                        mode: 'insensitive'
                    };
                } else {
                    matchCriteria.last_name = null;
                }

                console.log("Match criteria:", JSON.stringify(matchCriteria));

                const registration = await prisma.registration.findFirst({
                    where: matchCriteria,
                    include: {
                        payment: true,
                    },
                });

                if (!registration) {
                    console.warn(`No registration found for event ${noShow.eventId} and email ${noShow.email}`);
                } else if (!registration.payment) {
                    console.warn(`Registration found (${registration.id}) but has no payment record`);
                }

                // If registration and payment exist, update the payment status
                if (registration && registration.payment) {
                    await prisma.payment.update({
                        where: {
                            id: registration.payment.id,
                        },
                        data: {
                            paid: feePaid,
                        },
                    });
                    console.log(`Propagated payment status ${feePaid} to registration ${registration.id}`);
                }
            } catch (propError) {
                // Don't fail the request if propagation fails, just log it
                console.error("Failed to propagate payment status to registration:", propError);
            }
        }

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
