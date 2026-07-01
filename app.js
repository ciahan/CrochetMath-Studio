const TAU = Math.PI * 2;
let currentFn = 'sin';
let currentShape = 'heart';
let currentMode = 'fn';
let opts = { mirror: false, repeat: false, compare: false };
let historyStack = [];
let historyIndex = -1;
let restoringState = false;

function captureState() {
  return {
    fn: currentFn, mode: currentMode, shape: currentShape,
    mirror: opts.mirror, repeat: opts.repeat,
    rows: document.getElementById('rows').value,
    cols: document.getElementById('cols').value,
    thick: document.getElementById('thick').value,
    c1: document.getElementById('c1').value,
    c2: document.getElementById('c2').value,
    customEq: document.getElementById('custom-eq-input') ? document.getElementById('custom-eq-input').value : ''
  };
}

function pushHistory() {
  if (restoringState) return;
  const state = captureState();
  const last = historyStack[historyIndex];
  if (last && JSON.stringify(last) === JSON.stringify(state)) return;
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(state);
  if (historyStack.length > 50) historyStack.shift();
  historyIndex = historyStack.length - 1;
  updateUndoRedoButtons();
}

function applyStateToUI(state) {
  restoringState = true;
  currentFn = state.fn; currentMode = state.mode; currentShape = state.shape;
  opts.mirror = state.mirror; opts.repeat = state.repeat;

  document.getElementById('rows').value = state.rows;
  document.getElementById('rv').textContent = state.rows;
  document.getElementById('cols').value = state.cols;
  document.getElementById('cv').textContent = state.cols;
  document.getElementById('thick').value = state.thick;
  document.getElementById('tv').textContent = state.thick;
  document.getElementById('c1').value = state.c1;
  document.getElementById('c2').value = state.c2;
  const c1hex = document.getElementById('c1hex'); if (c1hex) c1hex.value = state.c1;
  const c2hex = document.getElementById('c2hex'); if (c2hex) c2hex.value = state.c2;

  document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
  const modeIdx = state.mode === 'shape' ? 1 : 0;
  const modeBtns = document.querySelectorAll('.mode-tab');
  if (modeBtns[modeIdx]) modeBtns[modeIdx].classList.add('active');
  document.getElementById('fn-panel').style.display = state.mode === 'fn' ? '' : 'none';
  document.getElementById('shape-panel').style.display = state.mode === 'shape' ? '' : 'none';
  document.getElementById('thickness-row').style.display = state.mode === 'shape' ? 'none' : '';

  document.querySelectorAll('#fn-tabs .fn-tab').forEach(b => {
    b.classList.remove('active'); b.style.background = ''; b.style.borderColor = '';
  });
  document.querySelectorAll('#fn-tabs .fn-tab').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${state.fn}'`)) {
      b.classList.add('active'); b.style.background = state.c1; b.style.borderColor = state.c1;
    }
  });
  document.querySelectorAll('#shape-tabs .fn-tab').forEach(b => {
    b.classList.remove('active');
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${state.shape}'`)) {
      b.classList.add('active');
    }
  });

  document.getElementById('tog-mirror').classList.toggle('on', opts.mirror);
  document.getElementById('tog-repeat').classList.toggle('on', opts.repeat);

  const ceInput = document.getElementById('custom-eq-input');
  if (ceInput) {
    ceInput.value = state.customEq || '';
    if (state.customEq) {
      const result = validateCustomEq(state.customEq);
      if (typeof result === 'function') { customEqFn = result; ceInput.className = 'custom-eq-input eq-ok'; }
    } else {
      ceInput.className = 'custom-eq-input';
      customEqFn = null;
    }
  }

  restoringState = false;
  softRender();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  applyStateToUI(historyStack[historyIndex]);
  updateUndoRedoButtons();
}

function redo() {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex++;
  applyStateToUI(historyStack[historyIndex]);
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const u = document.getElementById('undo-btn');
  const r = document.getElementById('redo-btn');
  if (u) u.disabled = historyIndex <= 0;
  if (r) r.disabled = historyIndex >= historyStack.length - 1;
}
let animFrame = null;
let animState = { running:false, paused:false, row:0, rows:0, lastTime:0, interval:14 };
let savedPatterns = JSON.parse(localStorage.getItem('crochetmath_saved') || '[]');

// ── SHAPE GRIDS ──
const SHAPES = {
  heart: [
    [0,0,0,1,1,0,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
  diamond: [
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0],
  ],
  star: [
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0],
  ],
  butterfly: [
    [1,1,0,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,1,1,1],
    [0,1,1,1,0,1,0,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,0,1,0,1,1,1,0],
    [1,1,1,0,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,0,0,1,1],
  ],
  wave: [
    [0,0,0,0,0,0,1,1,1,1,1,1],
    [0,0,0,1,1,1,1,0,0,0,0,0],
    [1,1,1,1,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,1,1],
    [0,0,0,0,0,0,0,1,1,1,1,0],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,1,1,1,1,0,0,0,0,0,0,0],
    [1,1,0,0,0,0,0,0,0,0,1,1],
  ],
  arrow: [
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
  ],
  cross: [
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
  ],
  moon: [
    [0,0,0,0,1,1,1,1,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,0,1,1,0],
    [0,1,1,1,1,1,0,0,0,1,0],
    [0,1,1,1,1,0,0,0,0,1,0],
    [0,1,1,1,1,0,0,0,0,1,0],
    [0,0,1,1,1,1,1,0,1,1,0],
    [0,0,0,1,1,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,0,0,0],
  ],
  tree: [
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
  ],
  crown: [
    [1,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,1,0,0,0,1,1],
    [1,1,1,0,1,1,1,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
  ],
  hexagon: [
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
  ],
  zigzag: [
    [1,1,1,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0],
    [0,0,0,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,1,1],
  ],
};

const MATH_DESC = {
  sin:       'y = sin(x) — smooth oscillation between −1 and +1. The equation behind the scarf in the banner.',
  cos:       'y = cos(x) — cosine is sine shifted by π/2, starting at the peak instead of zero.',
  heart:     'y = sin(u)·|cos(u)|, u ∈ [−π,π] — a parametric envelope that pinches into a heart silhouette.',
  rose:      'y = cos(2x) — a rose curve with 4 petals, producing a zigzag that changes direction 4× per cycle.',
  spiral:    'y = sin(3x)·(row/rows) — amplitude grows linearly with each row. A spiral unfolding.',
  lissajous: 'y = sin(3x + π/4) — a Lissajous-style figure with π/4 phase offset.',
  triangle:  'y = (2/π)·arcsin(sin(x)) — sharp V-shapes with linear slopes. Very wearable as a scarf.',
  bounce:    'y = |sin(x)| — sine folded onto itself. All arches, no troughs.',
  damped:    'y = sin(x)·e^(−x/8) — amplitude decays exponentially. Starts wide, tightens toward center.',
  chirp:     'y = sin(x²/π) — frequency increases as rows go down. Starts slow, accelerates.',
  sawtooth:  'y = 2(x/2π − floor(x/2π + 0.5)) — a repeating diagonal staircase pattern.',
  harmonic:  'y = sin(x) + 0.5·sin(2x) — two harmonics added together, creating an irregular organic rhythm.',
};

