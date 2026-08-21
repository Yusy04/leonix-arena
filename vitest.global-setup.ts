import { execSync } from "node:child_process";
import dotenv from "dotenv";

export default function setup() {
  const env = dotenv.config({ path: ".env.test" }).parsed ?? {};
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
  });
}
