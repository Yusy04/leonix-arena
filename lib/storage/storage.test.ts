import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { LocalStorageDriver } from "@/lib/storage/local";
import { normalizeKey, testInputKey } from "@/lib/storage/paths";

describe("storage paths", () => {
  it("builds deterministic test keys", () => {
    expect(testInputKey("secv3", "test-01")).toBe("problems/secv3/tests/test-01.in");
  });
  it("rejects path traversal", () => {
    expect(() => normalizeKey("problems/../etc/passwd")).toThrow();
    expect(normalizeKey("/problems/secv3/x")).toBe("problems/secv3/x");
  });
});

describe("LocalStorageDriver", () => {
  it("round-trips put/get/exists/delete", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "lx-storage-"));
    const drv = new LocalStorageDriver(root);
    const key = testInputKey("secv3", "test-01");

    const ref = await drv.put(key, "5\n1 2 3 4 5\n", "text/plain");
    expect(ref.driver).toBe("local");
    expect(ref.key).toBe(key);
    expect(ref.size).toBeGreaterThan(0);
    expect(ref.checksum).toHaveLength(64);

    expect(await drv.exists(key)).toBe(true);
    expect((await drv.get(key)).toString()).toContain("1 2 3 4 5");

    await drv.delete(key);
    expect(await drv.exists(key)).toBe(false);

    await fs.rm(root, { recursive: true, force: true });
  });
});
