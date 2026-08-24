"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { RichEditor } from "@/components/admin/RichEditor";
import type { FullProblem } from "@/lib/problems/service";

type Tag = { slug: string; name: string };
type Lang = { code: string; name: string };

export function ProblemEditor({ initial, allTags, languages }: { initial: FullProblem; allTags: Tag[]; languages: Lang[] }) {
  const router = useRouter();
  const base = "/api/problems/" + initial.code;
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  async function api(path: string, method: string, body?: unknown) {
    setMsg({});
    const res = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ err: data.error || (data.errors && Object.values(data.errors).join("; ")) || "Request failed." });
      return null;
    }
    setMsg({ ok: "Saved." });
    router.refresh();
    return data;
  }

  return (
    <div className="adm container-wide">
      <div className="adm-crumb">
        <a onClick={() => router.push("/admin/problems")}>Problems</a> <Icon name="chev-r" size={12}/> <span className="mono">{initial.code}</span>
      </div>

      <div className="adm-head">
        <div className="stack-2">
          <h1>{initial.title}</h1>
          <div className="adm-badges">
            <span className={"adm-badge st-" + initial.status.toLowerCase()}>{initial.status}</span>
            <span className="adm-badge dim">{initial.visibility}</span>
            <span className="mono dim t-xs">v{initial.version}</span>
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          <a className="btn btn-secondary btn-sm" href={"/problem/" + initial.code} target="_blank" rel="noopener noreferrer">
            <Icon name="search" size={13}/> Preview
          </a>
          <select className="input adm-inline" defaultValue={initial.visibility} onChange={e => api(base + "/visibility", "POST", { visibility: e.target.value })}>
            <option value="PUBLIC">Public</option><option value="PRIVATE">Private</option><option value="CONTEST_ONLY">Contest only</option>
          </select>
          {initial.status !== "PUBLISHED" && <button className="btn btn-primary btn-sm" onClick={() => api(base + "/publish", "POST")}><Icon name="check" size={13}/> Publish</button>}
          <button className="btn btn-ghost btn-sm adm-danger" onClick={async () => { if (confirm("Delete this problem and all its data?")) { const r = await fetch(base, { method: "DELETE" }); if (r.ok) router.push("/admin/problems"); } }}><Icon name="close" size={13}/> Delete</button>
        </div>
      </div>

      {msg.ok && <div className="st-ok"><Icon name="check" size={14}/> {msg.ok}</div>}
      {msg.err && <div className="auth-error">{msg.err}</div>}

      <BasicSection initial={initial} api={api} base={base}/>
      <StatementsSection initial={initial} api={api} base={base}/>
      <TagsSection initial={initial} allTags={allTags} api={api} base={base}/>
      <TestsSection initial={initial} api={api} base={base}/>
      <ScoringSection initial={initial} api={api} base={base}/>
      <CollaboratorsSection initial={initial} api={api} base={base}/>
      <EditorialSection initial={initial} languages={languages} api={api} base={base}/>
      <FilesSection initial={initial} api={api} base={base}/>
      <ContestSection api={api} base={base}/>
    </div>
  );
}

function CollaboratorsSection({ initial, api, base }: { initial: FullProblem; api: Api; base: string }) {
  const [handle, setHandle] = useState("");
  return (
    <Section title={`Co-authors (${initial.collaborators.length + 1})`}>
      <p className="st-sub">The author and every co-author (and any admin) have equal, full edit rights on this problem.</p>
      <div className="adm-list">
        <div className="adm-item">
          <span className="mono adm-lang">@{initial.createdBy.handle}</span>
          <span className="adm-item-title">{initial.createdBy.name}</span>
          <span className="adm-tag">author</span>
        </div>
        {initial.collaborators.map(c => (
          <div key={c.id} className="adm-item">
            <span className="mono adm-lang">@{c.user.handle}</span>
            <span className="adm-item-title">{c.user.name}</span>
            <button className="adm-link adm-danger" onClick={() => api(base + "/collaborators/" + c.userId, "DELETE")}>Remove</button>
          </div>
        ))}
      </div>
      <div className="adm-subform stack-3">
        <div className="strong t-sm">Add a co-author (admin or helper)</div>
        <div className="adm-grid">
          <div className="field"><label>Handle or email</label><input className="input mono" value={handle} onChange={e => setHandle(e.target.value)} placeholder="helper"/></div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { const r = await api(base + "/collaborators", "POST", { handle }); if (r) setHandle(""); }}>Add co-author</button>
      </div>
    </Section>
  );
}

