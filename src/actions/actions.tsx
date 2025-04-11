"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "~/lib/db";

export async function createEvent(formData: FormData) {
  try {
    await prisma.event.create({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: Number(formData.get("price") || 0),
        place: (formData.get("place") as string) || null,
        from: new Date(formData.get("from") as string),
        to: new Date(formData.get("to") as string),
        created_at: new Date(),
        visible: formData.get("visible") === "true",
      },
    });
    revalidatePath("/events");
    revalidatePath("/admin/events");
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "Event with this data already exists" };
      }
    }
    console.error(error);
    return { error: "Failed to create event" };
  }
}

export async function updateEvent(id: string, formData: FormData) {
  try {
    // Parse dates correctly to avoid timezone issues
    const fromString = formData.get("from") as string;
    const toString = formData.get("to") as string;

    // Create dates from ISO strings
    const fromDate = new Date(fromString);
    const toDate = new Date(toString);

    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return { error: "Invalid date format" };
    }

    await prisma.event.update({
      where: { id },
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: Number(formData.get("price") || 0),
        place: (formData.get("place") as string) || null,
        from: fromDate,
        to: toDate,
        visible: formData.get("visible") === "true",
        capacity: Number(formData.get("capacity") || 0),
      },
    });
    revalidatePath("/events");
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
    return { success: true };
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return { error: "Failed to duplicate event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    // Check if event has registrations
    const registrationCount = await prisma.registration.count({
      where: { event_id: id },
    });

    if (registrationCount > 0) {
      return {
        error:
          "Cannot delete event with existing registrations. Consider hiding it instead.",
      };
    }

    await prisma.event.delete({
      where: { id },
    });

    revalidatePath("/events");
    revalidatePath("/admin/events");
    return { success: true };
  } catch (error) {
    console.error(error);
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
    console.log(
      "Received form data:",
      formData.get("first_name"),
      formData.get("email"),
    );

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
      console.log("No event found for registration.");
      return {
        success: false,
        message: "No event available for registration.",
      };
    }

    console.log("Creating new registration...");
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

    console.log("Registration created successfully.");
    return { success: true, registration };
  } catch (error) {
    console.error("Error creating registration:", error);
    return {
      success: false,
      message: "Failed to complete registration. Please try again later.",
    };
  }
}

export async function deleteRegistration(id: string) {
  await prisma.registration.delete({
    where: { id },
  });
}
