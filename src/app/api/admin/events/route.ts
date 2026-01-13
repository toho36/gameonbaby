import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    // Parse pagination params (optional, defaults to fetching all for backward compatibility)
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    // Only apply pagination if explicitly requested
    const hasPagination = pageParam !== null || limitParam !== null;
    const page = hasPagination
      ? Math.max(1, parseInt(pageParam || "1", 10))
      : 1;
    const limit = hasPagination
      ? Math.min(50, Math.max(1, parseInt(limitParam || "20", 10)))
      : undefined; // undefined means fetch all
    const skip = hasPagination && limit ? (page - 1) * limit : 0;

    // Fetch events with registration counts and optional pagination
    const [events, totalCount] = hasPagination
      ? await Promise.all([
          prisma.event.findMany({
            skip,
            take: limit,
            orderBy: { from: "desc" },
            include: {
              _count: {
                select: { Registration: true },
              },
            },
          }),
          prisma.event.count(),
        ])
      : [
          await prisma.event.findMany({
            orderBy: { from: "desc" },
            include: {
              _count: {
                select: { Registration: true },
              },
            },
          }),
          0,
        ];

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
      ...(hasPagination && {
        pagination: {
          page,
          limit: limit!,
          totalCount,
          totalPages: Math.ceil(totalCount / limit!),
        },
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

    // Get date values from form data
    const fromString = formData.get("from") as string;
    const toString = formData.get("to") as string;

    // Convert datetime-local strings (interpreted as Prague time) to UTC
    const { convertPragueTimeStringToUTC } = await import(
      "~/utils/timezoneUtils"
    );
    const fromDate =
      fromString.includes("Z") ||
      fromString.includes("+") ||
      (fromString.includes("-") && fromString.length > 19)
        ? new Date(fromString)
        : convertPragueTimeStringToUTC(fromString);
    const toDate =
      toString.includes("Z") ||
      toString.includes("+") ||
      (toString.includes("-") && toString.length > 19)
        ? new Date(toString)
        : convertPragueTimeStringToUTC(toString);

    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        price: Number(formData.get("price") || 0),
        place: (formData.get("place") as string) || null,
        capacity: Number(formData.get("capacity") || 0),
        from: fromDate,
        to: toDate,
        created_at: new Date(),
        visible: formData.get("visible") === "true",
        bankAccountId: (formData.get("bankAccountId") as string) || null,
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