type Api = (path: string, method: string, body?: unknown) => Promise<unknown>;

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="adm-sec hud">
      <span className="hud-corners"></span>
      <button className="adm-sec-h" onClick={() => setOpen(o => !o)}>
        <span>{title}</span><Icon name={open ? "chev-d" : "chev-r"} size={16}/>
      </button>
      {open && <div className="adm-sec-b">{children}</div>}
    </div>
  );
}

function BasicSection({ initial, api, base }: { initial: FullProblem; api: Api; base: string }) {
  const [f, setF] = useState({
    title: initial.title, authorName: initial.authorName ?? "", difficulty: initial.difficulty,
    type: initial.type, ioMode: initial.ioMode, inputFile: initial.inputFile ?? "", outputFile: initial.outputFile ?? "",
    timeLimitMs: initial.timeLimitMs, memoryLimitMb: initial.memoryLimitMb, checkerType: initial.checkerType,
  });
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });
  return (
    <Section title="Basic information & execution" defaultOpen>
      <div className="adm-grid">
        <div className="field"><label>Title</label><input className="input" value={f.title} onChange={e => set("title", e.target.value)}/></div>
        <div className="field"><label>Author</label><input className="input" value={f.authorName} onChange={e => set("authorName", e.target.value)}/></div>
        <div className="field"><label>Difficulty</label><input className="input mono" type="number" min={1} max={10} value={f.difficulty} onChange={e => set("difficulty", Number(e.target.value))}/></div>
        <div className="field"><label>Type</label><select className="input" value={f.type} onChange={e => set("type", e.target.value)}><option>STANDARD</option><option>FUNCTION</option><option>INTERACTIVE</option></select></div>
        <div className="field"><label>I/O mode</label><select className="input" value={f.ioMode} onChange={e => set("ioMode", e.target.value)}><option value="STDIN_STDOUT">stdin / stdout</option><option value="FILES">Files</option></select></div>
        <div className="field"><label>Checker</label><select className="input" value={f.checkerType} onChange={e => set("checkerType", e.target.value)}><option value="DIFF">Exact / diff</option><option value="TOKEN">Token</option><option value="CUSTOM">Custom</option></select></div>
        {f.ioMode === "FILES" && <>
          <div className="field"><label>Input file</label><input className="input mono" value={f.inputFile} onChange={e => set("inputFile", e.target.value)} placeholder="secv3.in"/></div>
          <div className="field"><label>Output file</label><input className="input mono" value={f.outputFile} onChange={e => set("outputFile", e.target.value)} placeholder="secv3.out"/></div>
        </>}
        <div className="field"><label>Time limit (ms, C++ baseline)</label><input className="input mono" type="number" value={f.timeLimitMs} onChange={e => set("timeLimitMs", Number(e.target.value))}/></div>
        <div className="field"><label>Memory limit (MB)</label><input className="input mono" type="number" value={f.memoryLimitMb} onChange={e => set("memoryLimitMb", Number(e.target.value))}/></div>
      </div>
      <div className="st-actions"><button className="btn btn-primary btn-sm" onClick={() => api(base, "PATCH", { ...f, inputFile: f.inputFile || null, outputFile: f.outputFile || null })}>Save basics</button></div>
    </Section>
  );
}

interface TrInit { language: string; title: string; statement: string; inputSpec: string | null; outputSpec: string | null; constraints: string | null; notes: string | null }

