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
    const { registrationId, paid } = data;

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

    // If setting to paid and payment record exists, update it
    if (paid && registration.payment) {
      await prisma.payment.update({
        where: { registration_id: registrationId },
        data: { paid: true },
      });
    }
    // If setting to paid and no payment record exists, create one
    else if (paid && !registration.payment) {
      await prisma.payment.create({
        data: {
          registration: { connect: { id: registrationId } },
          variable_symbol: `VS${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`,
          qr_data: "Generated by admin",
          paid: true,
          created_at: new Date(),
        },
      });
    }
    // If setting to unpaid and payment record exists, update it
    else if (!paid && registration.payment) {
      await prisma.payment.update({
        where: { registration_id: registrationId },
        data: { paid: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: paid
        ? "Registration marked as paid"
        : "Registration marked as pending",
    });
  } catch (error) {
    console.error("Error toggling payment status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update payment status",
      },
      { status: 500 },
    );
  }
}
