// @ts-check
const { PrismaClient } = require("@prisma/client");

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

    // Check column type
    const columnInfo = await prisma.$queryRaw`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'RegistrationHistory' 
      AND column_name = 'action_type'
    `;

    console.log("Current action_type column type:", columnInfo);

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

    // Ensure enum values are properly handled
    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'REGISTERED'
      WHERE "action_type" = '0'
    `;

    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'UNREGISTERED'
      WHERE "action_type" = '1'
    `;

    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'MOVED_TO_WAITLIST'
      WHERE "action_type" = '2'
    `;

    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'MOVED_FROM_WAITLIST'
      WHERE "action_type" = '3'
    `;

    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'DELETED_BY_MODERATOR'
      WHERE "action_type" = '4'
    `;

    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'EVENT_CREATED'
      WHERE "action_type" = '5'
    `;

    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'EVENT_DELETED'
      WHERE "action_type" = '6'
    `;

    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type" = 'EVENT_UPDATED'
      WHERE "action_type" = '7'
    `;

    console.log("Updated enum values successfully!");

    // Vacuum the table to clean up any bloat
    await prisma.$executeRaw`VACUUM "RegistrationHistory"`;

    console.log("Column fix completed successfully!");
  } catch (error) {
    console.error("Error fixing action_type column:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixActionTypeColumn();
