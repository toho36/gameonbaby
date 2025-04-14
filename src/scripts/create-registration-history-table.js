// @ts-check
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createRegistrationHistoryTable() {
  try {
    console.log("Creating RegistrationHistory table...");

    // Check if table already exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'RegistrationHistory'
      )
    `;

    // @ts-ignore
    if (tableExists[0].exists) {
      console.log("RegistrationHistory table already exists.");
      return;
    }

    // Create the table with raw SQL
    await prisma.$executeRaw`
      CREATE TABLE "RegistrationHistory" (
        "id" TEXT NOT NULL,
        "event_id" TEXT NOT NULL,
        "registration_id" TEXT,
        "waiting_list_id" TEXT,
        "first_name" TEXT NOT NULL,
        "last_name" TEXT,
        "email" TEXT NOT NULL,
        "phone_number" TEXT,
        "action_type" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "user_id" TEXT,
        "event_title" TEXT,
        
        CONSTRAINT "RegistrationHistory_pkey" PRIMARY KEY ("id")
      )
    `;

    console.log("RegistrationHistory table created successfully!");
  } catch (error) {
    console.error("Error creating RegistrationHistory table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createRegistrationHistoryTable();
