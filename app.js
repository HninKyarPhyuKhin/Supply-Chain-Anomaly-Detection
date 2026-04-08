/* ─────────────────────────────────────────────
   app.js — Supply Chain Anomaly Detection System
   ───────────────────────────────────────────── */

/* ── Static route data ── */
const ROUTES = [
  { code: 'SHG-LAX', name: 'Shanghai → Los Angeles',      flag: '🇨🇳→🇺🇸', anomalies: 41, severity: 'high', color: '#f87171', risk: 4200000 },
  { code: 'RTD-HBG', name: 'Rotterdam → Hamburg',          flag: '🇳🇱→🇩🇪', anomalies: 29, severity: 'high', color: '#f87171', risk: 3100000 },
  { code: 'DXB-MUM', name: 'Dubai → Mumbai',               flag: '🇦🇪→🇮🇳', anomalies: 24, severity: 'med',  color: '#fbbf24', risk: 2400000 },
  { code: 'SGP-SYD', name: 'Singapore → Sydney',           flag: '🇸🇬→🇦🇺', anomalies: 21, severity: 'med',  color: '#fbbf24', risk: 2100000 },
  { code: 'NYK-LDN', name: 'New York → London',            flag: '🇺🇸→🇬🇧', anomalies: 19, severity: 'med',  color: '#fbbf24', risk: 1900000 },
  { code: 'TOK-VAN', name: 'Tokyo → Vancouver',            flag: '🇯🇵→🇨🇦', anomalies: 17, severity: 'med',  color: '#fbbf24', risk: 1700000 },
  { code: 'MUM-JNB', name: 'Mumbai → Johannesburg',        flag: '🇮🇳→🇿🇦', anomalies: 14, severity: 'low',  color: '#34d399', risk: 980000  },
  { code: 'BCN-IST', name: 'Barcelona → Istanbul',         flag: '🇪🇸→🇹🇷', anomalies: 12, severity: 'low',  color: '#34d399', risk: 820000  },
  { code: 'BUE-SAO', name: 'Buenos Aires → São Paulo',     flag: '🇦🇷→🇧🇷', anomalies: 10, severity: 'low',  color: '#34d399', risk: 650000  },
  { code: 'OSA-SEL', name: 'Osaka → Seoul',                flag: '🇯🇵→🇰🇷', anomalies: 8,  severity: 'low',  color: '#34d399', risk: 510000  },
  { code: 'CAI-ATH', name: 'Cairo → Athens',               flag: '🇪🇬→🇬🇷', anomalies: 7,  severity: 'low',  color: '#34d399', risk: 430000  },
  { code: 'CPT-DAR', name: 'Cape Town → Dar es Salaam',    flag: '🇿🇦→🇹🇿', anomalies: 5,  severity: 'low',  color: '#34d399', risk: 290000  },
];

const ANOMALY_TYPES = ['Cost Spike', 'Transit Delay', 'Weight Discrepancy', 'Route Deviation', 'Carrier Fraud', 'Duplicate Record'];
const CARRIERS      = ['Maersk', 'MSC', 'COSCO', 'Evergreen', 'Hapag-Lloyd', 'ONE', 'Yang Ming', 'Zim'];
const DAYS_OF_WEEK  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── Helpers ── */
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randEl  = arr => arr[Math.floor(Math.random() * arr.length)];

/* ── Generate all anomaly records once ── */
const ALL_ANOMALIES = [];
let idCounter = 100000;

ROUTES.forEach(route => {
  for (let i = 0; i < route.anomalies; i++) {
    const zScore        = parseFloat((Math.random() * 4 + 2.8).toFixed(2));
    const type          = randEl(ANOMALY_TYPES);
    const risk          = zScore > 5.5 ? 'high' : zScore > 4 ? 'medium' : 'low';
    const value         = rand(15000, 980000);
    const costExpected  = rand(8000, 120000);
    const costActual    = type === 'Cost Spike'
      ? Math.round(costExpected * (1.3 + Math.random()))
      : Math.round(costExpected * (0.85 + Math.random() * 0.3));
    const daysAgo       = rand(0, 30);
    const date          = new Date();
    date.setDate(date.getDate() - daysAgo);

    ALL_ANOMALIES.push({
      id:           'SHP-' + (idCounter++),
      route:        route.code,
      routeName:    route.name,
      carrier:      randEl(CARRIERS),
      type,
      score:        zScore,
      risk,
      value,
      date:         date.toISOString().split('T')[0],
      flag:         route.flag,
      weight:       rand(200, 45000),
      origin_port:  route.name.split(' → ')[0],
      dest_port:    route.name.split(' → ')[1],
      container:    'CONT-' + rand(1000000, 9999999),
      eta_deviation: rand(-5, 21),
      cost_expected: costExpected,
      cost_actual:   costActual,
    });
  }
});

