import { PrismaClient } from "@prisma/client";
import { storage, storagePaths } from "../lib/storage";
import { validateScoring, type ScoringInput, type TestRef } from "../lib/problems/scoring";

/**
 * Seeds the `secv3` example problem exercising every relationship:
 * translations, hierarchical tags & sources, per-language settings, file-backed
 * tests (written through the storage abstraction), subtask scoring, samples,
 * an image, a multilingual editorial with solutions + a video, and a contest
 * association. Idempotent: re-running replaces the problem cleanly.
 */
export async function seedProblems(prisma: PrismaClient, adminId: string) {
  // --- programming languages (Python defaults to 5× the C++ baseline) ---
  const cpp = await prisma.programmingLanguage.upsert({
    where: { code: "cpp" }, update: { defaultTimeMultiplier: 1 },
    create: { code: "cpp", name: "C++17", fileExtension: "cpp", defaultTimeMultiplier: 1, ordering: 1 },
  });
  const py = await prisma.programmingLanguage.upsert({
    where: { code: "python" }, update: { defaultTimeMultiplier: 5 },
    create: { code: "python", name: "Python 3", fileExtension: "py", defaultTimeMultiplier: 5, ordering: 2 },
  });
  const java = await prisma.programmingLanguage.upsert({
    where: { code: "java" }, update: { defaultTimeMultiplier: 2 },
    create: { code: "java", name: "Java 17", fileExtension: "java", defaultTimeMultiplier: 2, ordering: 3 },
  });

  // --- hierarchical tags ---
  const upsertTag = (slug: string, name: string, parentId: string | null) =>
    prisma.tag.upsert({ where: { slug }, update: { name, parentId }, create: { slug, name, parentId } });
  const algorithms = await upsertTag("algorithms", "Algorithms", null);
  const dp = await upsertTag("dynamic-programming", "Dynamic Programming", algorithms.id);
  const graphs = await upsertTag("graphs", "Graphs", algorithms.id);
  await upsertTag("shortest-paths", "Shortest Paths", graphs.id);

  // --- hierarchical sources ---
  const upsertSource = (slug: string, name: string, parentId: string | null) =>
    prisma.source.upsert({ where: { slug }, update: { name, parentId }, create: { slug, name, parentId } });
  const infoarena = await upsertSource("infoarena", "Infoarena", null);
  const oni = await upsertSource("oni", "ONI", infoarena.id);

  // --- fresh problem (idempotent) ---
  await prisma.problem.deleteMany({ where: { code: "secv3" } });
  await prisma.storageObject.deleteMany({ where: { key: { startsWith: "problems/secv3/" } } });

  const problem = await prisma.problem.create({
    data: {
      code: "secv3",
      title: "Secvență 3",
      authorName: "Emilian Miron",
      createdById: adminId,
      difficulty: 3,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      type: "STANDARD",
      ioMode: "STDIN_STDOUT",
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      originalLanguage: "ro",
      translations: {
        create: [
          {
            language: "ro", title: "Secvență 3", published: true,
            statement: "Se dă un șir de N numere. Determinați suma elementelor.",
            inputSpec: "Prima linie conține N. A doua linie conține N numere.",
            outputSpec: "Suma celor N numere.",
            constraints: "1 ≤ N ≤ 1000",
          },
          {
            language: "en", title: "Sequence 3", published: true,
            statement: "Given a sequence of N numbers, compute the sum of its elements.",
            inputSpec: "The first line contains N. The second line contains N numbers.",
            outputSpec: "The sum of the N numbers.",
            constraints: "1 ≤ N ≤ 1000",
          },
        ],
      },
      languageSettings: {
        create: [
          { languageId: cpp.id, enabled: true },
          { languageId: py.id, enabled: true }, // inherits 5000ms via multiplier
          { languageId: java.id, enabled: true, timeLimitMs: 2000 }, // explicit override
        ],
      },
      tags: { create: [{ tagId: dp.id }, { tagId: graphs.id }] },
      sources: { create: [{ sourceId: oni.id, ordering: 0 }] },
      samples: {
        create: [{ index: 1, input: "5\n1 2 3 4 5", output: "15", explanation: "1+2+3+4+5 = 15." }],
      },
    },
  });

  // --- tests: written through storage, referenced by StorageObject rows ---
  const testDefs = [
    { name: "test-01", input: "5\n1 2 3 4 5\n", output: "15\n" },
    { name: "test-02", input: "3\n10 20 30\n", output: "60\n" },
    { name: "test-03", input: "1\n42\n", output: "42\n" },
  ];
  const testRows: { id: string; name: string; index: number }[] = [];
  for (let i = 0; i < testDefs.length; i++) {
    const t = testDefs[i];
    const inRef = await storage.put(storagePaths.testInputKey("secv3", t.name), t.input, "text/plain");
    const outRef = await storage.put(storagePaths.testOutputKey("secv3", t.name), t.output, "text/plain");
    const inObj = await prisma.storageObject.create({ data: inRef });
    const outObj = await prisma.storageObject.create({ data: outRef });
    const row = await prisma.problemTest.create({
      data: { problemId: problem.id, name: t.name, index: i + 1, inputObjectId: inObj.id, outputObjectId: outObj.id },
    });
    testRows.push({ id: row.id, name: row.name, index: row.index });
  }

  // --- image ---
  const imgRef = await storage.put(storagePaths.imageKey("secv3", "fig1.txt"), "placeholder figure", "text/plain");
  const imgObj = await prisma.storageObject.create({ data: imgRef });
  await prisma.problemImage.create({
    data: { problemId: problem.id, filename: "fig1.txt", storageObjectId: imgObj.id, altText: "Figure 1", ordering: 0 },
  });

  // --- scoring: two RANGE subtasks, validated + materialized ---
  const scoringInput: ScoringInput = {
    type: "SUBTASK", totalPoints: 100,
    subtasks: [
      { index: 1, points: 10, selection: "RANGE", rangeStart: 1, rangeEnd: 1, name: "Small" },
      { index: 2, points: 90, selection: "RANGE", rangeStart: 2, rangeEnd: 3, name: "Full" },
    ],
  };
  const testRefs: TestRef[] = testRows.map(r => ({ name: r.name, index: r.index }));
  const v = validateScoring(scoringInput, testRefs);
  if (!v.ok) throw new Error("seed scoring invalid: " + v.errors.join("; "));
  const scheme = await prisma.scoringScheme.create({
    data: { problemId: problem.id, type: "SUBTASK", totalPoints: 100, rawConfig: scoringInput as object },
  });
  for (const sub of scoringInput.subtasks) {
    const subRow = await prisma.subtask.create({
      data: { schemeId: scheme.id, index: sub.index, name: sub.name, points: sub.points, selection: "RANGE", rangeStart: sub.rangeStart, rangeEnd: sub.rangeEnd },
    });
    for (const testName of v.resolved[sub.index]) {
      const test = testRows.find(r => r.name === testName)!;
      await prisma.subtaskTest.create({ data: { subtaskId: subRow.id, testId: test.id } });
    }
  }

  // --- editorial: ro + en, each with a stored C++ solution; ro has a video ---
  const editorial = await prisma.editorial.create({ data: { problemId: problem.id } });
  for (const lang of ["ro", "en"] as const) {
    const tr = await prisma.editorialTranslation.create({
      data: {
        editorialId: editorial.id, language: lang, published: true,
        description: lang === "ro" ? "Folosim sume parțiale pentru a răspunde rapid." : "We use prefix sums to answer quickly.",
      },
    });
    const solRef = await storage.put(storagePaths.editorialSolutionKey("secv3", lang, "solution.cpp"), "// prefix sums\nint main(){}\n", "text/x-c++src");
    const solObj = await prisma.storageObject.create({ data: solRef });
    await prisma.editorialSolution.create({ data: { translationId: tr.id, languageId: cpp.id, storageObjectId: solObj.id, ordering: 0 } });
    if (lang === "ro") {
      await prisma.editorialVideo.create({ data: { translationId: tr.id, url: "https://example.com/secv3-ro", title: "Explicație", ordering: 0 } });
    }
  }

  // --- contest association ---
  const contest = await prisma.contest.upsert({
    where: { slug: "oni-2019" }, update: {}, create: { slug: "oni-2019", name: "ONI 2019", createdById: adminId },
  });
  await prisma.contestProblem.upsert({
    where: { contestId_problemId: { contestId: contest.id, problemId: problem.id } },
    update: {},
    create: { contestId: contest.id, problemId: problem.id, index: "A", ordering: 0, points: 100 },
  });

  // demo co-author: the helper account can also fully manage secv3
  const helper = await prisma.user.findUnique({ where: { email: "helper@leonix.dev" }, select: { id: true } });
  if (helper) {
    await prisma.problemCollaborator.upsert({
      where: { problemId_userId: { problemId: problem.id, userId: helper.id } },
      update: {},
      create: { problemId: problem.id, userId: helper.id },
    });
  }

  console.log("seeded problem: secv3 (translations, tags, sources, tests, scoring, samples, image, editorial, contest, co-author)");
}
