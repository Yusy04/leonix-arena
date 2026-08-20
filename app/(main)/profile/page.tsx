import { redirect } from "next/navigation";
import { CURRENT_HANDLE } from "@/lib/mock";
export default function Page() { redirect(`/u/${CURRENT_HANDLE}`); }
