"use client";

import { useRouter } from "next/navigation";
import { Icon, Avatar, ProgressRing, EmptyState } from "@/components/ui";
import { CodePane } from "@/components/code/CodePane";
import { Evaluation } from "@/components/submissions/Evaluation";
import { VerdictBadge } from "@/components/submissions/VerdictBadge";
import { getSubmission, getUserByHandle } from "@/lib/mock";
import { formatDate, formatTime } from "@/lib/data";

export function SubmissionDetail({ id }: { id: string }) {
  const router = useRouter();
  const s = getSubmission(id);

  if (!s) {
    return (
      <div className="container sd-notfound">
        <EmptyState glyph="404" title="Submission not found"
          description={`No submission with id ${id}.`}
          action={<button className="btn btn-secondary" onClick={() => router.push('/problem/submissions')}>Back to submissions</button>}/>
      </div>
    );
  }

  const u = getUserByHandle(s.userHandle);

  return (
    <div className="sd container-wide">
      <div className="subs-crumb">
        <a onClick={() => router.push('/archive')}>Archive</a> <Icon name="chev-r" size={12}/>
        <a onClick={() => router.push('/problem')}>{s.problemTitle}</a> <Icon name="chev-r" size={12}/>
        <a onClick={() => router.push('/problem/submissions')}>Submissions</a> <Icon name="chev-r" size={12}/>
        <span>#{s.id}</span>
      </div>

      <div className="sd-hero hud is-glow">
        <span className="hud-corners"></span>
        <div className="sd-ring">
          <ProgressRing percent={s.verdict === 'PENDING' ? 0 : s.score} size={68} label={s.verdict === 'PENDING' ? '…' : s.score}/>
        </div>
        <div className="sd-hero-main">
          <h1>Submission #{s.id} · {s.problemTitle}</h1>
          <VerdictBadge v={s.verdict}/>
          <div className="sd-meta mono">
            <span className="sd-user" onClick={() => router.push('/u/' + s.userHandle)}>
              <Avatar initial={u?.initial ?? s.userHandle[0].toUpperCase()} hue={u?.hue ?? 145} size="sm"/> {s.userHandle}
            </span>
            <span><b>{s.language}</b></span>
            <span>max <b>{s.time}</b></span>
            <span>peak <b>{s.memory}</b></span>
            <span>{formatDate(s.submittedAt, { month: 'short', day: 'numeric', year: 'numeric' })} {formatTime(s.submittedAt)}</span>
          </div>
        </div>
        <div className="sd-actions">
          <button className="btn btn-secondary" onClick={() => router.push('/problem')}><Icon name="code" size={14}/> Open in editor</button>
        </div>
      </div>

      <div className="sd-grid">
        <div className="sd-panel">
          <div className="sd-panel-h">
            <span><Icon name="code" size={15}/> Source — {s.language}</span>
            <button className="pb-copy"><Icon name="doc" size={12}/> Copy</button>
          </div>
          <CodePane code={s.source} className="sd-code"/>
        </div>
        <div className="sd-panel">
          <div className="sd-panel-h"><span><Icon name="target" size={15}/> Evaluation</span></div>
          {s.verdict === 'CE'
            ? <div className="sd-note"><Icon name="close" size={15}/> Compilation failed — no executable was produced, so no tests were run.</div>
            : s.groups.length
              ? <Evaluation groups={s.groups} total={s.score}/>
              : <div className="sd-note"><Icon name="clock" size={15}/> Evaluation pending — results will appear once the judge finishes.</div>}
        </div>
      </div>
    </div>
  );
}
