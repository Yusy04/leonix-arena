"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import type { Extension } from "@codemirror/state";

// CodeMirror touches the DOM on init, so load the React wrapper client-only.
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

/**
 * Editor chrome, themed entirely from the design tokens so it matches the rest
 * of the app (and follows light/dark). CodeMirror injects these declarations as
 * a stylesheet, and `var(--…)` resolves against the normal cascade.
 */
const arenaTheme = EditorView.theme({
  "&": { background: "transparent", color: "var(--fg)", fontSize: "13px" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.5" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--brand-400)" },
  ".cm-gutters": { background: "transparent", border: "none", color: "#4e6048" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 14px", minWidth: "26px" },
  ".cm-activeLine": { background: "var(--brand-glow-soft)" },
  ".cm-activeLineGutter": { background: "var(--brand-glow-soft)", color: "var(--brand-300)" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "var(--brand-400)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    background: "rgba(84,232,23,0.18)",
  },
  ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
    background: "rgba(84,232,23,0.16)", color: "inherit", outline: "1px solid var(--border-brand)",
  },
  ".cm-placeholder": { color: "var(--fg-dim)" },
}, { dark: true });

// Token colours reuse the exact palette from the original highlighter.
const arenaHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: "#7cf03f" },
  { tag: [t.string, t.special(t.string), t.character], color: "#e8a85c" },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: "#5f7a54", fontStyle: "italic" },
  { tag: [t.number, t.integer, t.float, t.bool, t.null], color: "#58c8d8" },
  { tag: [t.macroName, t.meta, t.processingInstruction], color: "#b88af0" },
  { tag: [t.typeName, t.className, t.namespace], color: "#88c0f0" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#d2dccb" },
  { tag: [t.operator, t.punctuation, t.bracket, t.separator], color: "#96a68c" },
  { tag: [t.variableName, t.propertyName, t.attributeName], color: "var(--fg)" },
]);

const LANG_EXTENSION: Record<string, () => Extension> = { cpp, python, java };

const BASIC_SETUP = { foldGutter: false, autocompletion: false, searchKeymap: false } as const;

export function CodeEditor({ value, onChange, className, placeholder, language }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  language?: string;
}) {
  const extensions = useMemo<Extension[]>(() => {
    const ext: Extension[] = [arenaTheme, syntaxHighlighting(arenaHighlight), EditorView.lineWrapping];
    const lang = language ? LANG_EXTENSION[language] ?? LANG_EXTENSION[language.toLowerCase()] : undefined;
    if (lang) ext.push(lang());
    return ext;
  }, [language]);

  return (
    <div className={"ceditor" + (className ? " " + className : "")}>
      <CodeMirror
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        extensions={extensions}
        basicSetup={BASIC_SETUP}
        indentWithTab
        theme="none"
        height="100%"
        style={{ height: "100%" }}
      />
    </div>
  );
}