/* ── State ── */
let filteredAnomalies = [...ALL_ANOMALIES];
let currentPage   = 1;
const PAGE_SIZE   = 25;
let currentFilter = 'all';
let sortCol       = 'score';
let sortDir       = -1;
let activeRoute   = null; // null = all routes
let mainChart     = null; // Chart.js instance

/* ══════════════════════════════════════════════
   ROUTE SELECTION — the single source of truth.
   Clicking a route calls this, which updates
   KPIs, chart, and table all at once.
   ══════════════════════════════════════════════ */
function selectRoute(code, el) {
  /* Deselect all route items */
  document.querySelectorAll('.route-item').forEach(r => r.classList.remove('selected'));

  if (activeRoute === code) {
    /* Clicking the same route again → show all */
    activeRoute = null;
  } else {
    activeRoute = code;
    if (el) el.classList.add('selected');
  }

  updateKPIs();
  updateChart();
  applyFiltersAndSort();
}

/* ── KPI update ── */
function updateKPIs() {
  const subset = activeRoute
    ? ALL_ANOMALIES.filter(a => a.route === activeRoute)
    : ALL_ANOMALIES;

  const route      = activeRoute ? ROUTES.find(r => r.code === activeRoute) : null;
  const count      = subset.length;
  const risk       = route ? route.risk : 150000;
  const routeLabel = activeRoute ? activeRoute : '12 routes';

  document.getElementById('counter-anomalies').textContent = count.toLocaleString();
  document.getElementById('counter-risk').textContent      = '$' + (risk / 1000).toFixed(0) + 'K';
  document.getElementById('kpi-route-label').textContent   = routeLabel;

  const highCount = subset.filter(a => a.risk === 'high').length;
  document.getElementById('kpi-badge-anomalies').textContent =
    highCount > 0 ? highCount + ' HIGH' : 'ALL CLEAR';
}

/* ── Chart update — mutate existing Chart.js instance (instant, no flicker) ── */
function updateChart() {
  if (!mainChart) return;

  const subset = activeRoute
    ? ALL_ANOMALIES.filter(a => a.route === activeRoute)
    : ALL_ANOMALIES;

  /* Bucket anomalies by day-of-week */
  const anomalyByDay = [0, 0, 0, 0, 0, 0, 0];
  subset.forEach(a => {
    const dow = new Date(a.date).getDay(); // 0=Sun
    const idx = dow === 0 ? 6 : dow - 1;  // remap to Mon=0
    anomalyByDay[idx]++;
  });

  /* Scale normal shipments proportionally */
  const baseNormal  = [12400, 13200, 11800, 14600, 15200, 9800, 8200];
  const totalAll    = ALL_ANOMALIES.length;
  const totalSubset = subset.length;
  const ratio       = totalAll > 0 ? totalSubset / totalAll : 1;
  const scaledNormal = baseNormal.map(v => Math.round(v * ratio));

  mainChart.data.datasets[0].data = scaledNormal;
  mainChart.data.datasets[1].data = anomalyByDay;
  mainChart.update('none'); // 'none' = skip animation → instant update
}

/* ── Table filter + sort ── */
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();

  filteredAnomalies = ALL_ANOMALIES.filter(a => {
    const matchRoute = activeRoute ? a.route === activeRoute : true;
    const matchQ     = !q || a.id.toLowerCase().includes(q)
                          || a.route.toLowerCase().includes(q)
                          || a.carrier.toLowerCase().includes(q)
                          || a.type.toLowerCase().includes(q);
    const matchF =
      currentFilter === 'all'    ? true :
      currentFilter === 'high'   ? a.risk === 'high' :
      currentFilter === 'medium' ? a.risk === 'medium' :
      currentFilter === 'low'    ? a.risk === 'low' :
      currentFilter === 'delay'  ? a.type === 'Transit Delay' :
      currentFilter === 'cost'   ? a.type === 'Cost Spike' : true;

    return matchRoute && matchQ && matchF;
  });

  filteredAnomalies.sort((a, b) => {
    const av = (sortCol === 'score' || sortCol === 'value') ? a[sortCol] : a[sortCol];
    const bv = (sortCol === 'score' || sortCol === 'value') ? b[sortCol] : b[sortCol];
    return av > bv ? sortDir : av < bv ? -sortDir : 0;
  });

  currentPage = 1;
  renderTable();
}

