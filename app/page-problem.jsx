/* global React, Icon */
/* ============================================================
   PROBLEM PAGE — Statement / Editorial / Submissions + editor
   Recreated from the provided mockups.
   ============================================================ */
const { useState: usePb } = React;

/* ---------- tiny C++ highlighter ---------- */
function hlCpp(code) {
  let s = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const KW = /\b(int|long|using|namespace|return|for|while|if|else|void|const|vector|set|map|pair|sort|cin|cout|std|nullptr|main|bool|auto|struct|double|ios|sync_with_stdio|tie|begin|end|first|second|push_back|size)\b/g;
  const NUM = /\b(\d+(?:LL|ll|u|U)?)\b/g;
  const lines = s.split('\n').map(line => {
    if (/^\s*\/\//.test(line)) return '<span class="c-com">' + line + '</span>';
    if (/^\s*#/.test(line)) {
      return line.replace(/^(\s*#[a-z]+)(.*)$/, '<span class="c-pre">$1</span><span class="c-inc">$2</span>');
    }
    // split on string/char literals; even indices = code, odd = literals
    const parts = line.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) return '<span class="c-str">' + part + '</span>';
      let p = part.replace(/(\/\/.*)$/, '\u0001$1\u0002'); // shield trailing comment
      p = p.replace(KW, '<span class="c-kw">$1</span>');
      p = p.replace(NUM, '<span class="c-num">$1</span>');
      p = p.replace(/\u0001(.*)\u0002/, '<span class="c-com">$1</span>');
      return p;
    }).join('');
  });
  return lines;
}

function CodePane({ code, className }) {
  const lines = hlCpp(code);
  return (
    <div className={'cpane' + (className ? ' ' + className : '')}>
      <div className="cpane-gutter">{lines.map((_, i) => <span key={i}>{i + 1}</span>)}</div>
      <pre className="cpane-code">{lines.map((l, i) => <div key={i} className="cline" dangerouslySetInnerHTML={{ __html: l || '\u200b' }} />)}</pre>
    </div>
  );
}

/* ---------- sample code ---------- */
const PB_BOILER = `#include<stdio.h>
#include<string.h>
#include<algorithm>
#include<vector>
#include<set>
#include<map>

using namespace std;

#define x first
#define y second

int main () {

    return 0;
}`;

