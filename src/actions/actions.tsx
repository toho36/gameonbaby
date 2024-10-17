"use server";

import { revalidatePath } from "next/cache";
import prisma from "~/lib/db";

export async function createEvent(formData: FormData) {
  await prisma.event.create({
    data: {
      price: Number(formData.get("price")),
      from: new Date(formData.get("from") as string),
      to: new Date(formData.get("to") as string),
      created_at: new Date(),
    },
  });
  revalidatePath("/events");
}

export async function editEvent(formData: FormData) {
  await prisma.event.update({
    where: { id: formData.get("id") as string },
    data: {
      price: Number(formData.get("price")),
    },
  });
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({
    where: { id },
  });
}

export async function createRegistration(formData: FormData) {
  await prisma.registration.create({
    data: {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone_number: formData.get("phone_number") as string,
      created_at: new Date(),
      event: {
        connect: { id: formData.get("event_id") as string },
      },
      payment_type: formData.get("payment_type") as string,
    },
  });
}

export async function deleteRegistration(id: string) {
  await prisma.registration.delete({
    where: { id },
  });
}
