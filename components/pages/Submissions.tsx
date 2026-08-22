"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";
import { SourceModal } from "@/components/submissions/SourceModal";
import { VerdictBadge, scoreCls } from "@/components/submissions/VerdictBadge";
import { useApp } from "@/components/providers/AppProvider";
import type { Language, Verdict } from "@/lib/types";
import type { SubRow } from "@/lib/submissions/queries";

const PAGE_SIZE = 15;

export function SubmissionsPage({ code, problemTitle, rows, bestScore }: { code: string; problemTitle: string; rows: SubRow[]; bestScore: number | null }) {
  const router = useRouter();
  const { authUser } = useApp();
  const [mineOnly, setMineOnly] = useState(false);
  const [verdict, setVerdict] = useState("ALL");
  const [language, setLanguage] = useState("ALL");
  const [sort, setSort] = useState<"newest" | "score" | "fastest">("newest");
  const [user, setUser] = useState("");
  const [page, setPage] = useState(1);
  const [srcSub, setSrcSub] = useState<SubRow | null>(null);

  const timeMs = (t: string) => { const n = parseInt(t); return isNaN(n) ? Number.MAX_SAFE_INTEGER : n; };
  let list = rows.filter(s => {
    if (mineOnly && s.userHandle !== authUser?.handle) return false;
    if (verdict !== "ALL" && s.verdict !== verdict) return false;
    if (language !== "ALL" && s.language !== language) return false;
    if (user && !s.userHandle.toLowerCase().includes(user.toLowerCase())) return false;
    return true;
  });
  if (sort === "score") list = [...list].sort((a, b) => b.score - a.score);
  else if (sort === "fastest") list = [...list].sort((a, b) => timeMs(a.time) - timeMs(b.time));

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const pageRows = list.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);
  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="subs container-wide">
      <div className="subs-crumb">
        <a onClick={() => router.push("/archive")}>Archive</a> <Icon name="chev-r" size={12}/>
        <a onClick={() => router.push("/problem/" + code)}>{problemTitle}</a> <Icon name="chev-r" size={12}/>
        <span>Submissions</span>
      </div>

      <div className="subs-head">
        <div className="stack-2"><span className="eyebrow">// submissions</span><h1>Submissions · {problemTitle}</h1></div>
        <div className="subs-summary mono"><span>{rows.length.toLocaleString()} total</span><span className="dim">·</span><span>your best: {bestScore != null ? `${bestScore}/100` : "—"}</span></div>
      </div>

      <div className="subs-toolbar hud">
        <span className="hud-corners"></span>
        <div className="seg">
          <button className={!mineOnly ? "on" : ""} onClick={() => reset(() => setMineOnly(false))}>Everyone</button>
          <button className={mineOnly ? "on" : ""} onClick={() => reset(() => setMineOnly(true))}>Only mine</button>
        </div>
        <label className="subs-field">Verdict
          <select value={verdict} onChange={e => reset(() => setVerdict(e.target.value))}>
            <option value="ALL">All</option><option value="AC">Accepted</option><option value="WA">Wrong answer</option><option value="TLE">Time limit</option><option value="RE">Runtime error</option><option value="CE">Compile error</option><option value="PENDING">Pending</option>
          </select>
        </label>
        <label className="subs-field">Language
          <select value={language} onChange={e => reset(() => setLanguage(e.target.value))}>
            <option value="ALL">All</option><option value="C++17">C++17</option><option value="Python 3">Python 3</option><option value="Java 17">Java 17</option>
          </select>
        </label>
        <label className="subs-field">Sort
          <select value={sort} onChange={e => reset(() => setSort(e.target.value as "newest" | "score" | "fastest"))}>
            <option value="newest">Newest</option><option value="score">Best score</option><option value="fastest">Fastest</option>
          </select>
        </label>
        <div className="subs-search"><Icon name="search" size={14}/><input placeholder="Search by user…" value={user} onChange={e => reset(() => setUser(e.target.value))}/></div>
      </div>

      <div className="subs-table-wrap hud">
        <span className="hud-corners"></span>
        <table className="subs-table">
          <thead><tr><th>Verdict</th><th>Score</th><th>User</th><th>Lang</th><th>Time</th><th>Memory</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>
            {pageRows.map(s => (
              <tr key={s.id}>
                <td><VerdictBadge v={s.verdict as Verdict}/></td>
                <td>{s.verdict === "PENDING" ? <span className="dim mono">—</span> : <span className={"sc " + scoreCls(s.score)}>{s.score}<span className="sc-tot">/100</span></span>}</td>
                <td><span className="subs-user" onClick={() => router.push("/u/" + s.userHandle)}><Avatar initial={s.userInitial} hue={s.userHue} size="sm"/>{s.userHandle}{s.userHandle === authUser?.handle && <span className="you-tag">you</span>}</span></td>
                <td className="mono dim">{s.language ?? "—"}</td>
                <td className="mono dim">{s.time}</td>
                <td className="mono dim">{s.memory}</td>
                <td className="mono dim">{new Date(s.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</td>
                <td className="subs-actions"><button onClick={() => setSrcSub(s)}><Icon name="code" size={13}/> Source</button><button onClick={() => router.push("/submissions/" + s.id)}>Details <Icon name="arrow-r" size={12}/></button></td>
              </tr>
            ))}
            {pageRows.length === 0 && <tr><td colSpan={8} className="subs-empty">No submissions match these filters.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="subs-foot">
        <span className="mono dim">Showing {pageRows.length ? (pageClamped - 1) * PAGE_SIZE + 1 : 0}–{(pageClamped - 1) * PAGE_SIZE + pageRows.length} of {list.length}</span>
        <div className="subs-pages">
          <button disabled={pageClamped <= 1} onClick={() => setPage(pageClamped - 1)} aria-label="Previous"><Icon name="arrow-l" size={13}/></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => <button key={p} className={"mono" + (p === pageClamped ? " on" : "")} onClick={() => setPage(p)}>{p}</button>)}
          <button disabled={pageClamped >= totalPages} onClick={() => setPage(pageClamped + 1)} aria-label="Next"><Icon name="arrow-r" size={13}/></button>
        </div>
      </div>

      {srcSub && <SourceModal code={srcSub.source} language={(srcSub.language ?? "C++17") as Language} onClose={() => setSrcSub(null)}/>}
    </div>
  );
}
