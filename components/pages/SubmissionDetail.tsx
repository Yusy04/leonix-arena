"use client";

import { useRouter } from "next/navigation";
import { Icon, Avatar, ProgressRing, EmptyState } from "@/components/ui";
import { CodePane } from "@/components/code/CodePane";
import { Evaluation } from "@/components/submissions/Evaluation";
import { VerdictBadge } from "@/components/submissions/VerdictBadge";
import type { Verdict, TestGroup } from "@/lib/types";

export interface SubmissionDetailData {
  id: string;
  verdict: string;
  score: number;
  language: string;
  time: string;
  memory: string;
  source: string;
  groups: unknown;
  submittedAt: string;
  problemCode: string;
  problemTitle: string;
  userHandle: string;
  userName: string;
  userInitial: string;
  userHue: number;
}

export function SubmissionDetail({ sub }: { sub: SubmissionDetailData | null }) {
  const router = useRouter();

  if (!sub) {
    return (
      <div className="container sd-notfound">
        <EmptyState glyph="404" title="Submission not found"
          description="This submission does not exist."
          action={<button className="btn btn-secondary" onClick={() => router.push("/archive")}>Browse problems</button>}/>
      </div>
    );
  }

  const groups: TestGroup[] = Array.isArray(sub.groups) ? (sub.groups as TestGroup[]) : [];

  return (
    <div className="sd container-wide">
      <div className="subs-crumb">
        <a onClick={() => router.push("/archive")}>Archive</a> <Icon name="chev-r" size={12}/>
        <a onClick={() => router.push("/problem/" + sub.problemCode)}>{sub.problemTitle}</a> <Icon name="chev-r" size={12}/>
        <a onClick={() => router.push("/problem/" + sub.problemCode + "/submissions")}>Submissions</a> <Icon name="chev-r" size={12}/>
        <span>#{sub.id.slice(-6)}</span>
      </div>

      <div className="sd-hero hud is-glow">
        <span className="hud-corners"></span>
        <div className="sd-ring"><ProgressRing percent={sub.verdict === "PENDING" ? 0 : sub.score} size={68} label={sub.verdict === "PENDING" ? "…" : sub.score}/></div>
        <div className="sd-hero-main">
          <h1>Submission · {sub.problemTitle}</h1>
          <VerdictBadge v={sub.verdict as Verdict}/>
          <div className="sd-meta mono">
            <span className="sd-user" onClick={() => router.push("/u/" + sub.userHandle)}><Avatar initial={sub.userInitial} hue={sub.userHue} size="sm"/> {sub.userHandle}</span>
            <span><b>{sub.language}</b></span>
            <span>max <b>{sub.time}</b></span>
            <span>peak <b>{sub.memory}</b></span>
            <span>{new Date(sub.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
          </div>
        </div>
        <div className="sd-actions"><button className="btn btn-secondary" onClick={() => router.push("/problem/" + sub.problemCode)}><Icon name="code" size={14}/> Open problem</button></div>
      </div>

      <div className="sd-grid">
        <div className="sd-panel">
          <div className="sd-panel-h"><span><Icon name="code" size={15}/> Source — {sub.language}</span><button className="pb-copy"><Icon name="doc" size={12}/> Copy</button></div>
          <CodePane code={sub.source} className="sd-code"/>
        </div>
        <div className="sd-panel">
          <div className="sd-panel-h"><span><Icon name="target" size={15}/> Evaluation</span></div>
          {sub.verdict === "CE"
            ? <div className="sd-note"><Icon name="close" size={15}/> Compilation failed — no tests were run.</div>
            : groups.length
              ? <Evaluation groups={groups} total={sub.score}/>
              : <div className="sd-note"><Icon name="target" size={15}/> Scored <b style={{ margin: "0 4px" }}>{sub.score}</b>/100 — per-test breakdown not recorded for this submission.</div>}
        </div>
      </div>
    </div>
  );
}
