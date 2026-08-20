import { Icon } from "@/components/ui";
import type { Verdict } from "@/lib/types";

export const VERDICT_META: Record<Verdict, { label: string; cls: string; icon: string }> = {
  AC:      { label: "Accepted",      cls: "v-ac",  icon: "check" },
  WA:      { label: "Wrong answer",  cls: "v-wa",  icon: "close" },
  TLE:     { label: "Time limit",    cls: "v-tle", icon: "clock" },
  RE:      { label: "Runtime error", cls: "v-re",  icon: "close" },
  CE:      { label: "Compile error", cls: "v-ce",  icon: "minus" },
  PENDING: { label: "Pending",       cls: "v-pd",  icon: "minus" },
};

export function VerdictBadge({ v }: { v: Verdict }) {
  const m = VERDICT_META[v];
  return <span className={"vb " + m.cls}><Icon name={m.icon} size={13}/> {m.label}</span>;
}

export function scoreCls(v: number): string {
  return v >= 80 ? "sc-hi" : v >= 40 ? "sc-mid" : "sc-lo";
}
