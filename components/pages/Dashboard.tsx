"use client";

import { useRouter } from "next/navigation";
import { HexChip, Icon, ProgressRing, Section } from "@/components/ui";
import { useApp } from "@/components/providers/AppProvider";
import { formatDate } from "@/lib/data";

export interface DashboardData {
  solved: number;
  submissionCount: number;
  recent: { id: string; verdict: string; score: number; language: string; problemCode: string; problemTitle: string; submittedAt: string }[];
  recommended: { code: string; title: string; difficulty: number; tag: string }[];
}

export function Dashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { user } = useApp();
  const recentSubs = data.recent;
  const recommended = data.recommended;
  const verdictClass = (v: string) => v === 'AC' ? 'is-success' : (v === 'TLE' ? 'is-warning' : 'is-danger');

  return (
    <div className="container-wide">
      <div className="page-header">
        <span className="eyebrow">// dashboard</span>
        <div className="row-between" style={{flexWrap:'wrap', gap:16}}>
          <div className="stack-2">
            <h1>Welcome back, {user.name.split(' ')[0]}</h1>
            <p className="subtitle">{user.streak}-day streak · level {user.level} · {user.xp.toLocaleString()} XP</p>
          </div>
          <div className="row gap-3">
            <button className="btn btn-secondary" onClick={() => router.push('/buddy')}><Icon name="sparkle" size={14}/> AI buddy</button>
            <button className="btn btn-primary" onClick={() => router.push('/archive')}><Icon name="target" size={14}/> Solve a problem</button>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="stack-6" style={{minWidth:0}}>
          {/* Recent submissions */}
          <Section eyebrow="// recent" title="Your latest submissions"
            action={<button className="btn btn-ghost btn-sm" onClick={() => router.push('/archive')}>Open archive</button>}>
            <div className="card">
              {recentSubs.map(s => (
                <div key={s.id} className="upcoming-row" onClick={() => router.push('/submissions/' + s.id)} style={{cursor:'pointer'}}>
                  <div className="upcoming-date">
                    <ProgressRing percent={s.verdict === 'PENDING' ? 0 : s.score} size={48}/>
                  </div>
                  <div className="upcoming-body">
                    <div className="row gap-2"><span className={'badge ' + verdictClass(s.verdict)}>{s.verdict}</span><span className="t-xs dim mono">{s.language}</span></div>
                    <div className="strong" style={{marginTop:6}}>{s.problemTitle}</div>
                    <div className="t-xs dim mono">{s.verdict === 'PENDING' ? '—' : s.score + '/100'} · {formatDate(s.submittedAt, { month: 'short', day: 'numeric' })}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm">{s.verdict === 'AC' ? 'Review' : 'Retry'}</button>
                </div>
              ))}
            </div>
          </Section>

          {/* Recommended problems */}
          <Section eyebrow="// recommended for you" title="Problems to try next">
            <div className="stack-3">
              {recommended.map(r => (
                <div key={r.code} className="card is-interactive cont-row" onClick={() => router.push('/problem/' + r.code)}>
                  <span className={'diff-badge diff-' + r.difficulty}>{r.difficulty}</span>
                  <div className="stack-2" style={{flex:1, minWidth:0}}>
                    <div className="t-xs mono dim uppercase">{r.tag || 'problem'}</div>
                    <div className="strong" style={{fontSize:18}}>{r.title}</div>
                  </div>
                  <button className="btn btn-primary btn-sm">Solve <Icon name="arrow-r" size={12}/></button>
                </div>
              ))}
              {recommended.length === 0 && <div className="card card-body t-sm dim">You&apos;ve attempted everything available — nice.</div>}
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="dash-side stack-6">
          <div className="card card-body stack-3">
            <div className="row-between"><div className="t-xs mono dim uppercase">XP this week</div><span className="brand-fg t-xs mono">+ 320</span></div>
            <div className="strong mono" style={{fontSize:32}}>{user.xp.toLocaleString()}</div>
            <div className="progress is-thick"><div className="progress-bar" style={{width: `${user.xp/user.xpNext*100}%`}}/></div>
            <div className="t-xs dim mono">{user.xpNext - user.xp} XP to level {user.level + 1}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/leaderboard')}><Icon name="trophy" size={12}/> Leaderboard</button>
          </div>

          <div className="card card-body stack-4">
            <div className="t-xs mono dim uppercase">This week</div>
            <div className="stack-3">
              <div className="wallet">
                <HexChip value={user.streak} unit="DAY" size="md"/>
                <div className="wallet-meta">
                  <div className="wallet-name">Current streak</div>
                  <div className="wallet-bal">Keep it alive — solve one today</div>
                </div>
              </div>
              <div className="wallet">
                <HexChip value={data.solved} unit="AC" size="md"/>
                <div className="wallet-meta">
                  <div className="wallet-name">Problems solved</div>
                  <div className="wallet-bal">{data.submissionCount} total submissions</div>
                </div>
              </div>
            </div>
            <button className="btn btn-secondary btn-block btn-sm" onClick={() => router.push('/archive')}><Icon name="target" size={12}/> Browse problems</button>
          </div>

          <div className="card card-body stack-3">
            <div className="t-xs mono dim uppercase">Need a hint?</div>
            <p className="t-sm muted">Your AI buddy knows every problem in the archive and gives hints without spoiling the solution.</p>
            <button className="btn btn-primary btn-block btn-sm" onClick={() => router.push('/buddy')}><Icon name="sparkle" size={12}/> Ask the AI buddy</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
