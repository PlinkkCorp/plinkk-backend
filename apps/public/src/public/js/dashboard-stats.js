// Stats dashboard (client-side)
// Expects window.__STATS__ = { views: number, links: Array<{id:string,text?:string,name?:string,url:string,clicks:number}> }

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

function formatNumber(n) {
  return new Intl.NumberFormat().format(n || 0);
}

function makeCSV(rows) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['Link ID', 'Label', 'URL', 'Clicks'];
  const lines = [head.map(esc).join(',')];
  rows.forEach((r) => {
    lines.push([r.id, r.label, r.url, r.clicks].map(esc).join(','));
  });
  return lines.join('\r\n');
}

function downloadBlob(content, filename, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function buildBarChart(container, data, { maxBars = 10 } = {}) {
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = '<div class="text-xs text-slate-400">Aucune donnée à afficher.</div>';
    return;
  }
  const width = container.clientWidth || 600;
  const barH = 28;
  const gap = 8;
  const leftLabelW = 220;
  const rightValW = 60;
  const innerW = Math.max(100, width - leftLabelW - rightValW - 20);
  const bars = data.slice(0, maxBars);
  const maxVal = Math.max(1, Math.max(...bars.map((b) => b.clicks)));
  const height = bars.length * (barH + gap) + 10;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));

  bars.forEach((b, i) => {
    const y = 5 + i * (barH + gap);
    const w = Math.max(2, Math.round((b.clicks / maxVal) * innerW));
    // Label gauche
    const label = document.createElementNS(svg.namespaceURI, 'text');
    label.setAttribute('x', String(8));
    label.setAttribute('y', String(y + barH * 0.7));
    label.setAttribute('fill', '#cbd5e1');
    label.setAttribute('font-size', '12');
    label.textContent = (b.label || 'Sans titre').slice(0, 34);
    svg.appendChild(label);
    // Barre
    const rectBg = document.createElementNS(svg.namespaceURI, 'rect');
    rectBg.setAttribute('x', String(leftLabelW));
    rectBg.setAttribute('y', String(y));
    rectBg.setAttribute('width', String(innerW));
    rectBg.setAttribute('height', String(barH));
    rectBg.setAttribute('rx', '4');
    rectBg.setAttribute('fill', '#0f172a');
    rectBg.setAttribute('stroke', '#1e293b');
    svg.appendChild(rectBg);

    const rect = document.createElementNS(svg.namespaceURI, 'rect');
    rect.setAttribute('x', String(leftLabelW));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', '#6366f1');
    svg.appendChild(rect);

    // Valeur à droite
    const val = document.createElementNS(svg.namespaceURI, 'text');
    val.setAttribute('x', String(leftLabelW + innerW + 8));
    val.setAttribute('y', String(y + barH * 0.7));
    val.setAttribute('fill', '#94a3b8');
    val.setAttribute('font-size', '12');
    val.textContent = String(b.clicks);
    svg.appendChild(val);
  });
  container.appendChild(svg);
}

// Graphique en ligne/aire pour séries journalières
function drawLineChart(container, series) {
  container.innerHTML = '';
  if (!series.length) {
    container.innerHTML = '<div class="text-xs text-slate-400">Aucune donnée à afficher.</div>';
    return;
  }
  const width = container.clientWidth || 700;
  const height = 220;
  const pad = { l: 36, r: 12, t: 12, b: 24 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const maxY = Math.max(1, Math.max(...series.map((p) => p.count)));
  const stepX = innerW / Math.max(1, series.length - 1);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));

  // Axes simples (graduations horizontales)
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const yVal = (i / gridCount) * maxY;
    const y = pad.t + innerH - (yVal / maxY) * innerH;
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', String(pad.l));
    line.setAttribute('x2', String(pad.l + innerW));
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', '#1e293b');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
    const label = document.createElementNS(svg.namespaceURI, 'text');
    label.setAttribute('x', String(4));
    label.setAttribute('y', String(y + 4));
    label.setAttribute('fill', '#64748b');
    label.setAttribute('font-size', '10');
    label.textContent = String(Math.round(yVal));
    svg.appendChild(label);
  }

  // Aire
  let d = '';
  series.forEach((p, i) => {
    const x = pad.l + i * stepX;
    const y = pad.t + innerH - (p.count / maxY) * innerH;
    d += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
  });
  const area = document.createElementNS(svg.namespaceURI, 'path');
  area.setAttribute('d', `${d} L ${pad.l + innerW} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`);
  area.setAttribute('fill', '#4f46e5');
  area.setAttribute('opacity', '0.15');
  svg.appendChild(area);

  // Ligne
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#6366f1');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);

  // Points
  series.forEach((p, i) => {
    const x = pad.l + i * stepX;
    const y = pad.t + innerH - (p.count / maxY) * innerH;
    const c = document.createElementNS(svg.namespaceURI, 'circle');
    c.setAttribute('cx', String(x));
    c.setAttribute('cy', String(y));
    c.setAttribute('r', '2');
    c.setAttribute('fill', '#818cf8');
    svg.appendChild(c);
  });

  container.appendChild(svg);
}