const PB_SUBMISSION = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;

    vector<long long> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    sort(a.begin(), a.end());

    long long ans = 0;
    for (int i = 0; i < n; ++i) {
        ans += a[i] * (2LL * i - n + 1);
    }

    cout << ans << "\\n";
    return 0;
}`;

const PB_OFFICIAL = `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    if (!(cin >> n >> q)) return 0;
    vector<long long> p(n + 1, 0), a(n + 1);

    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
        p[i] = p[i - 1] + a[i];
    }

    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << (p[r] - p[l - 1]) << '\\n';
    }
}`;

/* ---------- right-hand code editor ---------- */
function PbEditor() {
  const botTabs = ['Input','Output','Stderr','Compilation','Execution','Examples','Submission'];
  const [full, setFull] = usePb(false);
  React.useEffect(() => {
    if (!full) return;
    const onKey = e => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);
  return (
    <div className={'pb-editor hud' + (full ? ' is-full' : '')}>
      <span className="hud-corners"></span>
      <div className="pe-bar">
        <div className="pe-tools">
          <button className="pe-tool"><Icon name="send" size={14}/> Share</button>
          <button className="pe-tool"><Icon name="doc" size={14}/> Open file</button>
          <button className="pe-tool"><Icon name="arrow-up-r" size={14}/> Download</button>
          <button className="pe-lang">C++ <Icon name="chev-d" size={14}/></button>
        </div>
        <button className="pe-tool pe-full" onClick={() => setFull(f => !f)}>
          <Icon name={full ? 'close' : 'grid'} size={14}/> {full ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
      </div>

      <CodePane code={PB_BOILER} className="pe-main"/>

      <div className="pe-bottabs">
        {botTabs.map((t, i) => <button key={t} className={'pe-bt' + (i === 0 ? ' is-active' : '')}>{t}</button>)}
        <button className="pe-bt pe-bt-chev"><Icon name="chev-d" size={14}/></button>
      </div>
      <div className="pe-io"><div className="pe-io-gutter">1</div></div>

      <div className="pe-foot">
        <button className="pe-exec"><Icon name="chev-d" size={14} className="exec-chev"/> Execution Details</button>
        <div className="pe-actions">
          <button className="pe-act"><Icon name="settings" size={13}/> Compile</button>
          <button className="pe-act"><Icon name="play" size={13}/> Run input</button>
          <button className="pe-act"><Icon name="check" size={13}/> Run examples</button>
          <button className="pe-act pe-submit"><Icon name="send" size={13}/> Submit</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- STATEMENT ---------- */
function PbStatement() {
  return (
    <div className="pb-stmt">
      <h1 className="pb-h1">Matrix Exploration</h1>
      <div className="pb-limits">
        <span className="pb-limit"><Icon name="clock" size={14}/> Time limit: 1000 ms</span>
        <span className="pb-limit"><Icon name="grid" size={14}/> Memory limit: 128 MB</span>
      </div>
      <p className="pb-p">You are given a matrix of size <i>N × M</i>, where an empty cell is represented by a <code>.</code>, and a forbidden cell is represented by a <code>#</code>. You also know that <i>K</i> of the empty cells are special.</p>
      <p className="pb-p">For each empty cell you should compute the shortest distance to any special cell. You should consider that two cells are adjacent if they share a common side. For the special cells the computed value should be 0.</p>

      <div className="pb-sec"><span className="pb-dot"></span>STANDARD INPUT</div>
      <ul className="pb-ul">
        <li>First line contains three integers <i>N</i>, <i>M</i> and <i>K</i>.</li>
        <li>Each of the next <i>N</i> lines contains <i>M</i> characters, either <code>.</code> or <code>#</code>, representing the matrix.</li>
        <li>Each of the next <i>K</i> lines contains a pair of two integers <i>X</i> and <i>Y</i>, representing the line and the column of a special cell.</li>
      </ul>

      <div className="pb-sec"><span className="pb-dot"></span>STANDARD OUTPUT</div>
      <p className="pb-p">Output a single number representing the sum of the computed distances for each empty cell.</p>

      <div className="pb-sec"><span className="pb-dot"></span>RESTRICTIONS AND NOTES</div>
      <ul className="pb-ul">
        <li>1 ≤ <i>N</i> ≤ 1000</li>
        <li>1 ≤ <i>M</i> ≤ 1000</li>
        <li>1 ≤ <i>K</i> ≤ 5000</li>
        <li>1 ≤ <i>X</i> ≤ <i>N</i></li>
        <li>1 ≤ <i>Y</i> ≤ <i>M</i></li>
        <li>It is guaranteed that there is a path from every empty cell to at least one special cell.</li>
      </ul>

      <div className="pb-io-grid">
        <div className="pb-iobox">
          <div className="pb-iobox-h"><Icon name="arrow-r" size={13}/> INPUT</div>
          <pre className="pb-iobox-b">{`6 6 2
..#...
#.##.#
..#.#.
#.#..#
...#.o
######`}</pre>
        </div>
        <div className="pb-iobox">
          <div className="pb-iobox-h"><Icon name="doc" size={13}/> OUTPUT</div>
          <pre className="pb-iobox-b">50</pre>
        </div>
      </div>
    </div>
  );
}

