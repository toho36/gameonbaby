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

    // Find the user in our database
    const currentUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: user.email }],
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

    // Fetch event by ID
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            Registration: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        price: event.price,
        place: event.place,
        from: event.from.toISOString(),
        to: event.to.toISOString(),
        visible: event.visible,
        capacity: event.capacity || 0,
        bankAccountId: event.bankAccountId,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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

    // Find the user in our database
    const currentUser = (await prisma.user.findFirst({
      where: {
        OR: [{ email: user.email }],
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

    // Parse the request body
    const data = await request.json();
    const { title, description, price, place, from, to, visible, capacity, bankAccountId } =
      data;

    // Validate required fields
    if (!title || !from || !to) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 },
      );
    }

    // Convert datetime-local strings (interpreted as Prague time) to UTC
    // If the string is already an ISO string, use it directly
    const { convertPragueTimeStringToUTC } = await import("~/utils/timezoneUtils");
    const fromDate = from.includes("Z") || from.includes("+") || (from.includes("-") && from.length > 19)
      ? new Date(from)
      : convertPragueTimeStringToUTC(from);
    const toDate = to.includes("Z") || to.includes("+") || (to.includes("-") && to.length > 19)
      ? new Date(to)
      : convertPragueTimeStringToUTC(to);

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        title,
        description: description || null,
        price: Number(price),
        place: place || null,
        from: fromDate,
        to: toDate,
        visible: Boolean(visible),
        capacity: Number(capacity) || 0,
        bankAccountId: bankAccountId || null,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        price: updatedEvent.price,
        place: updatedEvent.place,
        from: updatedEvent.from.toISOString(),
        to: updatedEvent.to.toISOString(),
        visible: updatedEvent.visible,
        capacity: updatedEvent.capacity || 0,
        bankAccountId: updatedEvent.bankAccountId,
      },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update event",
      },
      { status: 500 },
    );
  }
}
