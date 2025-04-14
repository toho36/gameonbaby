// @ts-check
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixActionTypeColumn() {
  try {
    console.log("Fixing action_type column in RegistrationHistory table...");

    // First check if the table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'RegistrationHistory'
      )
    `;

    // @ts-ignore
    if (!tableExists[0].exists) {
      console.log("RegistrationHistory table does not exist.");
      return;
    }

    // Alter the action_type column to ensure it's TEXT
    await prisma.$executeRaw`
      ALTER TABLE "RegistrationHistory" 
      ALTER COLUMN "action_type" TYPE TEXT
    `;

    console.log("Fixed action_type column type successfully!");

    // Update any existing values to ensure they're proper strings
    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = CAST("action_type" AS TEXT)
    `;

    console.log("Updated existing action_type values successfully!");

    console.log("Column fix completed successfully!");
  } catch (error) {
    console.error("Error fixing action_type column:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixActionTypeColumn();