function TranslationForm({ code, base, api, initial, isNew, onDone }: { code: string; base: string; api: Api; initial?: TrInit; isNew: boolean; onDone: () => void }) {
  const [language, setLanguage] = useState(initial?.language ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [inputSpec, setInputSpec] = useState(initial?.inputSpec ?? "");
  const [outputSpec, setOutputSpec] = useState(initial?.outputSpec ?? "");
  const [constraints, setConstraints] = useState(initial?.constraints ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const payload = { title, statement, inputSpec, outputSpec, constraints, notes };
    const r = isNew
      ? await api(base + "/translations", "POST", { language, published: true, ...payload })
      : await api(base + "/translations/" + initial!.language, "PATCH", payload);
    setBusy(false);
    if (r) onDone();
  };

  return (
    <>
      <div className="adm-grid">
        {isNew && <div className="field"><label>Language</label><input className="input mono" value={language} onChange={e => setLanguage(e.target.value)} placeholder="en"/></div>}
        <div className="field"><label>Title</label><input className="input" value={title} onChange={e => setTitle(e.target.value)}/></div>
      </div>
      <div className="field"><label>Statement</label><RichEditor value={statement} onChange={setStatement} code={code}/></div>
      <div className="field"><label>Input</label><RichEditor value={inputSpec} onChange={setInputSpec} code={code}/></div>
      <div className="field"><label>Output</label><RichEditor value={outputSpec} onChange={setOutputSpec} code={code}/></div>
      <div className="field"><label>Constraints</label><RichEditor value={constraints} onChange={setConstraints} code={code}/></div>
      <div className="field"><label>Notes</label><RichEditor value={notes} onChange={setNotes} code={code}/></div>
      <div className="row gap-2">
        <button className="btn btn-secondary btn-sm" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || (isNew && !language)}>{busy ? "Saving…" : isNew ? "Add translation" : "Save translation"}</button>
      </div>
    </>
  );
}

function StatementsSection({ initial, api, base }: { initial: FullProblem; api: Api; base: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <Section title={`Statements (${initial.translations.length})`}>
      <p className="st-sub">Rich formatting and inline images — colors always follow the site theme.</p>
      <div className="adm-list">
        {initial.translations.map(t => (
          <div key={t.id}>
            <div className="adm-item">
              <span className="mono adm-lang">{t.language}{t.language === initial.originalLanguage && <span className="adm-tag">original</span>}</span>
              <span className="adm-item-title">{t.title}</span>
              <span className="row gap-2">
                <button className="adm-link" onClick={() => setEditing(editing === t.language ? null : t.language)}>{editing === t.language ? "Close" : "Edit"}</button>
                {t.language !== initial.originalLanguage && <button className="adm-link" onClick={() => api(base + "/original-language", "POST", { language: t.language })}>Set original</button>}
                {t.language !== initial.originalLanguage && <button className="adm-link adm-danger" onClick={() => api(base + "/translations/" + t.language, "DELETE")}>Delete</button>}
              </span>
            </div>
            {editing === t.language && (
              <div className="adm-subform stack-3">
                <TranslationForm code={initial.code} base={base} api={api} initial={t} isNew={false} onDone={() => setEditing(null)}/>
              </div>
            )}
          </div>
        ))}
      </div>
      {adding ? (
        <div className="adm-subform stack-3">
          <div className="strong t-sm">New translation</div>
          <TranslationForm code={initial.code} base={base} api={api} isNew onDone={() => setAdding(false)}/>
        </div>
      ) : (
        <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={12}/> Add translation</button>
      )}
    </Section>
  );
}

function TagsSection({ initial, allTags, api, base }: { initial: FullProblem; allTags: Tag[]; api: Api; base: string }) {
  const current = new Set(initial.tags.map(t => t.tag.slug));
  const [sel, setSel] = useState<Set<string>>(current);
  const toggle = (slug: string) => setSel(s => { const n = new Set(s); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });
  return (
    <Section title={`Tags (${initial.tags.length})`}>
      {allTags.length === 0 ? <p className="dim t-sm">No tags exist yet. An admin can create them via the tag API.</p> : (
        <div className="adm-tags">
          {allTags.map(t => (
            <label key={t.slug} className={"adm-tagchip" + (sel.has(t.slug) ? " on" : "")}>
              <input type="checkbox" checked={sel.has(t.slug)} onChange={() => toggle(t.slug)}/> {t.name}
            </label>
          ))}
        </div>
      )}
      <div className="st-actions"><button className="btn btn-primary btn-sm" onClick={() => api(base + "/tags", "PUT", { tags: [...sel] })}>Save tags</button></div>
    </Section>
  );
}

