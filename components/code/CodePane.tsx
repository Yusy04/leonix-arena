/* C++ syntax highlighter + code pane, shared across the submission views. */
export function hlCpp(code: string): string[] {
  let s = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = /\b(int|long|using|namespace|return|for|while|if|else|void|const|vector|set|map|pair|sort|cin|cout|std|nullptr|main|bool|auto|struct|double|ios|sync_with_stdio|tie|begin|end|first|second|push_back|size)\b/g;
  const NUM = /\b(\d+(?:LL|ll|u|U)?)\b/g;
  const lines = s.split('\n').map(line => {
    if (/^\s*\/\//.test(line)) return '<span class="c-com">' + line + '</span>';
    if (/^\s*#/.test(line)) {
      return line.replace(/^(\s*#[a-z]+)(.*)$/, '<span class="c-pre">$1</span><span class="c-inc">$2</span>');
    }
    const parts = line.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) return '<span class="c-str">' + part + '</span>';
      let p = part.replace(/(\/\/.*)$/, '$1');
      p = p.replace(KW, '<span class="c-kw">$1</span>');
      p = p.replace(NUM, '<span class="c-num">$1</span>');
      p = p.replace(/(.*)/, '<span class="c-com">$1</span>');
      return p;
    }).join('');
  });
  return lines;
}

export function CodePane({ code, className }: { code: string; className?: string }) {
  const lines = hlCpp(code);
  return (
    <div className={'cpane' + (className ? ' ' + className : '')}>
      <div className="cpane-gutter">{lines.map((_, i) => <span key={i}>{i + 1}</span>)}</div>
      <pre className="cpane-code">{lines.map((l, i) => <div key={i} className="cline" dangerouslySetInnerHTML={{ __html: l || '​' }} />)}</pre>
    </div>
  );
}
