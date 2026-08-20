"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon, Avatar } from "@/components/ui";
import { useApp } from "@/components/providers/AppProvider";
import { NOTIF_ICON } from "@/components/notifications/meta";
import { searchAll } from "@/lib/mock";
import { formatDate } from "@/lib/data";
import { assetPath } from "@/lib/asset";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, theme, toggleTheme, notifications, unreadCount, markRead, markAllRead } = useApp();

  const [openProfile, setOpenProfile] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [openCmd, setOpenCmd] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpenCmd(true); }
      if (e.key === 'Escape') { setOpenCmd(false); setOpenProfile(false); setOpenNotif(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const links = [
    { id: 'home',        label: 'Home',            path: '/' },
    { id: 'archive',     label: 'Problem Archive', path: '/archive' },
    { id: 'leaderboard', label: 'Leaderboard',     path: '/leaderboard' },
    { id: 'buddy',       label: 'AI Buddy',        path: '/buddy' },
  ];

  return (
    <>
      <header className="topnav">
        <div className="container-wide topnav-inner">
          <a className="brand brand-lockup" onClick={() => router.push('/')}>
            <img src={assetPath("/assets/logo-emblem.svg")} alt="" className="brand-emblem" width="40" height="40"/>
            <span className="brand-text">
              <span className="brand-name">leonix</span>
              <span className="brand-tag">arena</span>
            </span>
          </a>

          <nav className="topnav-links">
            {links.map(l => (
              <a key={l.id}
                 onClick={() => router.push(l.path)}
                 className={'topnav-link' + (pathname === l.path ? ' is-active' : '')}>
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
            <button className="btn btn-ghost btn-icon theme-toggle" onClick={toggleTheme}
                    title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
                    aria-label="Toggle color theme">
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16}/>
            </button>
            {user.authed ? (
              <>
                <div className="notif-pop">
                  <button className="btn btn-ghost btn-icon" title="Notifications" onClick={() => setOpenNotif(o => !o)}>
                    <Icon name="bell" size={16}/>
                    {unreadCount > 0 && <span className="dot-badge"></span>}
                  </button>
                  {openNotif && (
                    <div className="notif-menu" onMouseLeave={() => setOpenNotif(false)}>
                      <div className="notif-head">
                        <span className="strong">Notifications</span>
                        <button className="notif-mark" onClick={markAllRead} disabled={unreadCount === 0}>Mark all read</button>
                      </div>
                      <div className="notif-scroll">
                        {notifications.slice(0, 6).map(n => (
                          <button key={n.id} className={'notif-item' + (n.read ? '' : ' is-unread')}
                                  onClick={() => { markRead(n.id); setOpenNotif(false); router.push(n.href); }}>
                            <span className="notif-ic"><Icon name={NOTIF_ICON[n.type]} size={14}/></span>
                            <span className="notif-body">
                              <span className="notif-text">{n.text}</span>
                              <span className="notif-time mono">{formatDate(n.at, { month: 'short', day: 'numeric' })}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                      <button className="notif-all" onClick={() => { setOpenNotif(false); router.push('/notifications'); }}>
                        See all notifications <Icon name="arrow-r" size={13}/>
                      </button>
                    </div>
                  )}
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => router.push('/qr')} title="My QR">
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
                        <a onClick={() => { router.push('/dashboard'); setOpenProfile(false); }}><Icon name="home" size={14}/> Dashboard</a>
                        <a onClick={() => { router.push('/leaderboard'); setOpenProfile(false); }}><Icon name="trophy" size={14}/> Leaderboard</a>
                        <a onClick={() => { router.push('/qr'); setOpenProfile(false); }}><Icon name="qr" size={14}/> My QR code</a>
                        <a onClick={() => { router.push('/profile'); setOpenProfile(false); }}><Icon name="settings" size={14}/> Account</a>
                        <div className="divider" style={{margin:'6px 0'}}/>
                        <a onClick={() => { router.push('/login'); setOpenProfile(false); }}><Icon name="logout" size={14}/> Sign out</a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => router.push('/login')}>Sign in</button>
                <button className="btn btn-primary" onClick={() => router.push('/register')}>Get started</button>
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
              <img src={assetPath("/assets/logo-emblem.svg")} height="28" alt="leonix"/>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpenMobile(false)}><Icon name="close" size={18}/></button>
            </div>
            <nav className="mobile-nav-links">
              {links.map(l => (
                <a key={l.id} onClick={() => { router.push(l.path); setOpenMobile(false); }}
                   className={pathname === l.path ? 'is-active' : ''}>
                  {l.label}
                </a>
              ))}
              <div className="divider"/>
              <a onClick={() => { router.push('/dashboard'); setOpenMobile(false); }}>Dashboard</a>
              <a onClick={() => { router.push('/qr'); setOpenMobile(false); }}>QR Code</a>
              <a onClick={() => { router.push('/profile'); setOpenMobile(false); }}>Account</a>
            </nav>
          </div>
        </div>
      )}

      {openCmd && <CommandPalette onClose={() => setOpenCmd(false)} />}
    </>
  );
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const pages = [
    { label: 'Go to dashboard',        icon: 'home',    action: () => router.push('/dashboard') },
    { label: 'Browse problem archive', icon: 'target',  action: () => router.push('/archive') },
    { label: 'Leaderboard',            icon: 'trophy',  action: () => router.push('/leaderboard') },
    { label: 'AI Study Buddy',         icon: 'sparkle', action: () => router.push('/buddy') },
    { label: 'Notifications',          icon: 'bell',    action: () => router.push('/notifications') },
    { label: 'Settings',               icon: 'settings',action: () => router.push('/settings') },
    { label: 'My QR code',             icon: 'qr',      action: () => router.push('/qr') },
  ];
  const res = searchAll(q);
  const filteredPages = q ? pages.filter(p => p.label.toLowerCase().includes(q.toLowerCase())) : pages.slice(0, 6);
  const go = (fn: () => void) => { fn(); onClose(); };
  const seeAll = () => go(() => router.push('/search?q=' + encodeURIComponent(q)));
  const hasContent = res.problems.length > 0 || res.users.length > 0;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-palette">
        <div className="cmd-input">
          <Icon name="search" size={16}/>
          <input ref={inputRef} placeholder="Search problems, users, pages…"
                 value={q} onChange={(e) => setQ(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) seeAll(); }} />
          <span className="kbd mono">esc</span>
        </div>
        <div className="cmd-results">
          {q && res.problems.length > 0 && (
            <>
              <div className="cmd-group">Problems</div>
              {res.problems.slice(0, 4).map(p => (
                <button key={p.id} className="cmd-item" onClick={() => go(() => router.push('/problem'))}>
                  <Icon name="code" size={14}/>
                  <span style={{flex:1}}>{p.title}</span>
                  <span className="cmd-meta mono">{p.tags[0] ?? ''} · L{p.level}</span>
                </button>
              ))}
            </>
          )}
          {q && res.users.length > 0 && (
            <>
              <div className="cmd-group">Users</div>
              {res.users.slice(0, 4).map(u => (
                <button key={u.handle} className="cmd-item" onClick={() => go(() => router.push('/u/' + u.handle))}>
                  <Icon name="user" size={14}/>
                  <span style={{flex:1}}>{u.name} <span className="dim mono">@{u.handle}</span></span>
                  <span className="cmd-meta mono">#{u.rank}</span>
                </button>
              ))}
            </>
          )}
          {filteredPages.length > 0 && (
            <>
              <div className="cmd-group">Pages</div>
              {filteredPages.map((it, i) => (
                <button key={i} className="cmd-item" onClick={() => go(it.action)}>
                  <Icon name={it.icon} size={14}/>
                  <span style={{flex:1}}>{it.label}</span>
                  <Icon name="arrow-r" size={12}/>
                </button>
              ))}
            </>
          )}
          {q && hasContent && (
            <button className="cmd-item cmd-seeall" onClick={seeAll}>
              <Icon name="search" size={14}/>
              <span style={{flex:1}}>See all results for &ldquo;{q}&rdquo;</span>
              <span className="kbd mono">↵</span>
            </button>
          )}
          {q && !hasContent && filteredPages.length === 0 && (
            <div className="dim t-sm" style={{padding:'24px 20px', textAlign:'center'}}>No results for &ldquo;{q}&rdquo;</div>
          )}
        </div>
        <div className="cmd-footer">
          <span><span className="kbd mono">↑↓</span> navigate</span>
          <span><span className="kbd mono">↵</span> all results</span>
          <span><span className="kbd mono">esc</span> close</span>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const router = useRouter();
  return (
    <footer className="footer">
      <div className="container-wide">
        <div className="footer-grid">
          <div className="stack-4">
            <img src={assetPath("/assets/logo-emblem.svg")} height="40" alt="leonix"/>
            <p className="t-sm muted" style={{maxWidth:280}}>
              The training arena for competitive programmers. Solve, submit, get hints, climb the ranks.
            </p>
            <div className="row gap-2">
              <span className="status is-live">Judge online</span>
            </div>
          </div>
          <div className="stack-3">
            <div className="t-xs dim mono uppercase">Train</div>
            <a onClick={() => router.push('/archive')} className="t-sm">Problem Archive</a>
            <a onClick={() => router.push('/leaderboard')} className="t-sm">Leaderboard</a>
            <a onClick={() => router.push('/buddy')} className="t-sm">AI Study Buddy</a>
          </div>
          <div className="stack-3">
            <div className="t-xs dim mono uppercase">Account</div>
            <a onClick={() => router.push('/dashboard')} className="t-sm">Dashboard</a>
            <a onClick={() => router.push('/profile')} className="t-sm">My profile</a>
            <a onClick={() => router.push('/notifications')} className="t-sm">Notifications</a>
            <a onClick={() => router.push('/settings')} className="t-sm">Settings</a>
            <a onClick={() => router.push('/qr')} className="t-sm">My QR code</a>
            <a onClick={() => router.push('/login')} className="t-sm">Sign in</a>
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
