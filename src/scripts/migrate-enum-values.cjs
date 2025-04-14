// @ts-check
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateActionTypeEnum() {
  try {
    console.log("Beginning migration of action_type to enum type...");

    // First, create a temporary column
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "RegistrationHistory" ADD COLUMN "action_type_enum" TEXT`,
    );
    console.log("Added temporary column");

    // Copy values with conversion
    await prisma.$executeRaw`
      UPDATE "RegistrationHistory"
      SET "action_type_enum" = "action_type"
    `;

    // Make sure all values are valid enum values
    const validTypes = [
      "REGISTERED",
      "UNREGISTERED",
      "MOVED_TO_WAITLIST",
      "MOVED_FROM_WAITLIST",
      "DELETED_BY_MODERATOR",
      "EVENT_CREATED",
      "EVENT_DELETED",
      "EVENT_UPDATED",
    ];

    // Create a safe string of valid values
    const validTypesString = validTypes.map((type) => `'${type}'`).join(",");

    // Set default for any invalid values
    await prisma.$executeRawUnsafe(`
      UPDATE "RegistrationHistory"
      SET "action_type_enum" = 'REGISTERED'
      WHERE "action_type_enum" NOT IN (${validTypesString})
    `);

    // Drop the original column
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "RegistrationHistory" DROP COLUMN "action_type"`,
    );
    console.log("Dropped original column");

    // Rename the new column to the original name
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "RegistrationHistory" RENAME COLUMN "action_type_enum" TO "action_type"`,
    );
    console.log("Renamed temporary column");

    // Add a check constraint to ensure only valid enum values are used
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RegistrationHistory" 
      ADD CONSTRAINT "RegistrationHistory_action_type_check" 
      CHECK ("action_type" IN (${validTypesString}))
    `);
    console.log("Added constraint to enforce enum values");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
migrateActionTypeEnum();
