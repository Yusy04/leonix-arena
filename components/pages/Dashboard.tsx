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

export function QRPage() {
  const { user } = useApp();
  return (
    <div className="container">
      <div className="qr-page">
        <div className="page-header" style={{padding:'40px 0 16px'}}>
          <span className="eyebrow">// member check-in</span>
          <h1>Your check-in QR</h1>
          <p className="subtitle">Show this code at on-site contests and events to be marked present. Brightness will auto-max when you open this page from a reminder.</p>
        </div>
        <div className="qr-card">
          <div className="qr-code-wrap">
            <FakeQR seed={user.qrCode}/>
          </div>
          <div className="qr-side stack-4">
            <div>
              <div className="t-xs mono dim uppercase">Code</div>
              <div className="strong mono" style={{fontSize:18, letterSpacing:'0.08em'}}>{user.qrCode}</div>
            </div>
            <div>
              <div className="t-xs mono dim uppercase">Member</div>
              <div className="strong">{user.name}</div>
              <div className="t-sm dim mono">{user.email}</div>
            </div>
            <div>
              <div className="t-xs mono dim uppercase">City</div>
              <div className="strong">{user.city}</div>
            </div>
            <button className="btn btn-secondary btn-block">Download QR</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FakeQR({ seed }: { seed: string }) {
  // generate deterministic 25x25 grid
  const size = 25;
  let h = 0; for (let i=0;i<seed.length;i++) h = (h*31 + seed.charCodeAt(i)) >>> 0;
  const cells = [];
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    h = (h * 16807) % 2147483647;
    const fill = (h % 100) < 48;
    // finder patterns
    const inFinder = (x<7&&y<7) || (x>=size-7&&y<7) || (x<7&&y>=size-7);
    const finderRing = inFinder && (
      (x===0||x===6||y===0||y===6 ||
       (x===size-1)||(x===size-7)||(y===size-7)||(y===size-1)) ||
      ((x>=2&&x<=4&&y>=2&&y<=4) || (x>=size-5&&x<=size-3&&y>=2&&y<=4) || (x>=2&&x<=4&&y>=size-5&&y<=size-3))
    );
    cells.push({x,y, on: inFinder ? finderRing : fill});
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="qr-svg" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#0a0e0c"/>
      {cells.filter(c => c.on).map((c,i) => (
        <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="url(#qrgrad)"/>
      ))}
      <defs>
        <linearGradient id="qrgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#aee0af"/>
          <stop offset="1" stopColor="#71c873"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