function sortTable(col) {
  sortDir = sortCol === col ? sortDir * -1 : -1;
  sortCol = col;
  applyFiltersAndSort();
}

function changePage(d) {
  const maxPage = Math.ceil(filteredAnomalies.length / PAGE_SIZE);
  currentPage   = Math.max(1, Math.min(maxPage, currentPage + d));
  renderTable();
}

/* ── Render table rows ── */
function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end   = Math.min(start + PAGE_SIZE, filteredAnomalies.length);
  const page  = filteredAnomalies.slice(start, end);

  document.getElementById('tableCount').textContent =
    filteredAnomalies.length + ' anomalies' + (activeRoute ? ' — ' + activeRoute : '');
  document.getElementById('pageInfo').textContent =
    `Showing ${start + 1}–${end} of ${filteredAnomalies.length}`;
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = end >= filteredAnomalies.length;

  document.getElementById('tableBody').innerHTML = page.map(a => {
    const riskBg    = a.risk === 'high' ? 'severity-high' : a.risk === 'medium' ? 'severity-med' : 'severity-low';
    const typeColor = a.type === 'Cost Spike'   ? 'var(--warn)'    :
                      a.type === 'Transit Delay' ? 'var(--purple)'  :
                      a.type === 'Carrier Fraud' ? 'var(--danger)'  : 'var(--accent)';
    const typeBg    = a.type === 'Cost Spike'   ? 'badge-warn'     :
                      a.type === 'Carrier Fraud' ? 'badge-danger'   : 'badge-info';
    const fillPct   = Math.min(100, ((a.score - 2.8) / 4) * 100);
    const fillColor = a.score > 5.5 ? '#f87171' : a.score > 4 ? '#fbbf24' : '#38bdf8';

    return `<tr class="${a.risk === 'high' ? 'highlight-row' : ''}" onclick="openDrill('${a.id}')">
      <td><span style="font-family:var(--mono);font-size:11px;color:var(--accent)">${a.id}</span></td>
      <td><span style="font-size:11px">${a.flag} ${a.route}</span></td>
      <td style="color:var(--muted);font-size:12px">${a.carrier}</td>
      <td><span class="tag ${typeBg}" style="font-size:10px;color:${typeColor};background:${typeColor}22">${a.type}</span></td>
      <td>
        <div class="score-bar">
          <div class="score-track"><div class="score-fill" style="width:${fillPct.toFixed(0)}%;background:${fillColor}"></div></div>
          <span style="font-family:var(--mono);font-size:11px;color:${fillColor}">${a.score.toFixed(2)}σ</span>
        </div>
      </td>
      <td><span class="tag ${riskBg}">${a.risk.toUpperCase()}</span></td>
      <td style="font-family:var(--mono);font-size:11px">$${a.value.toLocaleString()}</td>
      <td style="font-size:11px;color:var(--muted);font-family:var(--mono)">${a.date}</td>
      <td><button onclick="event.stopPropagation();openDrill('${a.id}')" class="filter-btn" style="font-size:10px;padding:3px 8px">Drill ↗</button></td>
    </tr>`;
  }).join('');
}

