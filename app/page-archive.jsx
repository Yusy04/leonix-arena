/* global React, Icon */
/* ============================================================
   PROBLEM ARCHIVE  —  "Lista de probleme"
   Front-end replicated from the provided mockups.
   ============================================================ */
const { useState, useMemo, useEffect, useRef } = React;

/* ---------------- filter option sets ---------------- */
const A_PROFESORI = [
  { id: 'cumbre',    label: 'Cumbre Emil' },
  { id: 'mirsan',    label: 'Mîrșan Liviu' },
  { id: 'popescu',   label: 'Popescu Dan' },
  { id: 'enescu',    label: 'Enescu Andrei' },
  { id: 'radu',      label: 'Radu Mihai' },
  { id: 'georgescu', label: 'Georgescu Vlad' },
];
const A_CONCURS = [
  { id: 'oni', label: 'ONI', children: [
    { id: 'oni-2018', label: '2018' },
    { id: 'oni-2019', label: '2019', children: [
      { id: 'oni-2019-910',  label: 'Clasele 9-10' },
      { id: 'oni-2019-1112', label: 'Clasele 11-12' },
    ] },
    { id: 'oni-2020', label: '2020' },
    { id: 'oni-2021', label: '2021' },
    { id: 'oni-2022', label: '2022' },
  ] },
  { id: 'oji', label: 'OJI', children: [
    { id: 'oji-2019', label: '2019' },
    { id: 'oji-2020', label: '2020' },
    { id: 'oji-2021', label: '2021' },
  ] },
  { id: 'loturi', label: 'Loturi', children: [
    { id: 'lot-juniori', label: 'Juniori' },
    { id: 'lot-seniori', label: 'Seniori' },
  ] },
];
const A_ARIE = [
  { id: 'grafuri', label: 'Grafuri', children: [
    { id: 'bfs',      label: 'BFS' },
    { id: 'dfs',      label: 'DFS' },
    { id: 'dijkstra', label: 'Dijkstra' },
    { id: 'kruskal',  label: 'Kruskal' },
    { id: 'toposort', label: 'Topological Sort' },
  ] },
  { id: 'dp',          label: 'Programare Dinamică' },
  { id: 'backtracking',label: 'Backtracking' },
  { id: 'ds',          label: 'Structuri de date' },
  { id: 'geometrie',   label: 'Geometrie' },
  { id: 'teoria',      label: 'Teoria numerelor' },
  { id: 'matematica',  label: 'Matematică' },
  { id: 'altele',      label: 'Altele' },
];
const A_NIVEL = [1,2,3,4,5,6,7,8,9].map(n => ({ id: 'lvl' + n, label: 'Level ' + n }));
const A_EDIT = [{ id: 'all', label: 'All' }, { id: 'open', label: 'Open' }];

/* flatten helper for counting / select-all */
function flatIds(nodes, acc = []) {
  nodes.forEach(n => { acc.push(n.id); if (n.children) flatIds(n.children, acc); });
  return acc;
}

/* ---------------- problems data ---------------- */
const A_TITLES = ['Dumnuru','Sinr','Arborii','Backerf','Sinuri','Turn','Puterea','Aszdi','Adelin','Jurful','Nete','Pece','FCP214','Salt','Plumbera','X²+C','ABC','Grup','Gold','Mede','Racheta 4','Zebra','Zero Quarry','AVD','CTC','ETC','SwB','Furnirax','Aschii','Suiee','PC21','PlămADă','Soluție','Tablou'];
const A_AUTHORS = ['Emilian Miron','Sorin Stancu-Mara','Cristian Cedar','Cătălin Francu','Filip Cristian Bunanu','Cosmin Săvescu Negucan','Doru Pădoe','Dori Pocket','Liviu Cofrasi','Doru Chitabos','Tiberiu Sîrău','Vlad Stănilă Băltescu','Vlad Stăculă','Mugurel Ionuț Andrica','Adrian Ceroștescu'];
const A_SOURCES = ['Lec 2005 · G','PMC 2006 · G','Lot 2006 · G','Lista lui Francu · G','Summer Challenge 1 · G','Summer Challenge 2 · G','Summer Warmup 2006 · G','Autumn Warmup 2006 · G','Happy Coding 2006 · G'];

