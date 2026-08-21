"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";

export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || body.errors?.email || body.errors?.password || "Sign in failed.");
        setBusy(false);
        return;
      }
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again."); setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side">
          <div className="logo-mark"><span className="mono brand-fg">{'{'}</span><span className="mono">leonix</span><span className="mono brand-fg">{'}'}</span></div>
          <h2 style={{marginTop:32}}>Welcome back.</h2>
          <p className="muted t-md">Pick up where you left off — your submissions, streak and rank are waiting.</p>
          <div className="auth-quotes">
            <blockquote>&ldquo;The archive plus instant hints got me from div 2 to div 1 in a summer.&rdquo;</blockquote>
            <cite className="t-xs mono dim">— Andrei P., 12th grade, București</cite>
          </div>
        </div>
        <form className="auth-form stack-4" onSubmit={submit}>
          <span className="eyebrow">// log in</span>
          <h1>Sign in to leonix Arena</h1>
          {error && <div className="auth-error">{error}</div>}
          <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required/></div>
          <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required/></div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>{busy ? "Signing in…" : <>Sign in <Icon name="arrow-r" size={12}/></>}</button>
          <div className="auth-divider"><span>or</span></div>
          <div className="row gap-2">
            <button type="button" className="btn btn-secondary btn-block" disabled title="Coming soon">Google</button>
            <button type="button" className="btn btn-secondary btn-block" disabled title="Coming soon">GitHub</button>
          </div>
          <div className="t-sm dim" style={{textAlign:'center', marginTop:8}}>
            New here? <a onClick={() => router.push('/register')}>Create an account</a>
          </div>
        </form>
      </div>
    </div>
  );
}

const GOALS = [
  { glyph:'∑', name:'Algorithmics' }, { glyph:'◆', name:'Data structures' },
  { glyph:'{}', name:'Dynamic programming' }, { glyph:'◇', name:'Graphs' },
  { glyph:'⚑', name:'Olympiad prep' }, { glyph:'⌘', name:'Interview prep' },
];
const LANGS = [
  { id:'C++17', name:'C++ 17', note:'GCC · the competitive standard' },
  { id:'Python 3', name:'Python 3', note:'CPython · fast to write' },
  { id:'Java 17', name:'Java 17', note:'OpenJDK · strong typing' },
];

export function Register() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [language, setLanguage] = useState("C++17");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const toggleGoal = (g: string) => setGoals(gs => gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]);

  const finish = async () => {
    setBusy(true); setErrors({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, goals, language }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || { form: "Registration failed." });
        setBusy(false);
        if (body.errors?.name || body.errors?.email || body.errors?.password) setStep(0);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Something went wrong. Try again." }); setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side">
          <div className="logo-mark"><span className="mono brand-fg">{'{'}</span><span className="mono">leonix</span><span className="mono brand-fg">{'}'}</span></div>
          <h2 style={{marginTop:32}}>Start in 3 steps.</h2>
          <ol className="auth-steps">
            <li className={step>=0?'is-active':''}><span className="step-n mono">01</span> Account basics</li>
            <li className={step>=1?'is-active':''}><span className="step-n mono">02</span> Your goals</li>
            <li className={step>=2?'is-active':''}><span className="step-n mono">03</span> Preferred language</li>
          </ol>
        </div>
        <div className="auth-form stack-4">
          <span className="eyebrow">// step 0{step+1} of 03</span>
          {errors.form && <div className="auth-error">{errors.form}</div>}
          {step === 0 && <>
            <h1>Create account</h1>
            <div className="field"><label>Full name</label><input className="input" value={name} onChange={e => setName(e.target.value)}/>{errors.name && <span className="field-error">{errors.name}</span>}</div>
            <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}/>{errors.email && <span className="field-error">{errors.email}</span>}</div>
            <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}/>{errors.password && <span className="field-error">{errors.password}</span>}</div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep(1)}>Continue <Icon name="arrow-r" size={12}/></button>
          </>}
          {step === 1 && <>
            <h1>What do you want to train?</h1>
            <p className="t-sm muted">We&apos;ll tune your recommended problems. You can pick more than one.</p>
            <div className="grid-2 stack-3">
              {GOALS.map(g => (
                <label key={g.name} className="goal-card">
                  <input type="checkbox" checked={goals.includes(g.name)} onChange={() => toggleGoal(g.name)}/>
                  <span className="goal-glyph mono">{g.glyph}</span>
                  <span className="strong">{g.name}</span>
                </label>
              ))}
            </div>
            <div className="row gap-2"><button className="btn btn-secondary" onClick={() => setStep(0)}>Back</button><button className="btn btn-primary btn-block" onClick={() => setStep(2)}>Continue</button></div>
          </>}
          {step === 2 && <>
            <h1>Pick your default language</h1>
            <p className="t-sm muted">The one your editor opens with. You can switch any time.</p>
            <div className="stack-3">
              {LANGS.map(l => (
                <label key={l.id} className="prod-pick">
                  <input type="radio" name="lang" checked={language === l.id} onChange={() => setLanguage(l.id)}/>
                  <div className="stack-2"><div className="strong">{l.name}</div><div className="t-xs muted">{l.note}</div></div>
                </label>
              ))}
            </div>
            <div className="row gap-2"><button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary btn-block" onClick={finish} disabled={busy}>{busy ? "Creating…" : "Finish setup"}</button></div>
          </>}
        </div>
      </div>
    </div>
  );
}
