"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/providers/AppProvider";

export function Login() {
  const router = useRouter();
  const { login } = useApp();
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side">
          <div className="logo-mark"><span className="mono brand-fg">{'{'}</span><span className="mono">leonix</span><span className="mono brand-fg">{'}'}</span></div>
          <h2 style={{marginTop:32}}>Welcome back.</h2>
          <p className="muted t-md">Pick up where you left off — your submissions, streak and rank are waiting.</p>
          <div className="auth-quotes">
            <blockquote>"The archive plus instant hints got me from div 2 to div 1 in a summer."</blockquote>
            <cite className="t-xs mono dim">— Andrei P., 12th grade, București</cite>
          </div>
        </div>
        <form className="auth-form stack-4" onSubmit={e => { e.preventDefault(); login(); }}>
          <span className="eyebrow">// log in</span>
          <h1>Sign in to leonix Arena</h1>
          <div className="field"><label>Email</label><input className="input" type="email" defaultValue="alex@leonix.dev"/></div>
          <div className="field"><label>Password</label><input className="input" type="password" defaultValue="••••••••"/></div>
          <div className="row-between">
            <label className="row gap-2 t-sm"><input type="checkbox" defaultChecked/> Remember me</label>
            <a className="t-sm">Forgot password?</a>
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit">Sign in <Icon name="arrow-r" size={12}/></button>
          <div className="auth-divider"><span>or</span></div>
          <div className="row gap-2">
            <button type="button" className="btn btn-secondary btn-block">Google</button>
            <button type="button" className="btn btn-secondary btn-block">GitHub</button>
          </div>
          <div className="t-sm dim" style={{textAlign:'center', marginTop:8}}>
            New here? <a onClick={() => router.push('/register')}>Create an account</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Register() {
  const { login } = useApp();
  const [step, setStep] = useState(0);
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
          {step === 0 && <>
            <h1>Create account</h1>
            <div className="field"><label>Full name</label><input className="input" defaultValue="Ana Popescu"/></div>
            <div className="field"><label>Email</label><input className="input" defaultValue="ana@example.com"/></div>
            <div className="field"><label>Password</label><input className="input" type="password" defaultValue="••••••••"/></div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep(1)}>Continue <Icon name="arrow-r" size={12}/></button>
          </>}
          {step === 1 && <>
            <h1>What do you want to train?</h1>
            <p className="t-sm muted">We'll tune your recommended problems. You can pick more than one.</p>
            <div className="grid-2 stack-3">
              {[
                { glyph:'∑', name:'Algorithmics' },
                { glyph:'◆', name:'Data structures' },
                { glyph:'{}', name:'Dynamic programming' },
                { glyph:'◇', name:'Graphs' },
                { glyph:'⚑', name:'Olympiad prep' },
                { glyph:'⌘', name:'Interview prep' },
              ].map(g => (
                <label key={g.name} className="goal-card">
                  <input type="checkbox"/>
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
              {[
                { id:'cpp',    name:'C++ 17',      note:'GCC · the competitive standard' },
                { id:'python', name:'Python 3',    note:'CPython · fast to write' },
                { id:'java',   name:'Java 17',     note:'OpenJDK · strong typing' },
              ].map((l, i) => (
                <label key={l.id} className="prod-pick">
                  <input type="radio" name="lang" defaultChecked={i===0}/>
                  <div className="stack-2"><div className="strong">{l.name}</div><div className="t-xs muted">{l.note}</div></div>
                </label>
              ))}
            </div>
            <div className="row gap-2"><button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary btn-block" onClick={login}>Finish setup</button></div>
          </>}
        </div>
      </div>
    </div>
  );
}
