import sanitizeHtml from "sanitize-html";

/**
 * Clean author-supplied statement HTML into a safe subset. Crucially, ALL inline
 * styles and class attributes are stripped, so colors/typography always come
 * from the site theme — authors control structure/formatting, never the palette.
 * Images may only use http(s) or same-origin (relative) URLs; no data: blobs.
 */
export function sanitizeStatement(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "hr",
      "h1", "h2", "h3", "h4",
      "strong", "b", "em", "i", "u", "s", "sub", "sup",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      code: ["class"], // language-xxx from code blocks
    },
    allowedStyles: {}, // strip every inline style → colors locked to the theme
    allowedSchemes: ["http", "https", "mailto"], // relative URLs still allowed; data: not
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" } }),
    },
  });
}

export interface TranslationFields {
  statement?: string;
  inputSpec?: string | null;
  outputSpec?: string | null;
  constraints?: string | null;
  notes?: string | null;
}

/** Sanitize every rich field of a translation payload in place-safe fashion. */
export function sanitizeTranslationFields<T extends TranslationFields>(input: T): T {
  const out = { ...input };
  if (out.statement !== undefined) out.statement = sanitizeStatement(out.statement);
  if (out.inputSpec !== undefined && out.inputSpec !== null) out.inputSpec = sanitizeStatement(out.inputSpec);
  if (out.outputSpec !== undefined && out.outputSpec !== null) out.outputSpec = sanitizeStatement(out.outputSpec);
  if (out.constraints !== undefined && out.constraints !== null) out.constraints = sanitizeStatement(out.constraints);
  if (out.notes !== undefined && out.notes !== null) out.notes = sanitizeStatement(out.notes);
  return out;
}
