/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Icons ----------
function Icon({ name, size = 16, stroke = 1.6, className }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    className,
  };
  switch (name) {
    case 'home':     return <svg {...props}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case 'shop':     return <svg {...props}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M9 6V4a3 3 0 0 1 6 0v2"/></svg>;
    case 'calendar': return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'book':     return <svg {...props}><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v18H5.5A1.5 1.5 0 0 1 4 19.5V4.5z"/><path d="M4 17h16"/></svg>;
    case 'qr':       return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v3M14 21h7M17 17v4"/></svg>;
    case 'user':     return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case 'search':   return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>;
    case 'bell':     return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'menu':     return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'close':    return <svg {...props}><path d="M6 6l12 12M18 6l-12 12"/></svg>;
    case 'check':    return <svg {...props}><path d="M5 12l4 4 10-10"/></svg>;
    case 'lock':     return <svg {...props}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'play':     return <svg {...props}><path d="M7 4l13 8-13 8z"/></svg>;
    case 'arrow-r':  return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-l':  return <svg {...props}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case 'arrow-up-r':return <svg {...props}><path d="M7 17L17 7M9 7h8v8"/></svg>;
    case 'plus':     return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':    return <svg {...props}><path d="M5 12h14"/></svg>;
    case 'chev-d':   return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'chev-r':   return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case 'video':    return <svg {...props}><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2z"/></svg>;
    case 'pin':      return <svg {...props}><path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'clock':    return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'users':    return <svg {...props}><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a6 6 0 0 0-6-6"/></svg>;
    case 'sparkle':  return <svg {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2"/><circle cx="12" cy="12" r="2"/></svg>;
    case 'fire':     return <svg {...props}><path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-2 2-2 5a6 6 0 0 0 12 0c0-7-7-10-7-10z"/></svg>;
    case 'trophy':   return <svg {...props}><path d="M8 4h8v6a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3"/><path d="M10 16h4M9 20h6"/></svg>;
    case 'code':     return <svg {...props}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>;
    case 'sigma':    return <svg {...props}><path d="M18 5H6l6 7-6 7h12"/></svg>;
    case 'lang':     return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'web':      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'filter':   return <svg {...props}><path d="M4 5h16l-6 8v6l-4-2v-4z"/></svg>;
    case 'star':     return <svg {...props}><path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>;
    case 'message':  return <svg {...props}><path d="M21 15a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/></svg>;
    case 'send':     return <svg {...props}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>;
    case 'heart':    return <svg {...props}><path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>;
    case 'bookmark': return <svg {...props}><path d="M6 3h12v18l-6-4-6 4z"/></svg>;
    case 'logout':   return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'wallet':   return <svg {...props}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 14h2"/></svg>;
    case 'flag':     return <svg {...props}><path d="M4 21V4h13l-2 5 2 5H4"/></svg>;
    case 'doc':      return <svg {...props}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>;
    case 'mic':      return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case 'grid':     return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case 'target':   return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>;
    case 'brain':    return <svg {...props}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 6 .5V5a3 3 0 0 0-1-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-6 .5"/></svg>;
    case 'briefcase':return <svg {...props}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>;
    case 'chart':    return <svg {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>;
    case 'paw':      return <svg {...props}><circle cx="7" cy="9" r="1.8"/><circle cx="12" cy="7" r="1.8"/><circle cx="17" cy="9" r="1.8"/><circle cx="19" cy="14" r="1.6"/><path d="M12 12c-3 0-5 2.2-5 4.5C7 18.4 9 19 12 19s5-.6 5-2.5C17 14.2 15 12 12 12z"/></svg>;
    case 'hash':     return <svg {...props}><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/></svg>;
    case 'layers':   return <svg {...props}><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/></svg>;
    case 'refresh':  return <svg {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case 'list':     return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case 'sun':      return <svg {...props}><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>;
    case 'moon':     return <svg {...props}><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/></svg>;
    case 'logo':     return null;
    default: return null;
  }
}

// ---------- Hex chip ----------
function HexChip({ value, unit, size = 'md' }) {
  const cls = 'hex-chip' + (size === 'lg' ? ' is-lg' : size === 'xl' ? ' is-xl' : '');
  return (
    <span className={cls} title={`${value} ${unit || ''} credits`}>
      <svg viewBox="0 0 100 115" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hexg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(113,200,115,0.25)"/>
            <stop offset="1" stopColor="rgba(113,200,115,0.04)"/>
          </linearGradient>
          <radialGradient id="hexcore" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgba(113,200,115,0.6)"/>
            <stop offset="1" stopColor="rgba(113,200,115,0)"/>
          </radialGradient>
        </defs>
        <polygon points="50,2 96,28 96,87 50,113 4,87 4,28" fill="url(#hexg)" stroke="rgba(113,200,115,0.45)" strokeWidth="1.5"/>
        <circle cx="50" cy="58" r="38" fill="url(#hexcore)"/>
      </svg>
      <span className="hex-num tab-num">{value}</span>
    </span>
  );
}

// ---------- Avatar ----------
function Avatar({ initial, hue = 145, size = 'md', src }) {
  const cls = 'avatar' + (size === 'lg' ? ' is-lg' : size === 'xl' ? ' is-xl' : size === 'sm' ? ' is-sm' : '');
  const bg = `linear-gradient(135deg, oklch(0.55 0.12 ${hue}), oklch(0.32 0.08 ${(hue + 40) % 360}))`;
  return (
    <span className={cls} style={{ background: bg, color: '#fff' }}>
      {src ? <img className="avatar-img" src={src} alt={initial} /> : <span>{initial}</span>}
    </span>
  );
}

// ---------- Progress ring ----------
function ProgressRing({ percent = 0, size = 56, label }) {
  return (
    <div className="ring" style={{ '--p': percent, '--size': size + 'px' }}>
      <span className="ring-num">{label != null ? label : `${Math.round(percent)}%`}</span>
    </div>
  );
}

// ---------- Modal / Drawer ----------
function Modal({ open, onClose, children, size }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const cls = 'modal' + (size === 'lg' ? ' modal-lg' : size === 'xl' ? ' modal-xl' : '');
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cls}>{children}</div>
    </div>
  );
}

// ---------- Empty / Loading / Error ----------
function EmptyState({ glyph = '∅', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="glyph mono">{glyph}</div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

function Skeleton({ w = '100%', h = 16, r = 6, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

// ---------- Code block ----------
function CodeBlock({ lines }) {
  return (
    <pre className="code-block">{lines.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }} />)}</pre>
  );
}

// ---------- Section ----------
function Section({ eyebrow, title, action, children, id }) {
  return (
    <section id={id} className="stack-6" style={{ padding: 'var(--s-12) 0' }}>
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div className="stack-2">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

Object.assign(window, {
  Icon, HexChip, Avatar, ProgressRing, Modal, EmptyState, Skeleton, CodeBlock, Section,
});