function makeProblems(page) {
  const rows = [];
  const base = (page - 1) * 41 + 250;
  for (let i = 0; i < 30; i++) {
    const seed = base + i;
    const diff = ((seed * 7 + 3) % 6) + 1;
    const locked = (seed % 9 === 3 || seed % 9 === 5);
    const solved = !locked && (seed % 4 !== 0);
    const noScore = (seed % 5 === 0);
    rows.push({
      nr: base + i,
      title: A_TITLES[(seed) % A_TITLES.length],
      author: A_AUTHORS[(seed * 3) % A_AUTHORS.length],
      source: A_SOURCES[(seed) % A_SOURCES.length],
      editorial: locked ? 'locked' : 'open',
      diff,
      score: (locked || noScore) ? null : 100,
      solved,
    });
  }
  return rows;
}

/* ---------------- small bits ---------------- */
function CheckBox({ on }) {
  return <span className={'af-check' + (on ? ' on' : '')}>{on ? <Icon name="check" size={12} stroke={2.4}/> : null}</span>;
}

function TreeNodes({ nodes, depth, sel, expanded, onToggle, onExpand }) {
  return nodes.map(n => {
    const kids = n.children && n.children.length;
    const open = expanded.has(n.id);
    const on = sel.has(n.id);
    return (
      <React.Fragment key={n.id}>
        <div className={'af-opt' + (depth > 0 ? ' is-child' : '') + (on ? ' is-on' : '')} style={{ paddingLeft: 12 + depth * 20 }}>
          {kids
            ? <button className={'af-caret' + (open ? ' open' : '')} onClick={() => onExpand(n.id)} aria-label="expand"><Icon name="chev-r" size={13} stroke={2.2}/></button>
            : <span className="af-caret-sp"></span>}
          <button className="af-hit" onClick={() => onToggle(n.id)}>
            <CheckBox on={on}/>
            <span className="af-label">{n.label}</span>
          </button>
        </div>
        {kids && open ? <TreeNodes nodes={n.children} depth={depth + 1} sel={sel} expanded={expanded} onToggle={onToggle} onExpand={onExpand}/> : null}
      </React.Fragment>
    );
  });
}

function FlatNodes({ nodes, sel, onToggle }) {
  return nodes.map(n => {
    const on = sel.has(n.id);
    return (
      <div key={n.id} className={'af-opt' + (on ? ' is-on' : '')}>
        <button className="af-hit" onClick={() => onToggle(n.id)}>
          <CheckBox on={on}/>
          <span className="af-label">{n.label}</span>
        </button>
      </div>
    );
  });
}

