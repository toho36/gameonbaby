"use server";

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
}
