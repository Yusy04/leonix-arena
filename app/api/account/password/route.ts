import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { validatePasswordChange } from "@/lib/auth/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function POST(req: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body ?? {};

  const errors = validatePasswordChange({ currentPassword, newPassword });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  if (!(await verifyPassword(String(currentPassword), current.passwordHash))) {
    return NextResponse.json({ errors: { currentPassword: "Current password is incorrect." } }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: current.id },
    data: { passwordHash: await hashPassword(String(newPassword)) },
  });
  return NextResponse.json({ ok: true });
}
