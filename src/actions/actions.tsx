"use server";

import { revalidatePath } from "next/cache";
import prisma from "~/lib/db";
import {
  recordRegistrationHistory,
  RegistrationAction,
} from "~/utils/registrationHistory";
import { convertPragueTimeStringToUTC } from "~/utils/timezoneUtils";
import { sendWaitingListPromotionEmail } from "~/server/service/emailService";
import { generateQRCodeURL } from "~/utils/qrCodeUtils";

export async function createEvent(formData: FormData) {
  try {
    // Get date values from form data
    const fromString = formData.get("from") as string;
    const toString = formData.get("to") as string;

    // Convert datetime-local strings (interpreted as Prague time) to UTC
    // If the string is already an ISO string (has 'Z' or timezone), use it directly
    // Otherwise, treat it as datetime-local in Prague timezone
    const fromDate = fromString.includes("Z") || fromString.includes("+") || fromString.includes("-", 10)
      ? new Date(fromString)
      : convertPragueTimeStringToUTC(fromString);
    const toDate = toString.includes("Z") || toString.includes("+") || toString.includes("-", 10)
      ? new Date(toString)
      : convertPragueTimeStringToUTC(toString);

    const event = await prisma.event.create({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: Number(formData.get("price")),
        place: formData.get("place") as string,
        capacity: Number(formData.get("capacity")),
        from: fromDate,
        to: toDate,
        created_at: new Date(),
        autoPromote: formData.get("autoPromote") === "true",
      },
    });

    // Record event creation history
    await recordRegistrationHistory({
      eventId: event.id,
      firstName: "System",
      email: "system@event.management",
      actionType: RegistrationAction.EVENT_CREATED,
      eventTitle: event.title,
    });

    revalidatePath("/events");
    revalidatePath("/");
    return { id: event.id };
  } catch (error) {
    return { error: "Failed to create event" };
  }
}

