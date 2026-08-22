"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import type { Role } from "@/lib/types";

interface Row {
  code: string;
  title: string;
  status: string;
  visibility: string;
  difficulty: number;
  owner: string;
  updatedAt: string;
}

export function ProblemsAdmin({ problems, role }: { problems: Row[]; role: Role }) {
  const router = useRouter();
  return (
    <div className="adm container-wide">
      <div className="page-header">
        <span className="eyebrow">// authoring</span>
        <div className="row-between" style={{ flexWrap: "wrap", gap: 16 }}>
          <div className="stack-2">
            <h1>Problems</h1>
            <p className="subtitle">{role === "ADMIN" ? "All problems." : "Problems you created."} Create, edit, and publish.</p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push("/admin/problems/new")}><Icon name="plus" size={14}/> New problem</button>
        </div>
      </div>

      <div className="adm-table-wrap hud">
        <span className="hud-corners"></span>
        <table className="adm-table">
          <thead><tr><th>Code</th><th>Title</th><th>Status</th><th>Visibility</th><th>Diff</th><th>Owner</th><th>Updated</th></tr></thead>
          <tbody>
            {problems.map(p => (
              <tr key={p.code} onClick={() => router.push("/admin/problems/" + p.code)} className="adm-row">
                <td className="mono">{p.code}</td>
                <td>{p.title}</td>
                <td><span className={"adm-badge st-" + p.status.toLowerCase()}>{p.status}</span></td>
                <td className="mono dim">{p.visibility}</td>
                <td className="mono">{p.difficulty}</td>
                <td className="mono dim">@{p.owner}</td>
                <td className="mono dim">{new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
              </tr>
            ))}
            {problems.length === 0 && <tr><td colSpan={7} className="adm-empty">No problems yet. Create your first one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
