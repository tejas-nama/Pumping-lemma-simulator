// =============================================================================
//  Pumping Lemma Visualizer — app.js
// =============================================================================

// ── Utility helpers ───────────────────────────────────────────────────────────

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}
function nextPrime(min) { let p = min; while (!isPrime(p)) p++; return p; }
function truncate(s, max) { return s.length > max ? s.slice(0, max) + '…' : s; }
function repeat(ch, n)    { return n <= 0 ? '' : ch.repeat(n); }

// char → CSS colour class for the character cell
function charClass(ch) {
  if (ch === 'a') return 'ca';
  if (ch === 'b') return 'cb';
  if (ch === 'c') return 'cc';
  if (ch === 'd') return 'cd';
  return '';
}

// ── Language catalogue ────────────────────────────────────────────────────────
//
//  Each language object must have:
//    id          – unique string
//    name        – display label (shown on chip)
//    isRegular   – true if the language IS regular/CF (green chip), false = red chip
//    pumpingLength  – the p value used for demonstration
//    generate(n) – returns a string in the language of "size n"
//    decompose(s, p) – returns the split object { x, y, z } or { u, v, x, y, z }
//    check(s)    – returns true if s is in the language
//    proof       – one-paragraph explanation shown in Decompose and Verdict steps
// =============================================================================

const REGULAR_LANGUAGES = [
  // ── 1. aⁿbⁿ  (not regular) ─────────────────────────────────────────────────
  {
    id: 'anbn',
    name: 'aⁿbⁿ  (not regular)',
    isRegular: false,
    pumpingLength: 4,
    generate: n => repeat('a', n) + repeat('b', n),
    decompose(s) {
      // y lives in the first p chars → pure a's
      const yLen = Math.min(2, s.length);
      return { x: '', y: s.slice(0, yLen), z: s.slice(yLen) };
    },
    check(s) {
      const m = s.match(/^(a*)(b*)$/);
      return m ? m[1].length === m[2].length : false;
    },
    proof: "y falls within the first p characters, so it contains only a's. Pumping with i ≠ 1 yields unequal counts of a's and b's — the pumped string is not in L. Contradiction.",
  },

  // ── 2. ww  (not regular) ────────────────────────────────────────────────────
  {
    id: 'ww',
    name: 'ww  (not regular)',
    isRegular: false,
    pumpingLength: 4,
    generate: n => repeat('ab', n),
    decompose(s) { return { x: '', y: s.slice(0, 2), z: s.slice(2) }; },
    check(s) {
      if (s.length % 2 !== 0) return false;
      return s.slice(0, s.length / 2) === s.slice(s.length / 2);
    },
    proof: "Pumping y alters the total length or disrupts the exact midpoint, destroying the ww = w·w repetition structure. No valid decomposition survives pumping.",
  },

  // ── 3. aᵖ (prime length, not regular) ──────────────────────────────────────
  {
    id: 'prime',
    name: 'aᵖ  (prime length, not regular)',
    isRegular: false,
    pumpingLength: 4,
    generate: n => repeat('a', nextPrime(n + 4)),
    decompose(s) { return { x: '', y: s.slice(0, 2), z: s.slice(2) }; },
    check: s => isPrime(s.length),
    proof: "If |y| = k, pumping i times gives length p + (i−1)k. Choosing i = p gives p(1 + k) which is composite (not prime). Contradiction.",
  },

  // ── 4. (ab)ⁿ  (not regular) ─────────────────────────────────────────────────
  {
    id: 'abrepeat',
    name: '(ab)ⁿ  (not regular)',
    isRegular: false,
    pumpingLength: 4,
    generate: n => repeat('ab', n),
    decompose(s) { return { x: '', y: s.slice(0, 2), z: s.slice(2) }; },
    check(s) {
      if (s.length % 2 !== 0) return false;
      for (let i = 0; i < s.length; i += 2) {
        if (s[i] !== 'a' || s[i + 1] !== 'b') return false;
      }
      return true;
    },
    proof: "Any y contains part of the 'ab' pattern. Pumping breaks the strict alternation, producing strings like 'aabab' or 'ababab' that no longer fit (ab)ⁿ.",
  },

  // ── 5. a*b*  (IS regular — green) ───────────────────────────────────────────
  {
    id: 'astarb',
    name: 'a*b*  (IS regular)',
    isRegular: true,
    pumpingLength: 2,
    generate: n => repeat('a', n) + repeat('b', n),
    decompose(s) { return { x: '', y: s.slice(0, 1) || 'a', z: s.slice(1) }; },
    check: s => /^a*b*$/.test(s),
    proof: "a*b* IS regular — accepted by a simple 2-state DFA. The pumping lemma is satisfied: pumping more a's at the start still produces a valid a*b* string.",
  },

  // ── 6. (a|b)*  (IS regular — green) ─────────────────────────────────────────
  {
    id: 'aorb',
    name: '(a|b)*  (IS regular)',
    isRegular: true,
    pumpingLength: 2,
    generate: n => 'ab'.repeat(n).split('').sort(() => Math.random() - 0.5).join('').slice(0, n) || 'a',
    decompose(s) { return { x: '', y: s.slice(0, 1) || 'a', z: s.slice(1) }; },
    check: s => /^[ab]*$/.test(s),
    proof: "(a|b)* IS regular — it accepts every string over {a,b}. Any pumped string is still over {a,b}, so it's trivially in L. The lemma holds.",
  },
];

