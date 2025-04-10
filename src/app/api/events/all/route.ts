export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { type Event, PrismaClient } from "@prisma/client";
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes";
import { ApiError } from "~/utils/ApiError";
import { withErrorHandling } from "~/utils/errorHandler";
const prisma = new PrismaClient();

type EventResponse = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  from: Date;
  to: Date;
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
      from: event.from,
      to: event.to,
    }));

    return NextResponse.json(response);
  },
);
