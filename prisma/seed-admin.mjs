import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existing) {
    console.log("Admin already exists, updating role...");
    await prisma.user.update({ where: { id: existing.id }, data: { role: "admin" } });
  } else {
    const hash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: "admin@characterlab.local",
        username: "admin",
        passwordHash: hash,
        role: "admin",
      },
    });
    console.log("Admin created: username=admin, password=admin123");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