const PRESETS = [
  { fn:'sin',       rows:60,cols:30,c1:'#7F77DD',c2:'#EEEDFE',thick:2,mirror:false,repeat:false,label:'Sine wave scarf',tag:'function' },
  { fn:'cos',       rows:60,cols:30,c1:'#1D9E75',c2:'#E1F5EE',thick:1,mirror:false,repeat:false,label:'Cosine pattern',tag:'function' },
  { fn:'rose',      rows:60,cols:30,c1:'#D4537E',c2:'#FBEAF0',thick:2,mirror:false,repeat:false,label:'Rose curve',tag:'function' },
  { fn:'spiral',    rows:80,cols:30,c1:'#5a3e8a',c2:'#ece6f7',thick:2,mirror:false,repeat:false,label:'Spiral',tag:'function' },
  { fn:'lissajous', rows:60,cols:30,c1:'#2a6496',c2:'#dff0ff',thick:2,mirror:false,repeat:false,label:'Lissajous',tag:'function' },
  { fn:'triangle',  rows:70,cols:30,c1:'#2a6496',c2:'#dff0ff',thick:2,mirror:false,repeat:false,label:'Triangle wave',tag:'function' },
  { fn:'bounce',    rows:60,cols:30,c1:'#D4537E',c2:'#FBEAF0',thick:2,mirror:false,repeat:false,label:'Bounce arches',tag:'function' },
  { fn:'damped',    rows:80,cols:30,c1:'#5a3e8a',c2:'#ece6f7',thick:1,mirror:false,repeat:false,label:'Damped sine',tag:'function' },
  { fn:'chirp',     rows:80,cols:35,c1:'#D85A30',c2:'#FAECE7',thick:1,mirror:false,repeat:false,label:'Chirp',tag:'function' },
  { fn:'harmonic',  rows:60,cols:30,c1:'#BA7517',c2:'#FAEEDA',thick:2,mirror:false,repeat:false,label:'Harmonic wave',tag:'function' },
  { fn:'sawtooth',  rows:60,cols:30,c1:'#1a6b5e',c2:'#d8f2ee',thick:1,mirror:false,repeat:false,label:'Sawtooth',tag:'function' },
  { fn:'sin',       rows:60,cols:40,c1:'#7F77DD',c2:'#EEEDFE',thick:2,mirror:true,repeat:false,label:'Mirrored sine',tag:'mirror' },
  { fn:'heart',     rows:80,cols:40,c1:'#D4537E',c2:'#FBEAF0',thick:1,mirror:true,repeat:false,label:'Heart curve ×2',tag:'mirror' },
  { fn:'bounce',    rows:60,cols:40,c1:'#2a6496',c2:'#dff0ff',thick:2,mirror:false,repeat:true,label:'Bounce repeat',tag:'repeat' },
  { fn:'triangle',  rows:60,cols:40,c1:'#1D9E75',c2:'#E1F5EE',thick:2,mirror:true,repeat:true,label:'Triangle tiled',tag:'repeat' },
  // Distinctive function presets
  { fn:'pulse',        rows:60,cols:30,c1:'#C0392B',c2:'#FDECEA',thick:2,mirror:false,repeat:false,label:'Square pulse',tag:'function' },
  { fn:'ripple',       rows:80,cols:35,c1:'#1a6b9e',c2:'#dff0ff',thick:1,mirror:false,repeat:false,label:'Ripple wave',tag:'function' },
  { fn:'tangent',      rows:70,cols:30,c1:'#7B1FA2',c2:'#F3E5F5',thick:1,mirror:false,repeat:false,label:'Tangent arcs',tag:'function' },
  { fn:'folded',       rows:60,cols:30,c1:'#2E7D32',c2:'#E8F5E9',thick:2,mirror:false,repeat:false,label:'Folded sine',tag:'function' },
  { fn:'hypnotic',     rows:80,cols:30,c1:'#4527A0',c2:'#EDE7F6',thick:1,mirror:false,repeat:false,label:'Hypnotic',tag:'function' },
  { fn:'sharkfin',     rows:60,cols:30,c1:'#1a4a6b',c2:'#ddeeff',thick:2,mirror:false,repeat:false,label:'Shark Fin',tag:'function' },
  { fn:'irrational',   rows:80,cols:35,c1:'#5d3a1a',c2:'#fdf0e0',thick:1,mirror:false,repeat:false,label:'Irrational',tag:'function' },
  { fn:'quasiperiodic',rows:80,cols:35,c1:'#1a5c3a',c2:'#e0f5ec',thick:1,mirror:false,repeat:false,label:'Quasi-periodic',tag:'function' },
  { fn:'chirpmod',     rows:80,cols:35,c1:'#880E4F',c2:'#FCE4EC',thick:1,mirror:false,repeat:false,label:'Chirp Mod',tag:'function' },
  { fn:'interference', rows:80,cols:40,c1:'#1B5E20',c2:'#E8F5E9',thick:1,mirror:false,repeat:false,label:'Interference',tag:'function' },
  { fn:'triple',       rows:80,cols:35,c1:'#B71C1C',c2:'#FFEBEE',thick:1,mirror:false,repeat:false,label:'Triple product',tag:'function' },
  { fn:'exponchirp',   rows:80,cols:30,c1:'#0D47A1',c2:'#E3F2FD',thick:1,mirror:false,repeat:false,label:'Exp Chirp',tag:'function' },
  { fn:'pinched',      rows:60,cols:30,c1:'#4E342E',c2:'#EFEBE9',thick:2,mirror:false,repeat:false,label:'Pinched arches',tag:'function' },
  // Mirror combos
  { fn:'pulse',        rows:60,cols:40,c1:'#C0392B',c2:'#FDECEA',thick:2,mirror:true,repeat:false,label:'Pulse mirrored',tag:'mirror' },
  { fn:'folded',       rows:60,cols:40,c1:'#2E7D32',c2:'#E8F5E9',thick:2,mirror:true,repeat:false,label:'Folded mirror',tag:'mirror' },
  { fn:'hypnotic',     rows:80,cols:40,c1:'#4527A0',c2:'#EDE7F6',thick:1,mirror:true,repeat:false,label:'Hypnotic mirror',tag:'mirror' },
  { fn:'interference', rows:80,cols:40,c1:'#1B5E20',c2:'#E8F5E9',thick:1,mirror:true,repeat:false,label:'Interference mirror',tag:'mirror' },
  { fn:'sharkfin',     rows:60,cols:40,c1:'#1a4a6b',c2:'#ddeeff',thick:2,mirror:true,repeat:false,label:'Shark Fin mirror',tag:'mirror' },
  { fn:'triple',       rows:80,cols:40,c1:'#B71C1C',c2:'#FFEBEE',thick:1,mirror:true,repeat:false,label:'Triple mirror',tag:'mirror' },
  // Repeat/tiled combos
  { fn:'pulse',        rows:60,cols:40,c1:'#C0392B',c2:'#FDECEA',thick:1,mirror:false,repeat:true,label:'Pulse tiled',tag:'repeat' },
  { fn:'ripple',       rows:80,cols:40,c1:'#1a6b9e',c2:'#dff0ff',thick:1,mirror:true,repeat:true,label:'Ripple tiled',tag:'repeat' },
  { fn:'harmonic',     rows:80,cols:40,c1:'#BA7517',c2:'#FAEEDA',thick:2,mirror:true,repeat:true,label:'Harmonic tiled',tag:'repeat' },
  { fn:'quasiperiodic',rows:80,cols:40,c1:'#1a5c3a',c2:'#e0f5ec',thick:1,mirror:true,repeat:true,label:'Quasi tiled',tag:'repeat' },
  { fn:'chirpmod',     rows:80,cols:40,c1:'#880E4F',c2:'#FCE4EC',thick:1,mirror:true,repeat:true,label:'Chirp Mod tiled',tag:'repeat' },
  { fn:'cos',          rows:60,cols:30,c1:'#1D9E75',c2:'#E1F5EE',thick:2,mirror:true,repeat:false,label:'Cosine mirrored',tag:'mirror' },
  { fn:'wobble',        rows:60,cols:30,c1:'#0277BD',c2:'#E1F5FE',thick:2,mirror:false,repeat:false,label:'Wobble',tag:'function' },
  { fn:'sharkfin',      rows:60,cols:30,c1:'#37474F',c2:'#ECEFF1',thick:2,mirror:false,repeat:false,label:'Shark fin',tag:'function' },
  { fn:'irrational',    rows:80,cols:35,c1:'#558B2F',c2:'#F1F8E9',thick:1,mirror:false,repeat:false,label:'Irrational',tag:'function' },
  { fn:'quasiperiodic', rows:80,cols:35,c1:'#6A1B9A',c2:'#F3E5F5',thick:1,mirror:false,repeat:false,label:'Quasi-periodic',tag:'function' },
  { fn:'fattened',      rows:60,cols:30,c1:'#BF360C',c2:'#FBE9E7',thick:3,mirror:false,repeat:false,label:'Fattened sine',tag:'function' },
  { fn:'triple',        rows:80,cols:30,c1:'#1B5E20',c2:'#E8F5E9',thick:1,mirror:false,repeat:false,label:'Triple product',tag:'function' },
  { fn:'wobble',        rows:60,cols:40,c1:'#0277BD',c2:'#E1F5FE',thick:2,mirror:true,repeat:false,label:'Wobble mirror',tag:'mirror' },
  { fn:'sharkfin',      rows:60,cols:40,c1:'#37474F',c2:'#ECEFF1',thick:2,mirror:true,repeat:false,label:'Shark fin mirror',tag:'mirror' },
  { fn:'irrational',    rows:80,cols:40,c1:'#558B2F',c2:'#F1F8E9',thick:1,mirror:true,repeat:true,label:'Irrational tiled',tag:'repeat' },
  { fn:'quasiperiodic', rows:80,cols:40,c1:'#6A1B9A',c2:'#F3E5F5',thick:1,mirror:true,repeat:true,label:'Quasi tiled',tag:'repeat' },
  { fn:'triple',        rows:80,cols:40,c1:'#1B5E20',c2:'#E8F5E9',thick:1,mirror:true,repeat:true,label:'Triple tiled',tag:'repeat' },
]