function TestsSection({ initial, api, base }: { initial: FullProblem; api: Api; base: string }) {
  const router = useRouter();
  const [n, setN] = useState({ name: "", input: "", output: "" });
  const [showManual, setShowManual] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok?: string; err?: string }>({});
  const tests = initial.tests;

  const move = async (idx: number, dir: -1 | 1) => {
    const order = tests.map(t => t.id);
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    await api(base + "/tests/reorder", "POST", { testIds: order });
  };

  const upload = async () => {
    if (!file) { setNote({ err: "Choose a .zip file first." }); return; }
    if (mode === "replace" && tests.length > 0 &&
        !confirm(`Replace all ${tests.length} current test(s)? They will be removed and unlinked from any scoring subtasks.`)) return;
    setBusy(true); setNote({});
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      const res = await fetch(base + "/tests/import", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setNote({ err: data.error || (data.errors?.zip) || "Upload failed." }); setBusy(false); return; }
      setNote({ ok: `Imported ${data.imported} test${data.imported === 1 ? "" : "s"} — ${data.total} total.` });
      setFile(null);
      router.refresh();
    } catch {
      setNote({ err: "Upload failed." });
    }
    setBusy(false);
  };

  return (
    <Section title={`Tests (${tests.length})`}>
      <div className="adm-list">
        {tests.map((t, i) => (
          <div key={t.id} className="adm-item">
            <span className="mono dim">#{t.index}</span>
            <span className="mono adm-item-title">{t.name}</span>
            <span className={"adm-badge " + (t.enabled ? "st-published" : "dim")}>{t.enabled ? "enabled" : "disabled"}</span>
            <span className="row gap-2">
              <button className="adm-link" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="adm-link" onClick={() => move(i, 1)} disabled={i === tests.length - 1}>↓</button>
              <button className="adm-link adm-danger" onClick={() => api(base + "/tests/" + t.id, "DELETE")}>Delete</button>
            </span>
          </div>
        ))}
        {tests.length === 0 && <p className="dim t-sm">No tests yet — upload a package below.</p>}
      </div>

      {/* Primary path: upload a zip of all tests */}
      <div className="adm-subform stack-3">
        <div className="strong t-sm">Upload a test package (.zip)</div>
        <p className="t-xs dim" style={{ margin: 0 }}>
          Each test is a pair of files that share a name — <code>NAME.in</code> (input) and <code>NAME.ok</code> (expected
          output). Zip them together and upload. New to this? <a className="adm-link" href={base + "/tests/template"} download>Download the template</a> — it has a README and worked examples.
        </p>
        <div className="row gap-2" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <input type="file" accept=".zip,application/zip" className="input" onChange={e => { setFile(e.target.files?.[0] ?? null); setNote({}); }} />
          <select className="input adm-inline" value={mode} onChange={e => setMode(e.target.value as "replace" | "append")}>
            <option value="replace">Replace all tests</option>
            <option value="append">Add to existing</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={upload} disabled={busy || !file}>{busy ? "Uploading…" : "Upload package"}</button>
        </div>
        {note.ok && <div className="st-ok"><Icon name="check" size={13} /> {note.ok}</div>}
        {note.err && <div className="auth-error">{note.err}</div>}
      </div>

      {/* Secondary: add a single test by hand */}
      <button className="adm-link t-xs" onClick={() => setShowManual(s => !s)} style={{ marginTop: 8 }}>
        {showManual ? "− Hide manual entry" : "+ Add a single test manually"}
      </button>
      {showManual && (
        <div className="adm-subform stack-3">
          <div className="field"><label>Name</label><input className="input mono" value={n.name} onChange={e => setN({ ...n, name: e.target.value })} placeholder="test-01"/></div>
          <div className="adm-grid">
            <div className="field"><label>Input</label><textarea className="input mono" rows={3} value={n.input} onChange={e => setN({ ...n, input: e.target.value })}/></div>
            <div className="field"><label>Expected output</label><textarea className="input mono" rows={3} value={n.output} onChange={e => setN({ ...n, output: e.target.value })}/></div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={async () => { const r = await api(base + "/tests", "POST", n); if (r) setN({ name: "", input: "", output: "" }); }}>Add test</button>
        </div>
      )}
    </Section>
  );
}

interface SubRow { index: number; name: string; points: number; selection: string; testNames: string; regexPattern: string; rangeStart: string; rangeEnd: string; }

