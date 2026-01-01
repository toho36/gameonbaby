export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { type Event } from "@prisma/client";
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes";
import { ApiError } from "~/utils/ApiError";
import { withErrorHandling } from "~/utils/errorHandler";
import prisma from "~/lib/db";

type LatestEventResponse = {
  id: string;
  price: number;
  from: Date;
  to: Date;
};

export const GET = withErrorHandling(
  async (req: Request): Promise<NextResponse> => {
    const events: Event[] = await prisma.event.findMany({
      // orderBy: {
      //   from: "asc",
      // },
    });

    if (events.length === 0) {
      throw new ApiError(
        "There is no event available at the moment.",
        404,
        getCode(Modules.EVENT, ErrorCodes.NOT_FOUND),
      );
    }

    // Assuming you want the first event in the sorted list
    const event = events[0];

    if (!event) {
      throw new ApiError(
        "Event data is unavailable.",
        404,
        getCode(Modules.EVENT, ErrorCodes.NOT_FOUND),
      );
    }

    const response: LatestEventResponse = {
      id: event.id,
      price: event.price,
      from: event.from,
      to: event.to,
    };

    return NextResponse.json(response);
  },
);
