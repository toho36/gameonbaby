// This script updates the payment constraint to enable cascade delete
import { PrismaClient } from "@prisma/client";
import pkg from "pg";
const { Pool } = pkg;

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database constraint update...");

  // Create a direct connection to the database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({
    connectionString,
  });

  try {
    // First, list all tables to find the actual table names (case sensitive)
    console.log("Listing all tables...");
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    console.log("Tables in database:");
    for (const row of tablesResult.rows) {
      console.log(`- ${row.table_name}`);
    }

    // Find all foreign key constraints
    console.log("\nListing all foreign key constraints...");
    const allConstraintsResult = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.constraint_type = 'FOREIGN KEY';
    `);

    console.log("Foreign key constraints:");
    for (const row of allConstraintsResult.rows) {
      console.log(
        `- ${row.constraint_name}: ${row.table_name}(${row.column_name}) -> ${row.foreign_table_name}(${row.foreign_column_name})`,
      );
    }

    // Look for Payment & Registration tables with case insensitivity
    let paymentTable = null;
    let registrationTable = null;
    let constraintToModify = null;

    for (const row of tablesResult.rows) {
      if (row.table_name.toLowerCase() === "payment") {
        paymentTable = row.table_name;
      }
      if (row.table_name.toLowerCase() === "registration") {
        registrationTable = row.table_name;
      }
    }

    console.log(`\nPayment table: ${paymentTable}`);
    console.log(`Registration table: ${registrationTable}`);

    if (!paymentTable || !registrationTable) {
      console.log("Could not find Payment or Registration tables.");
      return;
    }

    // Find the constraint for the Payment -> Registration relationship
    for (const row of allConstraintsResult.rows) {
      if (
        row.table_name.toLowerCase() === paymentTable.toLowerCase() &&
        row.foreign_table_name.toLowerCase() === registrationTable.toLowerCase()
      ) {
        constraintToModify = row;
        break;
      }
    }

    if (!constraintToModify) {
      console.log(
        "Could not find constraint for Payment -> Registration relationship.",
      );
      return;
    }

    console.log(
      `\nFound constraint to modify: ${constraintToModify.constraint_name}`,
    );

    // Drop the existing constraint
    console.log("Dropping existing constraint...");
    await pool.query(`
      ALTER TABLE "${paymentTable}" 
      DROP CONSTRAINT "${constraintToModify.constraint_name}";
    `);

    // Add the new constraint with ON DELETE CASCADE
    console.log("Adding new constraint with CASCADE delete...");
    await pool.query(`
      ALTER TABLE "${paymentTable}" 
      ADD CONSTRAINT "${constraintToModify.constraint_name}" 
      FOREIGN KEY ("${constraintToModify.column_name}") 
      REFERENCES "${registrationTable}"("${constraintToModify.foreign_column_name}") 
      ON DELETE CASCADE;
    `);

    console.log("Database constraint updated successfully!");

    // Verify there are no orphaned payments
    const payments = await prisma.payment.findMany({
      include: {
        registration: true,
      },
    });

    const orphanedPayments = payments.filter((p) => !p.registration);
    console.log(`Found ${orphanedPayments.length} orphaned payments.`);

    console.log("Database update complete.");
  } catch (error) {
    console.error("Error updating database constraint:", error);
    throw error;
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
