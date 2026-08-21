import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateRegister } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { uniqueHandle } from "@/lib/auth/handle";
import { startSession } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password, goals, language } = body ?? {};

  const errors = validateRegister({ name, email, password });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const normEmail = String(email).trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normEmail } })) {
    return NextResponse.json({ errors: { email: "That email is already registered." } }, { status: 409 });
  }

  const handle = await uniqueHandle(String(name), normEmail);
  const passwordHash = await hashPassword(String(password));
  const user = await prisma.user.create({
    data: {
      email: normEmail,
      handle,
      name: String(name).trim(),
      passwordHash,
      goals: Array.isArray(goals) ? goals.map(String) : [],
      language: typeof language === "string" ? language : null,
    },
  });

  await startSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
