import type {Event, Registration} from "@prisma/client";
import {PrismaClient} from "@prisma/client";
import getCode, {ErrorCodes, Modules} from "~/app/api/error/error-codes";
import {PaymentType} from "~/app/constant/paymentType";
import {ApiError} from "~/utils/ApiError";
import * as paymentService from "~/server/service/paymentService"

const prisma = new PrismaClient()

interface CreateRegistrationCommand {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  eventId: string;
  paymentType: PaymentType,
}

interface RegistragionDto {
  firstName: string;
  lastName: string;
  email: string;
  registrationId: string;
  paymentType: PaymentType;
  qrCodeData?: string | null;
}

export async function createRegistration(command: CreateRegistrationCommand): Promise<RegistragionDto> {

  const event: Event | null = await prisma.event.findFirst({
    where: {
      id: command.eventId
    }
  })

  if (!event) {
    throw new ApiError(
      `The event ${command.eventId} was not found.`,
      404,
      getCode(Modules.REGISTRATION, ErrorCodes.EVENT_NOT_FOUND)
    )
  }

  const existingRegistration: Registration | null = await prisma.registration.findFirst({
    where: {
      event_id: command.eventId,
      email: {
        equals: command.email,
        mode: 'insensitive', // This makes the comparison case-insensitive
      },
    }
  })

  if (existingRegistration) {
    throw new ApiError(
      `There already exists registration under e-mail ${command.email} for this event`,
      409,
      getCode(Modules.REGISTRATION, ErrorCodes.REGISTRATION_ALREADY_EXISTS)
    )
  }

  const registration: Registration = await prisma.registration.create({
    data: {
      email: command.email.toLowerCase(),
      event: {
        connect: event
      },
      first_name: command.firstName,
      last_name: command.lastName,
      phone_number: command.phoneNumber,
      payment_type: command.paymentType,
      created_at: new Date()
    }
  })

  const paymentData = command.paymentType === PaymentType.CARD
    ? await paymentService.createPayment({
      firstName: command.firstName,
      lastName: command.lastName,
      price: event.price,
    })
    : null;

  return {
    firstName: registration.first_name,
    lastName: registration.last_name,
    email: registration.email,
    registrationId: registration.id,
    paymentType: PaymentType[registration.payment_type as keyof typeof PaymentType],
    qrCodeData: paymentData
  }
}

