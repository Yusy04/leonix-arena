import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(email: string, name: string, handle: string, password: string, role: Role) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, name, handle, passwordHash, role },
  });
  console.log(`seeded ${role}: ${email}`);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");

  await upsertUser(adminEmail, "Site Admin", "admin", adminPassword, Role.ADMIN);
  await upsertUser("helper@leonix.dev", "Demo Helper", "helper", "helper12345", Role.HELPER);
  await upsertUser("student@leonix.dev", "Demo Student", "student", "student12345", Role.STUDENT);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
