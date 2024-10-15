export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { type Event, PrismaClient } from "@prisma/client";
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes";
import { ApiError } from "~/utils/ApiError";
import { withErrorHandling } from "~/utils/errorHandler";
const prisma = new PrismaClient();

type LatestEventResponse = {
  id: string;
  price: number;
  from: Date;
  to: Date;
}[];

export const GET = withErrorHandling(
  async (req: Request): Promise<NextResponse> => {
    const events: Event[] = await prisma.event.findMany({
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

    const response: LatestEventResponse = events.map((event) => ({
      id: event.id,
      price: event.price,
      from: event.from,
      to: event.to,
    }));

    return NextResponse.json(response);
  },
);
