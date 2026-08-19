"use client";
import { Icon } from "@/components/ui";
import { CodePane } from "@/components/code/CodePane";
import type { Language } from "@/lib/types";

export function SourceModal({ code, language, onClose }: { code: string; language: Language; onClose: () => void }) {
  return (
    <div className="pb-modal-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pb-modal hud is-glow">
        <span className="hud-corners"></span>
        <div className="pb-modal-h">
          <h3>Submission Source Code</h3>
          <button className="pb-modal-x" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <div className="pb-modal-sub">
          <span className="mono">Language: <b>{language}</b></span>
          <button className="pb-copy"><Icon name="doc" size={12}/> Copy</button>
        </div>
        <CodePane code={code} className="pb-modal-code"/>
      </div>
    </div>
  );
}
