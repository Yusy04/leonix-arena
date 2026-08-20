"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";
import { searchAll } from "@/lib/mock";
import type { Problem, UserProfile } from "@/lib/types";

function ProblemRow({ p, onClick }: { p: Problem; onClick: () => void }) {
  return (
    <button className="sr-row" onClick={onClick}>
      <Icon name="code" size={16}/>
      <span className="sr-row-main">{p.title} <span className="dim mono">{p.tags.join(", ")}</span></span>
      <span className={"diff-badge diff-" + p.level}>L{p.level}</span>
      <span className="sr-row-meta mono">{p.editorial === "locked" ? "locked" : "editorial"}</span>
    </button>
  );
}
function UserRow({ u, onClick }: { u: UserProfile; onClick: () => void }) {
  return (
    <button className="sr-row" onClick={onClick}>
      <Avatar initial={u.initial} hue={u.hue} size="sm"/>
      <span className="sr-row-main">{u.name} <span className="dim mono">@{u.handle}</span></span>
      <span className="sr-row-meta mono">Global #{u.rank} · {u.solved} solved</span>
    </button>
  );
}

export function SearchResultsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState("all");
  // Keep the box in sync when arriving via ⌘K with a new ?q=.
  useEffect(() => { setQuery(q); }, [q]);
  const res = searchAll(query);
  const total = res.problems.length + res.users.length + res.editorials.length;

  const tabs = [
    { key: "all", label: `All ${total}` },
    { key: "problems", label: `Problems ${res.problems.length}` },
    { key: "users", label: `Users ${res.users.length}` },
    { key: "editorials", label: `Editorials ${res.editorials.length}` },
  ];
  const showProblems = tab === "all" || tab === "problems";
  const showUsers = tab === "all" || tab === "users";
  const showEditorials = tab === "all" || tab === "editorials";

  return (
    <div className="container-narrow sr">
      <div className="page-header">
        <span className="eyebrow">// search</span>
        <h1>Search</h1>
      </div>

      <div className="sr-input">
        <Icon name="search" size={18}/>
        <input autoFocus placeholder="Search problems, users, editorials…" value={query} onChange={e => setQuery(e.target.value)}/>
      </div>

      {query.trim() === "" ? (
        <div className="sr-hint">Type to search across problems, users and editorials.</div>
      ) : (
        <>
          <div className="tabs sr-tabs">
            {tabs.map(t => (
              <button key={t.key} className={"tab" + (tab === t.key ? " is-active" : "")} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>

          {total === 0 && <div className="sr-hint">No results for &ldquo;{query}&rdquo;.</div>}

          <div className="card sr-list">
            {showProblems && res.problems.map(p => (
              <ProblemRow key={p.id} p={p} onClick={() => router.push("/problem")}/>
            ))}
            {showUsers && res.users.map(u => (
              <UserRow key={u.handle} u={u} onClick={() => router.push("/u/" + u.handle)}/>
            ))}
            {showEditorials && res.editorials.map(p => (
              <button key={"ed-" + p.id} className="sr-row" onClick={() => router.push("/problem")}>
                <Icon name="doc" size={16}/>
                <span className="sr-row-main">Editorial: {p.title}</span>
                <span className="sr-row-meta mono">open</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
