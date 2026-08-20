"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/providers/AppProvider";
import { NOTIF_ICON } from "@/components/notifications/meta";
import { formatDate, formatTime } from "@/lib/data";
import type { Notification } from "@/lib/types";

const TABS: { key: string; label: string; test: (n: Notification) => boolean }[] = [
  { key: "all",    label: "All",    test: () => true },
  { key: "unread", label: "Unread", test: n => !n.read },
  { key: "judged", label: "Judged", test: n => n.type === "judged" },
  { key: "social", label: "Social", test: n => n.type === "rank" || n.type === "badge" },
];

export function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useApp();
  const [tab, setTab] = useState("all");
  const active = TABS.find(t => t.key === tab)!;
  const rows = notifications.filter(active.test);

  const open = (n: Notification) => { markRead(n.id); router.push(n.href); };

  return (
    <div className="container-narrow nt">
      <div className="page-header">
        <span className="eyebrow">// notifications</span>
        <div className="row-between" style={{ flexWrap: "wrap", gap: 16 }}>
          <h1>Notifications</h1>
          <button className="btn btn-ghost btn-sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <Icon name="check" size={14}/> Mark all read
          </button>
        </div>
      </div>

      <div className="tabs nt-tabs">
        {TABS.map(t => (
          <button key={t.key} className={"tab" + (tab === t.key ? " is-active" : "")} onClick={() => setTab(t.key)}>
            {t.label}{t.key === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      <div className="card nt-list">
        {rows.length ? rows.map(n => (
          <button key={n.id} className={"nt-row" + (n.read ? "" : " is-unread")} onClick={() => open(n)}>
            <span className="nt-ic"><Icon name={NOTIF_ICON[n.type]} size={16}/></span>
            <span className="nt-body">
              <span className="nt-text">{n.text}</span>
              <span className="nt-time mono">{formatDate(n.at, { month: "short", day: "numeric" })} · {formatTime(n.at)}</span>
            </span>
            <Icon name="chev-r" size={14} className="nt-chev"/>
          </button>
        )) : <div className="nt-empty">Nothing here yet.</div>}
      </div>
    </div>
  );
}