// ── MATH FUNCTIONS ──
function getY(fn, r, rows) {
  const x = (r / rows) * TAU;
  switch(fn) {
    case 'sin':           return Math.sin(x);
    case 'triangle':      return (2 / Math.PI) * Math.asin(Math.sin(x));
    case 'pulse':         return Math.sin(x) > 0 ? 1 : -1;
    case 'sawtooth':      { const t = x / TAU; return 2 * (t - Math.floor(t + 0.5)); }
    case 'bounce':        return Math.abs(Math.sin(x));
    case 'chirp':         return Math.sin(x * x / Math.PI);
    case 'damped':        return Math.sin(x) * Math.exp(-x / 8);
    case 'harmonic':      return Math.sin(x) + 0.5 * Math.sin(2 * x);
    case 'hypnotic':      return Math.sin(x + Math.sin(2 * x + Math.sin(3 * x)));
    case 'sharkfin':      return Math.sign(Math.sin(x)) * Math.abs(Math.cos(x));
    case 'irrational':    return Math.sin(x * Math.PI) * Math.cos(x * Math.E);
    case 'quasiperiodic': return Math.sin(x) + Math.sin(Math.SQRT2 * x);
    case 'ripple':        { const d = r / rows; return Math.sin(x / (d + 0.1)); }
    case 'tangent':       { const v = Math.tanh(Math.tan(x % (Math.PI/2))); return isFinite(v) ? v : 0; }
    case 'folded':        return Math.sin(x) * Math.cos(3 * x);
    case 'rose':          return Math.cos(2 * x);
    case 'spiral':        return Math.sin(3 * x) * (r / rows);
    case 'heart':         { const u = x - Math.PI; return Math.sin(u) * Math.abs(Math.cos(u)); }
    case 'chirpmod':      return Math.sin(x * x) * Math.cos(x);
    case 'interference':  return Math.sin(7 * x) * Math.cos(11 * x);
    case 'triple':        return Math.sin(x) * Math.cos(2 * x) * Math.sin(3 * x);
    case 'quanthard':     return Math.floor(Math.sin(x) * 3) / 3;
    case 'exponchirp':    return Math.sin(Math.exp(x / Math.PI));
    case 'pinched':       return Math.cos(x) * Math.exp(-Math.abs(Math.sin(x)));
    case 'custom':        return evalCustomEq(x, r, rows);
    // kept for URL/saved pattern compatibility
    case 'cos':           return Math.cos(x);
    case 'lissajous':     return Math.sin(3 * x + Math.PI / 4);
    case 'staircase':     return Math.round(Math.sin(x) * 4) / 4;
    case 'beats':         return Math.sin(x) * Math.sin(0.1 * x);
    case 'sigmoid':       { const s = (r / rows) * 12 - 6; return 2 / (1 + Math.exp(-s)) - 1; }
    case 'wobble':        return Math.sin(x + Math.cos(x));
    case 'fattened':      return Math.tanh(3 * Math.sin(x));
    default:              return Math.sin(x);
  }
}

