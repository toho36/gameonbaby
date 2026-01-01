export const dynamic = "force-dynamic";

// OPTIMIZATION: Enable ISR (Incremental Static Regeneration)
// Revalidate events list every 30 seconds
export const revalidate = 30;

import { NextResponse } from "next/server";
import { type Event } from "@prisma/client";
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes";
import { ApiError } from "~/utils/ApiError";
import { withErrorHandling } from "~/utils/errorHandler";
import prisma from "~/lib/db";

type EventResponse = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  from: Date;
  to: Date;
  bankAccountId: string | null;
  capacity: number;
  created_at: Date;
  visible: boolean;
}[];

export const GET = withErrorHandling(
  async (req: Request): Promise<NextResponse> => {
    // Check if we should include past events
    const url = new URL(req.url);
    const includePast = url.searchParams.get("includePast") === "true";

    // Create filter conditions
    const whereConditions: any = {
      visible: true,
    };

    // Only add date filter if not including past events
    if (!includePast) {
      whereConditions.to = {
        gte: new Date(),
      };
    }

    const events: Event[] = await prisma.event.findMany({
      where: whereConditions,
      orderBy: {
        from: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        place: true,
        from: true,
        to: true,
        bankAccountId: true,
        capacity: true,
        created_at: true,
        visible: true,
      },
    });

    if (events.length === 0) {
      throw new ApiError(
        "There are no events available at the moment.",
        404,
        getCode(Modules.EVENT, ErrorCodes.NOT_FOUND),
      );
    }

    const response: EventResponse = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      price: event.price,
      place: event.place,
      from: event.from,
      to: event.to,
      bankAccountId: event.bankAccountId,
      capacity: event.capacity,
      created_at: event.created_at,
      visible: event.visible,
    }));

    return NextResponse.json(response);
  },
);
