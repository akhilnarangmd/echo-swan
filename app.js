// =============================================
//  Echo Swan — Intracardiac Pressure Calculator
//  app.js  (v2)
// =============================================

const stored = {
  rap: null, rvsp: null, rvedp: null,
  pasp: null, paedp: null, mpap: null,
  pvr: null, lap: null, lvsp: null, lvedp: null,
};

// ---- Tab navigation ----
document.getElementById('tabNav').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  const tabId = btn.dataset.tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + tabId).classList.add('active');
  if (tabId === 'summary') updateSummary();
});

// ---- Collapsible VSD section ----
function toggleSection(bodyId, chevronId) {
  const body = document.getElementById(bodyId);
  const chev = document.getElementById(chevronId);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  chev.classList.toggle('open', !isOpen);
}

// ---- PS checkbox ----
function togglePS() {
  const checked = document.getElementById('ps-check').checked;
  document.getElementById('ps-section').style.display = checked ? 'block' : 'none';
  calcPASP();
}

// =============================================
//  HELPERS
// =============================================

function fmt(val, decimals = 1) {
  if (val === null || isNaN(val)) return '—';
  return Number(val).toFixed(decimals);
}

function showResult(elId, { label, value, unit, formula, statusClass } = {}) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.display = '';
  el.className = 'result-box' + (statusClass ? ' ' + statusClass : '');
  el.innerHTML = `
    <div class="result-label">${label || ''}</div>
    <div>
      <span class="result-value">${value}</span>
      <span class="result-unit">${unit || ''}</span>
    </div>
    ${formula ? `<div class="result-formula">${formula}</div>` : ''}
  `;
}

function hideResult(elId) {
  const el = document.getElementById(elId);
  if (el) el.style.display = 'none';
}

function pvrStatus(val) {
  if (val < 2) return { cls: 'normal', label: 'Normal (< 2 WU)' };
  if (val < 3) return { cls: 'borderline', label: 'Borderline (2–3 WU)' };
  return { cls: 'elevated', label: 'Elevated (≥ 3 WU)' };
}

// =============================================
//  RAP
// =============================================

function calcRAP() {
  const diam = document.getElementById('ivc-diam').value;
  const collapse = document.getElementById('ivc-collapse').value;
  let rap, label, range, statusClass;
  if (diam === 'small' && collapse === 'gt50') {
    rap = 3; label = 'Normal RAP'; range = '(0–5 mmHg)'; statusClass = 'normal';
  } else if (diam === 'large' && collapse === 'lt50') {
    rap = 15; label = 'Elevated RAP'; range = '(10–20 mmHg)'; statusClass = 'elevated';
  } else {
    rap = 8; label = 'Intermediate RAP'; range = '(5–10 mmHg)'; statusClass = 'intermediate';
  }
  stored.rap = rap;
  const el = document.getElementById('rap-result');
  el.style.display = '';
  el.className = 'result-box ' + statusClass;
  el.innerHTML = `
    <div class="result-label">${label} ${range}</div>
    <div>
      <span class="result-value">${rap}</span>
      <span class="result-unit">mmHg (estimated)</span>
    </div>
    <div class="result-formula">IVC ${diam === 'small' ? '≤ 2.1 cm' : '> 2.1 cm'} · Collapse ${collapse === 'gt50' ? '> 50%' : '< 50%'} · Kircher 1990</div>
  `;
}

function calcSFF() {
  const s = parseFloat(document.getElementById('s-vti').value);
  const d = parseFloat(document.getElementById('d-vti').value);
  if (!isNaN(s) && !isNaN(d) && (s + d) > 0) {
    document.getElementById('sff').value = ((s / (s + d)) * 100).toFixed(1);
    showSFF();
  }
}

function showSFF() {
  const sff = parseFloat(document.getElementById('sff').value);
  const el = document.getElementById('sff-result');
  if (isNaN(sff)) { el.innerHTML = ''; el.className = 'result-inline'; return; }
  el.className = sff < 55 ? 'result-inline elevated' : 'result-inline normal';
  el.textContent = sff < 55
    ? `SFF ${sff.toFixed(1)}% — RAP likely > 8 mmHg`
    : `SFF ${sff.toFixed(1)}% — RAP likely normal`;
}

// =============================================
//  RV PRESSURES
// =============================================

