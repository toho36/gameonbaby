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
  // OPTIMIZATION: Support pagination
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100); // Max 100 per page

  const skip = (page - 1) * limit;
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

    // OPTIMIZATION: Use findMany with select instead of $queryRaw for better type safety
    // and automatic query optimization by Prisma
    const registrations = await prisma.registration.findMany({
      where: {
        event_id: params.id,
        deleted: false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        payment_type: true,
        created_at: true,
        attended: true,
        payment: {
          select: {
            paid: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
      skip,
      take: limit,
    });

    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      firstName: reg.first_name,
      lastName: reg.last_name,
      email: reg.email,
      phoneNumber: reg.phone_number,
      paymentType: reg.payment_type,
      createdAt: new Date(reg.created_at).toISOString(),
      paid: reg.payment?.paid || false,
      attended: reg.attended || false,
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
      pagination: {
        page,
        limit,
        total: formattedRegistrations.length,
        hasMore: formattedRegistrations.length === limit,
      },
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
