import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { parseTestsZip, buildTemplateZip } from "@/lib/problems/tests-zip";

async function makeZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("parseTestsZip", () => {
  it("pairs .in/.ok files and sorts by natural order", async () => {
    const buf = await makeZip({ "1.in": "a", "1.ok": "A", "2.in": "b", "2.ok": "B", "10.in": "c", "10.ok": "C" });
    const tests = await parseTestsZip(buf);
    expect(tests.map(t => t.name)).toEqual(["1", "2", "10"]);
    expect(tests[0].input.toString()).toBe("a");
    expect(tests[0].output.toString()).toBe("A");
  });

  it("accepts .out as an output alias and a tests/ folder wrapper", async () => {
    const buf = await makeZip({ "tests/01.in": "x", "tests/01.out": "X" });
    const tests = await parseTestsZip(buf);
    expect(tests).toHaveLength(1);
    expect(tests[0].name).toBe("01");
    expect(tests[0].output.toString()).toBe("X");
  });

  it("ignores README and dotfiles", async () => {
    const buf = await makeZip({ "README.txt": "hi", "1.in": "x", "1.ok": "X", ".DS_Store": "junk" });
    const tests = await parseTestsZip(buf);
    expect(tests).toHaveLength(1);
  });

  it("rejects a test missing its output", async () => {
    const buf = await makeZip({ "1.in": "x", "1.ok": "X", "2.in": "y" });
    await expect(parseTestsZip(buf)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a zip with no test pairs", async () => {
    const buf = await makeZip({ "README.txt": "nothing here" });
    await expect(parseTestsZip(buf)).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a non-zip buffer", async () => {
    await expect(parseTestsZip(Buffer.from("not a zip at all"))).rejects.toMatchObject({ status: 400 });
  });
});

describe("buildTemplateZip", () => {
  it("produces a README + example tests that round-trip through the parser", async () => {
    const buf = await buildTemplateZip();
    const zip = await JSZip.loadAsync(buf);
    expect(zip.file("README.txt")).toBeTruthy();
    const tests = await parseTestsZip(buf);
    expect(tests.map(t => t.name)).toEqual(["1", "2", "3"]);
    expect(tests[0].input.toString()).toContain("1 2 3 4 5");
    expect(tests[0].output.toString().trim()).toBe("15");
  });
});