// ── GETTERS ──
function getS() {
  return {
    fn:     currentFn,
    rows:   parseInt(document.getElementById('rows').value),
    cols:   parseInt(document.getElementById('cols').value),
    thick:  parseInt(document.getElementById('thick').value),
    c1:     document.getElementById('c1').value,
    c2:     document.getElementById('c2').value,
    mirror: opts.mirror,
    repeat: opts.repeat,
    mode:   currentMode,
    shape:  currentShape,
  };
}

// ── DRAW ──
function drawGrid(canvas, s, upToRow) {
  const wrap = document.getElementById('canvas-wrap');
  const maxW = wrap ? Math.floor(wrap.getBoundingClientRect().width) || 540 : 540;
  const CW = Math.max(4, Math.floor(maxW / s.cols));
  const CH = Math.max(3, Math.min(9, CW));
  canvas.width  = s.cols * CW;
  canvas.height = s.rows * CH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = s.c2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const limit = (upToRow !== undefined) ? upToRow : s.rows;

  if (s.mode === 'shape') {
    drawShape(ctx, s, CW, CH, limit);
  } else {
    drawFn(ctx, s, CW, CH, limit);
  }
}

function drawFn(ctx, s, CW, CH, limit) {
  for (let r = 0; r < limit; r++) {
    const y = getY(s.fn, r, s.rows);
    let col = Math.round((y + 1) / 2 * (s.cols - 1));

    // repeat: tile the function N times across
    const reps = s.repeat ? 3 : 1;
    const segW = Math.floor(s.cols / reps);

    for (let rep = 0; rep < reps; rep++) {
      let c = col % segW;
      if (s.mirror) c = Math.round(segW / 2 - Math.abs(c - segW / 2));
      const offset = rep * segW;
      for (let t = 0; t < s.thick; t++) {
        const fc = Math.min(s.cols - 1, offset + c + t);
        ctx.fillStyle = s.c1;
        ctx.fillRect(fc * CW, r * CH, CW - 1, CH - 1);
        if (s.mirror) {
          const mc = offset + segW - 1 - c - t;
          if (mc >= offset && mc < offset + segW) {
            ctx.fillStyle = s.c1;
            ctx.fillRect(mc * CW, r * CH, CW - 1, CH - 1);
          }
        }
      }
    }
  }
}

function drawShape(ctx, s, CW, CH, limit) {
  const grid = SHAPES[s.shape];
  if (!grid) return;
  const gh = grid.length, gw = grid[0].length;
  const scaleR = s.rows / gh;
  const scaleC = s.cols / gw;
  for (let r = 0; r < Math.min(limit, s.rows); r++) {
    const gr = Math.floor(r / scaleR);
    for (let c = 0; c < s.cols; c++) {
      const gc = Math.floor(c / scaleC);
      if (gr < gh && gc < gw && grid[gr][gc] === 1) {
        ctx.fillStyle = s.c1;
        ctx.fillRect(c * CW, r * CH, CW - 1, CH - 1);
      }
    }
  }
}

// ── RENDER ──
function softRender() {
  stopAnimation(false);
  const s = getS();
  drawGrid(document.getElementById('main-canvas'), s);
  updateNote(s);
  updateCompare(s);
  updateStitchesData(s);
  saveToURL(s);
  pushHistory();
}

// ── DEBOUNCE (for sliders — avoid re-rendering on every pixel of drag) ──
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
const debouncedRender = debounce(softRender, 120);

function drawAnimatedRow(ctx, s, CW, CH, r) {
  if (s.mode === 'shape') {
    drawShape(ctx, s, CW, CH, r + 1);
    return;
  }
  const y = getY(s.fn, r, s.rows);
  let col = Math.round((y + 1) / 2 * (s.cols - 1));
  const reps = s.repeat ? 3 : 1;
  const segW = Math.max(1, Math.floor(s.cols / reps));
  for (let rep = 0; rep < reps; rep++) {
    let c = col % segW;
    if (s.mirror) c = Math.round(segW / 2 - Math.abs(c - segW / 2));
    const offset = rep * segW;
    for (let t = 0; t < s.thick; t++) {
      const fc = Math.min(s.cols - 1, offset + c + t);
      ctx.fillStyle = s.c1;
      ctx.fillRect(fc * CW, r * CH, CW - 1, CH - 1);
      if (s.mirror) {
        const mc = offset + segW - 1 - c - t;
        if (mc >= offset && mc < offset + segW) {
          ctx.fillStyle = s.c1;
          ctx.fillRect(mc * CW, r * CH, CW - 1, CH - 1);
        }
      }
    }
  }
}

function animatePattern() {
  gtag('event', 'animate_pattern', { event_category: 'engagement' });
  stopAnimation(false);
  const s = getS();
  const canvas = document.getElementById('main-canvas');
  const wrap = document.getElementById('canvas-wrap');
  const maxW = wrap ? Math.floor(wrap.getBoundingClientRect().width) || 540 : 540;
  const CW = Math.max(4, Math.floor(maxW / s.cols));
  const CH = Math.max(3, Math.min(9, CW));
  canvas.width = s.cols * CW;
  canvas.height = s.rows * CH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = s.c2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  updateNote(s);

  animState = { running:true, paused:false, row:0, rows:s.rows, lastTime:0, interval:getAnimSpeed(), s, ctx, CW, CH };
  setAnimationUI(true, false);
  updateProgress(0, s.rows);

  const frame = (timestamp) => {
    if (!animState.running) return;
    if (animState.paused) {
      animFrame = requestAnimationFrame(frame);
      return;
    }
    if (!animState.lastTime) animState.lastTime = timestamp;
    const elapsed = timestamp - animState.lastTime;
    const rowsPerFrame = animState.interval <= 4 ? 2 : 1;
    if (elapsed >= animState.interval) {
      for (let i = 0; i < rowsPerFrame && animState.row < s.rows; i++) {
        drawAnimatedRow(ctx, s, CW, CH, animState.row);
        animState.row++;
      }
      animState.lastTime = timestamp;
      updateProgress(animState.row, s.rows);
    }
    if (animState.row >= s.rows) {
      finishAnimation(s);
      return;
    }
    animFrame = requestAnimationFrame(frame);
  };
  animFrame = requestAnimationFrame(frame);
}

function finishAnimation(s) {
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = null;
  animState.running = false;
  animState.paused = false;
  updateProgress(s.rows, s.rows);
  setAnimationUI(false, false);
  updateCompare(s);
  updateStitchesData(s);
  saveToURL(s);
  showToast('Animation complete');
}

function togglePauseAnimation() {
  if (!animState.running) { animatePattern(); return; }
  animState.paused = !animState.paused;
  setAnimationUI(true, animState.paused);
}

