import { prisma } from "@/lib/db";

export function generateHandle(name: string, email: string): string {
  const source = (name && name.trim()) || email.split("@")[0] || "user";
  const slug = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return slug || "user";
}

export async function uniqueHandle(name: string, email: string): Promise<string> {
  const base = generateHandle(name, email);
  let candidate = base;
  let n = 2;
  while (await prisma.user.findUnique({ where: { handle: candidate } })) {
    candidate = `${base}${n++}`;
  }
  return candidate;
}
