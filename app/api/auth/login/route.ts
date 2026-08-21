import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateLogin } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body ?? {};

  const errors = validateLogin({ email, password });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await startSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
