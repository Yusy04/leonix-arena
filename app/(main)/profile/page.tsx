"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CURRENT_HANDLE } from "@/lib/mock";

// Client-side redirect (works under static export, which has no server to run
// next/navigation's redirect() at request time).
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace(`/u/${CURRENT_HANDLE}`); }, [router]);
  return null;
}
