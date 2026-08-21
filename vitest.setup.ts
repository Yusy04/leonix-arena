import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

import { afterEach } from "vitest";
import { prisma } from "@/lib/db";

afterEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});
