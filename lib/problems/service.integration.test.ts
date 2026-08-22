import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { Actor } from "@/lib/problems/authz";
import { createProblem, getProblemByCode, updateProblem, publishProblem, setVisibility, listProblems, ServiceError } from "@/lib/problems/service";
import { addTranslation, setOriginalLanguage, removeTranslation } from "@/lib/problems/translations";
import { setProblemTags, createTag } from "@/lib/problems/taxonomy";
import { createTest, reorderTests, deleteTest } from "@/lib/problems/tests-service";
import { setScoring } from "@/lib/problems/scoring-service";
import { setAttachment, addImage } from "@/lib/problems/attachments-service";
import { upsertEditorialTranslation, addEditorialSolution, addEditorialVideo } from "@/lib/problems/editorials-service";
import { createContest, attachToContest } from "@/lib/problems/contests-service";

let admin: Actor;
let helper: Actor;
let otherHelper: Actor;

beforeEach(async () => {
  const a = await prisma.user.create({ data: { email: "a@x.com", handle: "a", name: "Admin", passwordHash: await hashPassword("password123"), role: "ADMIN" } });
  const h = await prisma.user.create({ data: { email: "h@x.com", handle: "h", name: "Helper", passwordHash: await hashPassword("password123"), role: "HELPER" } });
  const h2 = await prisma.user.create({ data: { email: "h2@x.com", handle: "h2", name: "Helper2", passwordHash: await hashPassword("password123"), role: "HELPER" } });
  admin = { id: a.id, role: "ADMIN" };
  helper = { id: h.id, role: "HELPER" };
  otherHelper = { id: h2.id, role: "HELPER" };
  await prisma.programmingLanguage.create({ data: { code: "cpp", name: "C++17", fileExtension: "cpp", defaultTimeMultiplier: 1 } });
});

function baseProblem(code = "secv3") {
  return {
    code, title: "Secvență 3", originalLanguage: "ro",
    statement: { language: "ro", title: "Secvență 3", statement: "Enunț..." },
  };
}

describe("problem creation", () => {
  it("creates a valid problem as a helper (STUDENT default role denied)", async () => {
    const p = await createProblem(baseProblem(), helper);
    expect(p.code).toBe("secv3");
    expect(p.status).toBe("DRAFT");
    expect(p.translations).toHaveLength(1);
    await expect(createProblem(baseProblem("x2"), { id: "s", role: "STUDENT" })).rejects.toMatchObject({ status: 403 });
  });
  it("rejects a duplicate code", async () => {
    await createProblem(baseProblem(), helper);
    await expect(createProblem(baseProblem(), helper)).rejects.toMatchObject({ status: 409 });
  });
  it("rejects an invalid code", async () => {
    await expect(createProblem({ ...baseProblem("Bad Code") }, helper)).rejects.toMatchObject({ status: 400 });
  });
});

describe("permissions", () => {
  it("a helper cannot edit another helper's problem; an admin can", async () => {
    await createProblem(baseProblem(), helper);
    await expect(updateProblem("secv3", { title: "x" }, otherHelper)).rejects.toMatchObject({ status: 403 });
    const p = await updateProblem("secv3", { title: "By Admin" }, admin);
    expect(p.title).toBe("By Admin");
  });
});

describe("languages / translations", () => {
  it("adds a translation and switches the original language; guards removal", async () => {
    await createProblem(baseProblem(), helper);
    await addTranslation("secv3", { language: "en", title: "Sequence 3", statement: "Statement..." }, helper);
    const p1 = await getProblemByCode("secv3");
    expect(p1!.translations.map(t => t.language).sort()).toEqual(["en", "ro"]);

    // cannot remove the current original (ro)
    await expect(removeTranslation("secv3", "ro", helper)).rejects.toMatchObject({ status: 400 });
    // switch original to en, then ro can be removed
    await setOriginalLanguage("secv3", "en", helper);
    await removeTranslation("secv3", "ro", helper);
    const p2 = await getProblemByCode("secv3");
    expect(p2!.translations.map(t => t.language)).toEqual(["en"]);
    expect(p2!.originalLanguage).toBe("en");
  });
  it("rejects setting an original language with no statement", async () => {
    await createProblem(baseProblem(), helper);
    await expect(setOriginalLanguage("secv3", "de", helper)).rejects.toMatchObject({ status: 400 });
  });
});

describe("tags", () => {
  it("assigns known tags and rejects unknown ones", async () => {
    await createProblem(baseProblem(), helper);
    await createTag({ slug: "dp", name: "DP" }, admin);
    const assigned = await setProblemTags("secv3", ["dp"], helper);
    expect(assigned).toHaveLength(1);
    await expect(setProblemTags("secv3", ["nope"], helper)).rejects.toMatchObject({ status: 400 });
  });
});

