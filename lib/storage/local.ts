import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { StorageRef, StorageService } from "./types";
import { normalizeKey } from "./paths";

/** Filesystem-backed storage for local development. */
export class LocalStorageDriver implements StorageService {
  readonly driver = "local";
  constructor(private readonly root: string) {}

  private full(key: string): string {
    return path.join(this.root, normalizeKey(key));
  }

  async put(key: string, data: Buffer | string, contentType?: string): Promise<StorageRef> {
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    const target = this.full(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buf);
    return {
      driver: this.driver,
      bucket: null,
      key: normalizeKey(key),
      size: buf.length,
      contentType,
      checksum: createHash("sha256").update(buf).digest("hex"),
    };
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.full(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.full(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.full(key));
    } catch {
      /* already gone */
    }
  }
}
