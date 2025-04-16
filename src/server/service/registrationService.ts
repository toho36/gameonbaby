import type { Event, Registration } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import getCode, { ErrorCodes, Modules } from "~/app/api/error/error-codes";
import { PaymentType } from "~/app/constant/paymentType";
import { ApiError } from "~/utils/ApiError";
import * as paymentService from "~/server/service/paymentService";
import {
  recordRegistrationHistory,
  RegistrationAction,
} from "~/utils/registrationHistory";

const prisma = new PrismaClient();

interface CreateRegistrationCommand {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  eventId: string;
  paymentType: PaymentType;
}

interface RegistragionDto {
  firstName: string;
  lastName: string;
  email: string;
  registrationId: string;
  paymentType: PaymentType;
  qrCodeData?: string | null;
}

export async function createRegistration(
  command: CreateRegistrationCommand,
): Promise<RegistragionDto> {
  console.log("📌 SERVICE: Starting createRegistration with data:", {
    ...command,
    // Hide sensitive parts for logging
    email:
      command.email.slice(0, 3) +
      "***" +
      command.email.slice(command.email.indexOf("@")),
  });

  try {
    console.log("Looking up event with ID:", command.eventId);
    const event: Event | null = await prisma.event.findFirst({
      where: {
        id: command.eventId,
      },
    });

    if (!event) {
      console.error(`Event not found with ID: ${command.eventId}`);
      throw new ApiError(
        `The event ${command.eventId} was not found.`,
        404,
        getCode(Modules.REGISTRATION, ErrorCodes.EVENT_NOT_FOUND),
      );
    }

    console.log("Event found:", {
      id: event.id,
      title: event.title,
      capacity: event.capacity,
      price: event.price,
    });

    // Check for duplicate registration (same email AND same name)
    console.log("Checking for duplicate registration with:", {
      eventId: command.eventId,
      email:
        command.email.slice(0, 3) +
        "***" +
        command.email.slice(command.email.indexOf("@")),
      firstName: command.firstName,
      lastName: command.lastName || "",
    });

    try {
      const existingRegistration: Registration | null =
        await prisma.registration.findFirst({
          where: {
            event_id: command.eventId,
            email: {
              equals: command.email,
              mode: "insensitive", // This makes the comparison case-insensitive
            },
            first_name: {
              equals: command.firstName,
              mode: "insensitive", // Case-insensitive name comparison
            },
            last_name: {
              equals: command.lastName || "",
              mode: "insensitive", // Case-insensitive name comparison
            },
          },
        });

      if (existingRegistration) {
        console.log("Duplicate registration found!");
        throw new ApiError(
          `There already exists a registration for ${command.firstName} ${command.lastName} with email ${command.email} for this event`,
          409,
          getCode(Modules.REGISTRATION, ErrorCodes.REGISTRATION_ALREADY_EXISTS),
        );
      }

      console.log(
        "No duplicate registration found, proceeding with registration creation",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Error checking for duplicate registration:", error);
      throw new ApiError(
        "Failed to check for existing registrations",
        500,
        getCode(Modules.REGISTRATION, ErrorCodes.DATABASE_ERROR),
      );
    }

    // Create the registration
    console.log("Creating new registration record...");
    let registration: Registration;
    try {
      registration = await prisma.registration.create({
        data: {
          email: command.email.toLowerCase(),
          event: {
            connect: { id: event.id },
          },
          first_name: command.firstName,
          last_name: command.lastName,
          phone_number: command.phoneNumber,
          payment_type: command.paymentType,
          created_at: new Date(),
        },
      });
      console.log(
        "Registration record created successfully with ID:",
        registration.id,
      );
    } catch (error) {
      console.error("Failed to create registration record:", error);
      throw new ApiError(
        "Failed to create registration",
        500,
        getCode(Modules.REGISTRATION, ErrorCodes.DATABASE_ERROR),
      );
    }

    // Record registration history
    console.log("Recording registration history...");
    try {
      await recordRegistrationHistory({
        eventId: event.id,
        registrationId: registration.id,
        firstName: registration.first_name,
        lastName: registration.last_name,
        email: registration.email,
        phoneNumber: registration.phone_number,
        actionType: RegistrationAction.REGISTERED,
        eventTitle: event.title,
      });
      console.log("Registration history recorded successfully");
    } catch (error) {
      console.warn("Warning: Failed to record registration history:", error);
      // Don't throw error here, registration history is optional
    }

    // Handle payment data if needed
    console.log(
      "Checking if payment data is needed for type:",
      command.paymentType,
    );
    let paymentData = null;
    if (command.paymentType === PaymentType.CARD) {
      try {
        console.log("Creating payment data for card payment...");
        paymentData = await paymentService.createPayment({
          firstName: command.firstName,
          // lastName: command.lastName,
          price: event.price,
        });
        console.log("Payment data created successfully");
      } catch (error) {
        console.error("Error creating payment data:", error);
        // Don't throw error, proceed with registration
      }
    }

    console.log("Registration process completed successfully");
    return {
      firstName: registration.first_name || "",
      lastName: registration.last_name ?? "",
      email: registration.email || "",
      registrationId: registration.id,
      paymentType:
        PaymentType[registration.payment_type as keyof typeof PaymentType],
      qrCodeData: paymentData,
    };
  } catch (error) {
    console.error("Error in createRegistration service:", error);
    throw error; // Re-throw to let the caller handle it
  }
}
