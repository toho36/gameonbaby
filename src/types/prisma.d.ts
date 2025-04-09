import { PrismaClient } from "@prisma/client";

// Extend the Prisma User type to include the custom fields
declare global {
  namespace PrismaJson {
    interface User {
      role: "USER" | "MODERATOR" | "ADMIN";
      createdAt: Date;
      updatedAt: Date;
      kindeId?: string | null;
    }
  }
}

export {};