/* ── Drill-down panel ── */
function openDrill(id) {
  const a = ALL_ANOMALIES.find(x => x.id === id);
  if (!a) return;

  const riskColor  = a.risk === 'high' ? 'var(--danger)' : a.risk === 'medium' ? 'var(--warn)' : 'var(--success)';
  const costDiff   = a.cost_actual - a.cost_expected;
  const costDiffPct = ((costDiff / a.cost_expected) * 100).toFixed(1);

  document.getElementById('drillTitle').textContent = a.type + ' Detected';
  document.getElementById('drillId').textContent    = a.id + ' · ' + a.route;
  document.getElementById('drillBody').innerHTML = `
    <div class="detail-grid">
      <div class="detail-card"><div class="detail-label">Z-Score</div><div class="detail-val" style="color:${riskColor};font-family:var(--mono)">${a.score.toFixed(2)}σ</div></div>
      <div class="detail-card"><div class="detail-label">Risk Level</div><div class="detail-val" style="color:${riskColor}">${a.risk.toUpperCase()}</div></div>
      <div class="detail-card"><div class="detail-label">Shipment Value</div><div class="detail-val" style="font-family:var(--mono)">$${a.value.toLocaleString()}</div></div>
      <div class="detail-card"><div class="detail-label">Weight (kg)</div><div class="detail-val" style="font-family:var(--mono)">${a.weight.toLocaleString()}</div></div>
    </div>

    <div style="font-size:12px;font-weight:500;margin-bottom:8px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;letter-spacing:1px">Shipment Details</div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:1rem;">
      <div class="stat-row"><span class="stat-key">Container ID</span><span style="font-family:var(--mono);font-size:11px">${a.container}</span></div>
      <div class="stat-row"><span class="stat-key">Carrier</span><span>${a.carrier}</span></div>
      <div class="stat-row"><span class="stat-key">Origin Port</span><span>${a.origin_port}</span></div>
      <div class="stat-row"><span class="stat-key">Destination</span><span>${a.dest_port}</span></div>
      <div class="stat-row"><span class="stat-key">ETA Deviation</span><span style="color:${a.eta_deviation > 0 ? 'var(--danger)' : 'var(--success)'};">${a.eta_deviation > 0 ? '+' : ''}${a.eta_deviation} days</span></div>
      <div class="stat-row"><span class="stat-key">Flagged Date</span><span style="font-family:var(--mono);font-size:11px">${a.date}</span></div>
    </div>

    <div style="font-size:12px;font-weight:500;margin-bottom:8px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;letter-spacing:1px">Cost Analysis</div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:1rem;">
      <div class="stat-row"><span class="stat-key">Expected Cost</span><span style="font-family:var(--mono)">$${a.cost_expected.toLocaleString()}</span></div>
      <div class="stat-row"><span class="stat-key">Actual Cost</span><span style="font-family:var(--mono);color:${costDiff > 0 ? 'var(--danger)' : 'var(--success)'}">$${a.cost_actual.toLocaleString()}</span></div>
      <div class="stat-row"><span class="stat-key">Variance</span><span style="font-family:var(--mono);color:${costDiff > 0 ? 'var(--danger)' : 'var(--success)'}">${costDiff > 0 ? '+' : ''}${costDiffPct}% ($${Math.abs(costDiff).toLocaleString()})</span></div>
    </div>

    <div style="font-size:12px;font-weight:500;margin-bottom:8px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;letter-spacing:1px">Detection Method</div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:1rem;font-size:12px;color:var(--muted);line-height:1.6">
      Flagged via <strong style="color:var(--text)">Z-Score Analysis</strong> with σ = ${a.score.toFixed(2)} (threshold: 2.8σ).
      ${a.type === 'Cost Spike'           ? 'Shipment cost exceeded expected range by ' + costDiffPct + '%, triggering cost anomaly protocol.'
      : a.type === 'Transit Delay'        ? 'Shipment arrived ' + a.eta_deviation + ' days past expected window, outside normal variance.'
      : a.type === 'Route Deviation'      ? 'Vessel path deviated from registered corridor, flagged by geofence monitor.'
      : a.type === 'Carrier Fraud'        ? 'Carrier credentials did not match verified registry — escalated for manual review.'
      : 'Statistical outlier detected in batch processing. Recommended for manual audit.'}
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="filter-btn" style="background:rgba(248,113,113,0.15);color:var(--danger);border-color:rgba(248,113,113,0.3);font-size:11px">Escalate to Manager</button>
      <button class="filter-btn" style="font-size:11px">Mark as Reviewed</button>
      <button class="filter-btn" style="font-size:11px">Export Record</button>
    </div>`;

  document.getElementById('drillPanel').classList.add('open');
}

function closeDrill() {
  document.getElementById('drillPanel').classList.remove('open');
}

