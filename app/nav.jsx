/* global React, Icon, Avatar, HexChip */
const { useState, useEffect, useRef } = React;

function TopNav({ route, navigate, user, onOpenSearch, theme, onToggleTheme }) {
  const [openProfile, setOpenProfile] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [openCmd, setOpenCmd] = useState(false);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpenCmd(true); }
      if (e.key === 'Escape') { setOpenCmd(false); setOpenProfile(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const links = [
    { id: 'home',        label: 'Home',            route: 'home' },
    { id: 'archive',     label: 'Problem Archive', route: 'archive' },
    { id: 'leaderboard', label: 'Leaderboard',     route: 'leaderboard' },
    { id: 'buddy',       label: 'AI Buddy',        route: 'buddy' },
  ];

  return (
    <>
      <header className="topnav">
        <div className="container-wide topnav-inner">
          <a className="brand brand-lockup" onClick={() => navigate('home')}>
            <img src="assets/logo-emblem.svg" alt="" className="brand-emblem" width="40" height="40"/>
            <span className="brand-text">
              <span className="brand-name">leonix</span>
              <span className="brand-tag">arena</span>
            </span>
          </a>

          <nav className="topnav-links">
            {links.map(l => (
              <a key={l.id}
                 onClick={() => navigate(l.route)}
                 className={'topnav-link' + (route.page === l.route ? ' is-active' : '')}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="topnav-tools">
            <button className="search search-trigger" onClick={() => setOpenCmd(true)}>
              <Icon name="search" size={14}/>
              <span className="muted">Search…</span>
              <span className="kbd mono">⌘K</span>
            </button>
            <button className="btn btn-ghost btn-icon theme-toggle" onClick={onToggleTheme}
                    title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
                    aria-label="Toggle color theme">
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16}/>
            </button>
            {user.authed ? (
              <>
                <button className="btn btn-ghost btn-icon" title="Notifications">
                  <Icon name="bell" size={16}/>
                  <span className="dot-badge"></span>
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => navigate('qr')} title="My QR">
                  <Icon name="qr" size={16}/>
                </button>
                <div className="profile-pop">
                  <button className="profile-trig" onClick={() => setOpenProfile(o => !o)}>
                    <Avatar initial={user.initial} hue={user.hue} size="sm" />
                  </button>
                  {openProfile && (
                    <div className="profile-menu" onMouseLeave={() => setOpenProfile(false)}>
                      <div className="profile-head">
                        <Avatar initial={user.initial} hue={user.hue} size="lg"/>
                        <div className="stack-2" style={{flex:1}}>
                          <div className="strong">{user.name}</div>
                          <div className="t-xs dim mono">{user.email}</div>
                        </div>
                      </div>
                      <div className="profile-stats">
                        <div><div className="t-xs dim">Level</div><div className="strong mono">{user.level}</div></div>
                        <div><div className="t-xs dim">Streak</div><div className="strong mono">{user.streak}d</div></div>
                        <div><div className="t-xs dim">XP</div><div className="strong mono">{user.xp}</div></div>
                      </div>
                      <div className="profile-links">
                        <a onClick={() => { navigate('dashboard'); setOpenProfile(false); }}><Icon name="home" size={14}/> Dashboard</a>
                        <a onClick={() => { navigate('leaderboard'); setOpenProfile(false); }}><Icon name="trophy" size={14}/> Leaderboard</a>
                        <a onClick={() => { navigate('qr'); setOpenProfile(false); }}><Icon name="qr" size={14}/> My QR code</a>
                        <a onClick={() => { navigate('profile'); setOpenProfile(false); }}><Icon name="settings" size={14}/> Account</a>
                        <div className="divider" style={{margin:'6px 0'}}/>
                        <a onClick={() => { navigate('login'); setOpenProfile(false); }}><Icon name="logout" size={14}/> Sign out</a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => navigate('login')}>Sign in</button>
                <button className="btn btn-primary" onClick={() => navigate('register')}>Get started</button>
              </>
            )}
            <button className="btn btn-ghost btn-icon mobile-only" onClick={() => setOpenMobile(true)}>
              <Icon name="menu" size={18}/>
            </button>
          </div>
        </div>
      </header>

      {openMobile && (
        <div className="mobile-nav-overlay" onClick={() => setOpenMobile(false)}>
          <div className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{padding:'18px 20px', borderBottom:'1px solid var(--hairline)'}}>
              <img src="assets/logo-emblem.svg" height="28" alt="leonix"/>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpenMobile(false)}><Icon name="close" size={18}/></button>
            </div>
            <nav className="mobile-nav-links">
              {links.map(l => (
                <a key={l.id} onClick={() => { navigate(l.route); setOpenMobile(false); }}
                   className={route.page === l.route ? 'is-active' : ''}>
                  {l.label}
                </a>
              ))}
              <div className="divider"/>
              <a onClick={() => { navigate('dashboard'); setOpenMobile(false); }}>Dashboard</a>
              <a onClick={() => { navigate('qr'); setOpenMobile(false); }}>QR Code</a>
              <a onClick={() => { navigate('profile'); setOpenMobile(false); }}>Account</a>
            </nav>
          </div>
        </div>
      )}

      {openCmd && <CommandPalette onClose={() => setOpenCmd(false)} navigate={navigate} />}
    </>
  );
}

function CommandPalette({ onClose, navigate }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const items = [
    { kind: 'page', label: 'Go to dashboard',     icon: 'home',    action: () => navigate('dashboard') },
    { kind: 'page', label: 'Browse problem archive', icon: 'target', action: () => navigate('archive') },
    { kind: 'page', label: 'Open a problem',       icon: 'code',    action: () => navigate('problem') },
    { kind: 'page', label: 'Leaderboard',          icon: 'trophy',  action: () => navigate('leaderboard') },
    { kind: 'page', label: 'AI Study Buddy',       icon: 'sparkle', action: () => navigate('buddy') },
    { kind: 'page', label: 'My QR code',           icon: 'qr',      action: () => navigate('qr') },
  ];
  const filtered = q ? items.filter(i => (i.label + ' ' + (i.sub||'')).toLowerCase().includes(q.toLowerCase())) : items.slice(0, 9);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-palette">
        <div className="cmd-input">
          <Icon name="search" size={16}/>
          <input ref={inputRef} placeholder="Search problems, pages, actions…"
                 value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="kbd mono">esc</span>
        </div>
        <div className="cmd-results">
          {filtered.length === 0 && <div className="dim t-sm" style={{padding:'24px 20px', textAlign:'center'}}>No results for "{q}"</div>}
          {filtered.map((it, i) => (
            <button key={i} className="cmd-item" onClick={() => { it.action(); onClose(); }}>
              <Icon name={it.icon} size={14}/>
              <span style={{flex:1}}>{it.label}</span>
              {it.sub && <span className="dim t-xs">{it.sub}</span>}
              <Icon name="arrow-r" size={12}/>
            </button>
          ))}
        </div>
        <div className="cmd-footer">
          <span><span className="kbd mono">↑↓</span> navigate</span>
          <span><span className="kbd mono">↵</span> select</span>
          <span><span className="kbd mono">esc</span> close</span>
        </div>
      </div>
    </div>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="container-wide">
        <div className="footer-grid">
          <div className="stack-4">
            <img src="assets/logo-emblem.svg" height="40" alt="leonix"/>
            <p className="t-sm muted" style={{maxWidth:280}}>
              The training arena for competitive programmers. Solve, submit, get hints, climb the ranks.
            </p>
            <div className="row gap-2">
              <span className="status is-live">Judge online</span>
            </div>
          </div>
          <div className="stack-3">
            <div className="t-xs dim mono uppercase">Train</div>
            <a onClick={() => navigate('archive')} className="t-sm">Problem Archive</a>
            <a onClick={() => navigate('leaderboard')} className="t-sm">Leaderboard</a>
            <a onClick={() => navigate('buddy')} className="t-sm">AI Study Buddy</a>
          </div>
          <div className="stack-3">
            <div className="t-xs dim mono uppercase">Account</div>
            <a onClick={() => navigate('dashboard')} className="t-sm">Dashboard</a>
            <a onClick={() => navigate('qr')} className="t-sm">My QR code</a>
            <a onClick={() => navigate('login')} className="t-sm">Sign in</a>
            <a onClick={() => navigate('register')} className="t-sm">Create account</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="t-xs dim mono">© 2026 leonix.info — built with <span style={{color:'var(--brand-400)'}}>♥</span> in București</span>
          <span className="t-xs dim mono">v0.42.1 · 31 days uptime</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { TopNav, Footer });
