import { NextRequest, NextResponse } from "next/server";
import prisma from "~/lib/db";
import { getCurrentUser } from "~/server/service/userService";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PrismaClient } from "@prisma/client";
import { sendWaitingListPromotionEmail } from "~/server/service/emailService";
import {
  recordRegistrationHistory,
  RegistrationAction,
} from "~/utils/registrationHistory";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();

    // Check if user is authenticated
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to unregister" },
        { status: 401 },
      );
    }

    const eventId = params.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    // Check if the event is in the past
    if (new Date(event.to) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Cannot unregister from past events" },
        { status: 400 },
      );
    }

    // Check if user is registered for this event
    // Only search by email if it exists
    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account does not have an email address",
        },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email: user.email,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "You are not registered for this event" },
        { status: 400 },
      );
    }

    // Delete the registration
    await prisma.registration.delete({
      where: {
        id: registration.id,
      },
    });

    // Record unregistration history
    await recordRegistrationHistory({
      eventId: eventId,
      registrationId: registration.id,
      firstName: registration.first_name,
      lastName: registration.last_name,
      email: registration.email,
      phoneNumber: registration.phone_number,
      actionType: RegistrationAction.UNREGISTERED,
      userId: user.id,
      eventTitle: event.title,
    });

    // Check if there's anyone on the waiting list for this event
    const waitingListEntry = await prisma.waitingList.findFirst({
      where: {
        event_id: eventId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    if (waitingListEntry) {
      // Get event details for the email
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      // Move the first person from the waiting list to registrations
      const newRegistration = await prisma.registration.create({
        data: {
          event_id: eventId,
          first_name: waitingListEntry.first_name,
          last_name: waitingListEntry.last_name,
          email: waitingListEntry.email,
          phone_number: waitingListEntry.phone_number,
          payment_type: waitingListEntry.payment_type,
          created_at: new Date(),
        },
      });

      // Record moving from waiting list history
      await recordRegistrationHistory({
        eventId: eventId,
        registrationId: newRegistration.id,
        waitingListId: waitingListEntry.id,
        firstName: waitingListEntry.first_name,
        lastName: waitingListEntry.last_name,
        email: waitingListEntry.email,
        phoneNumber: waitingListEntry.phone_number,
        actionType: RegistrationAction.MOVED_FROM_WAITLIST,
        eventTitle: event?.title,
      });

      // Delete the entry from the waiting list
      await prisma.waitingList.delete({
        where: {
          id: waitingListEntry.id,
        },
      });

      // Send notification email to the person moved from waiting list
      if (event) {
        try {
          const formattedDate = new Date(event.from).toLocaleDateString(
            "cs-CZ",
          );
          const startTime = new Date(event.from).toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const endTime = new Date(event.to).toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
          });

          await sendWaitingListPromotionEmail(
            waitingListEntry.email,
            waitingListEntry.first_name,
            event.title,
            formattedDate,
            `${startTime} - ${endTime}`,
            event.place || "See event details online",
            waitingListEntry.payment_type,
          );
        } catch (emailError) {
          console.error(
            "Failed to send waiting list promotion email:",
            emailError,
          );
          // Continue with the operation even if email fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unregistered from event",
    });
  } catch (error) {
    console.error("Error unregistering from event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unregister from event" },
      { status: 500 },
    );
  }
}