function calcRVSP() {
  const v = parseFloat(document.getElementById('tr-vel').value);
  const rap = parseFloat(document.getElementById('rap-rvsp').value);
  if (isNaN(v)) { hideResult('rvsp-result'); return; }
  const gradient = +(4 * v * v).toFixed(1);
  if (isNaN(rap)) {
    // Show partial result without RAP
    stored.rvsp = null;
    showResult('rvsp-result', {
      label: 'RVSP (RAP not entered)',
      value: gradient,
      unit: '+ RAP  mmHg',
      formula: `4 × ${v}² = ${gradient} + RAP`
    });
  } else {
    const val = gradient + rap;
    stored.rvsp = val;
    showResult('rvsp-result', {
      label: 'RV Systolic Pressure',
      value: fmt(val),
      unit: 'mmHg',
      formula: `4 × ${v}² + ${rap} = ${fmt(val)}`
    });
  }
}

function calcRVSP_VSD() {
  const sbp = parseFloat(document.getElementById('sbp-vsd').value);
  const v = parseFloat(document.getElementById('vsd-vel').value);
  if (isNaN(sbp) || isNaN(v)) { hideResult('rvsp-vsd-result'); return; }
  const val = sbp - 4 * v * v;
  showResult('rvsp-vsd-result', {
    label: 'RVSP via VSD',
    value: fmt(val),
    unit: 'mmHg',
    formula: `${sbp} − 4×${v}² = ${fmt(val)}`
  });
  if (!stored.rvsp) stored.rvsp = val;
}

function calcRVEDP() {
  const lvedp = parseFloat(document.getElementById('lvedp-rv').value);
  const v = parseFloat(document.getElementById('vsd-diast').value);
  if (isNaN(lvedp) || isNaN(v)) { hideResult('rvedp-result'); return; }
  const val = lvedp - 4 * v * v;
  stored.rvedp = val;
  showResult('rvedp-result', {
    label: 'RV End-Diastolic Pressure',
    value: fmt(val),
    unit: 'mmHg',
    formula: `${lvedp} − 4×${v}² = ${fmt(val)}`
  });
}

function calcRVDP() {
  const rap = parseFloat(document.getElementById('rap-rvdp').value);
  const ts = parseFloat(document.getElementById('ts-grad').value) || 0;
  if (isNaN(rap)) { hideResult('rvdp-result'); return; }
  const val = rap - ts;
  showResult('rvdp-result', {
    label: 'RV Diastolic Pressure',
    value: fmt(val),
    unit: 'mmHg',
    formula: ts > 0 ? `${rap} − ${ts} = ${fmt(val)}` : `= RAP = ${fmt(val)}`
  });
}

// =============================================
//  PA PRESSURES
// =============================================

function calcPASP() {
  const v = parseFloat(document.getElementById('tr-vel-pasp').value);
  const rap = parseFloat(document.getElementById('rap-pasp').value);
  const psCheck = document.getElementById('ps-check').checked;
  const ps = psCheck ? (parseFloat(document.getElementById('ps-grad').value) || 0) : 0;

  if (isNaN(v)) { hideResult('pasp-result'); return; }

  const rvsp = 4 * v * v;

  if (isNaN(rap)) {
    // No RAP — show partial
    const partial = +(rvsp - ps).toFixed(1);
    stored.pasp = null;
    showResult('pasp-result', {
      label: 'PASP (RAP not entered)',
      value: fmt(partial),
      unit: '+ RAP  mmHg',
      formula: psCheck
        ? `4×${v}² − PS(${ps}) = ${fmt(partial)} + RAP`
        : `4×${v}² = ${fmt(partial)} + RAP`
    });
  } else {
    const val = rvsp + rap - ps;
    stored.pasp = val;
    showResult('pasp-result', {
      label: 'PA Systolic Pressure',
      value: fmt(val),
      unit: 'mmHg',
      formula: psCheck
        ? `4×${v}² + RAP(${rap}) − PS(${ps}) = ${fmt(val)}`
        : `4×${v}² + RAP(${rap}) = ${fmt(val)}`
    });
  }
}

function calcPAEDP() {
  const v = parseFloat(document.getElementById('pr-vel').value);
  const rap = parseFloat(document.getElementById('rap-paedp').value);
  if (isNaN(v) || isNaN(rap)) { hideResult('paedp-result'); return; }
  const val = 4 * v * v + rap;
  stored.paedp = val;
  showResult('paedp-result', {
    label: 'PA End-Diastolic Pressure',
    value: fmt(val),
    unit: 'mmHg',
    formula: `4×${v}² + ${rap} = ${fmt(val)}`
  });
}

