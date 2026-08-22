import path from "node:path";
import { LocalStorageDriver } from "./local";
import type { StorageService } from "./types";

// Driver selection. Today: local filesystem under ./storage (or $STORAGE_ROOT).
// Later: switch on $STORAGE_DRIVER to return an S3 / object-storage driver — no
// caller or schema changes required.
const root = process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");

export const storage: StorageService = new LocalStorageDriver(root);

export * from "./types";
export * as storagePaths from "./paths";