function stopAnimation(showMessage = true) {
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = null;
  const wasRunning = animState.running;
  animState.running = false;
  animState.paused = false;
  setAnimationUI(false, false);
  if (wasRunning && showMessage) showToast('Animation stopped');
}

function setAnimationUI(running, paused) {
  const panel = document.getElementById('animation-panel');
  const animateBtn = document.getElementById('animate-btn');
  const pauseBtn = document.getElementById('pause-btn');
  if (panel) panel.classList.toggle('show', running);
  if (animateBtn) animateBtn.textContent = running ? '↻ Restart animation' : '▶ Animate row by row';
  if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
}

function updateProgress(row, rows) {
  const pct = rows ? Math.round((row / rows) * 100) : 0;
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  const pctEl = document.getElementById('progress-pct');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `Row ${Math.min(row, rows)} / ${rows}`;
  if (pctEl) pctEl.textContent = pct + '%';
}


function updateNote(s) {
  const el = document.getElementById('math-note');
  if (s.mode === 'shape') {
    el.textContent = 'Shape mode — the pattern is defined by a 2D grid of filled and open squares, like filet crochet.';
  } else {
    el.textContent = MATH_DESC[s.fn] || '';
  }
}

function updateCompare(s) {
  if (!opts.compare) return;
  const cc = document.getElementById('compare-canvas');
  const ps = { ...s, fn: 'sin', rows: 60, cols: 30, thick: 2, mirror: false, repeat: false, mode: 'fn' };
  drawGrid(cc, ps);
}

// ── STITCH INSTRUCTIONS ──
let stitchText = '';
function updateStitchesData(s) {
  if (s.mode === 'shape') {
    stitchText = 'Stitch instructions are available for function mode only.';
    return;
  }
  let text = `${s.fn} pattern — ${s.rows} rows × ${s.cols} cols, thickness ${s.thick}\n${'-'.repeat(44)}\n`;
  for (let r = 0; r < s.rows; r++) {
    const y   = getY(s.fn, r, s.rows);
    const col = Math.round((y + 1) / 2 * (s.cols - 1));
    const before = col;
    const after  = Math.max(0, s.cols - col - s.thick);
    text += `Row ${String(r+1).padStart(3)}: ${before} off, ${s.thick} ON, ${after} off\n`;
  }
  stitchText = text;
  if (document.getElementById('stitch-out').classList.contains('open')) {
    document.getElementById('stitch-out').textContent = stitchText;
  }
}

function toggleStitches() {
  const el  = document.getElementById('stitch-out');
  const btn = document.querySelector('.stitch-toggle');
  el.classList.toggle('open');
  if (el.classList.contains('open')) {
    el.textContent = stitchText;
    btn.textContent = 'Hide stitch instructions';
  } else {
    btn.textContent = 'Show stitch instructions';
  }
}

// ── SETTERS ──
function setMode(mode, btn) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('fn-panel').style.display = mode === 'fn' ? '' : 'none';
  document.getElementById('shape-panel').style.display = mode === 'shape' ? '' : 'none';
  document.getElementById('thickness-row').style.display = mode === 'shape' ? 'none' : '';
  softRender();
}


// ── CUSTOM EQUATION ──
let customEqFn = null;
let customEqDebounce = null;

function buildCustomFn(expr) {
  // Safe math scope — no access to window/document
  const code = `
    "use strict";
    const sin=Math.sin,cos=Math.cos,tan=Math.tan,abs=Math.abs,
          sqrt=Math.sqrt,pow=Math.pow,log=Math.log,exp=Math.exp,
          floor=Math.floor,ceil=Math.ceil,round=Math.round,
          sign=Math.sign,PI=Math.PI,E=Math.E,TAU=Math.PI*2;
    return (function(x,r,rows){return (${expr});});
  `;
  // eslint-disable-next-line no-new-func
  return new Function(code)();
}

function validateCustomEq(expr) {
  if (!expr.trim()) return null;
  // Block dangerous keywords
  const forbidden = /(window|document|fetch|eval|Function|import|require|alert|location|cookie|localStorage|sessionStorage)/;
  if (forbidden.test(expr)) return 'Forbidden keyword in expression';
  try {
    const fn = buildCustomFn(expr);
    // Test with a few x values
    [0, 1, Math.PI, Math.PI*2].forEach(x => {
      const v = fn(x, 0, 60);
      if (typeof v !== 'number' || isNaN(v)) throw new Error('Returns non-number');
    });
    return fn; // valid
  } catch(e) {
    return e.message || 'Invalid expression';
  }
}

function onCustomEqInput(val) {
  clearTimeout(customEqDebounce);
  const input = document.getElementById('custom-eq-input');
  const errEl = document.getElementById('custom-eq-error');
  if (!val.trim()) {
    input.className = 'custom-eq-input';
    errEl.textContent = '';
    return;
  }
  customEqDebounce = setTimeout(() => {
    const result = validateCustomEq(val);
    if (typeof result === 'function') {
      input.className = 'custom-eq-input eq-ok';
      errEl.textContent = '';
      customEqFn = result;
      // Live render
      deactivatePresets();
      currentFn = 'custom';
      softRender();
    } else {
      input.className = 'custom-eq-input eq-error';
      errEl.textContent = result || 'Invalid expression';
    }
  }, 400);
}

function applyCustomEq() {
  const val = document.getElementById('custom-eq-input').value;
  const result = validateCustomEq(val);
  const errEl = document.getElementById('custom-eq-error');
  const input = document.getElementById('custom-eq-input');
  if (typeof result === 'function') {
    customEqFn = result;
    input.className = 'custom-eq-input eq-ok';
    errEl.textContent = '';
    deactivatePresets();
    currentFn = 'custom';
    softRender();
  } else {
    input.className = 'custom-eq-input eq-error';
    errEl.textContent = result || 'Invalid expression';
  }
}

function evalCustomEq(x, r, rows) {
  if (!customEqFn) return Math.sin(x);
  try {
    const v = customEqFn(x, r, rows);
    if (!isFinite(v)) return 0;
    // If value is already in [-1,1] use directly; otherwise normalize via tanh so out-of-range equations still produce interesting patterns
    return (v >= -1 && v <= 1) ? v : Math.tanh(v);
  } catch(e) {
    return 0;
  }
}

function deactivatePresets() {
  document.querySelectorAll('#fn-tabs .fn-tab').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.borderColor = '';
  });
}

function setFn(fn, btn) {
  currentFn = fn;
  // Clear custom eq
  const ceInput = document.getElementById('custom-eq-input');
  if (ceInput) { ceInput.value = ''; ceInput.className = 'custom-eq-input'; }
  const ceErr = document.getElementById('custom-eq-error');
  if (ceErr) ceErr.textContent = '';
  customEqFn = null;
  document.querySelectorAll('#fn-tabs .fn-tab').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.borderColor = '';
  });
  btn.classList.add('active');
  const c1 = document.getElementById('c1').value;
  btn.style.background = c1;
  btn.style.borderColor = c1;
  softRender();
}

