"use client";

import { useRouter } from "next/navigation";
import { Avatar, Icon, EmptyState } from "@/components/ui";
import { VerdictBadge } from "@/components/submissions/VerdictBadge";
import { useApp } from "@/components/providers/AppProvider";
import { formatDate } from "@/lib/data";
import type { Verdict } from "@/lib/types";

export interface ProfileData {
  handle: string;
  name: string;
  initial: string;
  hue: number;
  city: string;
  joinedAt: string;
  role: string;
  solved: number;
  submissionCount: number;
  acceptance: number;
  recent: { id: string; verdict: string; score: number; problemCode: string; problemTitle: string; submittedAt: string }[];
  solvedByTopic: { topic: string; count: number }[];
}

const HEAT = ["rgba(124,240,63,.06)", "rgba(84,232,23,.22)", "rgba(84,232,23,.45)", "rgba(84,232,23,.7)", "#7cf03f"];
function activity(handle: string): number[] {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) & 0xffff;
  const out: number[] = [];
  for (let i = 0; i < 84; i++) out.push(Math.floor(Math.abs(Math.sin((i + 1) * ((h % 13) + 3) * 0.35)) * 5) % 5);
  return out;
}

export function Profile({ profile }: { profile: ProfileData | null }) {
  const router = useRouter();
  const { authUser } = useApp();

  if (!profile) {
    return (
      <div className="container pf-notfound">
        <EmptyState glyph="404" title="User not found" description="No member with that handle."
          action={<button className="btn btn-secondary" onClick={() => router.push("/leaderboard")}>Back to leaderboard</button>}/>
      </div>
    );
  }

  const isOwn = profile.handle === authUser?.handle;
  const cells = activity(profile.handle);
  const maxTopic = Math.max(1, ...profile.solvedByTopic.map(t => t.count));
  const badges = [
    { emoji: "✅", label: `${profile.solved} solved` },
    { emoji: "🎯", label: `${profile.acceptance}% acceptance` },
    { emoji: "📨", label: `${profile.submissionCount} submissions` },
  ];
  const stats = [
    { n: profile.solved.toLocaleString(), l: "Solved", g: true },
    { n: profile.submissionCount.toLocaleString(), l: "Submissions" },
    { n: profile.acceptance + "%", l: "Acceptance" },
    { n: profile.role.toLowerCase(), l: "Role" },
  ];

  return (
    <div className="pf container-wide">
      <div className="pf-hero hud is-glow">
        <span className="hud-corners"></span>
        <Avatar initial={profile.initial} hue={profile.hue} size="xl"/>
        <div className="pf-id">
          <h1>{profile.name}</h1>
          <div className="pf-handle mono">@{profile.handle}{profile.city ? " · " + profile.city : ""}</div>
          <div className="pf-sub mono"><span><Icon name="calendar" size={13}/> Joined {formatDate(profile.joinedAt, { month: "short", year: "numeric" })}</span></div>
        </div>
        {isOwn && <button className="btn btn-secondary pf-edit" onClick={() => router.push("/settings")}><Icon name="settings" size={14}/> Edit profile</button>}
      </div>

      <div className="pf-stats">
        {stats.map(s => <div key={s.l} className="pf-stat"><div className={"pf-stat-n mono" + (s.g ? " brand-fg" : "")}>{s.n}</div><div className="pf-stat-l">{s.l}</div></div>)}
      </div>

      <div className="pf-card">
        <div className="pf-card-h">Activity — last 12 weeks</div>
        <div className="pf-heat">{cells.map((c, i) => <span key={i} className="pf-hc" style={{ background: HEAT[c] }}/>)}</div>
      </div>

      <div className="pf-cols">
        <div className="pf-card">
          <div className="pf-card-h">Recent submissions</div>
          {profile.recent.length ? profile.recent.map(s => (
            <div key={s.id} className="pf-srow" onClick={() => router.push("/submissions/" + s.id)}>
              <VerdictBadge v={s.verdict as Verdict}/>
              <span className="pf-srow-title">{s.problemTitle}</span>
              <span className="mono dim">{s.verdict === "PENDING" ? "—" : s.score} · {formatDate(s.submittedAt, { month: "short", day: "numeric" })}</span>
            </div>
          )) : <div className="pf-empty">No submissions yet.</div>}
        </div>
        <div className="pf-side">
          <div className="pf-card">
            <div className="pf-card-h">Solved by topic</div>
            {profile.solvedByTopic.length ? profile.solvedByTopic.map(t => (
              <div key={t.topic} className="pf-topic">
                <div className="pf-topic-h"><span>{t.topic}</span><span className="mono dim">{t.count}</span></div>
                <div className="pf-bar"><i style={{ width: (t.count / maxTopic * 100) + "%" }}/></div>
              </div>
            )) : <div className="pf-empty">Nothing solved yet.</div>}
          </div>
          <div className="pf-card">
            <div className="pf-card-h">Badges</div>
            {badges.map((b, i) => <div key={i} className="pf-badge"><span className="pf-badge-em">{b.emoji}</span> {b.label}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
