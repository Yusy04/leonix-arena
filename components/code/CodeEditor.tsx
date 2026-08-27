"use client";

import { useRef } from "react";

/**
 * A lightweight editable code surface: a line-number gutter beside a plain
 * textarea. No syntax highlighting or execution — just a dependable place to
 * write code (Tab inserts two spaces, gutter tracks the textarea's scroll).
 */
export function CodeEditor({ value, onChange, className, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(1, value.split("\n").length);

  const syncScroll = () => {
    if (gutterRef.current && taRef.current) gutterRef.current.scrollTop = taRef.current.scrollTop;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      onChange(value.slice(0, start) + "  " + value.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
  };

  return (
    <div className={"ceditor" + (className ? " " + className : "")}>
      <div className="ceditor-gutter" ref={gutterRef} aria-hidden>
        {Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}
      </div>
      <textarea
        ref={taRef}
        className="ceditor-ta"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
      />
    </div>
  );
}
