/* global React, ReactDOM */
const { useState, useEffect, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "card": "glass",
  "radius": "rounded",
  "creditViz": "hex",
  "showGrid": true,
  "accentHue": 145,
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [route, setRoute] = useState({ page: 'home', params: {} });
  const [user, setUser] = useState({
    authed: true,
    name: 'Alex Popescu',
    initial: 'A',
    email: 'alex@leonix.dev',
    hue: 145,
    city: 'București',
    qrCode: 'LNX-Y3K9-77AX',
    level: 7, xp: 6420, xpNext: 8000, streak: 12,
  });
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweakOpen, setTweakOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('leonix-theme') || 'dark'; } catch (e) { return 'dark'; }
  });

  // apply + persist theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('leonix-theme', theme); } catch (e) {}
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), []);

  const navigate = useCallback((page, params = {}) => {
    setRoute({ page, params });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // apply tweaks
  useEffect(() => {
    document.documentElement.dataset.card = tweaks.card;
    document.documentElement.dataset.radius = tweaks.radius;
    document.documentElement.style.setProperty('--brand-hue-shift', tweaks.accentHue);
    document.body.classList.toggle('no-grid', !tweaks.showGrid);
    document.body.classList.toggle('density-compact', tweaks.density === 'compact');
  }, [tweaks]);

  // tweak protocol
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode')   setTweakOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweakOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (k, v) => {
    const next = typeof k === 'object' ? { ...tweaks, ...k } : { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: typeof k === 'object' ? k : { [k]: v } }, '*');
  };
  const dismissTweaks = () => {
    setTweakOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  // hide nav for auth screens
  const noChrome = ['login','register'].includes(route.page);
  const onLogin = () => { setUser(u => ({ ...u, authed: true })); navigate('dashboard'); };

  return (
    <div className="app-root" data-screen-label={route.page}>
      {!noChrome && <TopNav route={route} navigate={navigate} user={user} theme={theme} onToggleTheme={toggleTheme} />}
      <main>
        {route.page === 'home' && <Home navigate={navigate} user={user}/>}
        {route.page === 'archive' && <Archive navigate={navigate} user={user}/>}
        {route.page === 'problem' && <Problem navigate={navigate} user={user}/>}
        {route.page === 'dashboard' && <Dashboard navigate={navigate} user={user}/>}
        {route.page === 'qr' && <QRPage navigate={navigate} user={user}/>}
        {route.page === 'login' && <Login navigate={navigate} onLogin={onLogin}/>}
        {route.page === 'register' && <Register navigate={navigate} onLogin={onLogin}/>}
        {route.page === 'buddy' && <Buddy navigate={navigate} user={user}/>}
        {route.page === 'leaderboard' && <Leaderboard navigate={navigate} user={user}/>}
        {route.page === 'wallet' && <Dashboard navigate={navigate} user={user}/>}
        {route.page === 'profile' && <Dashboard navigate={navigate} user={user}/>}
      </main>
      {!noChrome && <Footer navigate={navigate}/>}
      {tweakOpen && <TweaksUI tweaks={tweaks} setTweak={setTweak} onClose={dismissTweaks}/>}
    </div>
  );
}

function TweaksUI({ tweaks, setTweak, onClose }) {
  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        <span className="strong mono">Tweaks</span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="close" size={14}/></button>
      </div>
      <div className="tweaks-body">
        <div className="tweak-section">
          <div className="t-xs mono dim uppercase">Card style</div>
          <div className="seg">
            {['glass','solid','outlined'].map(o => (
              <button key={o} className={'seg-opt' + (tweaks.card===o?' is-active':'')} onClick={() => setTweak('card', o)}>{o}</button>
            ))}
          </div>
        </div>
        <div className="tweak-section">
          <div className="t-xs mono dim uppercase">Corner radius</div>
          <div className="seg">
            {['sharp','rounded','pill'].map(o => (
              <button key={o} className={'seg-opt' + (tweaks.radius===o?' is-active':'')} onClick={() => setTweak('radius', o)}>{o}</button>
            ))}
          </div>
        </div>
        <div className="tweak-section">
          <div className="t-xs mono dim uppercase">Density</div>
          <div className="seg">
            {['comfortable','compact'].map(o => (
              <button key={o} className={'seg-opt' + (tweaks.density===o?' is-active':'')} onClick={() => setTweak('density', o)}>{o}</button>
            ))}
          </div>
        </div>
        <div className="tweak-section">
          <div className="row-between"><div className="t-xs mono dim uppercase">Background grid</div>
            <div className={'switch' + (tweaks.showGrid?' is-on':'')} onClick={() => setTweak('showGrid', !tweaks.showGrid)}/>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App/>);