export async function updateEvent(id: string, formData: FormData) {
  try {
    // Get the existing event to preserve dates if not provided
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return { error: "Event not found" };
    }

    // Prepare update data with basic fields
    const updateData: Record<string, unknown> = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price") ?? 0),
      place: (formData.get("place") as string) ?? null,
      visible: formData.get("visible") === "true",
      capacity: Number(formData.get("capacity") ?? 0),
      autoPromote: formData.get("autoPromote") === "true",
    };

    // Only update dates if they are provided in the form
    const fromString = formData.get("from") as string | null;
    const toString = formData.get("to") as string | null;

    if (fromString) {
      // Convert datetime-local strings (interpreted as Prague time) to UTC
      // If the string is already an ISO string (has 'Z' or timezone), use it directly
      const fromDate = fromString.includes("Z") || fromString.includes("+") || (fromString.includes("-") && fromString.length > 19)
        ? new Date(fromString)
        : convertPragueTimeStringToUTC(fromString);
      if (!isNaN(fromDate.getTime())) {
        updateData.from = fromDate;
      }
    }

    if (toString) {
      // Convert datetime-local strings (interpreted as Prague time) to UTC
      const toDate = toString.includes("Z") || toString.includes("+") || (toString.includes("-") && toString.length > 19)
        ? new Date(toString)
        : convertPragueTimeStringToUTC(toString);
      if (!isNaN(toDate.getTime())) {
        updateData.to = toDate;
      }
    }

    // Add bankAccountId if present
    if (formData.has("bankAccountId")) {
      const bankAccountId = formData.get("bankAccountId") as string;
      updateData.bankAccountId = bankAccountId ?? null;
    }

    await prisma.event.update({
      where: { id },
      data: updateData,
    });

    // Check if we have available spots and people on waiting list
    // Only auto-promote if the event has autoPromote enabled
    const currentCapacity = updateData.capacity as number;
    if (currentCapacity > 0) {
      const registrationCount = await prisma.registration.count({
        where: { event_id: id },
      });

      const availableSpots = currentCapacity - registrationCount;

      if (availableSpots > 0 && existingEvent.autoPromote) {
        // Get people from waiting list
        const waitingListCandidates = await prisma.waitingList.findMany({
          where: { event_id: id },
          orderBy: { created_at: "asc" },
          take: availableSpots,
        });

        for (const candidate of waitingListCandidates) {
          // Move to registration
          const newRegistration = await prisma.registration.create({
            data: {
              event_id: id,
              first_name: candidate.first_name,
              last_name: candidate.last_name,
              email: candidate.email,
              phone_number: candidate.phone_number,
              payment_type: candidate.payment_type,
              created_at: new Date(),
            },
          });

          // Delete from waiting list
          await prisma.waitingList.delete({
            where: { id: candidate.id },
          });

          // Record history
          await recordRegistrationHistory({
            eventId: id,
            registrationId: newRegistration.id,
            waitingListId: candidate.id,
            firstName: candidate.first_name,
            lastName: candidate.last_name,
            email: candidate.email,
            phoneNumber: candidate.phone_number,
            actionType: RegistrationAction.MOVED_FROM_WAITLIST,
            eventTitle: existingEvent.title,
          });

          // Send email
          try {
            // We need to get the event again to have the correct dates if they were updated
            // or use the existing ones if not.
            // To be safe and simple, let's use the values we have.
            // If dates were updated, they are in updateData (as Date objects), else in existingEvent (as Date objects)

            const finalFrom = (updateData.from as Date) ?? existingEvent.from;
            const finalTo = (updateData.to as Date) ?? existingEvent.to;
            const finalPlace = (updateData.place as string) ?? existingEvent.place;
            const finalTitle = (updateData.title as string) ?? existingEvent.title;

            const formattedDate = new Date(finalFrom).toLocaleDateString(
              "cs-CZ",
              {
                timeZone: "Europe/Prague",
              },
            );

            const startTime = new Date(finalFrom).toLocaleTimeString("cs-CZ", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Prague",
            });
            const endTime = new Date(finalTo).toLocaleTimeString("cs-CZ", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Prague",
            });

            let qrCodeUrl = undefined;
            const price = (updateData.price as number) ?? existingEvent.price;

            // Generate QR code if payment type is QR or CARD (assuming these map to online payment)
            // We use the event title and date for the QR code message
            if (candidate.payment_type === "QR" || candidate.payment_type === "CARD") {
              qrCodeUrl = generateQRCodeURL(
                finalTitle,
                formattedDate,
                price,
                existingEvent.bankAccountId ?? undefined
              );
            }

            await sendWaitingListPromotionEmail(
              candidate.email,
              candidate.first_name,
              finalTitle,
              formattedDate,
              `${startTime} - ${endTime}`,
              finalPlace ?? "See event details online",
              candidate.payment_type,
              qrCodeUrl,
              price
            );
          } catch (emailError) {
            console.error("Failed to send promotion email:", emailError);
          }
        }
      }
    }

    revalidatePath("/events");
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to update event" };
  }
}

export async function duplicateEvent(id: string, bankAccountId?: string) {
  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return { error: "Event not found" };
    }

    // Dates from database are already in UTC, use them directly
    const fromDate = new Date(existingEvent.from);
    const toDate = new Date(existingEvent.to);

    const newEvent = await prisma.event.create({
      data: {
        title: `${existingEvent.title} (Copy)`,
        description: existingEvent.description,
        price: existingEvent.price,
        place: existingEvent.place,
        capacity: existingEvent.capacity,
        from: fromDate,
        to: toDate,
        created_at: new Date(),
        visible: existingEvent.visible,
        autoPromote: false, // Default to false when duplicating
        bankAccountId: typeof bankAccountId !== 'undefined' ? bankAccountId : existingEvent.bankAccountId ?? null,
      },
    });

    revalidatePath("/events");
    revalidatePath("/admin/events");
    return { success: true, eventId: newEvent.id };
  } catch (error) {
    return { error: "Failed to duplicate event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    // Get event details before deletion
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    // Delete the event
    await prisma.event.delete({
      where: { id },
    });

    // Record event deletion history
    await recordRegistrationHistory({
      eventId: id,
      firstName: "System",
      email: "system@event.management",
      actionType: RegistrationAction.EVENT_DELETED,
      eventTitle: event.title,
    });

    revalidatePath("/events");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete event" };
  }
}

