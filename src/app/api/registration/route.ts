export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PaymentType } from "~/app/constant/paymentType";
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes";
import * as registrationService from "~/server/service/registrationService";
import { ApiError } from "~/utils/ApiError";
import { withErrorHandling } from "~/utils/errorHandler";
import { sendRegistrationEmail } from "~/server/service/emailService";
import { generateQRCodeURL, generateQRCodeURLWithAccountId } from "~/utils/qrCodeUtils";
import prisma from "~/lib/db";

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

        // Get event details for the email
        try {
          const event = await prisma.event.findUnique({
            where: { id: request.eventId },
          });

          let qrCodeUrl: string | null = null;
          if (event) {
            // Format date and time for email
            const eventDate = new Date(event.from).toLocaleDateString("cs-CZ");

            // Create adjusted dates for display (add 2 hours to match the correction in event creation)
            const fromDate = new Date(event.from);
            const toDate = new Date(event.to);
            fromDate.setHours(fromDate.getHours() + 2);
            toDate.setHours(toDate.getHours() + 2);

            const eventTime = `${fromDate.toLocaleTimeString("cs-CZ", {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${toDate.toLocaleTimeString("cs-CZ", {
              hour: "2-digit",
              minute: "2-digit",
            })}`;

            // Generate QR code for the email and response
            if (event.bankAccountId) {
              // Use event-specific bank account
              qrCodeUrl = generateQRCodeURLWithAccountId(
                `${request.firstName} ${request.lastName}`,
                eventDate,
                event.price,
                event.bankAccountId,
              );
            } else {
              // Use default bank account
              qrCodeUrl = generateQRCodeURL(
                `${request.firstName} ${request.lastName}`,
                eventDate,
                event.price,
              );
            }

            // Send confirmation email
            await sendRegistrationEmail(
              request.email,
              request.firstName,
              qrCodeUrl,
              eventDate,
              eventTime,
              event.place || "TJ JM Chodov",
              event.title,
              event.price,
            );

            console.log("Confirmation email sent to:", request.email);
          } else {
            console.error("Could not find event details for email");
            return NextResponse.json(
              { success: false, message: "Event not found" },
              { status: 404 }
            );
          }

          return NextResponse.json<CreateRegistrationResponse>(
            {
              ...registrationDto,
              qrCodeData: qrCodeUrl,
            },
            { status: 201 },
          );
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Continue with the response even if email fails
        }
      } catch (serviceError) {
        console.error("Error in registration service:", serviceError);
        throw serviceError;
      }
    } catch (error) {
      console.error("Registration error with details:", error);
      throw error; // Re-throw to let the error handler handle it
    }
    // Fallback: should never reach here, but return a 500 if it does
    return NextResponse.json({ success: false, message: "Unknown error" }, { status: 500 });
  },
);
