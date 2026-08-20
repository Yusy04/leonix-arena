"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";
import { SourceModal } from "@/components/submissions/SourceModal";
import { VerdictBadge, scoreCls } from "@/components/submissions/VerdictBadge";
import { useApp } from "@/components/providers/AppProvider";
import { submissionsForProblem, getUserByHandle, PROBLEMS } from "@/lib/mock";
import { formatDate, formatTime } from "@/lib/data";
import type { Submission, Verdict, Language } from "@/lib/types";

const PROBLEM_ID = "matrix-exploration";
const PAGE_SIZE = 8;

export function SubmissionsPage() {
  const router = useRouter();
  const { currentHandle } = useApp();
  const [mineOnly, setMineOnly] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | "ALL">("ALL");
  const [language, setLanguage] = useState<Language | "ALL">("ALL");
  const [sort, setSort] = useState<"newest" | "score" | "fastest">("newest");
  const [user, setUser] = useState("");
  const [page, setPage] = useState(1);
  const [srcSub, setSrcSub] = useState<Submission | null>(null);

  const problem = PROBLEMS.find(p => p.id === PROBLEM_ID)!;
  const all = submissionsForProblem(PROBLEM_ID, { mineOnly, verdict, language, sort, user });
  const myBest = submissionsForProblem(PROBLEM_ID, { mineOnly: true }).reduce((m, s) => Math.max(m, s.score), -1);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const rows = all.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);
  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="subs container-wide">
      <div className="subs-crumb">
        <a onClick={() => router.push('/archive')}>Archive</a> <Icon name="chev-r" size={12}/>
        <a onClick={() => router.push('/problem')}>{problem.title}</a> <Icon name="chev-r" size={12}/>
        <span>Submissions</span>
      </div>

      <div className="subs-head">
        <div className="stack-2">
          <span className="eyebrow">// submissions</span>
          <h1>Submissions · {problem.title}</h1>
        </div>
        <div className="subs-summary mono">
          <span>{all.length.toLocaleString()} shown</span>
          <span className="dim">·</span>
          <span>your best: {myBest >= 0 ? `${myBest}/100` : '—'}</span>
        </div>
      </div>

      <div className="subs-toolbar hud">
        <span className="hud-corners"></span>
        <div className="seg">
          <button className={!mineOnly ? 'on' : ''} onClick={() => reset(() => setMineOnly(false))}>Everyone</button>
          <button className={mineOnly ? 'on' : ''} onClick={() => reset(() => setMineOnly(true))}>Only mine</button>
        </div>
        <label className="subs-field">Verdict
          <select value={verdict} onChange={e => reset(() => setVerdict(e.target.value as Verdict | "ALL"))}>
            <option value="ALL">All</option>
            <option value="AC">Accepted</option>
            <option value="WA">Wrong answer</option>
            <option value="TLE">Time limit</option>
            <option value="RE">Runtime error</option>
            <option value="CE">Compile error</option>
            <option value="PENDING">Pending</option>
          </select>
        </label>
        <label className="subs-field">Language
          <select value={language} onChange={e => reset(() => setLanguage(e.target.value as Language | "ALL"))}>
            <option value="ALL">All</option>
            <option value="C++17">C++17</option>
            <option value="Python 3">Python 3</option>
            <option value="Java 17">Java 17</option>
          </select>
        </label>
        <label className="subs-field">Sort
          <select value={sort} onChange={e => reset(() => setSort(e.target.value as "newest" | "score" | "fastest"))}>
            <option value="newest">Newest</option>
            <option value="score">Best score</option>
            <option value="fastest">Fastest</option>
          </select>
        </label>
        <div className="subs-search">
          <Icon name="search" size={14}/>
          <input placeholder="Search by user…" value={user} onChange={e => reset(() => setUser(e.target.value))}/>
        </div>
      </div>

      <div className="subs-table-wrap hud">
        <span className="hud-corners"></span>
        <table className="subs-table">
          <thead><tr>
            <th>Verdict</th><th>Score</th><th>User</th><th>Lang</th><th>Time</th><th>Memory</th><th>Submitted</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {rows.map(s => {
              const u = getUserByHandle(s.userHandle);
              return (
                <tr key={s.id}>
                  <td><VerdictBadge v={s.verdict}/></td>
                  <td>{s.verdict === 'PENDING'
                    ? <span className="dim mono">—</span>
                    : <span className={"sc " + scoreCls(s.score)}>{s.score}<span className="sc-tot">/100</span></span>}</td>
                  <td>
                    <span className="subs-user" onClick={() => router.push('/u/' + s.userHandle)}>
                      <Avatar initial={u?.initial ?? s.userHandle[0].toUpperCase()} hue={u?.hue ?? 145} size="sm"/>
                      {s.userHandle}{s.userHandle === currentHandle && <span className="you-tag">you</span>}
                    </span>
                  </td>
                  <td className="mono dim">{s.language}</td>
                  <td className="mono dim">{s.time}</td>
                  <td className="mono dim">{s.memory}</td>
                  <td className="mono dim">{formatDate(s.submittedAt, { month: 'short', day: 'numeric' })} {formatTime(s.submittedAt)}</td>
                  <td className="subs-actions">
                    <button onClick={() => setSrcSub(s)}><Icon name="code" size={13}/> Source</button>
                    <button onClick={() => router.push('/submissions/' + s.id)}>Details <Icon name="arrow-r" size={12}/></button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="subs-empty">No submissions match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="subs-foot">
        <span className="mono dim">Showing {rows.length ? (pageClamped - 1) * PAGE_SIZE + 1 : 0}–{(pageClamped - 1) * PAGE_SIZE + rows.length} of {all.length}</span>
        <div className="subs-pages">
          <button disabled={pageClamped <= 1} onClick={() => setPage(pageClamped - 1)} aria-label="Previous"><Icon name="arrow-l" size={13}/></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={'mono' + (p === pageClamped ? ' on' : '')} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={pageClamped >= totalPages} onClick={() => setPage(pageClamped + 1)} aria-label="Next"><Icon name="arrow-r" size={13}/></button>
        </div>
      </div>

      {srcSub && <SourceModal code={srcSub.source} language={srcSub.language} onClose={() => setSrcSub(null)}/>}
    </div>
  );
}
