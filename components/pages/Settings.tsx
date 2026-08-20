"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/providers/AppProvider";
import type { CardStyle, RadiusStyle } from "@/components/providers/AppProvider";

const SECTIONS = [
  { key: "editor",     label: "Editor & Language", icon: "settings" },
  { key: "appearance", label: "Appearance",        icon: "sun" },
  { key: "account",    label: "Account",           icon: "user" },
  { key: "notifs",     label: "Notifications",     icon: "bell" },
  { key: "privacy",    label: "Privacy",           icon: "lock" },
  { key: "danger",     label: "Danger zone",       icon: "flag" },
];

function Seg({ value, options, onChange }: { value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="seg">
      {options.map(o => <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.l}</button>)}
    </div>
  );
}
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button className={"st-toggle" + (on ? " on" : "")} onClick={onClick} aria-pressed={on}><i/></button>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="st-field"><label>{label}</label>{children}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="st-row"><span>{label}</span>{children}</div>;
}

export function Settings() {
  const router = useRouter();
  const { user, appearance, setAppearance } = useApp();
  const [section, setSection] = useState("editor");

  const [lang, setLang] = useState("C++17");
  const [fontSize, setFontSize] = useState("14");
  const [editor, setEditor] = useState({ autosave: true, lineNumbers: true, vim: false });
  const [notifs, setNotifs] = useState({ judged: true, hint: true, editorial: true, rank: true, streak: false, contest: true, badge: true, email: false });
  const [privacy, setPrivacy] = useState({ publicProfile: true, showLeaderboard: true, publicSubs: true });

  const notifRows: [keyof typeof notifs, string][] = [
    ["judged", "Submission judged"], ["hint", "AI buddy / hint ready"], ["editorial", "New editorial"],
    ["rank", "Rank / leaderboard"], ["streak", "Streak reminders"], ["contest", "Contest / event"], ["badge", "Badge earned"],
  ];

  return (
    <div className="st container-wide">
      <div className="page-header"><span className="eyebrow">// settings</span><h1>Settings</h1></div>

      <div className="st-shell">
        <nav className="st-nav">
          {SECTIONS.map(s => (
            <button key={s.key} className={"st-navi" + (section === s.key ? " on" : "") + (s.key === "danger" ? " st-danger-navi" : "")} onClick={() => setSection(s.key)}>
              <Icon name={s.icon} size={15}/> {s.label}
            </button>
          ))}
        </nav>

        <div className="st-panel hud">
          <span className="hud-corners"></span>

          {section === "editor" && (<>
            <h2>Editor &amp; Language</h2>
            <p className="st-sub">Defaults your code editor opens with.</p>
            <Field label="Default language"><Seg value={lang} onChange={setLang} options={[{ v: "C++17", l: "C++17" }, { v: "Python 3", l: "Python 3" }, { v: "Java 17", l: "Java 17" }]}/></Field>
            <Field label="Theme"><Seg value={appearance.theme} onChange={v => setAppearance({ theme: v as "dark" | "light" })} options={[{ v: "dark", l: "Dark" }, { v: "light", l: "Light" }]}/></Field>
            <Field label="Font size"><Seg value={fontSize} onChange={setFontSize} options={[{ v: "13", l: "13" }, { v: "14", l: "14" }, { v: "16", l: "16" }]}/></Field>
            <Row label="Auto-save draft solutions"><Toggle on={editor.autosave} onClick={() => setEditor(s => ({ ...s, autosave: !s.autosave }))}/></Row>
            <Row label="Show line numbers"><Toggle on={editor.lineNumbers} onClick={() => setEditor(s => ({ ...s, lineNumbers: !s.lineNumbers }))}/></Row>
            <Row label="Vim key bindings"><Toggle on={editor.vim} onClick={() => setEditor(s => ({ ...s, vim: !s.vim }))}/></Row>
          </>)}

          {section === "appearance" && (<>
            <h2>Appearance</h2>
            <p className="st-sub">These apply instantly and persist across visits.</p>
            <Field label="Theme"><Seg value={appearance.theme} onChange={v => setAppearance({ theme: v as "dark" | "light" })} options={[{ v: "dark", l: "Dark" }, { v: "light", l: "Light" }]}/></Field>
            <Field label="Card style"><Seg value={appearance.card} onChange={v => setAppearance({ card: v as CardStyle })} options={[{ v: "glass", l: "Glass" }, { v: "solid", l: "Solid" }, { v: "outlined", l: "Outlined" }]}/></Field>
            <Field label="Corner radius"><Seg value={appearance.radius} onChange={v => setAppearance({ radius: v as RadiusStyle })} options={[{ v: "sharp", l: "Sharp" }, { v: "rounded", l: "Rounded" }, { v: "pill", l: "Pill" }]}/></Field>
          </>)}

          {section === "account" && (<>
            <h2>Account</h2>
            <p className="st-sub">Your public identity and login.</p>
            <Field label="Full name"><input className="input" defaultValue={user.name}/></Field>
            <Field label="Handle"><input className="input" defaultValue="alexp"/></Field>
            <Field label="Email"><input className="input" type="email" defaultValue={user.email}/></Field>
            <Field label="City"><input className="input" defaultValue={user.city}/></Field>
            <Field label="Password"><input className="input" type="password" defaultValue="password"/></Field>
            <div className="st-actions"><button className="btn btn-primary">Save changes</button></div>
          </>)}

          {section === "notifs" && (<>
            <h2>Notifications</h2>
            <p className="st-sub">Choose what shows up in your bell.</p>
            {notifRows.map(([k, l]) => (
              <Row key={k} label={l}><Toggle on={notifs[k]} onClick={() => setNotifs(s => ({ ...s, [k]: !s[k] }))}/></Row>
            ))}
            <Row label="Weekly email digest"><Toggle on={notifs.email} onClick={() => setNotifs(s => ({ ...s, email: !s.email }))}/></Row>
          </>)}

          {section === "privacy" && (<>
            <h2>Privacy</h2>
            <p className="st-sub">Control what others can see.</p>
            <Row label="Public profile"><Toggle on={privacy.publicProfile} onClick={() => setPrivacy(s => ({ ...s, publicProfile: !s.publicProfile }))}/></Row>
            <Row label="Show me on the leaderboard"><Toggle on={privacy.showLeaderboard} onClick={() => setPrivacy(s => ({ ...s, showLeaderboard: !s.showLeaderboard }))}/></Row>
            <Row label="Make my submissions public"><Toggle on={privacy.publicSubs} onClick={() => setPrivacy(s => ({ ...s, publicSubs: !s.publicSubs }))}/></Row>
          </>)}

          {section === "danger" && (<>
            <h2 className="st-danger-h">Danger zone</h2>
            <p className="st-sub">Irreversible and destructive actions.</p>
            <div className="st-danger-box">
              <div><div className="strong">Sign out everywhere</div><div className="t-sm dim">End all active sessions on other devices.</div></div>
              <button className="btn btn-secondary" onClick={() => router.push("/login")}>Sign out</button>
            </div>
            <div className="st-danger-box">
              <div><div className="strong">Delete account</div><div className="t-sm dim">Permanently remove your account and all data.</div></div>
              <button className="btn st-delete">Delete</button>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
