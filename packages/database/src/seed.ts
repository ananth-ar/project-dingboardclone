import { prisma } from "./client";

async function main() {
  const nestedReply = await prisma.user.create({
    data: {
      name: "A R Ananth",
      username: "ananth.ar",
      email: "ananth@gmail.com",
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
