import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

// Define user interface with role property
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  emailVerified: Date | null;
  image: string | null;
}

// Helper function to check if user is admin or moderator
async function checkPermission(kindeUser: any) {
  if (!kindeUser || !kindeUser.email) {
    return null;
  }

  // Find the user in our database
  const currentUser = (await prisma.user.findFirst({
    where: {
      email: kindeUser.email,
    },
  })) as unknown as DbUser | null;

  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")
  ) {
    return null;
  }

  return currentUser;
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

    const currentUser = await checkPermission(kindeUser);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    // Parse the request body
    const data = await request.json();
    const { registrationId } = data;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: "Registration ID is required" },
        { status: 400 },
      );
    }

    // Check if registration exists
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { payment: true },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 },
      );
    }

    // If payment already exists, just update the paid status
    if (registration.payment) {
      await prisma.payment.update({
        where: { registration_id: registrationId },
        data: { paid: true },
      });
    } else {
      // Create a new payment record
      await prisma.payment.create({
        data: {
          registration: { connect: { id: registrationId } },
          variable_symbol: `VS${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`,
          qr_data: "Generated on admin mark as paid",
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
