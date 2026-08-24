"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { RichEditor } from "@/components/admin/RichEditor";

export function NewProblemForm() {
  const router = useRouter();
  const [f, setF] = useState({ code: "", title: "", originalLanguage: "ro", statement: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      const res = await fetch("/api/problems", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: f.code, title: f.title, originalLanguage: f.originalLanguage,
          statement: { language: f.originalLanguage, title: f.title, statement: f.statement },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setErrors(body.errors ?? { form: body.error ?? "Could not create." }); setBusy(false); return; }
      router.push("/admin/problems/" + body.problem.code);
    } catch { setErrors({ form: "Something went wrong." }); setBusy(false); }
  };

  return (
    <div className="adm container-narrow">
      <div className="page-header">
        <span className="eyebrow">// new problem</span>
        <h1>Create a problem</h1>
        <p className="subtitle">Start with the basics — you can fill in tests, scoring, translations and more after.</p>
      </div>
      <form className="adm-card stack-4" onSubmit={submit}>
        {errors.form && <div className="auth-error">{errors.form}</div>}
        <div className="field"><label>Code / slug</label><input className="input mono" value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="secv3"/>{errors.code && <span className="field-error">{errors.code}</span>}</div>
        <div className="field"><label>Title</label><input className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Secvență 3"/>{errors.title && <span className="field-error">{errors.title}</span>}</div>
        <div className="field"><label>Original statement language</label><input className="input mono" value={f.originalLanguage} onChange={e => setF({ ...f, originalLanguage: e.target.value })} placeholder="ro"/>{errors.originalLanguage && <span className="field-error">{errors.originalLanguage}</span>}</div>
        <div className="field"><label>Statement</label><RichEditor value={f.statement} onChange={html => setF({ ...f, statement: html })}/>{errors.statement && <span className="field-error">{errors.statement}</span>}<span className="t-xs dim" style={{ marginTop: 6, display: "block" }}>You can add images and more formatting after creating the problem.</span></div>
        <div className="row gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/admin/problems")}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : <>Create <Icon name="arrow-r" size={12}/></>}</button>
        </div>
      </form>
    </div>
  );
}