/* ---------- EDITORIAL ---------- */
const PB_CONTENTS = [
  { ic: 'doc', label: 'N^3 complexity' },
  { ic: 'grid', label: 'N^2 complexity' },
  { ic: 'sparkle', label: 'N log N complexity offline' },
  { ic: 'fire', label: 'N log N online' },
];
function PbEditorial() {
  const [active, setActive] = usePb(0);
  const [hint, setHint] = usePb(0);
  return (
    <div className="pb-edit">
      <h1 className="pb-h1 sm">Problem Editorial</h1>
      <div className="pb-edit-row">
        <div className="pb-card">
          <div className="pb-card-h"><Icon name="book" size={15}/> Contents</div>
          <div className="pb-contents">
            {PB_CONTENTS.map((c, i) => (
              <button key={i} className={'pb-coni' + (active === i ? ' is-active' : '')} onClick={() => setActive(i)}>
                <Icon name={c.ic} size={15}/><span>{c.label}</span><Icon name="chev-r" size={14} className="coni-chev"/>
              </button>
            ))}
          </div>
        </div>
        <div className="pb-card">
          <div className="pb-card-h"><Icon name="sparkle" size={15}/> Hints</div>
          <div className="pb-hints">
            {[1,2,3,4].map(n => (
              <div key={n} className={'pb-hint' + (hint >= n ? ' is-open' : '')}>
                <div className="pb-hint-top">
                  <span className="pb-hint-n">Hint {n}</span>
                  <button className="pb-hint-btn" onClick={() => setHint(n)}><Icon name="message" size={12}/> Ask for a hint</button>
                </div>
                <span className="pb-hint-sub"><Icon name="lock" size={11}/> Reveal next hint to unlock</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-card pb-video">
        <div className="pb-card-h"><Icon name="video" size={15}/> Video Editorial</div>
        <div className="pb-player">
          <div className="pb-player-glow"></div>
          <span className="pb-bracket">{'{ 1 }'}</span>
          <button className="pb-play"><Icon name="play" size={26}/></button>
          <div className="pb-player-bar">
            <Icon name="play" size={14}/>
            <Icon name="bell" size={14}/>
            <span className="pb-time mono">00:00 / 14:37</span>
            <span className="pb-spacer"></span>
            <span className="pb-rate mono">1.25x</span>
            <span className="pb-cc">CC</span>
            <Icon name="settings" size={14}/>
            <Icon name="grid" size={14}/>
          </div>
        </div>
      </div>

      <div className="pb-card">
        <div className="pb-card-h"><Icon name="book" size={15}/> Editorial</div>
        <div className="pb-edit-body">
          <h3 className="pb-eh">Sume parțiale (prefix sums)</h3>
          <p className="pb-p">Ideea principală este să precomputăm sumele prefixate ale șirului, astfel încât să putem răspunde rapid la interogări de tipul „suma elementelor din intervalul [l, r]".</p>
          <h4 className="pb-eh2">Preprocesare</h4>
          <p className="pb-p">Construim un tablou <i>p</i>, unde <i>p[i]</i> reprezintă suma elementelor de la 1 la <i>i</i>.</p>
          <CodePane code={`p[0] = 0\np[i] = p[i - 1] + a[i]   pentru i = 1 .. n`} className="pb-mini"/>
          <h4 className="pb-eh2">Răspuns la interogări</h4>
          <p className="pb-p">Suma elementelor din intervalul [l, r] se obține astfel:</p>
          <CodePane code={`sum(l, r) = p[r] - p[l - 1]`} className="pb-mini"/>
          <h4 className="pb-eh2">Complexitate</h4>
          <ul className="pb-ul">
            <li>Preprocesare: O(n)</li>
            <li>Fiecare interogare: O(1)</li>
          </ul>
        </div>
      </div>

      <div className="pb-card">
        <div className="pb-card-h">
          <span><Icon name="code" size={15}/> Official Source Code (C++)</span>
          <button className="pb-copy"><Icon name="doc" size={12}/> Copy</button>
        </div>
        <CodePane code={PB_OFFICIAL} className="pb-official"/>
      </div>
    </div>
  );
}

/* ---------- SUBMISSIONS ---------- */
const PB_SUBS = [
  { date: 'May 20, 2025 11:42:18', user: 'leonix',    score: 100, ov: 'ok' },
  { date: 'May 20, 2025 10:58:07', user: 'cyberdev',  score: 87,  ov: 'ok' },
  { date: 'May 20, 2025 10:11:33', user: 'matrix01',  score: 42,  ov: 'info' },
  { date: 'May 20, 2025 09:47:52', user: 'ghostcode', score: 0,   ov: 'bad' },
  { date: 'May 20, 2025 09:23:15', user: 'novacpp',   score: 0,   ov: 'dash' },
];
function ScoreBadge({ v }) {
  const cls = v >= 80 ? 'sc-hi' : v >= 40 ? 'sc-mid' : 'sc-lo';
  return <span className={'pb-score ' + cls}>{v} <span className="pb-score-tot">/ 100</span></span>;
}
function OvIcon({ ov }) {
  if (ov === 'ok')   return <span className="ov ov-ok"><Icon name="check" size={14}/></span>;
  if (ov === 'info') return <span className="ov ov-info">i</span>;
  if (ov === 'bad')  return <span className="ov ov-bad"><Icon name="close" size={14}/></span>;
  return <span className="ov ov-dash"><Icon name="minus" size={14}/></span>;
}
function PbSubmissions({ onSource, onEval }) {
  return (
    <div className="pb-subs">
      <h1 className="pb-h1 sm">Recent Submissions</h1>
      <div className="pb-subtable">
        <div className="pb-subrow pb-subhead">
          <span>Date</span><span>User</span><span>Score</span><span>Overview</span><span>Source</span>
        </div>
        {PB_SUBS.map((s, i) => (
          <div key={i} className="pb-subrow">
            <span className="pb-sd"><Icon name="clock" size={13}/> {s.date}</span>
            <span className="pb-su"><Icon name="user" size={13}/> {s.user}</span>
            <span><ScoreBadge v={s.score}/></span>
            <span><button className="pb-ovbtn" onClick={onEval}><OvIcon ov={s.ov}/></button></span>
            <span><button className="pb-viewsrc" onClick={onSource}><Icon name="code" size={13}/> View source</button></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- MODALS ---------- */
function SourceModal({ onClose }) {
  return (
    <div className="pb-modal-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pb-modal hud is-glow">
        <span className="hud-corners"></span>
        <div className="pb-modal-h">
          <h3>Submission Source Code</h3>
          <button className="pb-modal-x" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <div className="pb-modal-sub">
          <span className="mono">Language: <b>C++</b></span>
          <button className="pb-copy"><Icon name="doc" size={12}/> Copy</button>
        </div>
        <CodePane code={PB_SUBMISSION} className="pb-modal-code"/>
      </div>
    </div>
  );
}

const PB_GROUPS = [
  { name: 'Group 1', pts: 10, got: 10, tests: [{ n: 1, st: 'ok', t: '8 ms', m: '1.2 MB' }, { n: 2, st: 'ok', t: '11 ms', m: '1.6 MB' }] },
  { name: 'Group 2', pts: 20, got: 20, tests: [{ n: 3, st: 'ok', t: '9 ms', m: '1.5 MB' }, { n: 4, st: 'ok', t: '14 ms', m: '1.8 MB' }, { n: 5, st: 'ok', t: '18 ms', m: '2.5 MB' }] },
  { name: 'Group 3', pts: 12, got: 12, tests: [{ n: 6, st: 'ok', t: '22 ms', m: '4.1 MB' }] },
  { name: 'Group 4', pts: 28, got: 0,  tests: [{ n: 7, st: 'ok', t: '35 ms', m: '5.2 MB' }, { n: 8, st: 'tle', t: '1000 ms', m: '16.6 MB' }, { n: 9, st: 'wa', t: '120 ms', m: '3.4 MB' }] },
  { name: 'Group 5', pts: 30, got: 0,  tests: [{ n: 10, st: 'pend', t: '--', m: '--' }] },
];
function TestStatus({ st }) {
  if (st === 'ok')   return <span className="ts ts-ok"><Icon name="check" size={13}/> Accepted</span>;
  if (st === 'tle')  return <span className="ts ts-tle"><Icon name="clock" size={13}/> Time Limit</span>;
  if (st === 'wa')   return <span className="ts ts-wa"><Icon name="close" size={13}/> Wrong Answer</span>;
  return <span className="ts ts-pend"><Icon name="minus" size={13}/> Pending</span>;
}
function EvalModal({ onClose }) {
  return (
    <div className="pb-modal-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pb-modal pb-modal-eval hud is-glow">
        <span className="hud-corners"></span>
        <div className="pb-modal-h">
          <h3>Evaluation Details</h3>
          <button className="pb-modal-x" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <div className="pb-eval-note"><Icon name="target" size={13}/> Group score is awarded only if all tests in that group pass. <span className="dim">Total possible score: 100</span></div>
        <div className="pb-eval-body">
          {PB_GROUPS.map((g, gi) => (
            <div key={gi} className="pb-group">
              <div className="pb-group-h">
                <span>{g.name} <span className="dim">({g.pts} points)</span></span>
                <span className={'pb-group-pts' + (g.got > 0 ? '' : ' zero')}>{g.got}</span>
              </div>
              <div className="pb-testtable">
                <div className="pb-testrow pb-testhead"><span>Test</span><span>Status</span><span>Time</span><span>Memory</span></div>
                {g.tests.map(t => (
                  <div key={t.n} className="pb-testrow">
                    <span className="dim">Test {t.n}</span>
                    <span><TestStatus st={t.st}/></span>
                    <span className="mono dim">{t.t}</span>
                    <span className="mono dim">{t.m}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pb-total"><Icon name="trophy" size={20}/> Total Score: <b>42</b> <span className="dim">/ 100</span></div>
      </div>
    </div>
  );
}

/* ---------- page shell ---------- */
function Problem({ navigate, user }) {
  const [tab, setTab] = usePb('statement');
  const [modal, setModal] = usePb(null);
  const tabs = [['statement','Statement'],['editorial','Editorial'],['submissions','Submissions']];
  return (
    <div className="pb container-wide">
      <div className="pb-split">
        <div className="pb-left hud">
          <span className="hud-corners"></span>
          <div className="pb-tabs">
            {tabs.map(([k,l]) => (
              <button key={k} className={'pb-tab' + (tab === k ? ' is-active' : '')} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <div className="pb-body">
            {tab === 'statement' && <PbStatement/>}
            {tab === 'editorial' && <PbEditorial/>}
            {tab === 'submissions' && <PbSubmissions onSource={() => setModal('source')} onEval={() => setModal('eval')}/>}
          </div>
        </div>
        <PbEditor/>
      </div>
      {modal === 'source' && <SourceModal onClose={() => setModal(null)}/>}
      {modal === 'eval' && <EvalModal onClose={() => setModal(null)}/>}
    </div>
  );
}

Object.assign(window, { Problem });
