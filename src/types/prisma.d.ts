import { PrismaClient } from "@prisma/client";

// Extend the Prisma types to include custom fields
declare global {
  namespace Prisma {
    namespace User {
      export type role = "USER" | "REGULAR" | "MODERATOR" | "ADMIN";
    }
  }
}

export {};
