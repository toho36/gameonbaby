import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

export async function GET(
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

    // Find registration for this user and event
    const registration = await prisma.registration.findFirst({
      where: {
        event_id: params.id,
        email: kindeUser.email,
      },
    });

    return NextResponse.json({
      success: true,
      registration: registration,
    });
  } catch (error) {
    console.error("Error checking registration status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check registration status",
      },
      { status: 500 },
    );
  }
}
