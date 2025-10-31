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

    // Parse the FormData instead of JSON
    const formData = await request.formData();

    // Extract data from FormData
    const sourceEventId = formData.get("sourceEventId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const place = formData.get("place") as string;
    const capacity = formData.get("capacity") as string;
    const from = formData.get("from") as string;
    const to = formData.get("to") as string;
    const visible = formData.get("visible") as string;
    const bankAccountId = formData.get("bankAccountId") as string | null;

    if (!sourceEventId || !title || !from || !to) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 },
      );
    }

    // Check if source event exists
    const sourceEvent = await prisma.event.findUnique({
      where: { id: sourceEventId },
    });

    if (!sourceEvent) {
      return NextResponse.json(
        { success: false, message: "Source event not found" },
        { status: 404 },
      );
    }

    // Convert datetime-local strings (interpreted as Prague time) to UTC
    const { convertPragueTimeStringToUTC } = await import("~/utils/timezoneUtils");
    const fromDate = from.includes("Z") || from.includes("+") || (from.includes("-") && from.length > 19)
      ? new Date(from)
      : convertPragueTimeStringToUTC(from);
    const toDate = to.includes("Z") || to.includes("+") || (to.includes("-") && to.length > 19)
      ? new Date(to)
      : convertPragueTimeStringToUTC(to);

    // Create new event based on the source
    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        price: Number(price) || 0,
        place: place || null,
        capacity: Number(capacity) || 0,
        from: fromDate,
        to: toDate,
        created_at: new Date(),
        visible: visible === "true",
        bankAccountId: bankAccountId !== undefined && bankAccountId !== null && bankAccountId !== "" ? bankAccountId : sourceEvent.bankAccountId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Event duplicated successfully",
      event: {
        ...newEvent,
        from: newEvent.from.toISOString(),
        to: newEvent.to.toISOString(),
        created_at: newEvent.created_at.toISOString(),
        _count: { Registration: 0 },
      },
    });
  } catch (error) {
    console.error("Error duplicating event:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to duplicate event",
      },
      { status: 500 },
    );
  }
}