// =============================================================================

const CF_LANGUAGES = [
  // ── 1. aⁿbⁿcⁿ  (not CF) ────────────────────────────────────────────────────
  {
    id: 'anbncn',
    name: 'aⁿbⁿcⁿ  (not CF)',
    isRegular: false,
    pumpingLength: 6,
    generate: n => repeat('a', n) + repeat('b', n) + repeat('c', n),
    decompose(s, p) {
      const k = Math.max(1, Math.floor(p / 5));
      return { u: s.slice(0, 1), v: s.slice(1, 1 + k), x: s.slice(1 + k, 2 + k), y: s.slice(2 + k, 2 + 2 * k), z: s.slice(2 + 2 * k) };
    },
    check(s) {
      const m = s.match(/^(a*)(b*)(c*)$/);
      return m ? m[1].length === m[2].length && m[2].length === m[3].length : false;
    },
    proof: "vxy spans at most 2 character types. Pumping inflates at most 2 of the 3 counts while the third stays fixed — the triple equality breaks. Contradiction.",
  },

  // ── 2. aⁿbᵐcⁿdᵐ  (not CF) ──────────────────────────────────────────────────
  {
    id: 'anbmcndm',
    name: 'aⁿbᵐcⁿdᵐ  (not CF)',
    isRegular: false,
    pumpingLength: 6,
    generate: n => repeat('a', n) + repeat('b', n) + repeat('c', n) + repeat('d', n),
    decompose(s) {
      return { u: s.slice(0, 2), v: s.slice(2, 4), x: s.slice(4, 5), y: s.slice(5, 7), z: s.slice(7) };
    },
    check(s) {
      const m = s.match(/^(a*)(b*)(c*)(d*)$/);
      return m ? m[1].length === m[3].length && m[2].length === m[4].length : false;
    },
    proof: "vxy cannot simultaneously straddle both the a/c gap and the b/d gap. Pumping always breaks at least one of the two count equalities.",
  },

  // ── 3. aⁿb²ⁿ  (not CF) ─────────────────────────────────────────────────────
  {
    id: 'anb2n',
    name: 'aⁿb²ⁿ  (not CF)',
    isRegular: false,
    pumpingLength: 5,
    generate: n => repeat('a', n) + repeat('b', 2 * n),
    decompose(s) {
      return { u: '', v: s.slice(0, 1), x: s.slice(1, 2), y: s.slice(2, 3), z: s.slice(3) };
    },
    check(s) {
      const m = s.match(/^(a*)(b*)$/);
      return m ? m[2].length === 2 * m[1].length : false;
    },
    proof: "Pumping v and y equally cannot maintain the exact 1:2 ratio between a's and b's unless the decomposition has a very specific structure — which the adversary cannot always guarantee.",
  },

  // ── 4. aⁿbⁿcⁿdⁿ  (not CF) ──────────────────────────────────────────────────
  {
    id: 'anbncndn',
    name: 'aⁿbⁿcⁿdⁿ  (not CF)',
    isRegular: false,
    pumpingLength: 7,
    generate: n => repeat('a', n) + repeat('b', n) + repeat('c', n) + repeat('d', n),
    decompose(s, p) {
      const k = Math.max(1, Math.floor(p / 6));
      return { u: s.slice(0, 1), v: s.slice(1, 1 + k), x: s.slice(1 + k, 2 + k), y: s.slice(2 + k, 2 + 2 * k), z: s.slice(2 + 2 * k) };
    },
    check(s) {
      const m = s.match(/^(a*)(b*)(c*)(d*)$/);
      return m ? m[1].length === m[2].length && m[2].length === m[3].length && m[3].length === m[4].length : false;
    },
    proof: "vxy covers at most 2 of the 4 character segments. Pumping leaves at least 2 counts unchanged while inflating others — the quadruple equality is broken.",
  },

  // ── 5. wwᴿ palindromes  (IS CF) ─────────────────────────────────────────────
  {
    id: 'palindrome',
    name: 'wwᴿ palindromes (IS CF)',
    isRegular: true,
    pumpingLength: 4,
    generate: n => { const w = 'ab'.repeat(n).slice(0, n); return w + w.split('').reverse().join(''); },
    decompose(s) {
      const half = Math.floor(s.length / 4);
      return { u: s.slice(0, 1), v: s.slice(1, 1 + half), x: s.slice(1 + half, s.length - 1 - half), y: s.slice(s.length - 1 - half, s.length - 1), z: s.slice(s.length - 1) };
    },
    check(s) { return s === s.split('').reverse().join(''); },
    proof: "Even-length palindromes ARE context-free — generated by the CFG S → aSa | bSb | ε. The pumping lemma is satisfied: pumping symmetric v and y preserves the palindrome structure.",
  },

  // ── 6. aⁿbⁿ  (IS CF) ────────────────────────────────────────────────────────
  {
    id: 'anbn_cf',
    name: 'aⁿbⁿ  (IS CF)',
    isRegular: true,
    pumpingLength: 3,
    generate: n => repeat('a', n) + repeat('b', n),
    decompose(s) {
      const mid = Math.floor(s.length / 2);
      return { u: s.slice(0, mid - 1), v: s.slice(mid - 1, mid), x: '', y: s.slice(mid, mid + 1), z: s.slice(mid + 1) };
    },
    check(s) {
      const m = s.match(/^(a*)(b*)$/);
      return m ? m[1].length === m[2].length : false;
    },
    proof: "aⁿbⁿ IS context-free — generated by S → aSb | ε. The pumping lemma holds: we can decompose any long string so that pumping v (an 'a') and y (a 'b') equally preserves the count.",
  },
];

