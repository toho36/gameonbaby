export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PaymentType } from "~/app/constant/paymentType";
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes";
import * as registrationService from "~/server/service/registrationService";
import { ApiError } from "~/utils/ApiError";
import { withErrorHandling } from "~/utils/errorHandler";

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
  qrCodeData?: string | null;
}

export const POST = withErrorHandling(
  async (req: Request): Promise<NextResponse> => {
    console.log("📌 API ENTRY: /api/registration POST endpoint called");
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request: CreateRegistrationRequest = await req.json();

      console.log("Registration attempt:", {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        eventId: request.eventId,
        paymentType: request.paymentType,
      });

      // Validate payment type
      if (!Object.values(PaymentType).includes(request.paymentType)) {
        console.error(`Invalid payment type received: ${request.paymentType}`);
        console.log("Valid payment types are:", Object.values(PaymentType));
        throw new ApiError(
          `The payment type ${request.paymentType} cannot be processed.`,
          400,
          getCode(Modules.REGISTRATION, ErrorCodes.BAD_PAYMENT_TYPE),
        );
      }

      console.log(
        "Payment type validation successful, proceeding with registration...",
      );

      // Proceed with registration creation
      try {
        const registrationDto = await registrationService.createRegistration({
          ...request,
        });

        console.log("Registration created successfully:", registrationDto);

        return NextResponse.json<CreateRegistrationResponse>(
          {
            ...registrationDto,
          },
          { status: 201 },
        );
      } catch (serviceError) {
        console.error("Error in registration service:", serviceError);
        throw serviceError;
      }
    } catch (error) {
      console.error("Registration error with details:", error);
      throw error; // Re-throw to let the error handler handle it
    }
  },
);
