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

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
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

    // Verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        { status: 404 },
      );
    }

    // Fetch registrations for this event
    const registrations = await prisma.registration.findMany({
      where: { event_id: params.eventId },
      include: {
        payment: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        price: event.price,
        from: event.from.toISOString(),
        to: event.to.toISOString(),
        created_at: event.created_at.toISOString(),
      },
      registrations: registrations.map((reg) => ({
        id: reg.id,
        firstName: reg.first_name,
        lastName: reg.last_name,
        email: reg.email,
        phoneNumber: reg.phone_number,
        paymentType: reg.payment_type,
        createdAt: reg.created_at.toISOString(),
        paid: reg.payment?.paid || false,
      })),
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch registrations",
      },
      { status: 500 },
    );
  }
}