function setShape(shape, btn) {
  currentShape = shape;
  document.querySelectorAll('#shape-tabs .fn-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  softRender();
}

function toggleOpt(key) {
  opts[key] = !opts[key];
  document.getElementById('tog-' + key).classList.toggle('on', opts[key]);
  if (key === 'compare') {
    document.getElementById('compare-strip').classList.toggle('show', opts[key]);
    if (opts[key]) updateCompare(getS());
  }
  softRender();
}

// ── URL ──
function saveToURL(s) {
  if (s.mode === 'shape') return;
  const p = new URLSearchParams({
    fn:s.fn, rows:s.rows, cols:s.cols, thick:s.thick,
    c1:s.c1.replace('#',''), c2:s.c2.replace('#',''),
    mirror:s.mirror?1:0, repeat:s.repeat?1:0
  });
  history.replaceState(null, '', '?' + p.toString());
  document.getElementById('share-url').value = location.href;
}

function syncHex(colorId, hexId) {
  const el = document.getElementById(hexId);
  if (el) el.value = document.getElementById(colorId).value;
}
function syncColor(hexId, colorId) {
  const val = document.getElementById(hexId).value;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    document.getElementById(colorId).value = val;
  }
}

function copyURL() {
  const url = document.getElementById('share-url').value;
  if (!url) return;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.share-copy');
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.color = '#2ca87f';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1800);
  }).catch(() => {
    document.getElementById('share-url').select();
    document.execCommand('copy');
  });
}

function loadFromURL() {
  const p = new URLSearchParams(location.search);
  if (!p.get('fn')) return;
  currentFn = p.get('fn');
  if (p.get('rows')) { document.getElementById('rows').value = p.get('rows'); document.getElementById('rv').textContent = p.get('rows'); }
  if (p.get('cols')) { document.getElementById('cols').value = p.get('cols'); document.getElementById('cv').textContent = p.get('cols'); }
  if (p.get('thick')) { document.getElementById('thick').value = p.get('thick'); document.getElementById('tv').textContent = p.get('thick'); }
  if (p.get('c1')) document.getElementById('c1').value = '#' + p.get('c1');
  if (p.get('c2')) document.getElementById('c2').value = '#' + p.get('c2');
  if (p.get('mirror') === '1') { opts.mirror = true; document.getElementById('tog-mirror').classList.add('on'); }
  if (p.get('repeat') === '1') { opts.repeat = true; document.getElementById('tog-repeat').classList.add('on'); }
  document.querySelectorAll('#fn-tabs .fn-tab').forEach(b => {
    if (b.getAttribute('onclick').includes(`'${currentFn}'`)) b.classList.add('active');
    else b.classList.remove('active');
  });
}

// ── DOWNLOAD ──
function downloadPNG() {
  gtag('event', 'download_png', { event_category: 'engagement' });
  const canvas = document.getElementById('main-canvas');
  const a = document.createElement('a');
  a.download = 'crochetmath-' + (currentMode === 'shape' ? currentShape : currentFn) + '.png';
  a.href = canvas.toDataURL();
  a.click();
  showToast('PNG downloaded');
}

// ── GALLERY ──
function buildPresets() {
  const grid = document.getElementById('preset-grid');
  if (grid.children.length) return;
  PRESETS.forEach(p => {
    const item = document.createElement('div');
    item.className = 'g-item';
    const c = document.createElement('canvas');
    item.appendChild(c);
    const s = { ...p, mode:'fn', shape:'heart', mirror:p.mirror||false, repeat:p.repeat||false };
    drawGrid(c, s);
    const lbl = document.createElement('div'); lbl.className='g-label'; lbl.textContent=p.label;
    const tag = document.createElement('div'); tag.className='g-tag'; tag.textContent=p.tag;
    item.appendChild(lbl); item.appendChild(tag);
    grid.appendChild(item);
    item.onclick = () => loadPreset(p);
  });
}

function loadPreset(p) {
  currentFn = p.fn; currentMode = 'fn';
  document.getElementById('rows').value = p.rows; document.getElementById('rv').textContent = p.rows;
  document.getElementById('cols').value = p.cols; document.getElementById('cv').textContent = p.cols;
  document.getElementById('thick').value = p.thick||1; document.getElementById('tv').textContent = p.thick||1;
  document.getElementById('c1').value = p.c1;
  document.getElementById('c2').value = p.c2;
  opts.mirror = p.mirror||false; opts.repeat = p.repeat||false;
  document.getElementById('tog-mirror').classList.toggle('on', opts.mirror);
  document.getElementById('tog-repeat').classList.toggle('on', opts.repeat);
  document.querySelectorAll('#fn-tabs .fn-tab').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick').includes(`'${p.fn}'`));
  });
  document.querySelectorAll('.mode-tab').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes("'fn'")));
  document.getElementById('fn-panel').style.display = '';
  document.getElementById('shape-panel').style.display = 'none';
  document.getElementById('thickness-row').style.display = '';
  showPage('studio', document.querySelector('.nb'));
  document.querySelectorAll('.nb')[0].classList.add('active');
  updateStitchBtn();
  animatePattern();
}