/* ── Render route sidebar ── */
function renderRoutes() {
  const max = ROUTES[0].anomalies;
  document.getElementById('routeList').innerHTML = ROUTES.map((r, i) => `
    <div class="route-item${i === 0 ? ' selected' : ''}" onclick="selectRoute('${r.code}', this)">
      <span class="route-flag">${r.flag}</span>
      <div>
        <div class="route-name">${r.code}</div>
        <div class="route-code" style="font-size:10px">${r.name}</div>
      </div>
      <div class="route-bar"><div class="route-bar-fill" style="width:${((r.anomalies / max) * 100).toFixed(0)}%;background:${r.color}"></div></div>
      <span class="route-anomalies severity-${r.severity}">${r.anomalies}</span>
    </div>`).join('');

  /* Auto-select first route on load */
  activeRoute = ROUTES[0].code;
}

/* ── Build Chart.js (once) ── */
function buildChart() {
  const ctx = document.getElementById('mainChart').getContext('2d');
  mainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DAYS_OF_WEEK,
      datasets: [
        {
          type: 'bar',
          label: 'Normal Shipments',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(56,189,248,0.15)',
          borderColor: 'rgba(56,189,248,0.5)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Anomalies',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#f87171',
          backgroundColor: 'rgba(248,113,113,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#f87171',
          pointRadius: 4,
          tension: 0.3,
          fill: true,
          yAxisID: 'y2',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.datasetIndex === 0
              ? ' Shipments: ' + ctx.raw.toLocaleString()
              : ' Anomalies: ' + ctx.raw
          }
        }
      },
      scales: {
        x:  { grid: { color: 'rgba(99,179,237,0.08)' }, ticks: { color: '#64748b', font: { family: 'IBM Plex Mono', size: 11 } } },
        y:  { grid: { color: 'rgba(99,179,237,0.08)' }, position: 'left',  ticks: { color: '#64748b', font: { family: 'IBM Plex Mono', size: 10 }, callback: v => (v / 1000).toFixed(0) + 'k' } },
        y2: { grid: { display: false },                  position: 'right', ticks: { color: '#f87171', font: { family: 'IBM Plex Mono', size: 10 } } }
      }
    }
  });
}

/* ── Activity log (static) ── */
function buildActivityLog() {
  const events = [
    { time: '14:32:07', text: 'SHP-100023 flagged — 6.4σ cost spike on SHG-LAX', color: 'var(--danger)' },
    { time: '14:29:51', text: 'Batch 1,847 completed — 7 new anomalies detected',  color: 'var(--warn)' },
    { time: '14:18:33', text: 'SHP-100091 escalated by logistics manager',          color: 'var(--purple)' },
    { time: '14:02:14', text: 'IQR re-calibration completed — Q1/Q3 updated',      color: 'var(--accent)' },
    { time: '13:55:40', text: 'SHP-100045 marked as reviewed — false positive',     color: 'var(--success)' },
    { time: '13:41:09', text: 'RTD-HBG route — 3 new delay anomalies flagged',     color: 'var(--danger)' },
    { time: '13:22:55', text: 'Pipeline heartbeat OK — all 6 stages nominal',      color: 'var(--success)' },
    { time: '12:58:03', text: 'SHP-100182 carrier fraud flag — manual review',     color: 'var(--danger)' },
  ];
  document.getElementById('activityLog').innerHTML = events.map(e => `
    <div class="timeline-item">
      <div class="timeline-time">${e.time}</div>
      <div class="timeline-dot" style="background:${e.color}"></div>
      <div style="font-size:12px;color:var(--muted);line-height:1.4">${e.text}</div>
    </div>`).join('');
}

/* ── Pipeline progress bars animation ── */
function animateProgressBars() {
  const delays = [200, 600, 1000, 1400, 1800];
  ['pb1','pb2','pb3','pb4','pb5'].forEach((id, i) => {
    setTimeout(() => {
      document.getElementById(id).style.width = id === 'pb5' ? '60%' : '100%';
    }, delays[i]);
  });
}

/* ── Search box ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('input', applyFiltersAndSort);
});

/* ══════════════════════════════════════════════
   INIT — order matters:
   1. Build chart shell first
   2. Render routes (sets activeRoute to first)
   3. Push real data into chart
   4. Update KPIs
   5. Render table
   ══════════════════════════════════════════════ */
buildChart();
renderRoutes();
updateChart();
updateKPIs();
applyFiltersAndSort();
buildActivityLog();
animateProgressBars();
