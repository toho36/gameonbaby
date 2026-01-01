import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

// Define user interface with role property
interface DbUser {
  id: string;
  email: string;
  role: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { getUser, isAuthenticated } = getKindeServerSession();
    const user = await getUser();

    if (!(await isAuthenticated()) || !user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Find the user in our database - use a more efficient query
    const currentUser = (await prisma.user.findFirst({
      where: { email: user.email },
      select: { id: true, email: true, role: true },
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

    // Verify the event exists - only select fields we need
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        price: true,
        from: true,
        to: true,
        created_at: true,
      },
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

    // Use a more optimized query
    const registrations = await prisma.$queryRaw`
      SELECT 
        r.id, r.first_name, r.last_name, r.email, r.phone_number, 
        r.payment_type, r.created_at, r.attended,
        p.paid as payment_paid
      FROM "Registration" r
      LEFT JOIN "Payment" p ON r.id = p.registration_id
      WHERE r.event_id = ${params.id} AND r.deleted = false
      ORDER BY r.created_at ASC
      LIMIT 500
    `;

    const formattedRegistrations = (registrations as any[]).map((reg) => ({
      id: reg.id,
      firstName: reg.first_name,
      lastName: reg.last_name,
      email: reg.email,
      phoneNumber: reg.phone_number,
      paymentType: reg.payment_type,
      createdAt: new Date(reg.created_at).toISOString(),
      paid: reg.payment_paid || false,
      attended: reg.attended,
    }));

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        price: event.price,
        from: event.from.toISOString(),
        to: event.to.toISOString(),
        created_at: event.created_at.toISOString(),
      },
      registrations: formattedRegistrations,
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
