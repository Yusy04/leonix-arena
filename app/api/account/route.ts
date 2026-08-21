import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { validateProfile } from "@/lib/auth/validation";
import { toPublicUser } from "@/lib/auth/user";

export async function PATCH(req: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, email, handle, city, language, avatarHue, goals } = body ?? {};

  const normEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normHandle = typeof handle === "string" ? handle.trim().toLowerCase() : "";

  const errors = validateProfile({ name, email: normEmail, handle: normHandle });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  // Uniqueness — allow the current user to keep their own email/handle.
  const emailOwner = await prisma.user.findUnique({ where: { email: normEmail } });
  if (emailOwner && emailOwner.id !== current.id) errors.email = "That email is already in use.";
  const handleOwner = await prisma.user.findUnique({ where: { handle: normHandle } });
  if (handleOwner && handleOwner.id !== current.id) errors.handle = "That handle is already taken.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 409 });

  const hue = typeof avatarHue === "number" && Number.isFinite(avatarHue)
    ? Math.max(0, Math.min(360, Math.round(avatarHue)))
    : current.avatarHue;

  const updated = await prisma.user.update({
    where: { id: current.id },
    data: {
      name: String(name).trim(),
      email: normEmail,
      handle: normHandle,
      city: typeof city === "string" ? city.trim() : current.city,
      language: typeof language === "string" && language ? language : current.language,
      avatarHue: hue,
      goals: Array.isArray(goals) ? goals.map(String) : current.goals,
    },
  });

  return NextResponse.json({ user: toPublicUser(updated) });
}