function FilterField({ icon, name, value, fkey, open, setOpen, dropWidth, children }) {
  const isOpen = open === fkey;
  return (
    <div className="af-wrap">
      <button className={'af-field' + (isOpen ? ' is-open' : '')} onClick={() => setOpen(isOpen ? null : fkey)}>
        <span className="af-ico"><Icon name={icon} size={22}/></span>
        <span className="af-meta">
          <span className="af-name">{name}</span>
          <span className="af-val">{value}</span>
        </span>
        <span className="af-fchev"><Icon name="chev-d" size={18}/></span>
      </button>
      {isOpen ? (
        <div className="af-drop hud is-glow" style={dropWidth ? { width: dropWidth } : null}>
          <span className="hud-corners"></span>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function DropSearch({ placeholder }) {
  return (
    <div className="af-search">
      <Icon name="search" size={15}/>
      <input type="text" placeholder={placeholder} onClick={e => e.stopPropagation()}/>
    </div>
  );
}

function DropFoot({ count, onReset }) {
  return (
    <div className="af-foot">
      <span className="af-count mono">{count} selectate</span>
      <button className="af-reset mono" onClick={onReset}>Resetează</button>
    </div>
  );
}

/* ---------------- main page ---------------- */
function Archive({ navigate, user }) {
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState({
    profesori: new Set(),
    concurs:   new Set(['oni', 'oni-2018', 'oni-2019', 'oni-2019-1112']),
    arie:      new Set(['grafuri', 'dijkstra']),
    nivel:     new Set(['lvl3', 'lvl5', 'lvl7']),
    editoriale:new Set(['open']),
  });
  const [expanded, setExpanded] = useState(new Set(['grafuri', 'oni', 'oni-2019']));

  const toggle = (fkey, id) => setSel(s => {
    const next = new Set(s[fkey]);
    next.has(id) ? next.delete(id) : next.add(id);
    return { ...s, [fkey]: next };
  });
  const reset = (fkey) => setSel(s => ({ ...s, [fkey]: new Set() }));
  const resetAll = () => setSel({ profesori: new Set(), concurs: new Set(), arie: new Set(), nivel: new Set(), editoriale: new Set() });
  const toggleExpand = (id) => setExpanded(e => { const n = new Set(e); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allRows = useMemo(() => makeProblems(page), [page]);
  const rows = useMemo(() => {
    if (tab === 'solved')    return allRows.filter(p => p.solved);
    if (tab === 'unsolved')  return allRows.filter(p => !p.solved && p.editorial !== 'locked');
    if (tab === 'attempted') return allRows.filter(p => !p.solved);
    return allRows;
  }, [tab, allRows]);

  const cnt = (fkey) => sel[fkey].size;
  const fieldVal = (fkey, fallback) => cnt(fkey) ? cnt(fkey) + ' selectate' : fallback;
  const pages = [1,2,3,4,5,6,7,8,9,10,11,'…',44,45,46,47,48];
  const cols = [
    { ic: 'hash', t: 'NUMĂR' }, { ic: 'list', t: 'TITLUL PROBLEMEI' }, { ic: 'user', t: 'AUTOR' },
    { ic: 'bookmark', t: 'SURSA' }, { ic: 'book', t: 'EDITORIAL' }, { ic: 'chart', t: 'NIVEL DE DIFICULTATE' }, { ic: 'star', t: 'SCORUL TĂU' },
  ];

  return (
    <div className="arch container-wide">
      {open ? <div className="af-scrim" onClick={() => setOpen(null)}></div> : null}

      {/* header */}
      <div className="arch-head">
        <h1 className="arch-title"><span className="arch-bar"></span>Lista de probleme</h1>
        <div className="arch-cats">
          <button className="arch-cat" onClick={() => navigate('archive')}>
            <Icon name="chev-r" size={14} className="cat-l"/>
            <span className="arch-cat-mid"><Icon name="code" size={15}/> CS Quizzes</span>
            <Icon name="chev-r" size={14}/>
          </button>
          <button className="arch-cat" onClick={() => navigate('archive')}>
            <Icon name="chev-r" size={14} className="cat-l"/>
            <span className="arch-cat-mid"><Icon name="book" size={15}/> Romanian Bacalaureate</span>
            <Icon name="chev-r" size={14}/>
          </button>
        </div>
      </div>

      {/* filters + AI assistant */}
      <div className="arch-top">
        <div className="arch-filters hud is-glow">
          <span className="hud-corners"></span>
          <div className="af-mainsearch">
            <Icon name="search" size={18}/>
            <input type="text" placeholder="Caută probleme după titlu, autor sau sursă…"/>
            <span className="af-search-dot"></span>
          </div>

          <div className="af-grid">
            <FilterField icon="user" name="Profesori" value={fieldVal('profesori','Toți profesori')} fkey="profesori" open={open} setOpen={setOpen}>
              <DropSearch placeholder="Caută profesori…"/>
              <div className="af-list">
                <div className={'af-opt af-selall' + (sel.profesori.size === A_PROFESORI.length ? ' is-on' : '')}>
                  <button className="af-hit" onClick={() => setSel(s => ({ ...s, profesori: s.profesori.size === A_PROFESORI.length ? new Set() : new Set(A_PROFESORI.map(p => p.id)) }))}>
                    <CheckBox on={sel.profesori.size === A_PROFESORI.length}/><span className="af-label">Selectează toate</span>
                  </button>
                </div>
                <FlatNodes nodes={A_PROFESORI} sel={sel.profesori} onToggle={id => toggle('profesori', id)}/>
              </div>
              <DropFoot count={cnt('profesori')} onReset={() => reset('profesori')}/>
            </FilterField>

            <FilterField icon="trophy" name="Concurs" value={fieldVal('concurs','Toate concursurile')} fkey="concurs" open={open} setOpen={setOpen} dropWidth={264}>
              <DropSearch placeholder="Caută concursuri…"/>
              <div className="af-list">
                <div className={'af-opt af-selall' + (sel.concurs.size === flatIds(A_CONCURS).length ? ' is-on' : '')}>
                  <button className="af-hit" onClick={() => setSel(s => ({ ...s, concurs: s.concurs.size === flatIds(A_CONCURS).length ? new Set() : new Set(flatIds(A_CONCURS)) }))}>
                    <CheckBox on={sel.concurs.size === flatIds(A_CONCURS).length}/><span className="af-label">Selectează toate</span>
                  </button>
                </div>
                <TreeNodes nodes={A_CONCURS} depth={0} sel={sel.concurs} expanded={expanded} onToggle={id => toggle('concurs', id)} onExpand={toggleExpand}/>
              </div>
              <DropFoot count={cnt('concurs')} onReset={() => reset('concurs')}/>
            </FilterField>

            <FilterField icon="layers" name="Arie de exerciții" value={fieldVal('arie','Toate ariile')} fkey="arie" open={open} setOpen={setOpen} dropWidth={264}>
              <DropSearch placeholder="Caută arie de exerciții…"/>
              <div className="af-list">
                <TreeNodes nodes={A_ARIE} depth={0} sel={sel.arie} expanded={expanded} onToggle={id => toggle('arie', id)} onExpand={toggleExpand}/>
              </div>
              <DropFoot count={cnt('arie')} onReset={() => reset('arie')}/>
            </FilterField>

            <FilterField icon="chart" name="Nivel de dificultate" value={fieldVal('nivel','Toate nivelurile')} fkey="nivel" open={open} setOpen={setOpen}>
              <DropSearch placeholder="Caută nivel…"/>
              <div className="af-list">
                <FlatNodes nodes={A_NIVEL} sel={sel.nivel} onToggle={id => toggle('nivel', id)}/>
              </div>
              <DropFoot count={cnt('nivel')} onReset={() => reset('nivel')}/>
            </FilterField>

            <FilterField icon="book" name="Editoriale" value={fieldVal('editoriale','Toate editoriale')} fkey="editoriale" open={open} setOpen={setOpen}>
              <DropSearch placeholder="Caută editoriale…"/>
              <div className="af-list">
                <FlatNodes nodes={A_EDIT} sel={sel.editoriale} onToggle={id => toggle('editoriale', id)}/>
              </div>
              <DropFoot count={cnt('editoriale')} onReset={() => reset('editoriale')}/>
            </FilterField>
          </div>

          <button className="af-clear" onClick={resetAll}><Icon name="refresh" size={15}/> Curăță filtrele</button>
        </div>

        <aside className="arch-ai hud is-glow">
          <span className="hud-corners"></span>
          <img src="assets/mascots/panther-metal.png" className="ai-panther" alt=""/>
          <div className="ai-body">
            <span className="ai-brand mono">{'{ leonix }'}</span>
            <h2 className="ai-title">AI TRAINING<br/>ASSISTANT</h2>
            <p className="ai-sub">Antrenament personalizat.<br/>Explicații inteligente.<br/>Rezultate reale.</p>
            <button className="btn btn-glow ai-cta" onClick={() => navigate('buddy')}>Start self-training module <Icon name="arrow-r" size={16}/></button>
          </div>
        </aside>
      </div>

      {/* status tabs */}
      <div className="arch-tabs">
        {[['all','Toate problemele'],['unsolved','Nerezolvate'],['attempted','Încercate'],['solved','Rezolvate']].map(([k,l]) => (
          <button key={k} className={'arch-tab' + (tab === k ? ' is-active' : '')} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* pagination */}
      <div className="arch-pager">
        <span className="arch-pager-lbl mono">Vezi pagina</span>
        <div className="arch-pages">
          {pages.map((p, i) => p === '…'
            ? <span key={i} className="arch-ellip">…</span>
            : <button key={i} className={'arch-page mono' + (page === p ? ' is-active' : '')} onClick={() => setPage(p)}>{p}</button>)}
        </div>
        <span className="arch-results mono">(1971 rezultate)</span>
        <button className="arch-reload" onClick={() => setPage(1)} aria-label="reload"><Icon name="refresh" size={16}/></button>
      </div>

      {/* table */}
      <div className="arch-table-wrap hud">
        <span className="hud-corners"></span>
        <table className="arch-table">
          <thead>
            <tr>{cols.map(c => <th key={c.t}><span className="th-in"><Icon name={c.ic} size={13}/> {c.t}</span></th>)}</tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.nr} className="ar-row-link" onClick={() => navigate('problem')} title="Open problem">
                <td className="ar-nr mono">{p.nr}</td>
                <td className="ar-title"><span className="ar-check">{p.solved ? <Icon name="check" size={14} stroke={2.4}/> : null}</span><span className="ar-title-txt">{p.title}</span></td>
                <td className="ar-author">{p.author}</td>
                <td className="ar-source">{p.source}</td>
                <td className="ar-ed">{p.editorial === 'locked'
                  ? <span className="ed-locked">Locked <Icon name="lock" size={12}/></span>
                  : <span className="ed-open">Open</span>}</td>
                <td className="ar-diff"><span className={'diff-badge diff-' + p.diff}>{p.diff}</span></td>
                <td className="ar-score">{p.score == null ? <span className="score-na">N/A</span> : <span className="score-v mono">{p.score}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { Archive });
