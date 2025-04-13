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

// PUT - Update an existing registration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Validate the registration ID
    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 },
      );
    }

    // Update the registration
    const updatedRegistration = await prisma.registration.update({
      where: { id: params.id },
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phoneNumber,
        payment_type: data.paymentType,
      },
    });

    return NextResponse.json({
      success: true,
      registration: {
        id: updatedRegistration.id,
        firstName: updatedRegistration.first_name,
        lastName: updatedRegistration.last_name,
        email: updatedRegistration.email,
        phoneNumber: updatedRegistration.phone_number,
        paymentType: updatedRegistration.payment_type,
      },
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update registration",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete a registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Check if registration exists and get related payment
    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 },
      );
    }

    // Delete payment first if it exists
    if (registration.payment) {
      await prisma.payment.delete({
        where: { registration_id: registration.id },
      });
    }

    // Delete the registration
    await prisma.registration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete registration",
      },
      { status: 500 },
    );
  }
}

// PATCH - Update registration status (attendance or payment)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Find the registration with user and payment data
    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 },
      );
    }

    // Get the user associated with the registration
    const user = await prisma.user.findUnique({
      where: { id: registration.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Parse the request body to determine what's being updated
    const updates = await request.json();

    // Process different types of updates
    if (updates.attended !== undefined) {
      // Toggle attendance
      await prisma.registration.update({
        where: { id: params.id },
        data: { attended: updates.attended },
      });
    } else if (updates.status !== undefined) {
      // Toggle payment status
      const paid = updates.status === "PAID";

      // If setting to paid and payment record exists, update it
      if (paid && registration.payment) {
        await prisma.payment.update({
          where: { id: registration.payment.id },
          data: { paid: true },
        });
      }
      // If setting to paid and no payment record exists, create one
      else if (paid && !registration.payment) {
        await prisma.payment.create({
          data: {
            registration_id: params.id,
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
          where: { id: registration.payment.id },
          data: { paid: false },
        });
      }
    } else if (updates.paymentMethod !== undefined) {
      // Update payment method
      await prisma.registration.update({
        where: { id: params.id },
        data: { payment_type: updates.paymentMethod },
      });
    }

    // Get the updated registration
    const updatedRegistration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!updatedRegistration) {
      return NextResponse.json(
        { success: false, message: "Failed to find updated registration" },
        { status: 500 },
      );
    }

    // Get the updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: updatedRegistration.email },
    });

    // Format the response according to the expected Registration interface
    return NextResponse.json({
      success: true,
      registration: {
        id: updatedRegistration.id,
        eventId: updatedRegistration.event_id,
        userId: updatedUser?.id || updatedRegistration.email,
        status: updatedRegistration.payment?.paid ? "PAID" : "UNPAID",
        attended: updatedRegistration.attended,
        paymentMethod: updatedRegistration.payment_type,
        createdAt: updatedRegistration.created_at.toISOString(),
        user: {
          name: updatedUser?.name || null,
          email: updatedUser?.email || null,
          phone: updatedUser?.phoneNumber || null,
        },
      },
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update registration",
      },
      { status: 500 },
    );
  }
}
