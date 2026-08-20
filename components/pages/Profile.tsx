"use client";

import { useRouter } from "next/navigation";
import { Avatar, Icon, EmptyState } from "@/components/ui";
import { VerdictBadge } from "@/components/submissions/VerdictBadge";
import { useApp } from "@/components/providers/AppProvider";
import { getUserByHandle, submissionsByUser } from "@/lib/mock";
import { formatDate } from "@/lib/data";

const HEAT = ['rgba(124,240,63,.06)', 'rgba(84,232,23,.22)', 'rgba(84,232,23,.45)', 'rgba(84,232,23,.7)', '#7cf03f'];

/** Deterministic 12-week activity intensities (SSR-safe: sin of handle-seeded index). */
function activity(handle: string): number[] {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) & 0xffff;
  const out: number[] = [];
  for (let i = 0; i < 84; i++) {
    const v = Math.abs(Math.sin((i + 1) * ((h % 13) + 3) * 0.35));
    out.push(Math.floor(v * 5) % 5);
  }
  return out;
}

export function Profile({ handle }: { handle: string }) {
  const router = useRouter();
  const { currentHandle } = useApp();
  const u = getUserByHandle(handle);

  if (!u) {
    return (
      <div className="container pf-notfound">
        <EmptyState glyph="404" title="User not found"
          description={`No member with handle @${handle}.`}
          action={<button className="btn btn-secondary" onClick={() => router.push('/leaderboard')}>Back to leaderboard</button>}/>
      </div>
    );
  }

  const isOwn = handle === currentHandle;
  const subs = submissionsByUser(handle).slice(0, 6);
  const cells = activity(handle);
  const maxTopic = Math.max(1, ...u.solvedByTopic.map(t => t.count));
  const stats = [
    { n: u.solved.toLocaleString(), l: 'Solved', g: true },
    { n: u.submissionCount.toLocaleString(), l: 'Submissions' },
    { n: u.acceptance + '%', l: 'Acceptance' },
    { n: u.xp.toLocaleString(), l: 'XP' },
    { n: String(u.bestStreak), l: 'Best streak' },
  ];

  return (
    <div className="pf container-wide">
      <div className="pf-hero hud is-glow">
        <span className="hud-corners"></span>
        <Avatar initial={u.initial} hue={u.hue} size="xl"/>
        <div className="pf-id">
          <h1>{u.name}</h1>
          <div className="pf-handle mono">@{u.handle} · {u.city}</div>
          <div className="pf-sub mono">
            <span><Icon name="calendar" size={13}/> Joined {formatDate(u.joinedAt, { month: 'short', year: 'numeric' })}</span>
            <span><Icon name="fire" size={13}/> {u.streak}-day streak</span>
            <span><Icon name="trophy" size={13}/> Global #{u.rank}</span>
          </div>
        </div>
        <div className="pf-lvl"><span className="pf-lvl-l">LEVEL</span><span className="pf-lvl-n mono">{u.level}</span></div>
        {isOwn && <button className="btn btn-secondary pf-edit" onClick={() => router.push('/settings')}><Icon name="settings" size={14}/> Edit profile</button>}
      </div>

      <div className="pf-stats">
        {stats.map(s => (
          <div key={s.l} className="pf-stat">
            <div className={"pf-stat-n mono" + (s.g ? ' brand-fg' : '')}>{s.n}</div>
            <div className="pf-stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="pf-card">
        <div className="pf-card-h">Activity — last 12 weeks</div>
        <div className="pf-heat">{cells.map((c, i) => <span key={i} className="pf-hc" style={{ background: HEAT[c] }}/>)}</div>
      </div>

      <div className="pf-cols">
        <div className="pf-card">
          <div className="pf-card-h">Recent submissions</div>
          {subs.length ? subs.map(s => (
            <div key={s.id} className="pf-srow" onClick={() => router.push('/submissions/' + s.id)}>
              <VerdictBadge v={s.verdict}/>
              <span className="pf-srow-title">{s.problemTitle}</span>
              <span className="mono dim">{s.verdict === 'PENDING' ? '—' : s.score} · {formatDate(s.submittedAt, { month: 'short', day: 'numeric' })}</span>
            </div>
          )) : <div className="pf-empty">No submissions yet.</div>}
        </div>
        <div className="pf-side">
          <div className="pf-card">
            <div className="pf-card-h">Solved by topic</div>
            {u.solvedByTopic.slice(0, 5).map(t => (
              <div key={t.topic} className="pf-topic">
                <div className="pf-topic-h"><span>{t.topic}</span><span className="mono dim">{t.count}</span></div>
                <div className="pf-bar"><i style={{ width: (t.count / maxTopic * 100) + '%' }}/></div>
              </div>
            ))}
          </div>
          <div className="pf-card">
            <div className="pf-card-h">Badges</div>
            {u.badges.length ? u.badges.map((b, i) => (
              <div key={i} className="pf-badge"><span className="pf-badge-em">{b.emoji}</span> {b.label}</div>
            )) : <div className="pf-empty">No badges yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
