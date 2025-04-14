// This script fixes database issues with registrations and payments
// It handles orphaned payments and corrects any data inconsistencies

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database cleanup...");

  // 1. Find all payments without valid registrations
  console.log("Checking for orphaned payments...");
  const allPayments = await prisma.payment.findMany({
    include: {
      registration: true,
    },
  });

  const orphanedPayments = allPayments.filter(
    (payment) => !payment.registration,
  );

  if (orphanedPayments.length > 0) {
    console.log(
      `Found ${orphanedPayments.length} orphaned payments. Deleting...`,
    );

    for (const payment of orphanedPayments) {
      await prisma.payment.delete({
        where: { id: payment.id },
      });
      console.log(`Deleted orphaned payment: ${payment.id}`);
    }
  } else {
    console.log("No orphaned payments found.");
  }

  // 2. Check for any registrations that might have issues
  console.log("\nVerifying all registrations...");

  const registrations = await prisma.registration.findMany({
    include: {
      payment: true,
      event: true,
    },
  });

  console.log(`Found ${registrations.length} total registrations.`);
  let fixedCount = 0;

  // Attempt to fix any problematic registrations
  for (const reg of registrations) {
    try {
      // Validate the event relationship
      if (!reg.event) {
        console.log(
          `Registration ${reg.id} has no valid event. Will be deleted.`,
        );

        // Delete associated payment first
        if (reg.payment) {
          await prisma.payment.delete({
            where: { registration_id: reg.id },
          });
        }

        // Then delete the registration
        await prisma.registration.delete({
          where: { id: reg.id },
        });

        fixedCount++;
        continue;
      }

      // Fix any payments with issues
      if (reg.payment) {
        // If need to fix any payment data, do it here
        // For example, ensuring valid variable_symbol
        if (
          !reg.payment.variable_symbol ||
          reg.payment.variable_symbol.trim() === ""
        ) {
          await prisma.payment.update({
            where: { id: reg.payment.id },
            data: {
              variable_symbol: `FIX${Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, "0")}`,
            },
          });

          console.log(
            `Fixed missing variable symbol for payment: ${reg.payment.id}`,
          );
          fixedCount++;
        }
      }
    } catch (error) {
      console.error(`Error processing registration ${reg.id}:`, error);
    }
  }

  console.log(`\nDatabase cleanup complete. Fixed ${fixedCount} issues.`);
}

main()
  .catch((e) => {
    console.error("Error during database cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