// =============================================================================
//  State
// =============================================================================
let mode      = 'regular';
let langIndex = 0;
let n         = 5;
let pumpI     = 1;
let step      = 0;   // 0 = Theorem … 4 = Verdict

const STEP_LABELS = ['Theorem', 'Choose string', 'Decompose', 'Pump it!', 'Verdict'];

function getLangs()   { return mode === 'regular' ? REGULAR_LANGUAGES : CF_LANGUAGES; }
function getLang()    { return getLangs()[langIndex]; }
function getBase()    { return getLang().generate(n); }
function getDecomp()  { return getLang().decompose(getBase(), getLang().pumpingLength); }

function pumped(i) {
  const d = getDecomp();
  return mode === 'regular'
    ? d.x + repeat(d.y, i) + d.z
    : d.u + repeat(d.v, i) + d.x + repeat(d.y, i) + d.z;
}

// =============================================================================
//  Bootstrap
// =============================================================================
document.addEventListener('DOMContentLoaded', renderAll);

// =============================================================================
//  Public event handlers (called from HTML onclick)
// =============================================================================
function setMode(m) {
  mode = m; langIndex = 0; step = 0; pumpI = 1;
  renderAll();
}

function setLang(idx) {
  langIndex = idx; step = 0; pumpI = 1;
  renderAll();
}

function setN(val) {
  n = Number(val); step = 0; pumpI = 1;
  document.getElementById('n-val').textContent           = n;
  document.getElementById('base-str-preview').textContent = truncate(getBase(), 28);
  renderStepBar(); renderPanel(); renderNextBtn();
}

function nextStep() {
  if (step < 4) { step++; renderStepBar(); renderPanel(); renderNextBtn(); }
}

function goToStep(i) {
  if (i <= step) { step = i; renderStepBar(); renderPanel(); renderNextBtn(); }
}

function resetAll() {
  step = 0; pumpI = 1;
  renderStepBar(); renderPanel(); renderNextBtn();
}