function saveToGallery() {
  gtag('event', 'save_pattern', { event_category: 'engagement' });
  const modal = document.getElementById('save-modal');
  const input = document.getElementById('save-name-input');
  const confirmBtn = document.getElementById('save-confirm-btn');
  const c1 = document.getElementById('c1').value;
  // Theme the confirm button
  confirmBtn.style.background = c1;
  // Default name
  const s = getS();
  input.value = s.mode === 'shape' ? currentShape : currentFn;
  modal.style.display = 'flex';
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

function closeSaveModal() {
  document.getElementById('save-modal').style.display = 'none';
}

function confirmSave() {
  const name = document.getElementById('save-name-input').value.trim();
  if (!name) return;
  closeSaveModal();
  const s = getS();
  const entry = { ...s, label: name, id: Date.now() };
  savedPatterns.push(entry);
  localStorage.setItem('crochetmath_saved', JSON.stringify(savedPatterns));
  renderSavedGallery();
  const btn = document.querySelectorAll('.act-btn')[2];
  btn.textContent = '✓ Saved!';
  showToast('Pattern saved to gallery');
  setTimeout(() => btn.textContent = '☆ Save to gallery', 1800);
}

// Close modal when clicking backdrop
window.addEventListener('click', (e) => {
  const modal = document.getElementById('save-modal');
  if (e.target === modal) closeSaveModal();
});

function renderSavedGallery() {
  const grid = document.getElementById('saved-grid');
  const empty = document.getElementById('empty-msg');
  const title = document.getElementById('saved-title');
  grid.innerHTML = ''; // always clear first
  if (!savedPatterns.length) {
    empty.style.display = '';
    title.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  title.style.display = '';
  grid.innerHTML = '';
  savedPatterns.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'g-item';
    item.dataset.index = i;

    // Fixed thumbnail: draw at exact cell size then scale via CSS
    const c = document.createElement('canvas');
    const CW = Math.max(2, Math.floor(240 / p.cols));
    const CH = Math.max(2, Math.floor(180 / p.rows));
    c.width  = p.cols * CW;
    c.height = p.rows * CH;
    c.style.width  = '100%';
    c.style.display = 'block';
    const ctx = c.getContext('2d');
    ctx.fillStyle = p.c2;
    ctx.fillRect(0, 0, c.width, c.height);
    // draw pattern directly without drawGrid
    for (let r = 0; r < p.rows; r++) {
      const y = getY(p.fn, r, p.rows);
      let col = Math.round((y + 1) / 2 * (p.cols - 1));
      const reps = p.repeat ? 3 : 1;
      const segW = Math.floor(p.cols / reps);
      for (let rep = 0; rep < reps; rep++) {
        let c2 = col % segW;
        if (p.mirror) c2 = Math.round(segW / 2 - Math.abs(c2 - segW / 2));
        const offset = rep * segW;
        for (let t = 0; t < (p.thick||1); t++) {
          const fc = Math.min(p.cols - 1, offset + c2 + t);
          ctx.fillStyle = p.c1;
          ctx.fillRect(fc * CW, r * CH, CW - 1, CH - 1);
          if (p.mirror) {
            const mc = offset + segW - 1 - c2 - t;
            if (mc >= offset && mc < offset + segW) {
              ctx.fillStyle = p.c1;
              ctx.fillRect(mc * CW, r * CH, CW - 1, CH - 1);
            }
          }
        }
      }
    }
    item.appendChild(c);

    const lbl = document.createElement('div');
    lbl.className = 'g-label';
    lbl.textContent = p.label || p.fn || 'pattern';

    const del = document.createElement('div');
    del.className = 'g-tag';
    const removeBtn = document.createElement('span');
    removeBtn.textContent = '× remove';
    removeBtn.style.cssText = 'cursor:pointer;color:var(--purple)';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Always reload from localStorage to ensure we have the latest data
      savedPatterns = JSON.parse(localStorage.getItem('crochetmath_saved') || '[]');
      let idx = -1;
      for (let j = 0; j < savedPatterns.length; j++) {
        const x = savedPatterns[j];
        if (x.fn === p.fn && x.rows === p.rows && x.cols === p.cols && x.c1 === p.c1) {
          idx = j; break;
        }
      }
      console.log('remove clicked, p=', p.fn, 'idx=', idx, 'savedPatterns=', savedPatterns.length);
      if (idx !== -1) {
        savedPatterns.splice(idx, 1);
        localStorage.setItem('crochetmath_saved', JSON.stringify(savedPatterns));
        renderSavedGallery();
      } else {
        // Last resort: clear all and re-render
        console.warn('Pattern not found by match, clearing all');
      }
    });
    del.appendChild(removeBtn);

    item.appendChild(lbl);
    item.appendChild(del);
    grid.appendChild(item);
    item.addEventListener('click', () => loadPreset(p));
  });
}

function deleteSaved(i) {
  savedPatterns.splice(i, 1);
  localStorage.setItem('crochetmath_saved', JSON.stringify(savedPatterns));
  renderSavedGallery();
}

// ── PAGE NAV ──
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
  if (id === 'gallery') { buildPresets(); renderSavedGallery(); }
}

// ── PALETTES ──
const PALETTES = [
  { name:'Sine scarf',  c1:'#7F77DD', c2:'#EEEDFE' },
  { name:'Ocean',       c1:'#2a6496', c2:'#dff0ff' },
  { name:'Rose',        c1:'#D4537E', c2:'#FBEAF0' },
  { name:'Forest',      c1:'#1D9E75', c2:'#E1F5EE' },
  { name:'Sunset',      c1:'#D85A30', c2:'#FAECE7' },
  { name:'Lavender',    c1:'#5a3e8a', c2:'#ece6f7' },
  { name:'Honey',       c1:'#BA7517', c2:'#FAEEDA' },
  { name:'Slate',       c1:'#3d5166', c2:'#e4eaf0' },
  { name:'Berry',       c1:'#8b1a4a', c2:'#fce8f0' },
  { name:'Sage',        c1:'#4a7c59', c2:'#e6f2ea' },
  { name:'Midnight',    c1:'#1c2233', c2:'#e8eaf0' },
  { name:'Sand',        c1:'#a07850', c2:'#f5ede0' },
];

let activePalette = 0;

function updateStitchBtn() {
  const c1 = document.getElementById('c1').value;
  const r = parseInt(c1.slice(1,3),16), g = parseInt(c1.slice(3,5),16), b = parseInt(c1.slice(5,7),16);
  const dr = Math.floor(r*0.6), dg = Math.floor(g*0.6), db = Math.floor(b*0.6);
  const shadow = `rgb(${dr},${dg},${db})`;
  const glow = `rgba(${r},${g},${b},.35)`;
  const light = `rgba(${r},${g},${b},.15)`;
  const boxShadow3d = `0 4px 0 ${shadow}, 0 6px 8px ${glow}`;

  // Stitch instructions button
  const stitchBtn = document.querySelector('.stitch-toggle');
  if (stitchBtn) {
    stitchBtn.style.background = c1;
    stitchBtn.style.boxShadow = boxShadow3d;
  }

  // Animate button - 3D same style
  const animBtn = document.getElementById('animate-btn');
  if (animBtn) {
    animBtn.style.background = c1;
    animBtn.style.boxShadow = boxShadow3d;
    animBtn.style.color = '#fff';
    animBtn.style.border = 'none';
  }

  // Surprise me button - keep gradient but tint with c1
  const surpriseBtn = document.querySelector('.btn-random');
  if (surpriseBtn) {
    const c2 = document.getElementById('c2').value;
    surpriseBtn.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
    surpriseBtn.style.boxShadow = boxShadow3d;
    surpriseBtn.style.color = '#fff';
  }

  // Speed slider accent color
  const speed = document.getElementById('speed');
  if (speed) {
    speed.style.accentColor = c1;
  }

  // Sliders accent color
  document.querySelectorAll('.sl-row input[type=range]').forEach(s => s.style.accentColor = c1);

  // Slider value numbers
  document.querySelectorAll('.sl-val').forEach(v => v.style.color = c1);

  // Active function tab
  document.querySelectorAll('.fn-tab.active').forEach(t => {
    t.style.background = c1;
    t.style.borderColor = c1;
  });

  // Inactive fn-tab hover handled via CSS var
  document.documentElement.style.setProperty('--c1-current', c1);
}

