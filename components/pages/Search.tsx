"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";

interface Results {
  problems: { code: string; title: string; difficulty: number; tags: string[]; editorialOpen: boolean }[];
  users: { handle: string; name: string; initial: string; hue: number }[];
}

export function SearchResultsPage({ q, results }: { q: string; results: Results }) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState("all");
  const total = results.problems.length + results.users.length;

  const submit = (e: React.FormEvent) => { e.preventDefault(); router.push("/search?q=" + encodeURIComponent(query.trim())); };
  const showProblems = tab === "all" || tab === "problems";
  const showUsers = tab === "all" || tab === "users";

  return (
    <div className="container-narrow sr">
      <div className="page-header"><span className="eyebrow">// search</span><h1>Search</h1></div>

      <form className="sr-input" onSubmit={submit}>
        <Icon name="search" size={18}/>
        <input autoFocus placeholder="Search problems and users…" value={query} onChange={e => setQuery(e.target.value)}/>
      </form>

      {q.trim() === "" ? (
        <div className="sr-hint">Type a query and press Enter to search across problems and users.</div>
      ) : (
        <>
          <div className="tabs sr-tabs">
            <button className={"tab" + (tab === "all" ? " is-active" : "")} onClick={() => setTab("all")}>All {total}</button>
            <button className={"tab" + (tab === "problems" ? " is-active" : "")} onClick={() => setTab("problems")}>Problems {results.problems.length}</button>
            <button className={"tab" + (tab === "users" ? " is-active" : "")} onClick={() => setTab("users")}>Users {results.users.length}</button>
          </div>

          {total === 0 && <div className="sr-hint">No results for &ldquo;{q}&rdquo;.</div>}

          <div className="card sr-list">
            {showProblems && results.problems.map(p => (
              <button key={p.code} className="sr-row" onClick={() => router.push("/problem/" + p.code)}>
                <Icon name="code" size={16}/>
                <span className="sr-row-main">{p.title} <span className="dim mono">{p.tags.join(", ")}</span></span>
                <span className={"diff-badge diff-" + p.difficulty}>L{p.difficulty}</span>
                <span className="sr-row-meta mono">{p.editorialOpen ? "editorial" : "—"}</span>
              </button>
            ))}
            {showUsers && results.users.map(u => (
              <button key={u.handle} className="sr-row" onClick={() => router.push("/u/" + u.handle)}>
                <Avatar initial={u.initial} hue={u.hue} size="sm"/>
                <span className="sr-row-main">{u.name} <span className="dim mono">@{u.handle}</span></span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
