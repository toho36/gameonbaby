import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
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

type EventWithCount = Prisma.EventGetPayload<{
  include: {
    _count: {
      select: { Registration: true };
    };
  };
}>;

export async function GET(request: NextRequest) {
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

    // Fetch events with registration counts
    const events = await prisma.event.findMany({
      orderBy: { from: "desc" },
      include: {
        _count: {
          select: { Registration: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      events: events.map((event) => {
        const { _count, ...eventData } = event;
        return {
          ...eventData,
          from: eventData.from.toISOString(),
          to: eventData.to.toISOString(),
          created_at: eventData.created_at.toISOString(),
          _count: {
            Registration: _count.Registration,
          },
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
      },
      { status: 500 },
    );
  }
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

    // Parse the FormData
    const formData = await request.formData();

    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        price: Number(formData.get("price") || 0),
        place: (formData.get("place") as string) || null,
        capacity: Number(formData.get("capacity") || 0),
        from: new Date(formData.get("from") as string),
        to: new Date(formData.get("to") as string),
        created_at: new Date(),
        visible: formData.get("visible") === "true",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      event: {
        ...newEvent,
        from: newEvent.from.toISOString(),
        to: newEvent.to.toISOString(),
        created_at: newEvent.created_at.toISOString(),
        _count: { Registration: 0 },
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create event",
      },
      { status: 500 },
    );
  }
}
