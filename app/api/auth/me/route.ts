import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