function buildPalettes() {
  const grid = document.getElementById('palette-grid');
  PALETTES.forEach((p, i) => {
    const sw = document.createElement('div');
    sw.className = 'palette-swatch' + (i === 0 ? ' active' : '');
    sw.title = p.name;
    sw.innerHTML = `<div class="swatch-off" style="background:${p.c2}"></div><div class="swatch-on" style="background:${p.c1}"></div>`;
    sw.onclick = () => {
      document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      activePalette = i;
      document.getElementById('c1').value = p.c1;
      document.getElementById('c2').value = p.c2;
      updateStitchBtn();
      softRender();
    };
    grid.appendChild(sw);
  });
}

// ── RANDOM ──
function randomPattern() {
  gtag('event', 'surprise_me', { event_category: 'engagement' });
  const fns = ['sin','cos','heart','rose','spiral','lissajous','triangle','bounce','damped','chirp','sawtooth','harmonic'];
  const fn = fns[Math.floor(Math.random() * fns.length)];
  const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const rows = 40 + Math.floor(Math.random() * 60);
  const cols = 20 + Math.floor(Math.random() * 30);
  const thick = 1 + Math.floor(Math.random() * 3);
  const mirror = Math.random() > 0.6;
  const repeat = Math.random() > 0.7;

  currentFn = fn; currentMode = 'fn';
  document.getElementById('rows').value = rows; document.getElementById('rv').textContent = rows;
  document.getElementById('cols').value = cols; document.getElementById('cv').textContent = cols;
  document.getElementById('thick').value = thick; document.getElementById('tv').textContent = thick;
  document.getElementById('c1').value = pal.c1;
  document.getElementById('c2').value = pal.c2;
  opts.mirror = mirror; opts.repeat = repeat;
  document.getElementById('tog-mirror').classList.toggle('on', mirror);
  document.getElementById('tog-repeat').classList.toggle('on', repeat);

  document.querySelectorAll('#fn-tabs .fn-tab').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick').includes(`'${fn}'`));
  });
  updateStitchBtn();
  animatePattern();
}

// ── ANIMATION SPEED ──
function getAnimSpeed() {
  const v = parseInt(document.getElementById('speed').value);
  return [90, 45, 18, 8, 3][v - 1];
}

function showToast(message, duration) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), duration || 1800);
}

function toggleTheme() {
  const dark = !document.body.classList.contains('dark');
  document.body.classList.toggle('dark', dark);
  document.getElementById('tog-theme')?.classList.toggle('on', dark);
  localStorage.setItem('crochetmath_theme', dark ? 'dark' : 'light');
  showToast(dark ? 'Dark studio mode on' : 'Light studio mode on');
}

function initTheme() {
  const dark = localStorage.getItem('crochetmath_theme') === 'dark';
  document.body.classList.toggle('dark', dark);
  document.getElementById('tog-theme')?.classList.toggle('on', dark);
}

function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (animState.running) togglePauseAnimation(); else animatePattern();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if (e.key.toLowerCase() === 's') saveToGallery();
    if (e.key.toLowerCase() === 'd') downloadPNG();
  });
}

// ── PDF EXPORT ──
function exportPDF() {
  gtag('event', 'export_pdf', { event_category: 'engagement' });
  const s = getS();
  if (s.mode === 'shape') { alert('PDF export is available for function mode only.'); return; }

  const rows = s.rows, cols = s.cols, thick = s.thick;
  const lines = [];
  for (let r = 0; r < rows; r++) {
    const y = getY(s.fn, r, rows);
    const col = Math.round((y + 1) / 2 * (cols - 1));
    const before = col;
    const after = Math.max(0, cols - col - thick);
    lines.push(`Row ${String(r+1).padStart(3, ' ')}: ${before} off,  ${thick} ON,  ${after} off`);
  }

  const canvas = document.getElementById('main-canvas');
  const imgData = canvas.toDataURL('image/png');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
  <title>CrochetMath Studio — Stitch Sheet</title>
  <style>
    body{font-family:'Georgia',serif;max-width:700px;margin:2rem auto;padding:0 1.5rem;color:#1c2233}
    h1{font-size:22px;font-weight:normal;margin-bottom:4px}
    .sub{font-size:13px;color:#8a8579;font-style:italic;margin-bottom:1.5rem}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;
      background:#ede9e1;border-radius:7px;padding:1rem}
    .meta-item label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;
      color:#8a8579;display:block;margin-bottom:3px}
    .meta-item span{font-size:15px;font-weight:normal}
    img{width:100%;border-radius:7px;margin-bottom:1.5rem;border:1px solid #dbd7cf}
    .stitches{font-family:'Courier New',monospace;font-size:11px;line-height:2;
      column-count:2;column-gap:2rem}
    .stitches div{break-inside:avoid}
    hr{border:none;border-top:1px solid #dbd7cf;margin:1.5rem 0}
    .footer{font-size:11px;color:#8a8579;text-align:center;margin-top:2rem}
    @media print{body{margin:1rem}}
  </style></head><body>
  <h1>CrochetMath Studio — Stitch Sheet</h1>
  <p class="sub">Generated ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
  <div class="meta">
    <div class="meta-item"><label>Function</label><span>${s.fn}</span></div>
    <div class="meta-item"><label>Rows</label><span>${rows}</span></div>
    <div class="meta-item"><label>Columns</label><span>${cols}</span></div>
    <div class="meta-item"><label>Thickness</label><span>${thick}</span></div>
  </div>
  <img src="${imgData}" alt="Pattern preview">
  <hr>
  <div class="stitches">${lines.map(l => `<div>${l}</div>`).join('')}</div>
  <hr>
  <p class="footer">CrochetMath Studio · stitchesforcare.org</p>
  <script>window.onload=()=>window.print()<\/script>
  </body></html>`);
  win.document.close();
}

// ── SERVICE WORKER (PWA) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ── PWA INSTALL PROMPT ──
let _installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _installPrompt = e;
  document.getElementById('install-btn').style.display = '';
});
window.addEventListener('appinstalled', () => {
  document.getElementById('install-btn').style.display = 'none';
  _installPrompt = null;
});
function installApp() {
  if (!_installPrompt) return;
  _installPrompt.prompt();
  _installPrompt.userChoice.then(() => { _installPrompt = null; });
}

// iOS: show install button that explains how to add to home screen
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
if (isIOS && !isInStandaloneMode) {
  const btn = document.getElementById('install-btn');
  btn.style.display = '';
  btn.onclick = () => {
    showToast('Tap the Share button (□↑) then "Add to Home Screen"', 4000);
  };
}


initTheme();
buildPalettes();
loadFromURL();
softRender();
updateStitchBtn();
initShortcuts();

window.animatePattern = animatePattern;
window.togglePauseAnimation = togglePauseAnimation;
window.stopAnimation = stopAnimation;
window.toggleTheme = toggleTheme;
