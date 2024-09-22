import {NextResponse} from "next/server";
import {PaymentType} from "~/app/constant/paymentType";
import getCode, {ErrorCodes, Modules} from "~/app/api/error/error-codes";
import * as registrationService from "~/server/service/registrationService";
import {ApiError} from "~/utils/ApiError";
import {withErrorHandling} from "~/utils/errorHandler";

interface CreateRegistrationRequest {
  firstName: string;
  lastName: number;
  email: string;
  phoneNumber?: string | null;
  eventId: string;
  paymentType: PaymentType,
}

interface CreateRegistrationResponse {
  firstName: string;
  lastName: number;
  email: string;
  registrationId: string;
  paymentType: PaymentType;
  qrCodeData?: string | null;
}

export const POST = withErrorHandling(async (req: Request): Promise<NextResponse> => {
  const request: CreateRegistrationRequest = await req.json();
  console.log(request);

  // Validate payment type
  if (!Object.values(PaymentType).includes(request.paymentType)) {
    throw new ApiError(
      `The payment type ${request.paymentType} cannot be processed.`,
      400,
      getCode(Modules.REGISTRATION, ErrorCodes.BAD_PAYMENT_TYPE)
    );
  }

  // Proceed with registration creation
  const registrationDto = await registrationService.createRegistration({...request});

  return NextResponse.json<CreateRegistrationResponse>({
    ...registrationDto
  }, {status: 201});
});