function setPumpI(i) {
  pumpI = i;
  renderPumpStep();
}

// =============================================================================
//  Master render
// =============================================================================
function renderAll() {
  renderModeTabs();
  renderLangChips();
  document.getElementById('n-val').textContent            = n;
  document.getElementById('base-str-preview').textContent = truncate(getBase(), 28);
  renderStepBar();
  renderPanel();
  renderNextBtn();
}

// ── Mode tabs ─────────────────────────────────────────────────────────────────
function renderModeTabs() {
  document.querySelectorAll('.mode-tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.mode === mode)
  );
}

// ── Language chips ────────────────────────────────────────────────────────────
function renderLangChips() {
  document.getElementById('lang-chips').innerHTML = getLangs().map((lang, i) => {
    const cls = i === langIndex ? (lang.isRegular ? 'active-yes' : 'active-not') : '';
    return `<button class="lang-chip ${cls}" onclick="setLang(${i})">${lang.name}</button>`;
  }).join('');
}

// ── Step bar ──────────────────────────────────────────────────────────────────
function renderStepBar() {
  document.getElementById('step-bar').innerHTML = STEP_LABELS.map((label, i) => {
    const cls = i < step ? 'done' : i === step ? 'current' : '';
    const pre = i < step ? '✓ ' : i === step ? '▶ ' : '';
    return `<div class="step-item ${cls}" onclick="goToStep(${i})">${pre}${label}</div>`;
  }).join('');
}

// ── Next button ───────────────────────────────────────────────────────────────
function renderNextBtn() {
  const btn = document.getElementById('next-btn');
  btn.style.display = step >= 4 ? 'none' : '';
  btn.textContent   = step === 3 ? 'See verdict →' : 'Next →';
}

// ── Panel router ──────────────────────────────────────────────────────────────
function renderPanel() {
  // Retrigger CSS animation
  const panel = document.getElementById('main-panel');
  panel.style.animation = 'none';
  void panel.offsetHeight;
  panel.style.animation = '';

  const el = document.getElementById('panel-content');
  switch (step) {
    case 0: el.innerHTML = buildTheorem();    break;
    case 1: el.innerHTML = buildStringStep(); break;
    case 2: el.innerHTML = buildDecompose();  break;
    case 3: el.innerHTML = buildPump();       renderPumpStep(); break;
    case 4: el.innerHTML = buildVerdict();    break;
  }
}

// =============================================================================
//  STEP 0 — Theorem
// =============================================================================
function buildTheorem() {
  const isReg = mode === 'regular';
  return `
    <div class="step-tag">Step 1 of 5 — The Theorem</div>
    <h2>${isReg ? 'Pumping Lemma for Regular Languages' : 'Pumping Lemma for Context-Free Languages'}</h2>
    <div class="theorem-box">
      <div class="t-head">
        If <em>L</em> is ${isReg ? 'a regular' : 'a context-free'} language, then
        ∃ pumping length <span class="hl-o">p ≥ 1</span> such that:
      </div>
      <div class="indent">
        For every string <span class="hl-w">s ∈ L</span> with |s| ≥ p,<br/>
        s can be written as <code class="hl-o">${isReg ? 's = xyz' : 's = uvxyz'}</code> satisfying:
      </div>
      <ul>
        ${isReg ? `
          <li>|y| ≥ 1 &nbsp;&nbsp;&nbsp;— y is non-empty</li>
          <li>|xy| ≤ p &nbsp;— xy fits within the first p characters</li>
          <li>∀ i ≥ 0 : <code class="hl-o">xy<sup>i</sup>z ∈ L</code></li>
        ` : `
          <li>|vy| ≥ 1 &nbsp;&nbsp;&nbsp;— at least one of v, y is non-empty</li>
          <li>|vxy| ≤ p &nbsp;— middle section fits within p characters</li>
          <li>∀ i ≥ 0 : <code class="hl-o">uv<sup>i</sup>xy<sup>i</sup>z ∈ L</code></li>
        `}
      </ul>
    </div>
    <div class="tip-box">
      💡 <strong>Strategy to prove L is NOT ${isReg ? 'regular' : 'CF'}:</strong>
      Assume it is → pick a string s ∈ L with |s| ≥ p → show every decomposition fails when pumped → contradiction!
    </div>`;
}

