import { PrismaClient, type Verdict } from "@prisma/client";
import bcrypt from "bcryptjs";
import { USERS as MOCK_USERS, PROBLEMS as MOCK_PROBLEMS, SUBMISSIONS as MOCK_SUBMISSIONS } from "../lib/mock";
import { storage, storagePaths } from "../lib/storage";

/** Deterministic PRNG so re-seeding is stable. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const langByName: Record<string, string> = { "C++17": "cpp", "Python 3": "python", "Java 17": "java" };
const parseMs = (t: string) => { const n = parseInt(t); return isNaN(n) ? null : n; };
const parseMb = (m: string) => { const n = parseFloat(m); return isNaN(n) ? null : n; };

const STATEMENT = (title: string, en = false) =>
  en
    ? `<p>In the problem <strong>${title}</strong>, you are given the input described below. Compute the requested value efficiently within the given limits.</p><p>Read the input from standard input and print the answer to standard output.</p>`
    : `<p>În problema <strong>${title}</strong>, se dă intrarea descrisă mai jos. Calculați valoarea cerută eficient, în limitele date.</p><p>Citiți datele de la intrarea standard și afișați rezultatul la ieșirea standard.</p>`;

/** Seeds a broad, realistic catalogue: languages, competitor users, hierarchical
 * tags & sources, ~20 published problems (translations/tags/source/settings/
 * samples/tests/scoring) and hundreds of judged submissions. */
