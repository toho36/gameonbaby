// @ts-check
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addMissingColumns() {
  try {
    console.log("Adding missing columns to RegistrationHistory table...");

    // Check if the user_id column exists
    const columnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'RegistrationHistory'
        AND column_name = 'user_id'
      )
    `;

    // @ts-ignore
    if (columnExists[0].exists) {
      console.log("user_id column already exists.");
    } else {
      // Add the missing user_id column
      await prisma.$executeRaw`
        ALTER TABLE "RegistrationHistory" 
        ADD COLUMN "user_id" TEXT
      `;
      console.log("Added user_id column successfully!");
    }

    // Check if the event_title column exists
    const eventTitleColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'RegistrationHistory'
        AND column_name = 'event_title'
      )
    `;

    // @ts-ignore
    if (eventTitleColumnExists[0].exists) {
      console.log("event_title column already exists.");
    } else {
      // Add the missing event_title column
      await prisma.$executeRaw`
        ALTER TABLE "RegistrationHistory" 
        ADD COLUMN "event_title" TEXT
      `;
      console.log("Added event_title column successfully!");
    }

    console.log("Table structure update completed successfully!");
  } catch (error) {
    console.error("Error updating RegistrationHistory table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addMissingColumns();
