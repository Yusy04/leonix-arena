"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { CodePane } from "@/components/code/CodePane";
import { SourceModal } from "@/components/submissions/SourceModal";
import { VerdictBadge, scoreCls } from "@/components/submissions/VerdictBadge";
import type { Verdict, Language } from "@/lib/types";
import type { SubRow } from "@/lib/submissions/queries";

export interface ProblemView {
  code: string;
  title: string;
  authorName: string | null;
  difficulty: number;
  tags: string[];
  source: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  originalLanguage: string;
  statementLanguage: string | null;
  languages: string[];
  statement: { title: string; statement: string; inputSpec: string | null; outputSpec: string | null; constraints: string | null; notes: string | null } | null;
  samples: { index: number; input: string; output: string; explanation: string | null }[];
  limits: { code: string; name: string; timeLimitMs: number; memoryLimitMb: number }[];
  editorial: {
    translations: { language: string; description: string | null; videos: { url: string; title: string | null }[]; solutions: { language: string; inlineSource: string | null }[] }[];
  } | null;
}

const PB_BOILER = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}`;

/* ---------- STATEMENT ---------- */
function PbStatement({ view }: { view: ProblemView }) {
  const s = view.statement;
  const [showTags, setShowTags] = useState(false);
  return (
    <div className="pb-stmt">
      <h1 className="pb-h1">{s?.title ?? view.title}</h1>
      <div className="pb-limits">
        <span className="pb-limit"><Icon name="clock" size={14}/> Time limit: {view.timeLimitMs} ms</span>
        <span className="pb-limit"><Icon name="grid" size={14}/> Memory limit: {view.memoryLimitMb} MB</span>
        {view.source && <span className="pb-limit"><Icon name="bookmark" size={14}/> {view.source}</span>}
        {view.authorName && <span className="pb-limit"><Icon name="user" size={14}/> {view.authorName}</span>}
      </div>

      {s ? (
        <>
          <div className="pb-rich" dangerouslySetInnerHTML={{ __html: s.statement || "" }} />
          {s.inputSpec && <><div className="pb-sec"><span className="pb-dot"></span>STANDARD INPUT</div><div className="pb-rich" dangerouslySetInnerHTML={{ __html: s.inputSpec }} /></>}
          {s.outputSpec && <><div className="pb-sec"><span className="pb-dot"></span>STANDARD OUTPUT</div><div className="pb-rich" dangerouslySetInnerHTML={{ __html: s.outputSpec }} /></>}
          {s.constraints && <><div className="pb-sec"><span className="pb-dot"></span>RESTRICTIONS AND NOTES</div><div className="pb-rich" dangerouslySetInnerHTML={{ __html: s.constraints }} /></>}
          {s.notes && <div className="pb-rich" dangerouslySetInnerHTML={{ __html: s.notes }} />}
        </>
      ) : <p className="pb-p dim">No published statement for this problem yet.</p>}

      {view.samples.length > 0 && view.samples.map(sample => (
        <div key={sample.index} className="pb-io-grid">
          <div className="pb-iobox">
            <div className="pb-iobox-h"><Icon name="arrow-r" size={13}/> INPUT {sample.index}</div>
            <pre className="pb-iobox-b">{sample.input}</pre>
          </div>
          <div className="pb-iobox">
            <div className="pb-iobox-h"><Icon name="doc" size={13}/> OUTPUT {sample.index}</div>
            <pre className="pb-iobox-b">{sample.output}</pre>
          </div>
        </div>
      ))}
      {view.tags.length > 0 && (
        <div className="pb-tags" style={{ marginTop: 18 }}>
          {!showTags ? (
            <button className="pb-tags-btn" onClick={() => setShowTags(true)} title="Tags may hint at the approach">
              <Icon name="lock" size={13}/> Show tags ({view.tags.length})
            </button>
          ) : (
            <div className="pb-limits">
              <button className="pb-tags-btn is-open" onClick={() => setShowTags(false)}><Icon name="close" size={12}/> Hide tags</button>
              {view.tags.map(t => <span key={t} className="pb-limit mono">#{t}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- EDITORIAL ---------- */
function PbEditorial({ view }: { view: ProblemView }) {
  const [lang, setLang] = useState(0);
  const eds = view.editorial?.translations ?? [];
  if (eds.length === 0) return <div className="pb-edit"><h1 className="pb-h1 sm">Problem Editorial</h1><p className="pb-p dim">No editorial published yet.</p></div>;
  const ed = eds[Math.min(lang, eds.length - 1)];
  return (
    <div className="pb-edit">
      <h1 className="pb-h1 sm">Problem Editorial</h1>
      {eds.length > 1 && (
        <div className="pb-tabs" style={{ marginBottom: 16 }}>
          {eds.map((e, i) => <button key={e.language} className={"pb-tab" + (i === lang ? " is-active" : "")} onClick={() => setLang(i)}>{e.language.toUpperCase()}</button>)}
        </div>
      )}
      <div className="pb-card">
        <div className="pb-card-h"><Icon name="book" size={15}/> Editorial ({ed.language})</div>
        <div className="pb-edit-body">{(ed.description ?? "No description.").split("\n").filter(Boolean).map((p, i) => <p key={i} className="pb-p">{p}</p>)}</div>
      </div>
      {ed.videos.length > 0 && (
        <div className="pb-card">
          <div className="pb-card-h"><Icon name="video" size={15}/> Video Editorial</div>
          <div className="pb-edit-body">{ed.videos.map((v, i) => <p key={i} className="pb-p"><a href={v.url} target="_blank" rel="noreferrer" className="pb-viewsrc">{v.title ?? v.url}</a></p>)}</div>
        </div>
      )}
      {ed.solutions.map((sol, i) => (
        <div key={i} className="pb-card">
          <div className="pb-card-h"><span><Icon name="code" size={15}/> Official Source ({sol.language})</span></div>
          <CodePane code={sol.inlineSource ?? "// source stored as a file"} className="pb-official"/>
        </div>
      ))}
    </div>
  );
}

/* ---------- SUBMISSIONS TAB ---------- */
function PbSubmissions({ submissions, code, onSource }: { submissions: SubRow[]; code: string; onSource: (s: SubRow) => void }) {
  const router = useRouter();
  return (
    <div className="pb-subs">
      <div className="pb-subs-head">
        <h1 className="pb-h1 sm">Recent Submissions</h1>
        <button className="pb-viewall" onClick={() => router.push("/problem/" + code + "/submissions")}>View all submissions <Icon name="arrow-r" size={14}/></button>
      </div>
      <div className="pb-subtable">
        <div className="pb-subrow pb-subhead"><span>Date</span><span>User</span><span>Score</span><span>Overview</span><span>Source</span></div>
        {submissions.slice(0, 6).map(s => (
          <div key={s.id} className="pb-subrow">
            <span className="pb-sd"><Icon name="clock" size={13}/> {new Date(s.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
            <span className="pb-su pb-su-link" onClick={() => router.push("/u/" + s.userHandle)}><Icon name="user" size={13}/> {s.userHandle}</span>
            <span>{s.verdict === "PENDING" ? <span className="dim mono">—</span> : <span className={"pb-score " + scoreCls(s.score)}>{s.score} <span className="pb-score-tot">/ 100</span></span>}</span>
            <span><button className="pb-ovbtn" onClick={() => router.push("/submissions/" + s.id)} title="Details"><VerdictBadge v={s.verdict as Verdict}/></button></span>
            <span><button className="pb-viewsrc" onClick={() => onSource(s)}><Icon name="code" size={13}/> View source</button></span>
          </div>
        ))}
        {submissions.length === 0 && <div className="pb-subrow"><span className="dim" style={{ gridColumn: "1 / -1" }}>No submissions yet.</span></div>}
      </div>
    </div>
  );
}

/* ---------- right-hand code editor (static demo) ---------- */
function PbEditor({ languages }: { languages: { code: string; name: string }[] }) {
  const botTabs = ["Input", "Output", "Stderr", "Compilation", "Execution", "Examples", "Submission"];
  const [full, setFull] = useState(false);
  return (
    <div className={"pb-editor hud" + (full ? " is-full" : "")}>
      <span className="hud-corners"></span>
      <div className="pe-bar">
        <div className="pe-tools">
          <button className="pe-tool"><Icon name="send" size={14}/> Share</button>
          <button className="pe-tool"><Icon name="doc" size={14}/> Open file</button>
          <button className="pe-lang">{languages[0]?.name ?? "C++"} <Icon name="chev-d" size={14}/></button>
        </div>
        <button className="pe-tool pe-full" onClick={() => setFull(f => !f)}><Icon name={full ? "close" : "grid"} size={14}/> {full ? "Exit fullscreen" : "Fullscreen"}</button>
      </div>
      <CodePane code={PB_BOILER} className="pe-main"/>
      <div className="pe-bottabs">
        {botTabs.map((t, i) => <button key={t} className={"pe-bt" + (i === 0 ? " is-active" : "")}>{t}</button>)}
      </div>
      <div className="pe-io"><div className="pe-io-gutter">1</div></div>
      <div className="pe-foot">
        <button className="pe-exec"><Icon name="chev-d" size={14} className="exec-chev"/> Execution Details</button>
        <div className="pe-actions">
          <button className="pe-act"><Icon name="play" size={13}/> Run</button>
          <button className="pe-act pe-submit"><Icon name="send" size={13}/> Submit</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- page shell ---------- */
export default function Problem({ view, submissions }: { view: ProblemView; submissions: SubRow[] }) {
  const [tab, setTab] = useState("statement");
  const [srcSub, setSrcSub] = useState<SubRow | null>(null);
  const tabs = [["statement", "Statement"], ["editorial", "Editorial"], ["submissions", "Submissions"]];
  return (
    <div className="pb container-wide">
      <div className="pb-split">
        <div className="pb-left hud">
          <span className="hud-corners"></span>
          <div className="pb-tabs">
            {tabs.map(([k, l]) => <button key={k} className={"pb-tab" + (tab === k ? " is-active" : "")} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          <div className="pb-body">
            {tab === "statement" && <PbStatement view={view}/>}
            {tab === "editorial" && <PbEditorial view={view}/>}
            {tab === "submissions" && <PbSubmissions submissions={submissions} code={view.code} onSource={setSrcSub}/>}
          </div>
        </div>
        <PbEditor languages={view.limits}/>
      </div>
      {srcSub && <SourceModal code={srcSub.source ?? ""} language={(srcSub.language ?? "C++17") as Language} onClose={() => setSrcSub(null)}/>}
    </div>
  );
}
