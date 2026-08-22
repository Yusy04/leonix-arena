import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

import { afterEach } from "vitest";
import { prisma } from "@/lib/db";

// Reset the whole graph between tests. CASCADE handles FK order; RESTART
// IDENTITY keeps things clean. Keep this list in sync with the schema.
const TABLES = [
  "ContestProblem", "Contest",
  "SubtaskTest", "Subtask", "ScoringScheme",
  "EditorialSolution", "EditorialVideo", "EditorialTranslation", "Editorial",
  "ProblemTest", "Sample", "ProblemImage", "ProblemAttachment",
  "ProblemTag", "ProblemSource", "ProblemTranslation", "ProblemLanguageSetting",
  "Problem", "Tag", "Source", "ProgrammingLanguage", "StorageObject",
  "Session", "User",
];

afterEach(async () => {
  const list = TABLES.map(t => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
});