// =============================================================================
//  STEP 1 — Choose string
// =============================================================================
function buildStringStep() {
  const lang = getLang();
  const s    = getBase();
  const p    = lang.pumpingLength;
  const ok   = s.length >= p;
  return `
    <div class="step-tag">Step 2 of 5 — Choose a long string</div>
    <h2>Assume <em style="color:var(--accent)">${escHtml(lang.name.split(' ')[0])}</em>
        is ${mode === 'regular' ? 'regular' : 'context-free'}</h2>
    <p>
      Then ∃ pumping length <code style="color:var(--orange)">p = ${p}</code>.
      We pick a string <strong>s ∈ L</strong> with |s| ≥ p:
    </p>
    ${buildStringDisplay(s, null)}
    <div class="str-info">
      <span class="si-len">|s| = ${s.length}</span>
      <span class="si-p">p = ${p}</span>
      <span class="${ok ? 'si-ok' : 'si-bad'}">${ok ? '✓ |s| ≥ p — valid' : '✗ string too short, increase n'}</span>
    </div>`;
}

// =============================================================================
//  STEP 2 — Decompose
// =============================================================================
function buildDecompose() {
  const lang  = getLang();
  const s     = getBase();
  const d     = getDecomp();
  const isReg = mode === 'regular';

  let cells   = '';
  let legend  = '';

  if (isReg) {
    cells  = buildCells(d.x, 's-x') + buildCells(d.y, 's-y') + buildCells(d.z, 's-z');
    legend = legPill('lx', 'x', d.x, 'fixed prefix') +
             legPill('ly', 'y', d.y, 'pumped part') +
             legPill('lz', 'z', d.z, 'fixed suffix');
  } else {
    cells  = buildCells(d.u, 's-u') + buildCells(d.v, 's-v') +
             buildCells(d.x, 's-xi') + buildCells(d.y, 's-yi') + buildCells(d.z, 's-z');
    legend = legPill('lu',  'u', d.u, 'fixed')   +
             legPill('lv',  'v', d.v, 'pumped')  +
             legPill('lxi', 'x', d.x, 'middle')  +
             legPill('lyi', 'y', d.y, 'pumped')  +
             legPill('lz',  'z', d.z, 'fixed');
  }

  return `
    <div class="step-tag">Step 3 of 5 — Decompose</div>
    <h2>Split s = ${isReg ? 'xyz' : 'uvxyz'}</h2>
    <p>
      The adversary picks a decomposition satisfying the constraints.
      We must find a pump value i that breaks <em>any</em> valid split.
    </p>
    <div class="string-display" id="decomp-display">${cells}</div>
    <div class="decomp-legend">${legend}</div>
    <div class="proof-hint">${escHtml(lang.proof.split('.')[0])}.</div>`;
}

// =============================================================================
//  STEP 3 — Pump
// =============================================================================
function buildPump() {
  const lang  = getLang();
  const isReg = mode === 'regular';
  const iVals = [0, 1, 2, 3, 4];

  const btns = iVals.map(i =>
    `<button class="i-btn ${i === pumpI ? 'active' : ''}" onclick="setPumpI(${i})">${i}</button>`
  ).join('');

  return `
    <div class="step-tag">Step 4 of 5 — Pump it!</div>
    <h2>Choose pump value <span style="color:var(--accent)">i</span></h2>
    <p>
      ${isReg
        ? 'The pumped string is <code style="color:var(--orange)">x · yⁱ · z</code>. Change i and watch the result.'
        : 'The pumped string is <code style="color:var(--orange)">u · vⁱ · x · yⁱ · z</code>. Change i and watch the result.'}
    </p>
    <div class="pump-i-row">
      <span style="font-size:12px;color:var(--text3)">i =</span>
      ${btns}
    </div>
    <div class="pump-formula" id="pump-formula"></div>
    <div class="string-display" id="pumped-display"></div>
    <div id="pump-verdict"></div>`;
}

