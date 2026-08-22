-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'CONTEST_ONLY');

-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('STANDARD', 'FUNCTION', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "IoMode" AS ENUM ('STDIN_STDOUT', 'FILES');

-- CreateEnum
CREATE TYPE "CheckerType" AS ENUM ('DIFF', 'TOKEN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('INDIVIDUAL', 'SUBTASK');

-- CreateEnum
CREATE TYPE "SubtaskSelection" AS ENUM ('EXPLICIT', 'RANGE', 'REGEX', 'ALL');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('GRADER', 'CHECKER', 'OTHER');

-- CreateTable
CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "driver" TEXT NOT NULL DEFAULT 'local',
    "bucket" TEXT,
    "key" TEXT NOT NULL,
    "size" INTEGER,
    "contentType" TEXT,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammingLanguage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "defaultTimeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "defaultMemoryMb" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgrammingLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorName" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "status" "ProblemStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "type" "ProblemType" NOT NULL DEFAULT 'STANDARD',
    "ioMode" "IoMode" NOT NULL DEFAULT 'STDIN_STDOUT',
    "inputFile" TEXT,
    "outputFile" TEXT,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 1000,
    "memoryLimitMb" INTEGER NOT NULL DEFAULT 256,
    "checkerType" "CheckerType" NOT NULL DEFAULT 'DIFF',
    "originalLanguage" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTranslation" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "inputSpec" TEXT,
    "outputSpec" TEXT,
    "constraints" TEXT,
    "notes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemLanguageSetting" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timeLimitMs" INTEGER,
    "memoryLimitMb" INTEGER,
    "solutionRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemLanguageSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTag" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemSource" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "ordering" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProblemSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemImage" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageObjectId" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemAttachment" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "storageObjectId" TEXT,
    "language" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTest" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "inputObjectId" TEXT,
    "outputObjectId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringScheme" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "type" "ScoringType" NOT NULL DEFAULT 'INDIVIDUAL',
    "totalPoints" INTEGER NOT NULL DEFAULT 100,
    "rawConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtask" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "name" TEXT,
    "points" INTEGER NOT NULL,
    "selection" "SubtaskSelection" NOT NULL DEFAULT 'EXPLICIT',
    "regexPattern" TEXT,
    "rangeStart" INTEGER,
    "rangeEnd" INTEGER,
    "minRequirement" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubtaskTest" (
    "id" TEXT NOT NULL,
    "subtaskId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,

    CONSTRAINT "SubtaskTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Editorial" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Editorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialTranslation" (
    "id" TEXT NOT NULL,
    "editorialId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialVideo" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialSolution" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "storageObjectId" TEXT,
    "inlineSource" TEXT,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestProblem" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER,
    "settings" JSONB,

    CONSTRAINT "ContestProblem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammingLanguage_code_key" ON "ProgrammingLanguage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_code_key" ON "Problem"("code");

-- CreateIndex
CREATE INDEX "Problem_status_visibility_idx" ON "Problem"("status", "visibility");

-- CreateIndex
CREATE INDEX "Problem_createdById_idx" ON "Problem"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTranslation_problemId_language_key" ON "ProblemTranslation"("problemId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemLanguageSetting_problemId_languageId_key" ON "ProblemLanguageSetting"("problemId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTag_problemId_tagId_key" ON "ProblemTag"("problemId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Source_slug_key" ON "Source"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemSource_problemId_sourceId_key" ON "ProblemSource"("problemId", "sourceId");

-- CreateIndex
CREATE INDEX "ProblemImage_problemId_idx" ON "ProblemImage"("problemId");

-- CreateIndex
CREATE INDEX "ProblemAttachment_problemId_kind_idx" ON "ProblemAttachment"("problemId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTest_problemId_name_key" ON "ProblemTest"("problemId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTest_problemId_index_key" ON "ProblemTest"("problemId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_problemId_index_key" ON "Sample"("problemId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringScheme_problemId_key" ON "ScoringScheme"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "Subtask_schemeId_index_key" ON "Subtask"("schemeId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "SubtaskTest_subtaskId_testId_key" ON "SubtaskTest"("subtaskId", "testId");

-- CreateIndex
CREATE UNIQUE INDEX "Editorial_problemId_key" ON "Editorial"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialTranslation_editorialId_language_key" ON "EditorialTranslation"("editorialId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialSolution_translationId_languageId_key" ON "EditorialSolution"("translationId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "Contest_slug_key" ON "Contest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_problemId_key" ON "ContestProblem"("contestId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_index_key" ON "ContestProblem"("contestId", "index");

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTranslation" ADD CONSTRAINT "ProblemTranslation_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemLanguageSetting" ADD CONSTRAINT "ProblemLanguageSetting_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemLanguageSetting" ADD CONSTRAINT "ProblemLanguageSetting_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "ProgrammingLanguage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSource" ADD CONSTRAINT "ProblemSource_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSource" ADD CONSTRAINT "ProblemSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemImage" ADD CONSTRAINT "ProblemImage_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemImage" ADD CONSTRAINT "ProblemImage_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "StorageObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAttachment" ADD CONSTRAINT "ProblemAttachment_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAttachment" ADD CONSTRAINT "ProblemAttachment_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "StorageObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTest" ADD CONSTRAINT "ProblemTest_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTest" ADD CONSTRAINT "ProblemTest_inputObjectId_fkey" FOREIGN KEY ("inputObjectId") REFERENCES "StorageObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTest" ADD CONSTRAINT "ProblemTest_outputObjectId_fkey" FOREIGN KEY ("outputObjectId") REFERENCES "StorageObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringScheme" ADD CONSTRAINT "ScoringScheme_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "ScoringScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskTest" ADD CONSTRAINT "SubtaskTest_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "Subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskTest" ADD CONSTRAINT "SubtaskTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ProblemTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Editorial" ADD CONSTRAINT "Editorial_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialTranslation" ADD CONSTRAINT "EditorialTranslation_editorialId_fkey" FOREIGN KEY ("editorialId") REFERENCES "Editorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialVideo" ADD CONSTRAINT "EditorialVideo_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "EditorialTranslation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialSolution" ADD CONSTRAINT "EditorialSolution_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "EditorialTranslation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialSolution" ADD CONSTRAINT "EditorialSolution_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "ProgrammingLanguage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialSolution" ADD CONSTRAINT "EditorialSolution_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "StorageObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
