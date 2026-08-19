/* global React, Icon, Avatar, Section */
const { useState, useEffect, useMemo } = React;

function Home({ navigate, user }) {
  return (
    <div className="home-v2">
      <Hero navigate={navigate}/>
      <ProblemArchive navigate={navigate}/>
      <GetStarted navigate={navigate}/>
      <Community navigate={navigate}/>
    </div>
  );
}

/* ---------------- 1 · HERO ---------------- */
function Hero({ navigate }) {
  const feats = [
    { icon: 'target',  label: 'Thousands of problems across every topic and difficulty', route: 'archive' },
    { icon: 'sparkle', label: 'Instant AI hints when you get stuck — no spoilers', route: 'buddy' },
    { icon: 'trophy',  label: 'Submit, get scored, and climb the leaderboard', route: 'leaderboard' },
  ];
  return (
    <section className="hero2">
      <div className="container-wide hero2-inner">
        <div className="hero2-copy">
          <span className="eyebrow-slash fade-in">v0.52 — Autumn 2026 release</span>
          <h1 className="hero2-title fade-in delay-1">
            Train like a competitor.
            <span className="hero2-title-accent"> Solve, submit, level up.</span>
          </h1>
          <div className="hero2-feats fade-in delay-2">
            {feats.map((f, i) => (
              <div key={i} className="hud hud-row" onClick={() => navigate(f.route)}>
                <span className="hud-corners"></span>
                <span className="hud-ico"><Icon name={f.icon} size={24}/></span>
                <span className="hud-divider"></span>
                <span className="hud-label">{f.label}</span>
                <span className="hud-chev"><Icon name="chev-r" size={18}/></span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero2-visual fade-in delay-2">
          <img src="assets/mascots/hero-cat.png" className="mascot hero2-cat" alt="" width="462" height="263"/>
          <img src="assets/mascots/cat-paws-tail.png" className="mascot hero2-paws" alt="" width="394" height="184"/>
          <div className="term hero2-term">
            <div className="term-bar">
              <span className="term-dots"><i style={{background:'#f06464'}}></i><i style={{background:'#f5b461'}}></i><i style={{background:'#54e817'}}></i></span>
              <span className="t-xs dim mono">~/leonix-arena — sliding-window</span>
              <span className="status is-live mono" style={{fontSize:11, color:'var(--brand-400)'}}>JUDGE</span>
            </div>
            <div className="term-body">
              <div className="tl"><span className="g">$</span> leonix submit sliding-window.cpp</div>
              <div className="tl dim">- compiling with g++ -O2 ...</div>
              <div className="tl dim">- running 20 test cases ...</div>
              <div className="tl">&nbsp;</div>
              <div className="term-prog"><span className="dim">tests 1–8 &gt; small cases</span><span className="g">AC</span></div>
              <div className="term-prog"><span className="dim">tests 9–16 &gt; random</span><span className="g">AC</span></div>
              <div className="term-prog"><span style={{color:'var(--fg-strong)'}}>tests 17–20 &gt; max N</span><span className="amber">TLE</span></div>
              <div className="tl">&nbsp;</div>
              <div className="tl"><span className="g">$</span> leonix <span className="g">hint</span> --stuck</div>
              <div className="tl dim">- your O(n²) scan is the bottleneck</div>
              <div className="tl dim">- try a two-pointer window to reach O(n)</div>
              <div className="tl"><span className="g">$</span> <span className="term-cursor"></span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 2 · PROBLEM ARCHIVE ---------------- */
function ProblemArchive({ navigate }) {
  const cards = [
    { icon: 'trophy',    title: 'Olympiad\nProblems' },
    { icon: 'briefcase', title: 'Interview\nProblems' },
    { icon: 'doc',       title: 'Romanian\nBaccalaureate Tests' },
    { icon: 'brain',     title: 'CS Knowledge\nQuizzes' },
  ];
  const stats = [
    { icon: 'target', num: '10K+', label: 'Problems' },
    { icon: 'chart',  num: '25+',  label: 'Categories' },
    { icon: 'users',  num: '50K+', label: 'Active Learners' },
  ];
  return (
    <section className="container-wide sect">
      <div className="hud archive-panel is-glow">
        <span className="hud-corners"></span>
        <div className="archive-left">
          <span className="eyebrow-slash">// Problem Archive</span>
          <h2 className="archive-title">Explore our<br/>Problem Archive</h2>
          <p className="archive-desc">
            Sharpen your skills with a curated collection of challenges across competitive programming and computer science.
            Use the AI self-training tool to optimize your working schedule.
          </p>
          <div className="archive-cards">
            {cards.map((c, i) => (
              <div key={i} className="hud archive-card" onClick={() => navigate('archive')}>
                <span className="hud-corners"></span>
                <span className="archive-card-ico"><Icon name={c.icon} size={26}/></span>
                <span className="archive-card-title">{c.title.split('\n').map((l,j,arr) => <React.Fragment key={j}>{l}{j < arr.length-1 ? <br/> : null}</React.Fragment>)}</span>
                <span className="archive-card-chev"><Icon name="arrow-r" size={18}/></span>
              </div>
            ))}
          </div>
          <div className="hud archive-tagline">
            <span className="hud-corners"></span>
            <span className="archive-paw"><Icon name="paw" size={22}/></span>
            <div className="stack-2" style={{flex:1}}>
              <span className="mono" style={{color:'var(--brand-400)', fontSize:14}}>Thousands of problems. Endless growth.</span>
              <span className="t-sm dim mono">Track progress, solve smarter, level up.</span>
            </div>
            <button className="btn btn-glow archive-grow-btn" onClick={() => navigate('archive')}>LEARN. CONNECT. GROW.</button>
          </div>
        </div>
        <div className="archive-right">
          <img src="assets/mascots/panther-metal.png" className="mascot archive-panther" alt="" width="656" height="616"/>
          <div className="archive-stats">
            {stats.map((s, i) => (
              <div key={i} className="archive-stat">
                <span className="archive-stat-ico"><Icon name={s.icon} size={22}/></span>
                <div className="stack-2">
                  <span className="archive-stat-num mono">{s.num}</span>
                  <span className="t-xs dim">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 3 · GET STARTED ---------------- */
function GetStarted({ navigate }) {
  return (
    <section className="container-wide sect">
      <div className="hud getstarted is-glow">
        <span className="hud-corners"></span>
        <div className="getstarted-copy">
          <span className="eyebrow-slash">// Get started</span>
          <h2 className="getstarted-title">Your next milestone is <span className="hero2-title-accent">one account away</span></h2>
          <p className="getstarted-desc">Register on the Arena, start solving from the archive, and get instant hints whenever you need them.</p>
          <div className="row gap-3" style={{flexWrap:'wrap'}}>
            <button className="btn btn-glow btn-lg getstarted-btn" onClick={() => navigate('login')}>
              <Icon name="arrow-l" size={16}/> Login
            </button>
            <button className="btn btn-glow btn-lg getstarted-btn" onClick={() => navigate('register')}>
              <Icon name="user" size={16}/> Register
            </button>
          </div>
        </div>
        <div className="getstarted-art">
          <img src="assets/mascots/paw-print.png" alt="" className="getstarted-paw"/>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 4 · COMMUNITY ---------------- */
function Community({ navigate }) {
  const socials = [
    { name: 'Facebook',  cta: 'Follow us', color: '#1877F2', icon: <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.75-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" fill="#1877F2"/> },
    { name: 'Instagram', cta: 'Follow us', grad: true, icon: <><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#FEDA75"/><stop offset="0.4" stopColor="#FA7E1E"/><stop offset="0.7" stopColor="#D62976"/><stop offset="1" stopColor="#962FBF"/></linearGradient></defs><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="url(#ig)"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.7"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></> },
    { name: 'TikTok',    cta: 'Follow us', color: '#fff', icon: <path d="M16.5 3c.3 2.2 1.6 3.6 3.5 3.8v2.6c-1.3.1-2.5-.3-3.5-1v6.1c0 3.4-2.7 5.5-5.6 4.8C8 20.8 6.4 18.4 7 15.9c.5-2.1 2.4-3.5 4.6-3.3v2.7c-.4-.1-.8-.1-1.2 0-1 .3-1.6 1.2-1.4 2.2.2 1.2 1.5 1.8 2.6 1.3.8-.4 1.1-1.1 1.1-2V3h3.8z" fill="#fff"/> },
    { name: 'Discord',   cta: 'Join us',   color: '#5865F2', icon: <path d="M19.5 5.5A16 16 0 0 0 15.5 4l-.3.5a13 13 0 0 1 3.5 1.7 13 13 0 0 0-11.4 0A13 13 0 0 1 10.8 4.5L10.5 4A16 16 0 0 0 6.5 5.5C4 9.2 3.3 12.8 3.6 16.4A16 16 0 0 0 8.5 19l.6-1a10 10 0 0 1-1.7-.8l.4-.3a11 11 0 0 0 9.4 0l.4.3a10 10 0 0 1-1.7.8l.6 1a16 16 0 0 0 4.9-2.6c.4-4.2-.6-7.8-2.9-11.1zM9.5 14.3c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.5.7 1.4 1.6c0 .9-.6 1.6-1.4 1.6zm5 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.5.7 1.4 1.6c0 .9-.6 1.6-1.4 1.6z" fill="#5865F2"/> },
  ];
  return (
    <section className="container-wide sect community-sect">
      <div className="hud community-panel">
        <span className="hud-corners"></span>
        <div className="community-left">
          <span className="eyebrow-slash">// Join our community</span>
          <h2 className="community-title">Join our community</h2>
          <p className="community-desc">Follow Leonix, connect with other competitors, and stay close to the community.</p>
          <div className="social-grid">
            {socials.map((s, i) => (
              <a key={i} className="hud social-card">
                <span className="hud-corners"></span>
                <span className="social-ico"><svg width="34" height="34" viewBox="0 0 24 24">{s.icon}</svg></span>
                <div className="stack-2">
                  <span className="social-name">{s.name}</span>
                  <span className="social-cta">{s.cta} <Icon name="arrow-r" size={13}/></span>
                </div>
              </a>
            ))}
          </div>
          <div className="hud contact-card is-glow">
            <span className="hud-corners"></span>
            <div className="contact-head"><Icon name="message" size={18}/> <span className="strong" style={{color:'var(--brand-400)', fontWeight:700, fontSize:18}}>Contact</span></div>
            <div className="contact-rows">
              <span className="contact-row"><Icon name="message" size={15}/> Office@leonix.info</span>
              <span className="contact-divider"></span>
              <span className="contact-row"><Icon name="bell" size={15}/> +40722533025</span>
            </div>
          </div>
          <div className="community-console">
            <span className="community-paw"><Icon name="paw" size={20}/></span>
            <div className="mono t-sm">
              <div><span style={{color:'var(--brand-400)'}}>console</span>.log(<span style={{color:'var(--brand-300)'}}>"Welcome to the Leonix Arena"</span>);</div>
              <div className="dim">// Learn. Connect. Grow.</div>
            </div>
          </div>
        </div>
        <div className="community-right">
          <img src="assets/mascots/robot-cat.png" alt="" className="community-robot"/>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Home });
