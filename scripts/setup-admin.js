/**
 * This script sets up the first admin user in the system.
 * Run with: node scripts/setup-admin.js email@example.com
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Get email from command line arguments
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email address as an argument.");
    console.error("Example: node scripts/setup-admin.js email@example.com");
    process.exit(1);
  }

  console.log(`Setting up admin user for email: ${email}`);

  try {
    // Find user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user with admin role
      user = await prisma.user.create({
        data: {
          email,
          name: "Admin User",
          role: "ADMIN",
        },
      });
      console.log("Created new admin user:", user);
    } else {
      // Update existing user to admin
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
      console.log("Updated existing user to admin:", user);
    }

    console.log("Admin setup complete!");
  } catch (error) {
    console.error("Error setting up admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
