"use client";

import { useState } from "react";
import { Avatar, Icon } from "@/components/ui";
import { useApp } from "@/components/providers/AppProvider";

export function Buddy() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey — I'm your Arena buddy. Stuck on a problem? I can explain a concept, suggest a warm-up, or help you debug your approach (without spoiling the solution). What are you working on?" },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setMessages(m => [...m, { role:'user', text }]);
    setDraft('');
    setBusy(true);
    try {
      const claude = (window as unknown as { claude?: { complete: (arg: unknown) => Promise<string> } }).claude;
      if (!claude) throw new Error("assistant unavailable");
      const reply = await claude.complete({
        messages: [
          { role: "user", content:
            `You are leonix Arena's AI study buddy for competitive programming. Help the student reason about algorithms and data structures. Be encouraging, concrete, and give hints rather than full solutions unless asked. Reply in 2-4 short paragraphs max. Question: ${text}` }
        ]
      });
      setMessages(m => [...m, { role:'assistant', text: reply }]);
    } catch(e) {
      setMessages(m => [...m, { role:'assistant', text: "I can't reach my brain right now — try again in a moment." }]);
    }
    setBusy(false);
  };

  const suggestions = [
    "Explain two-pointers like I'm 10",
    "Give me a warm-up problem",
    "What's the difference between two-pointer and sliding window?",
    "Quiz me on time complexity",
  ];

  return (
    <div className="container-narrow buddy-page">
      <div className="page-header">
        <div className="row gap-3">
          <div className="buddy-orb"><Icon name="sparkle" size={20}/></div>
          <div className="stack-2">
            <span className="eyebrow">// AI study buddy</span>
            <h1>Stuck? Let's work through it.</h1>
          </div>
        </div>
        <p className="subtitle">Hints on demand for any problem in the archive. Free for all leonix Arena members.</p>
      </div>

      <div className="card buddy-thread">
        <div className="buddy-msgs">
          {messages.map((m, i) => (
            <div key={i} className={'buddy-msg buddy-msg-' + m.role}>
              {m.role === 'assistant' && <div className="buddy-avatar"><Icon name="sparkle" size={12}/></div>}
              <div className="buddy-bubble">{m.text}</div>
            </div>
          ))}
          {busy && <div className="buddy-msg buddy-msg-assistant"><div className="buddy-avatar"><Icon name="sparkle" size={12}/></div><div className="buddy-bubble"><span className="typing"><span/><span/><span/></span></div></div>}
        </div>
        <div className="buddy-suggestions">
          {suggestions.map(s => <button key={s} className="tag" onClick={() => send(s)}>{s}</button>)}
        </div>
        <form className="buddy-input" onSubmit={e => { e.preventDefault(); send(draft); }}>
          <input className="input" placeholder="Ask anything about a problem…" value={draft} onChange={e => setDraft(e.target.value)}/>
          <button className="btn btn-primary" disabled={!draft.trim() || busy}><Icon name="send" size={14}/></button>
        </form>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const { user } = useApp();
  const [scope, setScope] = useState('global');
  const [period, setPeriod] = useState('week');
  const data = [
    { rank:1, name:'Andrei P.', xp: 12480, hue: 200, you: false, badge:'∞' },
    { rank:2, name:'Maria S.',  xp: 11920, hue: 320, you: false, badge:'★' },
    { rank:3, name:'Vlad I.',   xp: 10310, hue:  80, you: false, badge:'★' },
    { rank:4, name:'Ana C.',    xp:  9870, hue: 280, you: false, badge:'' },
    { rank:5, name:'Mihai R.',  xp:  9540, hue: 140, you: false, badge:'' },
    { rank:6, name: user.name,  xp: user.xp, hue: user.hue, you: true,  badge:'' },
    { rank:7, name:'Diana V.',  xp:  4120, hue:  10, you: false, badge:'' },
    { rank:8, name:'Cristi B.', xp:  3960, hue: 160, you: false, badge:'' },
  ];
  return (
    <div className="container-narrow">
      <div className="page-header">
        <span className="eyebrow">// leaderboard</span>
        <h1>Where you stand</h1>
        <p className="subtitle">XP from accepted submissions, solved problems and daily streaks. Resets weekly.</p>
      </div>
      <div className="row gap-3" style={{marginBottom: 16, flexWrap:'wrap'}}>
        <div className="tabs">
          <button className={'tab' + (scope==='global'?' is-active':'')} onClick={() => setScope('global')}>Global</button>
          <button className={'tab' + (scope==='country'?' is-active':'')} onClick={() => setScope('country')}>Romania</button>
          <button className={'tab' + (scope==='friends'?' is-active':'')} onClick={() => setScope('friends')}>Friends</button>
        </div>
        <div className="tabs">
          <button className={'tab' + (period==='week'?' is-active':'')} onClick={() => setPeriod('week')}>Week</button>
          <button className={'tab' + (period==='month'?' is-active':'')} onClick={() => setPeriod('month')}>Month</button>
          <button className={'tab' + (period==='all'?' is-active':'')} onClick={() => setPeriod('all')}>All time</button>
        </div>
      </div>

      <div className="podium">
        {[data[1], data[0], data[2]].map((p, i) => {
          const cls = ['silver','gold','bronze'][i];
          const heights = [120, 160, 100];
          return (
            <div key={p.rank} className={'podium-col podium-' + cls}>
              <Avatar initial={p.name[0]} hue={p.hue} size="lg"/>
              <div className="strong">{p.name}</div>
              <div className="t-xs mono dim">{p.xp.toLocaleString()} XP</div>
              <div className="podium-block" style={{height: heights[i]}}>
                <span className="mono podium-rank">{p.rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th style={{width:60}}>#</th><th>Member</th><th>XP</th><th>Streak</th><th>Solved</th></tr></thead>
          <tbody>
            {data.map(p => (
              <tr key={p.rank} className={p.you ? 'is-you' : ''}>
                <td className="mono strong">{p.rank}</td>
                <td><div className="row gap-2"><Avatar initial={p.name[0]} hue={p.hue} size="sm"/><span>{p.name} {p.badge && <span className="brand-fg mono">{p.badge}</span>}{p.you && <span className="badge is-success" style={{marginLeft:6}}>you</span>}</span></div></td>
                <td className="mono">{p.xp.toLocaleString()}</td>
                <td className="mono">{12 - p.rank}d</td>
                <td className="mono">{140 - p.rank * 8}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