export async function seedCatalog(prisma: PrismaClient, adminId: string) {
  // ---- programming languages ----
  const cpp = await prisma.programmingLanguage.upsert({ where: { code: "cpp" }, update: { defaultTimeMultiplier: 1 }, create: { code: "cpp", name: "C++17", fileExtension: "cpp", defaultTimeMultiplier: 1, ordering: 1 } });
  const py = await prisma.programmingLanguage.upsert({ where: { code: "python" }, update: { defaultTimeMultiplier: 5 }, create: { code: "python", name: "Python 3", fileExtension: "py", defaultTimeMultiplier: 5, ordering: 2 } });
  const java = await prisma.programmingLanguage.upsert({ where: { code: "java" }, update: { defaultTimeMultiplier: 2 }, create: { code: "java", name: "Java 17", fileExtension: "java", defaultTimeMultiplier: 2, ordering: 3 } });
  const langId: Record<string, string> = { cpp: cpp.id, python: py.id, java: java.id };

  // ---- competitor users (login: <handle>@leonix.dev / password123) ----
  const userId: Record<string, string> = {};
  const pw = await bcrypt.hash("password123", 10);
  for (const u of MOCK_USERS) {
    const email = `${u.handle}@leonix.dev`;
    const row = await prisma.user.upsert({
      where: { email },
      update: { city: u.city, avatarHue: u.hue },
      create: { email, handle: u.handle, name: u.name, passwordHash: pw, role: "STUDENT", city: u.city, avatarHue: u.hue },
    });
    userId[u.handle] = row.id;
  }
  const allHandles = Object.keys(userId);

  // ---- tags (hierarchy) ----
  const tagId: Record<string, string> = {};
  async function tag(s: string, name: string, parentId: string | null) {
    const row = await prisma.tag.upsert({ where: { slug: s }, update: { name, parentId }, create: { slug: s, name, parentId } });
    tagId[s] = row.id;
    return row.id;
  }
  const algorithms = await tag("algorithms", "Algorithms", null);
  const ds = await tag("data-structures", "Data structures", null);
  const graphs = await tag("graphs", "Graphs", algorithms);
  await tag("bfs", "BFS", graphs);
  for (const [s, n, p] of [["dp", "Dynamic programming", algorithms], ["greedy", "Greedy", algorithms], ["math", "Math", algorithms], ["implementation", "Implementation", algorithms], ["two-pointers", "Two pointers", algorithms], ["binary-search", "Binary search", algorithms], ["segment-tree", "Segment tree", ds], ["fenwick", "Fenwick tree", ds], ["dsu", "DSU", ds]] as const) {
    await tag(s, n, p);
  }
  async function ensureTag(raw: string) {
    const s = slug(raw);
    if (!tagId[s]) await tag(s, raw.replace(/\b\w/g, c => c.toUpperCase()), algorithms);
    return tagId[s];
  }

  // ---- sources ----
  const sourceId: Record<string, string> = {};
  async function ensureSource(name: string) {
    const s = slug(name);
    if (!sourceId[s]) {
      const row = await prisma.source.upsert({ where: { slug: s }, update: {}, create: { slug: s, name } });
      sourceId[s] = row.id;
    }
    return sourceId[s];
  }

  // ---- one problem (full graph) ----
  async function makeProblem(spec: { code: string; title: string; titleEn: string; author: string; source: string; level: number; tags: string[]; type?: "STANDARD" | "FUNCTION" | "INTERACTIVE" }) {
    await prisma.problem.deleteMany({ where: { code: spec.code } });
    const r = rng(spec.code.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7));
    const tags = [...new Set(spec.tags)];
    const problem = await prisma.problem.create({
      data: {
        code: spec.code, title: spec.title, authorName: spec.author, createdById: adminId,
        difficulty: spec.level, status: "PUBLISHED", visibility: "PUBLIC", type: spec.type ?? "STANDARD",
        timeLimitMs: 1000 + (spec.level > 4 ? 1000 : 0), memoryLimitMb: 256, originalLanguage: "ro",
        translations: { create: [
          { language: "ro", title: spec.title, statement: STATEMENT(spec.title), inputSpec: "<p>Prima linie conține un întreg <code>N</code>. Următoarea linie conține <code>N</code> numere.</p>", outputSpec: "<p>Rezultatul cerut, pe o singură linie.</p>", constraints: "<ul><li>1 ≤ N ≤ 100000</li></ul>", published: true },
          { language: "en", title: spec.titleEn, statement: STATEMENT(spec.titleEn, true), inputSpec: "<p>The first line contains an integer <code>N</code>. The next line contains <code>N</code> numbers.</p>", outputSpec: "<p>The requested result, on a single line.</p>", constraints: "<ul><li>1 ≤ N ≤ 100000</li></ul>", published: true },
        ] },
        languageSettings: { create: [{ languageId: cpp.id }, { languageId: py.id }, { languageId: java.id }] },
        sources: { create: [{ sourceId: await ensureSource(spec.source) }] },
        samples: { create: [
          { index: 1, input: "5\n1 2 3 4 5", output: "15", explanation: "Sample explanation." },
          { index: 2, input: "3\n10 20 30", output: "60" },
        ] },
      },
    });
    for (const raw of tags) await prisma.problemTag.create({ data: { problemId: problem.id, tagId: await ensureTag(raw) } });

    // 3 tests via storage
    const testRows: { id: string; name: string; index: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const name = `test-0${i}`;
      const inRef = await storage.put(storagePaths.testInputKey(spec.code, name), `${i}\n`, "text/plain");
      const outRef = await storage.put(storagePaths.testOutputKey(spec.code, name), `${i}\n`, "text/plain");
      const inObj = await prisma.storageObject.create({ data: inRef });
      const outObj = await prisma.storageObject.create({ data: outRef });
      const t = await prisma.problemTest.create({ data: { problemId: problem.id, name, index: i, inputObjectId: inObj.id, outputObjectId: outObj.id } });
      testRows.push({ id: t.id, name, index: i });
    }
    // scoring: two range subtasks
    const scheme = await prisma.scoringScheme.create({ data: { problemId: problem.id, type: "SUBTASK", totalPoints: 100 } });
    const s1 = await prisma.subtask.create({ data: { schemeId: scheme.id, index: 1, name: "Small", points: 30, selection: "RANGE", rangeStart: 1, rangeEnd: 1 } });
    const s2 = await prisma.subtask.create({ data: { schemeId: scheme.id, index: 2, name: "Full", points: 70, selection: "RANGE", rangeStart: 2, rangeEnd: 3 } });
    await prisma.subtaskTest.create({ data: { subtaskId: s1.id, testId: testRows[0].id } });
    await prisma.subtaskTest.create({ data: { subtaskId: s2.id, testId: testRows[1].id } });
    await prisma.subtaskTest.create({ data: { subtaskId: s2.id, testId: testRows[2].id } });

    // generated submissions for this problem
    const count = 8 + Math.floor(r() * 14);
    for (let k = 0; k < count; k++) {
      const handle = allHandles[Math.floor(r() * allHandles.length)];
      const roll = r();
      const score = roll < 0.45 ? 100 : roll < 0.65 ? 0 : [30, 70, 42][Math.floor(r() * 3)];
      const verdict: Verdict = score === 100 ? "AC" : score === 0 ? (r() < 0.5 ? "WA" : "RE") : (r() < 0.5 ? "WA" : "TLE");
      const langCode = ["cpp", "python", "java"][Math.floor(r() * 3)];
      await prisma.submission.create({ data: {
        problemId: problem.id, userId: userId[handle], languageId: langId[langCode],
        verdict, score, maxTimeMs: 20 + Math.floor(r() * 400),
        peakMemoryMb: 2 + Math.round(r() * 200) / 10, source: "// solution\nint main(){}\n",
        createdAt: new Date(Date.UTC(2025, 4, 20, 8 + (k % 12), (k * 7) % 60, k % 60) - k * 3600_000),
      } });
    }
    return problem;
  }

  // ---- problems from the curated mock catalogue ----
  for (const p of MOCK_PROBLEMS) {
    await makeProblem({ code: p.id, title: p.title, titleEn: p.title, author: p.author, source: p.source, level: p.level, tags: p.tags });
  }

  // ---- extra generated problems for breadth ----
  const EXTRA = ["Binary Lifting", "Two Sum", "Interval Scheduling", "Knapsack", "Longest Path", "Range Minimum", "Bracket Matching", "Coin Rows", "Grid Paths", "String Hashing", "Topological Order", "Union Find", "Bitmask DP", "Sliding Median"];
  const SRC = ["ONI 2020 · G", "OJI 2021 · G", "Lot Juniori · G", "Summer Challenge · G", "Baraj 2022 · G"];
  const TAGPOOL = ["dp", "graphs", "greedy", "math", "implementation", "two-pointers", "binary-search", "data-structures"];
  for (let i = 0; i < EXTRA.length; i++) {
    const title = EXTRA[i];
    await makeProblem({ code: slug(title), title, titleEn: title, author: MOCK_USERS[i % MOCK_USERS.length].name, source: SRC[i % SRC.length], level: (i % 6) + 1, tags: [TAGPOOL[i % TAGPOOL.length], TAGPOOL[(i + 3) % TAGPOOL.length]] });
  }

  // ---- rich submissions from the curated mock set (full per-test breakdown) ----
  for (const s of MOCK_SUBMISSIONS) {
    if (!userId[s.userHandle]) continue;
    const problem = await prisma.problem.findUnique({ where: { code: s.problemId }, select: { id: true } });
    if (!problem) continue;
    await prisma.submission.create({ data: {
      problemId: problem.id, userId: userId[s.userHandle], languageId: langId[langByName[s.language]] ?? null,
      verdict: s.verdict as Verdict, score: s.score, maxTimeMs: parseMs(s.time), peakMemoryMb: parseMb(s.memory),
      source: s.source, groups: s.groups as object, createdAt: new Date(s.submittedAt),
    } });
  }

  // ---- give the demo accounts some history too ----
  for (const [handle, uid] of [["student", null], ["helper", null], ["admin", adminId]] as const) {
    const demo = await prisma.user.findUnique({ where: { email: `${handle}@leonix.dev` }, select: { id: true } });
    const id = uid ?? demo?.id;
    if (!id) continue;
    const problems = await prisma.problem.findMany({ take: 6, select: { id: true } });
    for (let k = 0; k < problems.length; k++) {
      await prisma.submission.create({ data: {
        problemId: problems[k].id, userId: id, languageId: cpp.id, verdict: k % 3 === 0 ? "WA" : "AC", score: k % 3 === 0 ? 40 : 100,
        maxTimeMs: 30 + k * 10, peakMemoryMb: 3 + k, source: "// my solution\nint main(){}\n",
        createdAt: new Date(Date.UTC(2025, 4, 22, 10 + k, 0, 0)),
      } });
    }
  }

  const [problems, submissions] = await Promise.all([prisma.problem.count(), prisma.submission.count()]);
  console.log(`seeded catalogue: ${problems} problems, ${submissions} submissions, ${allHandles.length} competitor users`);
}
