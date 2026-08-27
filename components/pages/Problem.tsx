"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { CodePane } from "@/components/code/CodePane";
import { CodeEditor } from "@/components/code/CodeEditor";
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

/* starter code per language + which file extensions map to which language */
const BOILERPLATE: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}`,
  python: `import sys

def main():
    data = sys.stdin.buffer.read().split()
    # your code here

main()`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // your code here
    }
}`,
};
const EXT_TO_LANG: Record<string, string> = {
  cpp: "cpp", cc: "cpp", cxx: "cpp", "c++": "cpp", hpp: "cpp", c: "cpp",
  py: "python", java: "java",
};
function boilerplateFor(code: string): string {
  return BOILERPLATE[code] ?? BOILERPLATE[code.toLowerCase()] ?? "";
}

type EditorLang = { code: string; name: string; timeLimitMs?: number; memoryLimitMb?: number };
const NOT_WIRED = "The online judge isn't connected yet — this is where your program's output will appear once it is.";

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

      {view.samples.length > 0 && (
        <>
          <div className="pb-sec"><span className="pb-dot"></span>{view.samples.length > 1 ? "EXAMPLES" : "EXAMPLE"}</div>
          {view.samples.map(sample => (
            <div key={sample.index} className="pb-sample">
              <div className="pb-io-grid">
                <div className="pb-iobox">
                  <div className="pb-iobox-h"><Icon name="arrow-r" size={13}/> INPUT {view.samples.length > 1 ? sample.index : ""}</div>
                  <pre className="pb-iobox-b">{sample.input}</pre>
                </div>
                <div className="pb-iobox">
                  <div className="pb-iobox-h"><Icon name="doc" size={13}/> OUTPUT {view.samples.length > 1 ? sample.index : ""}</div>
                  <pre className="pb-iobox-b">{sample.output}</pre>
                </div>
              </div>
              {sample.explanation && (
                <div className="pb-explain">
                  <span className="pb-explain-label"><Icon name="message" size={13}/> Explanation{view.samples.length > 1 ? ` ${sample.index}` : ""}</span>
                  <p className="pb-explain-body">{sample.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </>
      )}
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

/* ---------- right-hand code editor ---------- */
const BOT_TABS = ["Input", "Output", "Stderr", "Compilation", "Execution", "Examples", "Submission"] as const;
type BotTab = (typeof BOT_TABS)[number];

function PbEditor({ languages, samples }: { languages: EditorLang[]; samples: ProblemView["samples"] }) {
  const langs: EditorLang[] = languages.length ? languages : [{ code: "cpp", name: "C++17" }];
  const [langCode, setLangCode] = useState(langs[0].code);
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>(
    () => Object.fromEntries(langs.map(l => [l.code, boilerplateFor(l.code)])),
  );
  const [stdin, setStdin] = useState("");
  const [botTab, setBotTab] = useState<BotTab>("Input");
  const [ran, setRan] = useState(false);
  const [full, setFull] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const activeLang = langs.find(l => l.code === langCode) ?? langs[0];
  const code = codeByLang[langCode] ?? "";
  const setCode = (v: string) => setCodeByLang(m => ({ ...m, [langCode]: v }));

  // In fullscreen, Esc exits. Capture phase so CodeMirror can't swallow the key.
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); setFull(false); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [full]);

  const openFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const inferred = EXT_TO_LANG[ext];
      const target = inferred && langs.some(l => l.code === inferred) ? inferred : langCode;
      setLangCode(target);
      setCodeByLang(m => ({ ...m, [target]: text }));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setShareMsg("Copied!");
      setTimeout(() => setShareMsg(""), 1500);
    } catch { /* clipboard blocked */ }
  };

  const useSampleAsInput = (input: string) => { setStdin(input); setBotTab("Input"); };
  const run = () => { setRan(true); setBotTab("Output"); };

  return (
    <div className={"pb-editor hud" + (full ? " is-full" : "")}>
      <span className="hud-corners"></span>
      <div className="pe-bar">
        <div className="pe-tools">
          <button className="pe-tool" onClick={share}><Icon name="send" size={14}/> {shareMsg || "Share"}</button>
          <button className="pe-tool" onClick={() => fileRef.current?.click()}><Icon name="doc" size={14}/> Open file</button>
          <input ref={fileRef} type="file" accept=".cpp,.cc,.cxx,.c,.hpp,.py,.java,.txt" hidden onChange={openFile}/>
          <div className="pe-langwrap">
            <button className="pe-lang" onClick={() => setLangOpen(o => !o)}>{activeLang.name} <Icon name="chev-d" size={14}/></button>
            {langOpen && (
              <div className="pe-langmenu" onMouseLeave={() => setLangOpen(false)}>
                {langs.map(l => (
                  <button key={l.code} className={"pe-langopt" + (l.code === langCode ? " is-active" : "")}
                          onClick={() => { setLangCode(l.code); setLangOpen(false); }}>
                    <span>{l.name}</span>
                    {l.code === langCode && <Icon name="check" size={13}/>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button className="pe-tool pe-full" onClick={() => setFull(f => !f)}><Icon name={full ? "close" : "grid"} size={14}/> {full ? "Exit fullscreen" : "Fullscreen"}</button>
      </div>

      <CodeEditor value={code} onChange={setCode} language={langCode} className="pe-main" placeholder="Write your solution here…"/>

      <div className="pe-bottabs">
        {BOT_TABS.map(t => <button key={t} className={"pe-bt" + (t === botTab ? " is-active" : "")} onClick={() => setBotTab(t)}>{t}</button>)}
      </div>

      <div className="pe-console">
        {botTab === "Input" && (
          <textarea className="pe-io-ta" value={stdin} onChange={e => setStdin(e.target.value)} spellCheck={false}
                    placeholder="Type the standard input to run your program against…"/>
        )}
        {botTab === "Output" && <pre className="pe-out">{ran ? <span className="dim">{NOT_WIRED}</span> : <span className="dim">Run your program to see its output here.</span>}</pre>}
        {botTab === "Stderr" && <pre className="pe-out"><span className="dim">Standard error appears here after a run.</span></pre>}
        {botTab === "Compilation" && <pre className="pe-out"><span className="dim">Compiler messages appear here after a run.</span></pre>}
        {botTab === "Execution" && <pre className="pe-out"><span className="dim">Time &amp; memory usage will appear here once the judge is connected.</span></pre>}
        {botTab === "Examples" && (
          <div className="pe-samples">
            {samples.length === 0 && <span className="dim t-sm" style={{ padding: 12 }}>This problem has no worked examples.</span>}
            {samples.map(s => (
              <div key={s.index} className="pe-sample">
                <div className="pe-sample-h">
                  <span className="mono dim">Example {s.index}</span>
                  <button className="pe-usebtn" onClick={() => useSampleAsInput(s.input)}><Icon name="arrow-r" size={12}/> Use as input</button>
                </div>
                <div className="pe-sample-io">
                  <pre className="pe-sample-pre">{s.input}</pre>
                  <pre className="pe-sample-pre">{s.output}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
        {botTab === "Submission" && <pre className="pe-out"><span className="dim">Submitting isn&apos;t wired up yet — your verdict and per-test results will show here.</span></pre>}
      </div>

      <div className="pe-foot">
        <span className="pe-limits mono">
          {activeLang.timeLimitMs ? <><Icon name="clock" size={12}/> {activeLang.timeLimitMs} ms</> : null}
          {activeLang.memoryLimitMb ? <> · <Icon name="grid" size={12}/> {activeLang.memoryLimitMb} MB</> : null}
        </span>
        <div className="pe-actions">
          <button className="pe-act" onClick={run}><Icon name="play" size={13}/> Run</button>
          <button className="pe-act pe-submit" onClick={() => setBotTab("Submission")}><Icon name="send" size={13}/> Submit</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- pre-publish preview / editor bar ---------- */
function PbAdminBar({ code, canEdit, preview }: { code: string; canEdit?: boolean; preview?: { status: string; visibility: string } | null }) {
  const router = useRouter();
  if (!canEdit && !preview) return null;
  return (
    <div className={"pb-adminbar" + (preview ? " is-preview" : "")}>
      {preview ? (
        <span className="pb-preview-tag">
          <Icon name="lock" size={14}/> Preview — this problem is <strong>{preview.status.toLowerCase()}</strong> and isn&apos;t visible to the public yet. Only you and its editors can see this.
        </span>
      ) : (
        <span className="pb-preview-tag dim"><Icon name="check" size={14}/> You have edit access to this problem.</span>
      )}
      {canEdit && (
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/admin/problems/" + code)}>
          <Icon name="edit" size={13}/> Edit problem
        </button>
      )}
    </div>
  );
}

/* ---------- page shell ---------- */
export default function Problem({ view, submissions, canEdit, preview }: { view: ProblemView; submissions: SubRow[]; canEdit?: boolean; preview?: { status: string; visibility: string } | null }) {
  const [tab, setTab] = useState("statement");
  const [srcSub, setSrcSub] = useState<SubRow | null>(null);
  const tabs = [["statement", "Statement"], ["editorial", "Editorial"], ["submissions", "Submissions"]];
  return (
    <div className="pb container-wide">
      <PbAdminBar code={view.code} canEdit={canEdit} preview={preview}/>
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
        <PbEditor languages={view.limits} samples={view.samples}/>
      </div>
      {srcSub && <SourceModal code={srcSub.source ?? ""} language={(srcSub.language ?? "C++17") as Language} onClose={() => setSrcSub(null)}/>}
    </div>
  );
}
