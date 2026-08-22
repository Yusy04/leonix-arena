-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('AC', 'WA', 'TLE', 'RE', 'CE', 'PENDING');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageId" TEXT,
    "verdict" "Verdict" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxTimeMs" INTEGER,
    "peakMemoryMb" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "groups" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_problemId_createdAt_idx" ON "Submission"("problemId", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_userId_createdAt_idx" ON "Submission"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "ProgrammingLanguage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