function calcMPAP() {
  const prPeak = parseFloat(document.getElementById('pr-peak').value);
  const rap1 = parseFloat(document.getElementById('rap-mpap1').value);
  const meanTR = parseFloat(document.getElementById('mean-tr-grad').value);
  const rap2 = parseFloat(document.getElementById('rap-mpap2').value);
  const act = parseFloat(document.getElementById('rvot-act').value);
  const pasp = parseFloat(document.getElementById('pasp-m4').value);
  const padp = parseFloat(document.getElementById('padp-m4').value);

  const el = document.getElementById('mpap-result');
  const cards = [];
  let first = null;

  if (!isNaN(prPeak) && !isNaN(rap1)) {
    const v = 4 * prPeak * prPeak + rap1;
    if (first === null) first = v;
    cards.push({ label: 'Method 1: 4(PR peak)² + RAP', val: v });
  }
  if (!isNaN(meanTR) && !isNaN(rap2)) {
    const v = meanTR + rap2;
    if (first === null) first = v;
    cards.push({ label: 'Method 2: Mean ΔP(RV-RA) + RAP', val: v });
  }
  if (!isNaN(act)) {
    const v = 79 - 0.45 * act;
    if (first === null) first = v;
    cards.push({ label: 'Method 3: 79 − 0.45×AcT', val: v });
  }
  if (!isNaN(pasp) && !isNaN(padp)) {
    const v = pasp / 3 + (padp * 2) / 3;
    if (first === null) first = v;
    cards.push({ label: 'Method 4: ⅓PASP + ⅔PADP', val: v });
  }

  stored.mpap = first;

  if (cards.length === 0) { el.innerHTML = ''; return; }
  el.className = 'mpap-results';
  el.innerHTML = cards.map(c => `
    <div class="mpap-card">
      <div class="m-label">${c.label}</div>
      <div class="m-val">${fmt(c.val)}</div>
      <div class="m-unit">mmHg</div>
    </div>
  `).join('');
}

// =============================================
//  PVR
// =============================================

function calcPVR() {
  const tr = parseFloat(document.getElementById('tr-pvr').value);
  const vti = parseFloat(document.getElementById('rvot-vti').value);
  if (isNaN(tr) || isNaN(vti) || vti === 0) { hideResult('pvr-echo-result'); return; }
  const val = 10 * (tr / vti) + 0.16;
  stored.pvr = val;
  const { cls, label } = pvrStatus(val);
  const el = document.getElementById('pvr-echo-result');
  el.style.display = '';
  el.className = 'result-box';
  el.innerHTML = `
    <div class="result-label">PVR — Echo Method (Abbas 2003)</div>
    <div>
      <span class="result-value">${fmt(val, 2)}</span>
      <span class="result-unit">Wood units</span>
    </div>
    <div><span class="pvr-badge ${cls}">${label}</span></div>
    <div class="result-formula">10 × (${tr} / ${vti}) + 0.16 = ${fmt(val, 2)} WU</div>
  `;
}

function calcPVR2() {
  const mpap = parseFloat(document.getElementById('mpap-pvr').value);
  const pcwp = parseFloat(document.getElementById('pcwp-pvr').value);
  const co = parseFloat(document.getElementById('co-pvr').value);
  if (isNaN(mpap) || isNaN(pcwp) || isNaN(co) || co === 0) { hideResult('pvr-fick-result'); return; }
  const val = (mpap - pcwp) / co;
  if (!stored.pvr) stored.pvr = val;
  const { cls, label } = pvrStatus(val);
  const el = document.getElementById('pvr-fick-result');
  el.style.display = '';
  el.className = 'result-box';
  el.innerHTML = `
    <div class="result-label">PVR — Hemodynamic Method</div>
    <div>
      <span class="result-value">${fmt(val, 2)}</span>
      <span class="result-unit">Wood units</span>
    </div>
    <div><span class="pvr-badge ${cls}">${label}</span></div>
    <div class="result-formula">(${mpap} − ${pcwp}) / ${co} = ${fmt(val, 2)} WU</div>
  `;
}

// =============================================
//  LAP
// =============================================

function calcLAP() {
  const e = parseFloat(document.getElementById('e-vel').value);
  const ep = parseFloat(document.getElementById('eprime').value);
  if (isNaN(e) || isNaN(ep) || ep === 0) { hideResult('lap-result'); return; }
  const ratio = e / ep;
  const m1 = ratio + 4;
  const m2 = 1.24 * ratio + 1.9;
  stored.lap = m1;
  const el = document.getElementById('lap-result');
  el.style.display = '';
  el.className = 'result-box';
  el.innerHTML = `
    <div class="result-label">Left Atrial Pressure — E/e' = ${ratio.toFixed(1)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.4rem;">
      <div>
        <div style="font-size:0.7rem;color:var(--ink-3);">E/e' + 4</div>
        <span class="result-value">${fmt(m1)}</span>
        <span class="result-unit">mmHg</span>
      </div>
      <div>
        <div style="font-size:0.7rem;color:var(--ink-3);">1.24×(E/e') + 1.9</div>
        <span class="result-value">${fmt(m2)}</span>
        <span class="result-unit">mmHg</span>
      </div>
    </div>
  `;
}