export async function editEvent(formData: FormData) {
  await prisma.event.update({
    where: { id: formData.get("id") as string },
    data: {
      price: Number(formData.get("price")),
    },
  });
}

export async function createRegistration(
  formData: FormData,
): Promise<{ success: boolean; message?: string; registration?: any }> {
  try {
    const eventId = formData.get("event_id") as string;
    let event;

    if (eventId) {
      // If eventId is provided, use it
      event = await prisma.event.findUnique({
        where: { id: eventId },
      });
    } else {
      // Fallback to first event if no eventId is provided
      event = await prisma.event.findFirst();
    }

    if (!event) {
      return {
        success: false,
        message: "No event available for registration.",
      };
    }

    const registration = await prisma.registration.create({
      data: {
        first_name: formData.get("first_name") as string,
        email: formData.get("email") as string,
        phone_number: formData.get("phone_number") as string,
        created_at: new Date(),
        event: { connect: { id: event.id } },
        payment_type: formData.get("payment_type") as string,
      },
    });

    // Record registration history
    await recordRegistrationHistory({
      eventId: event.id,
      registrationId: registration.id,
      firstName: registration.first_name,
      lastName: registration.last_name ?? null,
      email: registration.email,
      phoneNumber: registration.phone_number ?? null,
      actionType: RegistrationAction.REGISTERED,
      eventTitle: event.title,
    });

    return { success: true, registration };
  } catch (error) {
    return {
      success: false,
      message: "Failed to complete registration. Please try again later.",
    };
  }
}

export async function deleteRegistration(id: string) {
  try {
    // First get the registration details
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { event: true, payment: true },
    });

    if (!registration) {
      return { success: false, message: "Registration not found" };
    }

    // Delete the associated payment first if it exists
    if (registration.payment) {
      await prisma.payment.delete({
        where: {
          registration_id: registration.id,
        },
      });
    }

    // Now we can delete the registration
    await prisma.registration.delete({
      where: {
        id: registration.id,
      },
    });

    // Record deletion history
    await recordRegistrationHistory({
      eventId: registration.event_id,
      registrationId: id,
      firstName: registration.first_name,
      lastName: registration.last_name,
      email: registration.email,
      phoneNumber: registration.phone_number,
      actionType: RegistrationAction.DELETED_BY_MODERATOR,
      eventTitle: registration.event?.title,
    });

    // Check if there's anyone on the waiting list for this event
    // Only auto-promote if the event has autoPromote enabled
    const waitingListEntry = await prisma.waitingList.findFirst({
      where: {
        event_id: registration.event_id,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    if (waitingListEntry && registration.event?.autoPromote) {
      // Move the first person from the waiting list to registrations
      const newRegistration = await prisma.registration.create({
        data: {
          event_id: registration.event_id,
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
        eventId: registration.event_id,
        registrationId: newRegistration.id,
        waitingListId: waitingListEntry.id,
        firstName: waitingListEntry.first_name,
        lastName: waitingListEntry.last_name,
        email: waitingListEntry.email,
        phoneNumber: waitingListEntry.phone_number,
        actionType: RegistrationAction.MOVED_FROM_WAITLIST,
        eventTitle: registration.event?.title,
      });

      // Delete the entry from the waiting list
      await prisma.waitingList.delete({
        where: {
          id: waitingListEntry.id,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return {
      success: false,
      message: "Failed to delete registration",
      error: String(error),
    };
  }
}
