// Script for directly deleting participants from the database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get command line arguments
const args = process.argv.slice(2);
const usage = `
Usage: node delete-participant.js [options]

Options:
  --id <id>           Delete participant by ID
  --email <email>     Delete participant by email
  --event <eventId>   Event ID (required when using --email)
  --list              List all participants
  --help              Show this help message
`;

// Parse command line arguments
const options = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const option = args[i].substring(2);
    const value =
      args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
    options[option] = value;
    if (value !== true) i++;
  }
}

async function main() {
  try {
    // Show help
    if (options.help || Object.keys(options).length === 0) {
      console.log(usage);
      return;
    }

    // List all participants
    if (options.list) {
      const participants = await prisma.registration.findMany({
        include: {
          event: true,
          payment: true,
        },
      });

      if (participants.length === 0) {
        console.log("No participants found.");
        return;
      }

      console.log("Participants:");
      participants.forEach((p, index) => {
        console.log(`${index + 1}. ID: ${p.id}`);
        console.log(`   Name: ${p.first_name} ${p.last_name || ""}`);
        console.log(`   Email: ${p.email}`);
        console.log(`   Event: ${p.event?.title || "Unknown"}`);
        console.log(
          `   Payment: ${p.payment ? (p.payment.paid ? "Paid" : "Not Paid") : "No payment record"}`,
        );
        console.log("---");
      });
      return;
    }

    // Delete by ID
    if (options.id) {
      const registration = await prisma.registration.findUnique({
        where: { id: options.id },
        include: { event: true },
      });

      if (!registration) {
        console.log(`No participant found with ID: ${options.id}`);
        return;
      }

      // First, delete any associated payment
      const payment = await prisma.payment.findUnique({
        where: { registration_id: registration.id },
      });

      if (payment) {
        await prisma.payment.delete({
          where: { id: payment.id },
        });
        console.log("Associated payment record deleted.");
      }

      // Then delete the registration
      await prisma.registration.delete({
        where: { id: registration.id },
      });

      console.log(
        `Participant deleted: ${registration.first_name} ${registration.last_name || ""} (${registration.email})`,
      );
      return;
    }

    // Delete by email (requires event ID)
    if (options.email) {
      if (!options.event) {
        console.log("Error: Event ID is required when deleting by email.");
        console.log(usage);
        return;
      }

      const registration = await prisma.registration.findFirst({
        where: {
          email: options.email,
          event_id: options.event,
        },
        include: { event: true },
      });

      if (!registration) {
        console.log(
          `No participant found with email ${options.email} in the specified event.`,
        );
        return;
      }

      // First, delete any associated payment
      const payment = await prisma.payment.findUnique({
        where: { registration_id: registration.id },
      });

      if (payment) {
        await prisma.payment.delete({
          where: { id: payment.id },
        });
        console.log("Associated payment record deleted.");
      }

      // Then delete the registration
      await prisma.registration.delete({
        where: { id: registration.id },
      });

      console.log(
        `Participant deleted: ${registration.first_name} ${registration.last_name || ""} (${registration.email})`,
      );
      return;
    }

    console.log("No valid options provided.");
    console.log(usage);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
