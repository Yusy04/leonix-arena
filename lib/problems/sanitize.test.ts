import { describe, it, expect } from "vitest";
import { sanitizeStatement } from "@/lib/problems/sanitize";

describe("sanitizeStatement", () => {
  it("keeps allowed formatting", () => {
    const out = sanitizeStatement("<p>Hello <strong>world</strong></p><ul><li>a</li></ul><pre><code>x</code></pre>");
    expect(out).toContain("<strong>world</strong>");
    expect(out).toContain("<li>a</li>");
    expect(out).toContain("<pre>");
  });

  it("strips inline color/styles so the theme controls colors", () => {
    const out = sanitizeStatement('<p style="color:red;background:blue">x</p>');
    expect(out).not.toContain("style");
    expect(out).not.toContain("red");
  });

  it("strips class attributes (no color classes)", () => {
    expect(sanitizeStatement('<p class="danger">x</p>')).not.toContain("class");
  });

  it("removes scripts and event handlers", () => {
    const out = sanitizeStatement('<p onclick="alert(1)">x</p><script>alert(2)</script>');
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
  });

  it("allows http/relative image src but drops data: URIs", () => {
    expect(sanitizeStatement('<img src="/api/problems/x/images/a.png">')).toContain("/api/problems/x/images/a.png");
    expect(sanitizeStatement('<img src="https://x.com/a.png">')).toContain("https://x.com/a.png");
    expect(sanitizeStatement('<img src="data:image/png;base64,AAAA">')).not.toContain("data:");
  });

  it("forces links to open safely", () => {
    const out = sanitizeStatement('<a href="https://x.com">l</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });
});