function ScoringSection({ initial, api, base }: { initial: FullProblem; api: Api; base: string }) {
  const [total, setTotal] = useState(initial.scoringScheme?.totalPoints ?? 100);
  const [type, setType] = useState(initial.scoringScheme?.type ?? "SUBTASK");
  const [rows, setRows] = useState<SubRow[]>(() =>
    (initial.scoringScheme?.subtasks ?? []).map(s => ({
      index: s.index, name: s.name ?? "", points: s.points, selection: s.selection,
      testNames: s.tests.map(st => initial.tests.find(t => t.id === st.testId)?.name ?? "").filter(Boolean).join(", "),
      regexPattern: s.regexPattern ?? "", rangeStart: s.rangeStart?.toString() ?? "", rangeEnd: s.rangeEnd?.toString() ?? "",
    })),
  );
  const setRow = (i: number, patch: Partial<SubRow>) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows(rs => [...rs, { index: (rs.at(-1)?.index ?? 0) + 1, name: "", points: 0, selection: "EXPLICIT", testNames: "", regexPattern: "", rangeStart: "", rangeEnd: "" }]);
  const save = () => {
    const subtasks = rows.map(r => ({
      index: r.index, name: r.name || undefined, points: Number(r.points), selection: r.selection,
      testNames: r.selection === "EXPLICIT" ? r.testNames.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      regexPattern: r.selection === "REGEX" ? r.regexPattern : undefined,
      rangeStart: r.selection === "RANGE" ? Number(r.rangeStart) : undefined,
      rangeEnd: r.selection === "RANGE" ? Number(r.rangeEnd) : undefined,
    }));
    api(base + "/scoring", "PUT", { type, totalPoints: Number(total), subtasks });
  };
  return (
    <Section title="Scoring">
      <div className="adm-grid">
        <div className="field"><label>Total points</label><input className="input mono" type="number" value={total} onChange={e => setTotal(Number(e.target.value))}/></div>
        <div className="field"><label>Type</label><select className="input" value={type} onChange={e => setType(e.target.value as typeof type)}><option value="INDIVIDUAL">Individual</option><option value="SUBTASK">Subtasks</option></select></div>
      </div>
      <div className="adm-list">
        {rows.map((r, i) => (
          <div key={i} className="adm-subrow">
            <input className="input mono adm-xs" type="number" value={r.index} onChange={e => setRow(i, { index: Number(e.target.value) })} title="Index"/>
            <input className="input adm-sm" value={r.name} onChange={e => setRow(i, { name: e.target.value })} placeholder="name"/>
            <input className="input mono adm-xs" type="number" value={r.points} onChange={e => setRow(i, { points: Number(e.target.value) })} title="Points"/>
            <select className="input adm-sm" value={r.selection} onChange={e => setRow(i, { selection: e.target.value })}>
              <option value="EXPLICIT">Explicit</option><option value="RANGE">Range</option><option value="REGEX">Regex</option><option value="ALL">All</option>
            </select>
            {r.selection === "EXPLICIT" && <input className="input mono" value={r.testNames} onChange={e => setRow(i, { testNames: e.target.value })} placeholder="test-01, test-02"/>}
            {r.selection === "REGEX" && <input className="input mono" value={r.regexPattern} onChange={e => setRow(i, { regexPattern: e.target.value })} placeholder="test-0[12]"/>}
            {r.selection === "RANGE" && <span className="row gap-2"><input className="input mono adm-xs" type="number" value={r.rangeStart} onChange={e => setRow(i, { rangeStart: e.target.value })} placeholder="1"/><input className="input mono adm-xs" type="number" value={r.rangeEnd} onChange={e => setRow(i, { rangeEnd: e.target.value })} placeholder="3"/></span>}
            <button className="adm-link adm-danger" onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
      <div className="st-actions">
        <button className="btn btn-secondary btn-sm" onClick={addRow}><Icon name="plus" size={12}/> Subtask</button>
        <button className="btn btn-primary btn-sm" onClick={save}>Save scoring</button>
      </div>
    </Section>
  );
}

function EditorialSection({ initial, languages, api, base }: { initial: FullProblem; languages: Lang[]; api: Api; base: string }) {
  const [tr, setTr] = useState({ language: "", description: "" });
  const [sol, setSol] = useState({ language: "", languageCode: languages[0]?.code ?? "", source: "" });
  return (
    <Section title={`Editorial (${initial.editorial?.translations.length ?? 0})`}>
      <div className="adm-list">
        {(initial.editorial?.translations ?? []).map(t => (
          <div key={t.id} className="adm-item"><span className="mono adm-lang">{t.language}</span><span className="adm-item-title">{t.solutions.length} solution(s), {t.videos.length} video(s)</span></div>
        ))}
      </div>
      <div className="adm-subform stack-3">
        <div className="strong t-sm">Add / update editorial language</div>
        <div className="adm-grid">
          <div className="field"><label>Language</label><input className="input mono" value={tr.language} onChange={e => setTr({ ...tr, language: e.target.value })} placeholder="ro"/></div>
        </div>
        <div className="field"><label>Description</label><textarea className="input" rows={2} value={tr.description} onChange={e => setTr({ ...tr, description: e.target.value })}/></div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { const r = await api(base + "/editorial/" + tr.language, "PUT", { description: tr.description, published: true }); if (r) setTr({ language: "", description: "" }); }}>Save editorial</button>
      </div>
      <div className="adm-subform stack-3">
        <div className="strong t-sm">Add a solution</div>
        <div className="adm-grid">
          <div className="field"><label>Editorial language</label><input className="input mono" value={sol.language} onChange={e => setSol({ ...sol, language: e.target.value })} placeholder="ro"/></div>
          <div className="field"><label>Programming language</label><select className="input" value={sol.languageCode} onChange={e => setSol({ ...sol, languageCode: e.target.value })}>{languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
        </div>
        <div className="field"><label>Source</label><textarea className="input mono" rows={3} value={sol.source} onChange={e => setSol({ ...sol, source: e.target.value })}/></div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { const r = await api(base + "/editorial/" + sol.language + "/solutions", "POST", { languageCode: sol.languageCode, source: sol.source }); if (r) setSol({ ...sol, source: "" }); }}>Add solution</button>
      </div>
    </Section>
  );
}

function FilesSection({ initial, api, base }: { initial: FullProblem; api: Api; base: string }) {
  const [f, setF] = useState({ kind: "CHECKER", filename: "", data: "" });
  const active = initial.attachments.filter(a => a.active);
  return (
    <Section title="Files (grader / checker)">
      <div className="adm-list">
        {active.map(a => <div key={a.id} className="adm-item"><span className="mono adm-lang">{a.kind}</span><span className="mono adm-item-title">{a.filename}</span></div>)}
        {active.length === 0 && <p className="dim t-sm">No grader/checker uploaded. Default is exact/diff comparison.</p>}
      </div>
      <div className="adm-subform stack-3">
        <div className="adm-grid">
          <div className="field"><label>Kind</label><select className="input" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option value="CHECKER">Checker</option><option value="GRADER">Grader</option><option value="OTHER">Other</option></select></div>
          <div className="field"><label>Filename</label><input className="input mono" value={f.filename} onChange={e => setF({ ...f, filename: e.target.value })} placeholder="checker.cpp"/></div>
        </div>
        <div className="field"><label>Source</label><textarea className="input mono" rows={3} value={f.data} onChange={e => setF({ ...f, data: e.target.value })}/></div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { const r = await api(base + "/attachments", "POST", f); if (r) setF({ ...f, filename: "", data: "" }); }}>Upload</button>
      </div>
    </Section>
  );
}

function ContestSection({ api, base }: { api: Api; base: string }) {
  const [c, setC] = useState({ contestSlug: "", index: "" });
  return (
    <Section title="Contest association">
      <div className="adm-subform stack-3">
        <div className="adm-grid">
          <div className="field"><label>Contest slug</label><input className="input mono" value={c.contestSlug} onChange={e => setC({ ...c, contestSlug: e.target.value })} placeholder="oni-2019"/></div>
          <div className="field"><label>Index / letter</label><input className="input mono" value={c.index} onChange={e => setC({ ...c, index: e.target.value })} placeholder="A"/></div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={async () => { const r = await api(base + "/contests", "POST", c); if (r) setC({ contestSlug: "", index: "" }); }}>Attach to contest</button>
      </div>
    </Section>
  );
}
