import {NextResponse} from 'next/server';
import {type Event, PrismaClient} from "@prisma/client";
import getCode, {ErrorCodes, Modules} from "~/app/api/error/error-codes";

const prisma = new PrismaClient()

type LatestEventResponse = {
  id: string
  price: number
  from: Date
  to: Date
}


export async function GET() {
  const event: Event = await prisma.event.findFirst({
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
    return NextResponse.json<ErrorResponse>({
      code: getCode(Modules.EVENT, ErrorCodes.NOT_FOUND),
      message: 'There is no event available at the moment.'
    }, {status: 404})
  }

  const response: LatestEventResponse = {
    id: event.id,
    price: event.price,
    from: event.from,
    to: event.to
  }

  return NextResponse.json(response);
}
