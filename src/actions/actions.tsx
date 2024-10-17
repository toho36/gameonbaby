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