function calcLAP2() {
  const sbp = parseFloat(document.getElementById('sbp-lap').value);
  const mr = parseFloat(document.getElementById('mr-vel').value);
  if (isNaN(sbp) || isNaN(mr)) { hideResult('lap2-result'); return; }
  const val = sbp - 4 * mr * mr;
  if (!stored.lap) stored.lap = val;
  showResult('lap2-result', {
    label: 'LAP via MR',
    value: fmt(val),
    unit: 'mmHg',
    formula: `${sbp} − 4×${mr}² = ${fmt(val)}`
  });
}

// =============================================
//  LV PRESSURES
// =============================================

function calcLVSP() {
  const sbp = parseFloat(document.getElementById('sbp-lv').value);
  const mr = parseFloat(document.getElementById('mr-vel-lv').value);
  const lap = parseFloat(document.getElementById('lap-lvsp').value);
  const asGrad = parseFloat(document.getElementById('as-grad').value) || 0;

  const el = document.getElementById('lvsp-result');
  const methods = [];

  if (!isNaN(sbp)) {
    const v = sbp + asGrad;
    methods.push({ label: asGrad > 0 ? 'BP + AS gradient' : 'From BP (no AS)', val: v });
  }
  if (!isNaN(mr) && !isNaN(lap)) {
    const v = 4 * mr * mr + lap;
    methods.push({ label: '4(MR V<sub>peak</sub>)² + LAP', val: v });
  }

  if (methods.length === 0) { el.style.display = 'none'; return; }

  stored.lvsp = methods[0].val;
  el.style.display = '';
  el.className = 'result-box';
  el.innerHTML = `
    <div class="result-label">LV Systolic Pressure</div>
    <div style="display:grid;grid-template-columns:${methods.length > 1 ? '1fr 1fr' : '1fr'};gap:0.5rem;margin-top:0.4rem;">
      ${methods.map(m => `
        <div>
          <div style="font-size:0.7rem;color:var(--ink-3);">${m.label}</div>
          <span class="result-value">${fmt(m.val)}</span>
          <span class="result-unit">mmHg</span>
        </div>
      `).join('')}
    </div>
  `;
}

function calcLVEDP() {
  const dbp = parseFloat(document.getElementById('dbp-lv').value);
  const ar = parseFloat(document.getElementById('ar-vel').value);
  if (isNaN(dbp) || isNaN(ar)) { hideResult('lvedp-result'); return; }
  const val = dbp - 4 * ar * ar;
  stored.lvedp = val;
  showResult('lvedp-result', {
    label: 'LV End-Diastolic Pressure',
    value: fmt(val),
    unit: 'mmHg',
    formula: `${dbp} − 4×${ar}² = ${fmt(val)}`
  });
}

function calcArA() {
  const dur = parseFloat(document.getElementById('ar-a-dur').value);
  const el = document.getElementById('ara-result');
  if (isNaN(dur)) { el.innerHTML = ''; el.className = 'result-inline'; return; }
  el.className = dur > 30 ? 'result-inline elevated' : 'result-inline normal';
  el.textContent = dur > 30
    ? `Ar–A ${dur} ms — LVEDP likely > 20 mmHg`
    : `Ar–A ${dur} ms — LVEDP likely ≤ 20 mmHg`;
}

// =============================================
//  SUMMARY
// =============================================

function updateSummary() {
  const items = [
    { key: 'rap',   label: 'RAP',   unit: 'mmHg' },
    { key: 'rvsp',  label: 'RVSP',  unit: 'mmHg' },
    { key: 'rvedp', label: 'RVEDP', unit: 'mmHg' },
    { key: 'pasp',  label: 'PASP',  unit: 'mmHg' },
    { key: 'paedp', label: 'PAEDP', unit: 'mmHg' },
    { key: 'mpap',  label: 'mPAP',  unit: 'mmHg' },
    { key: 'pvr',   label: 'PVR',   unit: 'WU'   },
    { key: 'lap',   label: 'LAP',   unit: 'mmHg' },
    { key: 'lvsp',  label: 'LVSP',  unit: 'mmHg' },
    { key: 'lvedp', label: 'LVEDP', unit: 'mmHg' },
  ];
  document.getElementById('summary-grid').innerHTML = items.map(item => {
    const val = stored[item.key];
    const hasVal = val !== null && !isNaN(val);
    const display = hasVal ? fmt(val, item.key === 'pvr' ? 2 : 1) : '—';
    return `
      <div class="summary-card">
        <div class="s-label">${item.label}</div>
        <div class="s-val ${hasVal ? 'filled' : 'empty'}">${display}</div>
        <div class="s-unit">${item.unit}</div>
      </div>`;
  }).join('');
}

// =============================================
//  INIT
// =============================================
calcRAP();
