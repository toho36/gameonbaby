import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initialRegistrations = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone_number: "1234567890",
    payment_type: "cash",
    created_at: new Date(),
    event: {
      connectOrCreate: {
        where: { id: "1" },
        create: {
          title: "Sample Event",
          price: 100,
          from: new Date(),
          to: new Date(),
          created_at: new Date(),
        },
      },
    },
  },
];

async function main() {
  console.log("seeding...");
  for (const registration of initialRegistrations) {
    const newRegistration = await prisma.registration.create({
      data: registration,
    });
    console.log(`Registration created with ID: ${newRegistration.id}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