describe("tests + scoring", () => {
  async function withTests() {
    await createProblem(baseProblem(), helper);
    const t1 = await createTest("secv3", { name: "test-01", input: "1", output: "1" }, helper);
    const t2 = await createTest("secv3", { name: "test-02", input: "2", output: "2" }, helper);
    const t3 = await createTest("secv3", { name: "test-03", input: "3", output: "3" }, helper);
    return [t1, t2, t3];
  }

  it("creates ordered tests and reorders them", async () => {
    const [t1, t2, t3] = await withTests();
    expect([t1.index, t2.index, t3.index]).toEqual([1, 2, 3]);
    const reordered = await reorderTests("secv3", [t3.id, t1.id, t2.id], helper);
    expect(reordered.map(t => t.name)).toEqual(["test-03", "test-01", "test-02"]);
  });

  it("accepts individual, range, explicit and regex scoring; rejects bad configs", async () => {
    await withTests();
    // Type B (range)
    const scheme = await setScoring("secv3", {
      type: "SUBTASK", totalPoints: 100,
      subtasks: [
        { index: 1, points: 10, selection: "RANGE", rangeStart: 1, rangeEnd: 1 },
        { index: 2, points: 90, selection: "REGEX", regexPattern: "test-0[23]" },
      ],
    }, helper);
    expect(scheme!.subtasks).toHaveLength(2);
    const sub2 = scheme!.subtasks.find(s => s.index === 2)!;
    expect(sub2.tests).toHaveLength(2);

    // invalid total
    await expect(setScoring("secv3", { type: "SUBTASK", totalPoints: 100, subtasks: [{ index: 1, points: 10, selection: "ALL" }] }, helper))
      .rejects.toMatchObject({ status: 400 });
    // invalid regex
    await expect(setScoring("secv3", { type: "SUBTASK", totalPoints: 10, subtasks: [{ index: 1, points: 10, selection: "REGEX", regexPattern: "[" }] }, helper))
      .rejects.toMatchObject({ status: 400 });
  });

  it("deletes a test", async () => {
    const [t1] = await withTests();
    await deleteTest("secv3", t1.id, helper);
    const p = await getProblemByCode("secv3");
    expect(p!.tests.map(t => t.name)).toEqual(["test-02", "test-03"]);
  });
});

describe("files: images + one checker + one grader", () => {
  it("keeps a single active checker/grader and flips checkerType", async () => {
    await createProblem(baseProblem(), helper);
    await addImage("secv3", { filename: "fig1.png", data: "img", altText: "Fig 1" }, helper);
    await setAttachment("secv3", "CHECKER", { filename: "check.cpp", data: "// checker" }, helper);
    await setAttachment("secv3", "CHECKER", { filename: "check2.cpp", data: "// checker v2" }, helper); // replaces
    const p = await getProblemByCode("secv3");
    expect(p!.images).toHaveLength(1);
    const activeCheckers = p!.attachments.filter(a => a.kind === "CHECKER" && a.active);
    expect(activeCheckers).toHaveLength(1);
    expect(p!.checkerType).toBe("CUSTOM");
  });
});

describe("editorials", () => {
  it("supports multiple editorial languages, a solution, and a video", async () => {
    await createProblem(baseProblem(), helper);
    await upsertEditorialTranslation("secv3", "ro", { description: "Sume parțiale", published: true }, helper);
    await upsertEditorialTranslation("secv3", "en", { description: "Prefix sums", published: true }, helper);
    await addEditorialSolution("secv3", "en", { languageCode: "cpp", source: "int main(){}" }, helper);
    await addEditorialVideo("secv3", "ro", { url: "https://example.com/v", title: "Video" }, helper);
    const p = await getProblemByCode("secv3");
    expect(p!.editorial!.translations).toHaveLength(2);
    const en = p!.editorial!.translations.find(t => t.language === "en")!;
    expect(en.solutions).toHaveLength(1);
    const ro = p!.editorial!.translations.find(t => t.language === "ro")!;
    expect(ro.videos).toHaveLength(1);
  });
});

describe("contest associations", () => {
  it("the same problem can appear in multiple contests; duplicate index is rejected", async () => {
    await createProblem(baseProblem(), helper);
    await createContest({ slug: "oni-2019", name: "ONI 2019" }, admin);
    await createContest({ slug: "oni-2020", name: "ONI 2020" }, admin);
    await attachToContest("secv3", { contestSlug: "oni-2019", index: "A" }, helper);
    await attachToContest("secv3", { contestSlug: "oni-2020", index: "A" }, helper); // same letter, different contest — ok
    const p = await getProblemByCode("secv3");
    expect(p!.contestProblems).toHaveLength(2);
    // duplicate index within the same contest → 409
    await createProblem(baseProblem("alt"), helper);
    await expect(attachToContest("alt", { contestSlug: "oni-2019", index: "A" }, helper)).rejects.toMatchObject({ status: 409 });
  });
});

describe("lifecycle", () => {
  it("publishes and changes visibility", async () => {
    await createProblem(baseProblem(), helper);
    const pub = await publishProblem("secv3", helper);
    expect(pub.status).toBe("PUBLISHED");
    const vis = await setVisibility("secv3", "PUBLIC", helper);
    expect(vis.visibility).toBe("PUBLIC");
    const listed = await listProblems({ status: "PUBLISHED" });
    expect(listed.items.map(p => p.code)).toContain("secv3");
  });
});
