"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "~/lib/db";
import {
  recordRegistrationHistory,
  RegistrationAction,
} from "~/utils/registrationHistory";

export async function createEvent(formData: FormData) {
  try {
    const event = await prisma.event.create({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: Number(formData.get("price")),
        place: formData.get("place") as string,
        capacity: Number(formData.get("capacity")),
        from: new Date(formData.get("from") as string),
        to: new Date(formData.get("to") as string),
        created_at: new Date(),
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
    const updateData: any = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price") || 0),
      place: (formData.get("place") as string) || null,
      visible: formData.get("visible") === "true",
      capacity: Number(formData.get("capacity") || 0),
    };

    // Only update dates if they are provided in the form
    const fromString = formData.get("from") as string | null;
    const toString = formData.get("to") as string | null;

    if (fromString) {
      const fromDate = new Date(fromString);
      if (!isNaN(fromDate.getTime())) {
        updateData.from = fromDate;
      }
    }

    if (toString) {
      const toDate = new Date(toString);
      if (!isNaN(toDate.getTime())) {
        updateData.to = toDate;
      }
    }

    await prisma.event.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/events");
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to update event" };
  }
}

export async function duplicateEvent(id: string) {
  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return { error: "Event not found" };
    }

    const newEvent = await prisma.event.create({
      data: {
        title: `${existingEvent.title} (Copy)`,
        description: existingEvent.description,
        price: existingEvent.price,
        place: existingEvent.place,
        capacity: existingEvent.capacity,
        from: existingEvent.from,
        to: existingEvent.to,
        created_at: new Date(),
        visible: existingEvent.visible,
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
      lastName: registration.last_name || null,
      email: registration.email,
      phoneNumber: registration.phone_number || null,
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
    const waitingListEntry = await prisma.waitingList.findFirst({
      where: {
        event_id: registration.event_id,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    if (waitingListEntry) {
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
