import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find and delete registration for this user and event
    const registration = await prisma.registration.findFirst({
      where: {
        event_id: params.id,
        email: kindeUser.email,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 },
      );
    }

    // Delete the registration
    await prisma.registration.delete({
      where: {
        id: registration.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully unregistered from event",
    });
  } catch (error) {
    console.error("Error unregistering from event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to unregister from event",
      },
      { status: 500 },
    );
  }
}
