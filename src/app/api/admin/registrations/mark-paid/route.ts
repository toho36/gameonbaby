import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

// Define user interface with role property
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  emailVerified: Date | null;
  image: string | null;
}

export async function POST(request: NextRequest) {
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

    if (
      !currentUser ||
      (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    // Get registration ID from request body
    const { registrationId } = await request.json();
    if (!registrationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration ID is required",
        },
        { status: 400 },
      );
    }

    // Find registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { payment: true },
    });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration not found",
        },
        { status: 404 },
      );
    }

    // If payment record exists, update it
    if (registration.payment) {
      await prisma.payment.update({
        where: { id: registration.payment.id },
        data: { paid: true },
      });
    } else {
      // If no payment record exists, create one
      await prisma.payment.create({
        data: {
          registration: { connect: { id: registrationId } },
          variable_symbol: `VS${registrationId.substring(0, 8)}`,
          qr_data: "",
          paid: true,
          created_at: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Registration marked as paid",
    });
  } catch (error) {
    console.error("Error marking registration as paid:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark registration as paid",
      },
      { status: 500 },
    );
  }
}