// Catégorisation par domaine d'URL
function getHostnameSafe(url) {
  try { return new URL(url).hostname || ''; } catch { return ''; }
}

function classifyCategory(url, fallbackLabel = '') {
  const h = getHostnameSafe(url).toLowerCase();
  const text = (fallbackLabel || '').toLowerCase();
  const hay = h + ' ' + text;
  const tests = [
    { name: 'Réseaux sociaux', re: /(twitter|x\.com|instagram|facebook|tiktok|linkedin|threads|bluesky)/ },
    { name: 'Vidéo', re: /(youtube|youtu\.be|vimeo|twitch|dailymotion)/ },
    { name: 'Musique', re: /(spotify|soundcloud|music\.apple|deezer|bandcamp)/ },
    { name: 'Code', re: /(github|gitlab|bitbucket|npmjs|pypi|docker\.com)/ },
    { name: 'Articles & Blog', re: /(medium\.com|dev\.to|hashnode|substack|notion\.site|ghost)/ },
    { name: 'E‑commerce', re: /(gumroad|shopify|buymeacoffee|patreon|ko-fi|paypal)/ },
  ];
  for (const t of tests) {
    if (t.re.test(hay)) return t.name;
  }
  if (!h) return 'Autres';
  // Heuristique: domaines perso
  return 'Site perso / Autres';
}

function aggregateCategories(rows) {
  const map = new Map();
  for (const r of rows) {
    const cat = classifyCategory(r.url, r.label);
    const prev = map.get(cat) || 0;
    map.set(cat, prev + (Number(r.clicks) || 0));
  }
  const list = Array.from(map.entries()).map(([label, clicks]) => ({ label, clicks }));
  list.sort((a, b) => b.clicks - a.clicks);
  return list;
}

function updateKPIs({ views, links }) {
  const totalClicks = links.reduce((a, l) => a + (l.clicks || 0), 0);
  const avgClicks = links.length ? totalClicks / links.length : 0;
  const top = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];

  const elViews = qs('#kpiViews'); if (elViews) elViews.textContent = formatNumber(views || 0);
  const elClicks = qs('#kpiClicks'); if (elClicks) elClicks.textContent = formatNumber(totalClicks);
  const elAvg = qs('#kpiAvg'); if (elAvg) elAvg.textContent = formatNumber(Math.round(avgClicks));
  const elTop = qs('#kpiTop'); if (elTop) elTop.textContent = top ? `${top.text || top.name || 'Sans titre'} (${formatNumber(top.clicks || 0)})` : '—';
}

function applyFilters(allLinks) {
  const q = (qs('#fSearch')?.value || '').toLowerCase().trim();
  const min = Number(qs('#fMin')?.value || '0') || 0;
  const top = Number(qs('#fTop')?.value || '10') || 10;
  let list = allLinks.map((l) => ({
    id: l.id,
    label: l.text || l.name || l.url || 'Sans titre',
    url: l.url,
    clicks: Number(l.clicks || 0),
  }));
  if (q) list = list.filter((x) => x.label.toLowerCase().includes(q) || String(x.id).includes(q) || (x.url || '').toLowerCase().includes(q));
  if (min > 0) list = list.filter((x) => x.clicks >= min);
  list.sort((a, b) => b.clicks - a.clicks);
  return { rows: list, top };
}

