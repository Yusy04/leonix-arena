"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * WYSIWYG editor producing HTML. Deliberately offers NO color controls — the
 * rendered statement always uses the site theme (colors are locked). `code`
 * (the problem slug) enables inline image upload.
 */
export function RichEditor({ value, onChange, code }: { value: string; onChange: (html: string) => void; code?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ inline: false }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "pb-rich re-content" } },
  });

  if (!editor) return <div className="rich-editor"><div className="re-content re-loading">Loading editor…</div></div>;

  const upload = async (file: File) => {
    if (!code) return;
    const data = await fileToBase64(file);
    const res = await fetch(`/api/problems/${code}/images`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), data, encoding: "base64", altText: file.name }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.url) editor.chain().focus().setImage({ src: body.url, alt: file.name }).run();
  };

  const setLink = () => {
    const url = window.prompt("Link URL (blank to remove):", editor.getAttributes("link").href ?? "");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  function B({ on, click, children, title }: { on?: boolean; click: () => void; children: React.ReactNode; title: string }) {
    return <button type="button" title={title} className={"re-btn" + (on ? " on" : "")} onMouseDown={e => e.preventDefault()} onClick={click}>{children}</button>;
  }

  return (
    <div className="rich-editor">
      <div className="re-toolbar">
        <B on={editor.isActive("bold")} click={() => editor.chain().focus().toggleBold().run()} title="Bold"><b>B</b></B>
        <B on={editor.isActive("italic")} click={() => editor.chain().focus().toggleItalic().run()} title="Italic"><i>I</i></B>
        <B on={editor.isActive("strike")} click={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><s>S</s></B>
        <span className="re-sep"/>
        <B on={editor.isActive("heading", { level: 2 })} click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">H2</B>
        <B on={editor.isActive("heading", { level: 3 })} click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subheading">H3</B>
        <span className="re-sep"/>
        <B on={editor.isActive("bulletList")} click={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">•</B>
        <B on={editor.isActive("orderedList")} click={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">1.</B>
        <B on={editor.isActive("blockquote")} click={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">❝</B>
        <B on={editor.isActive("code")} click={() => editor.chain().focus().toggleCode().run()} title="Inline code">{"</>"}</B>
        <B on={editor.isActive("codeBlock")} click={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">{"{ }"}</B>
        <span className="re-sep"/>
        <B on={editor.isActive("link")} click={setLink} title="Link">🔗</B>
        {code && <>
          <B click={() => fileRef.current?.click()} title="Insert image">🖼</B>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}/>
        </>}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