// Called both on initial render and when i changes
function renderPumpStep() {
  const lang  = getLang();
  const isReg = mode === 'regular';
  const ps    = pumped(pumpI);
  const inL   = lang.check(ps);

  // Update i-button active state
  document.querySelectorAll('.i-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.textContent) === pumpI);
  });

  // Formula
  const fEl = document.getElementById('pump-formula');
  if (fEl) {
    const d = getDecomp();
    if (isReg) {
      fEl.innerHTML = `x="${escHtml(d.x)}" + y<sup>${pumpI}</sup>="${escHtml(repeat(d.y, pumpI))}" + z="${escHtml(d.z)}"`;
    } else {
      fEl.innerHTML = `u="${escHtml(d.u)}" + v<sup>${pumpI}</sup>="${escHtml(repeat(d.v, pumpI))}" + x="${escHtml(d.x)}" + y<sup>${pumpI}</sup>="${escHtml(repeat(d.y, pumpI))}" + z="${escHtml(d.z)}"`;
    }
  }

  // Pumped string display
  const pdEl = document.getElementById('pumped-display');
  if (pdEl) pdEl.innerHTML = buildStringDisplay(ps, null, true);

  // Verdict badge
  const pvEl = document.getElementById('pump-verdict');
  if (pvEl) {
    pvEl.innerHTML = inL
      ? `<div class="verdict-badge badge-in">✓ Pumped string is still in L</div>`
      : `<div class="verdict-badge badge-out">✗ Pumped string is NOT in L — contradiction!</div>`;
  }
}

// =============================================================================
//  STEP 4 — Verdict
// =============================================================================
function buildVerdict() {
  const lang    = getLang();
  const ps      = pumped(pumpI);
  const inL     = lang.check(ps);
  const notLang = !lang.isRegular;
  const typeName = mode === 'regular' ? 'regular' : 'context-free';
  const shortName = lang.name.split(' ')[0];

  const cardCls   = notLang ? 'not-lang' : 'is-lang';
  const title     = notLang
    ? `${escHtml(shortName)} is NOT ${typeName} ✓`
    : `${escHtml(shortName)} IS ${typeName} ✓`;

  return `
    <div class="step-tag">Step 5 of 5 — Verdict</div>
    <h2>Conclusion</h2>
    <div class="verdict-card ${cardCls}">
      <div class="verdict-title">${title}</div>
      <p>${escHtml(lang.proof)}</p>
    </div>
    <div class="proof-summary">
      <div class="section-label" style="margin-bottom:12px">Proof summary</div>
      <ol>
        <li>Assume <em>${escHtml(shortName)}</em> is ${typeName}. Then pumping length p exists.</li>
        <li>Choose s = <code style="color:var(--orange)">${escHtml(truncate(getBase(), 20))}</code> ∈ L with |s| ≥ p.</li>
        <li>Any decomposition ${mode === 'regular' ? 'xyz' : 'uvxyz'} must satisfy the pumping lemma conditions.</li>
        <li>We pump with i = ${pumpI}, yielding: <code style="color:var(--orange)">${escHtml(truncate(ps, 24))}</code></li>
        <li style="color:${notLang ? 'var(--red)' : 'var(--green)'}">
          ${notLang ? 'This string is NOT in L — contradiction! ⊥' : 'This string IS in L — the lemma holds. ✓'}
        </li>
      </ol>
      ${notLang ? `
        <div class="proof-qed">
          ∴ Our assumption was false.
          <strong>${escHtml(shortName)}</strong> is not ${typeName}. &nbsp;□
        </div>` : ''}
    </div>`;
}

// =============================================================================
//  String / cell builders
// =============================================================================

// Build a row of coloured character cells (with optional segment class)
function buildCells(str, segClass) {
  if (!str) return '';
  return str.split('').map(ch =>
    `<div class="char-cell ${charClass(ch)} ${segClass || ''}">${escHtml(ch)}</div>`
  ).join('');
}

// Full string display div (used in Step 1 and pump display)
function buildStringDisplay(s, _unused, inline) {
  const max = 48;
  const display = s.length > max ? s.slice(0, max) + '…' : s;
  const cells = display.split('').map((ch, i) =>
    `<div class="char-cell ${charClass(ch)}" title="index ${i}">${escHtml(ch)}</div>`
  ).join('');
  return inline ? cells : `<div class="string-display">${cells}</div>`;
}

// Legend pill helper
function legPill(cls, key, val, desc) {
  if (!val && val !== '') return '';
  return `
    <div class="leg-pill ${cls}">
      <span class="pk">${key}</span>
      <span class="pv">= "${escHtml(val)}" (len ${val.length}) — ${desc}</span>
    </div>`;
}

// =============================================================================
//  Utility
// =============================================================================
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