function renderTable(rows) {
  const tbody = qs('#tblBody');
  tbody.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.className = 'border-t border-slate-800 hover:bg-slate-800/40';
    tr.innerHTML = `
      <td class="px-3 py-2 text-xs text-slate-400">${r.id}</td>
      <td class="px-3 py-2">${r.label}</td>
      <td class="px-3 py-2 text-indigo-300 truncate"><a class="hover:underline" href="${r.url}" target="_blank" rel="noopener">${r.url}</a></td>
      <td class="px-3 py-2 text-right">${formatNumber(r.clicks)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function fetchDailyViews(days) {
  const now = new Date();
  const to = now.toISOString().slice(0,10);
  const fromDate = new Date(now.getTime() - (days - 1) * 86400000);
  const from = fromDate.toISOString().slice(0,10);
  const res = await fetch(`/dashboard/stats/views?from=${from}&to=${to}` , { credentials: 'same-origin' });
  if (!res.ok) {
    let msg = '';
    try { msg = await res.text(); } catch {}
    const err = new Error(`HTTP ${res.status} ${res.statusText}${msg ? ' — ' + msg : ''}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function main() {
  const root = qs('#statsRoot');
  let data = { views: 0, links: [] };
  if (root) {
    const views = Number(root.getAttribute('data-views') || '0') || 0;
    const linksRaw = root.getAttribute('data-links') || '[]';
    try { data.links = JSON.parse(linksRaw) || []; } catch { data.links = []; }
    data.views = views;
  }
  updateKPIs(data);
  const apply = () => {
    const { rows, top } = applyFilters(data.links || []);
    renderTable(rows);
    buildBarChart(qs('#chartTop'), rows, { maxBars: top });
    // Catégories (agrégat sur liste filtrée)
    const catData = aggregateCategories(rows);
    buildBarChart(qs('#chartCategories'), catData, { maxBars: 8 });
    qs('#exportCsv').onclick = () => downloadBlob(makeCSV(rows), 'stats-links.csv');
  };
  ['#fSearch', '#fMin', '#fTop'].forEach((sel) => qs(sel)?.addEventListener('input', apply));
  apply();

  // Vue datée
  const chartContainer = qs('#chartViews');
  const fRange = qs('#fRange');
  async function refreshViews() {
    const days = Number(fRange?.value || '30') || 30;
    try {
  const { series } = await fetchDailyViews(days);
  drawLineChart(chartContainer, series);
    } catch (e) {
      // Fallback: utiliser la série 30j préchargée côté serveur si disponible
      const preloadRaw = root?.getAttribute('data-views-daily') || '[]';
      try {
        const preload = JSON.parse(preloadRaw) || [];
        if (Array.isArray(preload) && preload.length) {
      drawLineChart(chartContainer, preload);
          return;
        }
      } catch {}
      const statusMsg = e && e.status === 401 ? ' (non connecté)' : '';
      const details = (e && e.message) ? ` — ${e.message}` : '';
      chartContainer.innerHTML = `<div class="text-xs text-rose-400">Erreur de chargement des vues datées${statusMsg}${details}</div>`;
    }
  }
  fRange?.addEventListener('change', refreshViews);
  await refreshViews();

  // Clics datés
  const chartClicks = qs('#chartClicks');
  async function fetchDailyClicks(days) {
    const now = new Date();
    const to = now.toISOString().slice(0,10);
    const fromDate = new Date(now.getTime() - (days - 1) * 86400000);
    const from = fromDate.toISOString().slice(0,10);
    const res = await fetch(`/dashboard/stats/clicks?from=${from}&to=${to}`, { credentials: 'same-origin' });
    if (!res.ok) {
      let msg = '';
      try { msg = await res.text(); } catch {}
      const err = new Error(`HTTP ${res.status} ${res.statusText}${msg ? ' — ' + msg : ''}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  async function refreshClicks() {
    const days = Number(fRange?.value || '30') || 30;
    try {
      const { series } = await fetchDailyClicks(days);
      drawLineChart(chartClicks, series);
    } catch (e) {
      const preloadRaw = root?.getAttribute('data-clicks-daily') || '[]';
      try {
        const preload = JSON.parse(preloadRaw) || [];
        if (Array.isArray(preload) && preload.length) {
          drawLineChart(chartClicks, preload);
          return;
        }
      } catch {}
      const statusMsg = e && e.status === 401 ? ' (non connecté)' : '';
      const details = (e && e.message) ? ` — ${e.message}` : '';
      chartClicks.innerHTML = `<div class="text-xs text-rose-400">Erreur de chargement des clics datés${statusMsg}${details}</div>`;
    }
  }
  fRange?.addEventListener('change', refreshClicks);
  await refreshClicks();
}

document.addEventListener('DOMContentLoaded', main);
