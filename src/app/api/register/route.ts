// pages/api/register.ts
import { type NextApiRequest, type NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { PaymentType } from "~/app/constant/paymentType"; // Ensure this path is correct
import { ApiError } from "~/utils/ApiError"; // Ensure this path is correct
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes"; // Ensure this path is correct

const db = new PrismaClient();

interface CreateRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  eventId: string;
  paymentType: PaymentType;
}

interface CreateRegistrationResponse {
  firstName: string;
  lastName: string;
  email: string;
  registrationId: string;
  paymentType: PaymentType;
}
export async function POST(
  req: NextApiRequest,
  res: NextApiResponse<CreateRegistrationResponse | { error: string }>,
) {
  try {
    const request = req.body as CreateRegistrationRequest;

    // Validate payment type
    if (!Object.values(PaymentType).includes(request.paymentType)) {
      throw new ApiError(
        `The payment type ${request.paymentType} cannot be processed.`,
        400,
        getCode(Modules.REGISTRATION, ErrorCodes.BAD_PAYMENT_TYPE),
      );
    }

    const registration = await db.registration.create({
      data: {
        first_name: request.firstName,
        last_name: request.lastName,
        email: request.email,
        phone_number: request.phoneNumber,
        created_at: new Date(),
        event_id: request.eventId,
        payment_type: request.paymentType,
      },
    });

    const response: CreateRegistrationResponse = {
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      registrationId: registration.id,
      paymentType: request.paymentType,
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
}
