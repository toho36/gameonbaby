export const dynamic = "force-dynamic";

import {NextResponse} from 'next/server';
import {type Event, PrismaClient} from "@prisma/client";
import getCode, {ErrorCodes, Modules} from "~/app/api/error/error-codes";
import {ApiError} from "~/utils/ApiError";

const prisma = new PrismaClient()

type LatestEventResponse = {
  id: string
  price: number
  from: Date
  to: Date
}


export async function GET() {
  const event: Event | null = await prisma.event.findFirst({
    where: {
      from: {
        gt: new Date()
      }
    },
    orderBy: {
      from: 'asc'
    }
  });

  if (!event) {
    throw new ApiError("There is no event available at the moment.", 404, getCode(Modules.EVENT, ErrorCodes.NOT_FOUND))
  }

  const response: LatestEventResponse = {
    id: event.id,
    price: event.price,
    from: event.from,
    to: event.to
  }

  return NextResponse.json(response);
}
