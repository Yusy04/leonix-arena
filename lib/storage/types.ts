/** A stored object's metadata — mirrors the `StorageObject` DB row. */
export interface StorageRef {
  driver: string;
  bucket: string | null;
  key: string;
  size: number;
  contentType?: string;
  checksum?: string;
}

/**
 * Storage abstraction. The judging system and services depend on this
 * interface, never on filesystem paths — so a local driver (dev) can be swapped
 * for S3 / object storage later without schema or caller changes.
 */
export interface StorageService {
  readonly driver: string;
  put(key: string, data: Buffer | string, contentType?: string): Promise<StorageRef>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}
