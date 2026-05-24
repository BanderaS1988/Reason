const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE   = 'https://reason-five.vercel.app';

// ── Kategória adatok ────────────────────────────────────────────
const CAT_COLOR = {
  'Mesterséges Intelligencia és Technológia': '#0066cc',
  'Klímaváltozás és Fenntarthatóság':         '#10b981',
  'Mentális Egészség és Önismeret':           '#e85d9b',
  'Világgazdaság és Pénzügyek':               '#f59e0b',
  'Űrkutatás és Asztrofizika':                '#7c3aed',
  'Orvostudomány és Élethosszabbítás':        '#ef4444',
  'Filozófia és az Élet Értelme':             '#a16207',
  'Oktatás és a Tudás Jövője':                '#0891b2',
};
const CAT_EMOJI = {
  'Mesterséges Intelligencia és Technológia': '🤖',
  'Klímaváltozás és Fenntarthatóság':         '🌍',
  'Mentális Egészség és Önismeret':           '🧠',
  'Világgazdaság és Pénzügyek':               '💰',
  'Űrkutatás és Asztrofizika':                '🚀',
  'Orvostudomány és Élethosszabbítás':        '🩺',
  'Filozófia és az Élet Értelme':             '💡',
  'Oktatás és a Tudás Jövője':                '📚',
};

function esc(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function ageBadge(iso) {
  if (!iso) return '';
  const diffH = (Date.now() - new Date(iso)) / 3600000;
  const today  = new Date().toDateString() === new Date(iso).toDateString();
  if (diffH < 1) return '<span class="badge-new">● Friss</span>';
  if (today)     return '<span class="badge-today">● Ma</span>';
  return '';
}

// ── Supabase: összes cikk (max 2000) ───────────────────────────
async function fetchArticles() {
  try {
    const headers = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
    const base = `${SB_URL}/rest/v1/articles?select=id,title,excerpt,category,created_at,read_time,like_count,comment_count,view_count,is_premium,image_url&order=created_at.desc`;

    const r1 = await fetch(`${base}&limit=1000&offset=0`, { headers });
    if (!r1.ok) return [];
    const batch1 = await r1.json();

    if (batch1.length === 1000) {
      const r2 = await fetch(`${base}&limit=1000&offset=1000`, { headers });
      if (r2.ok) {
        const batch2 = await r2.json();
        return [...batch1, ...batch2];
      }
    }
    return batch1;
  } catch {
    return [];
  }
}

// ── Kártyák ─────────────────────────────────────────────────────
function renderCards(articles) {
  if (!articles.length) {
    return `<div class="empty-state">
      <span class="empty-icon">📭</span>
      <div class="empty-title">Hamarosan friss hírek érkeznek</div>
    </div>`;
  }
  return articles.map((art, i) => {
    const c   = art.category || 'Egyéb';
    const col = CAT_COLOR[c] || '#888';
    const ico = CAT_EMOJI[c] || '📰';
    const ex  = art.excerpt || '';

    if (i === 0) {
      return `<div class="featured-card">
        <div class="featured-img" style="background:linear-gradient(135deg,${col}20,${col}08)">
          ${art.image_url
            ? `<img src="${esc(art.image_url)}" alt="${esc(art.title)}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
            : `<span style="font-size:64px;opacity:.18">${ico}</span>`}
        </div>
        <div class="featured-content">
          <div class="featured-cat" style="color:${col}">${esc(c)}</div>
          <h2 class="featured-title"><a href="${SITE}/cikk/${art.id}">${esc(art.title || '')}</a></h2>
          <p class="featured-excerpt">${esc(ex)}</p>
          <div class="featured-foot">
            <span>🕐 ${fmtDate(art.created_at)} ${ageBadge(art.created_at)}</span>
            <span>⏱ ${art.read_time || '?'} perc</span>
            <span>❤️ ${art.like_count || 0}</span>
            <span>💬 ${art.comment_count || 0}</span>
            ${art.is_premium ? '<span class="premium-tag">⭐ Prémium</span>' : ''}
          </div>
        </div>
      </div>`;
    }

    return `<article class="card">
      <a href="${SITE}/cikk/${art.id}" class="card-link">
        <div class="card-img" style="background:linear-gradient(135deg,${col}16,${col}08)${art.image_url ? `;background-image:url(${esc(art.image_url)});background-size:cover;background-position:center` : ''}">
          ${!art.image_url ? `<span class="card-emoji">${ico}</span>` : ''}
          <span class="card-cat-badge">${esc(c)}</span>
          ${art.is_premium ? '<span class="premium-ribbon">⭐ PRÉMIUM</span>' : ''}
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="card-cat" style="color:${col}">${esc(c)}</span>
            <span class="card-dot"></span>
            <span class="card-time">${fmtDate(art.created_at)} ${ageBadge(art.created_at)}</span>
          </div>
          <h3 class="card-title">${esc(art.title || 'Cím nélkül')}</h3>
          <p class="card-excerpt">${esc(ex)}</p>
          <div class="card-foot">
            <span>REASON Szerkesztőség</span>
            <span class="card-stats">
              ❤️ ${art.like_count || 0}
              &nbsp;💬 ${art.comment_count || 0}
              &nbsp;👁 ${art.view_count || 0}
              &nbsp;⏱ ${art.read_time || '?'} perc
            </span>
          </div>
        </div>
      </a>
    </article>`;
  }).join('');
}

function renderCatList(articles) {
  const counts = {};
  articles.forEach(a => {
    const c = a.category || 'Egyéb';
    counts[c] = (counts[c] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => {
      const col = CAT_COLOR[c] || '#999';
      const ico = CAT_EMOJI[c] || '📌';
      return `<a href="${SITE}/?cat=${encodeURIComponent(c)}" class="cat-row">
        <span class="cat-dot-c" style="background:${col}"></span>
        <span class="cat-name">${ico} ${esc(c)}</span>
        <span class="cat-count">${n}</span>
      </a>`;
    }).join('');
}

// ── Teljes statikus HTML oldal ──────────────────────────────────
function renderPage(articles) {
  const todayCount = articles.filter(a =>
    new Date(a.created_at || 0).toDateString() === new Date().toDateString()
  ).length;

  const schemaItems = articles.slice(0, 10).map((a, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE}/cikk/${a.id}`,
    name: a.title || '',
  }));
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'REASON – Legfrissebb cikkek',
    description: 'Gyors. Forrásalapú. Automatizált.',
    url: SITE,
    itemListElement: schemaItems,
  });

  const navCats = [
    ['Mesterséges Intelligencia és Technológia', '🤖 MI &amp; Tech'],
    ['Klímaváltozás és Fenntarthatóság',         '🌍 Klíma'],
    ['Mentális Egészség és Önismeret',           '🧠 Mentális'],
    ['Világgazdaság és Pénzügyek',               '💰 Gazdaság'],
    ['Űrkutatás és Asztrofizika',                '🚀 Űrkutatás'],
    ['Orvostudomány és Élethosszabbítás',        '🩺 Orvostudomány'],
    ['Filozófia és az Élet Értelme',             '💡 Filozófia'],
    ['Oktatás és a Tudás Jövője',                '📚 Oktatás'],
  ];
  const navHtml = navCats.map(([cat, label]) => {
    const cnt = articles.filter(a => a.category === cat).length;
    return `<a href="${SITE}/?cat=${encodeURIComponent(cat)}" class="nav-item">
      ${label} <span class="nav-count">${cnt}</span>
    </a>`;
  }).join('');

  const tickerItems = articles.slice(0, 20);
  const tickerHtml = [
    ...tickerItems.map(a => `<span class="ticker-item">${esc(a.title || '')}</span><span class="ticker-sep">·</span>`),
    ...tickerItems.map(a => `<span class="ticker-item">${esc(a.title || '')}</span><span class="ticker-sep">·</span>`),
  ].join('');

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>REASON – Friss Hírek</title>
<meta name="description" content="REASON – Gyors. Forrásalapú. Automatizált. Friss hírek MI, technológia, klíma, gazdaság és tudomány témakörökben.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/">
<meta property="og:title" content="REASON – Friss Hírek">
<meta property="og:description" content="Gyors. Forrásalapú. Automatizált.">
<meta property="og:url" content="${SITE}/">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE}/og-default.png">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="REASON">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="REASON – Friss Hírek">
<meta name="twitter:description" content="Gyors. Forrásalapú. Automatizált.">
<meta name="twitter:image" content="${SITE}/og-default.png">
<script type="application/ld+json">${schema}<\/script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7856205120757314" crossorigin="anonymous"><\/script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;max-width:100%}
:root{
  --bg:#f8f7f4;--bg2:#ffffff;--bg3:#f2f0ec;
  --surface:#ffffff;--border:#e8e4dc;--border2:#d4cfc4;
  --text:#1a1814;--text2:#3d3a35;--text3:#706b62;--text4:#9e9890;
  --accent:#c8102e;--gold:#b8860b;--cyan:#0066cc;--green:#1a7a3c;
  --shadow:0 1px 3px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.05);
  --shadow2:0 2px 8px rgba(0,0,0,.12),0 8px 24px rgba(0,0,0,.08);
  --font-d:'Playfair Display',Georgia,serif;
  --font-s:'Inter',system-ui,sans-serif;
}
body{background:var(--bg);color:var(--text);font-family:var(--font-s);font-size:15px;line-height:1.6;min-height:100vh}
a{text-decoration:none;color:inherit}
.ticker-wrap{background:var(--accent);color:#fff;overflow:hidden;height:34px;display:flex;align-items:center}
.ticker-label{background:rgba(0,0,0,.25);padding:0 14px;height:100%;display:flex;align-items:center;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;white-space:nowrap;flex-shrink:0}
.ticker-scroll{flex:1;overflow:hidden}
.ticker-inner{display:flex;animation:ticker 60s linear infinite;white-space:nowrap;align-items:center;height:34px}
.ticker-item{padding:0 28px;font-size:12px;font-weight:500}
.ticker-sep{opacity:.4;padding:0 4px}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.site-header{background:var(--bg2);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:190;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.header-top{display:flex;align-items:center;justify-content:space-between;padding:14px 28px 12px;max-width:1400px;margin:0 auto;gap:16px;flex-wrap:wrap}
.logo{font-family:var(--font-d);font-size:34px;font-weight:900;color:var(--text);letter-spacing:-1.5px;line-height:1}
.logo span{color:var(--accent)}
.logo-tagline{font-size:10px;color:var(--text4);letter-spacing:.18em;text-transform:uppercase;margin-top:2px}
.header-right{display:flex;align-items:center;gap:16px}
.main-nav{border-top:1px solid var(--border);overflow-x:auto;scrollbar-width:none}
.main-nav::-webkit-scrollbar{display:none}
.nav-inner{display:flex;padding:0 28px;max-width:1400px;margin:0 auto}
.nav-item{padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);white-space:nowrap;border-bottom:3px solid transparent;transition:.15s;display:inline-block}
.nav-item:hover{color:var(--text);border-bottom-color:var(--accent)}
.nav-item.all{color:var(--accent);border-bottom-color:var(--accent)}
.nav-count{display:inline-block;background:var(--accent);color:#fff;font-size:8px;font-weight:700;padding:1px 5px;border-radius:10px;margin-left:4px;vertical-align:middle;min-width:16px;text-align:center}
.ad-strip{margin:16px auto 0;max-width:1400px;padding:0 28px;min-height:0}
.page-wrap{max-width:1400px;margin:0 auto;padding:28px 28px 80px}
.main-layout{display:grid;grid-template-columns:1fr 300px;gap:32px;align-items:start}
@media(max-width:1000px){.main-layout{grid-template-columns:1fr}}
.status-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 0;margin-bottom:20px;border-bottom:1px solid var(--border)}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);display:inline-block;margin-right:8px;animation:pulse-dot 2s infinite}
@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}
.status-text{font-size:12px;color:var(--text3)}
.section-label{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--text4);margin-bottom:14px;display:flex;align-items:center;gap:10px}
.section-label::after{content:'';flex:1;height:1px;background:var(--border)}
.strip-title{font-family:var(--font-d);font-size:26px;font-weight:900;color:var(--text);margin-bottom:16px}
.strip-count{font-size:11px;color:var(--text4);font-family:monospace;background:var(--bg3);padding:2px 8px;border-radius:10px;margin-left:8px}
.featured-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:grid;grid-template-columns:280px 1fr;margin-bottom:32px;transition:.2s}
.featured-card:hover{box-shadow:var(--shadow2);border-color:var(--border2)}
.featured-img{display:flex;align-items:center;justify-content:center;min-height:240px;overflow:hidden}
.featured-content{padding:28px 30px;display:flex;flex-direction:column}
.featured-cat{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}
.featured-title{font-family:var(--font-d);font-size:24px;font-weight:800;line-height:1.3;color:var(--text);margin-bottom:12px;flex:1}
.featured-title a{color:inherit}
.featured-title a:hover{color:var(--accent)}
.featured-excerpt{font-size:13px;color:var(--text3);line-height:1.65;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.featured-foot{display:flex;align-items:center;gap:14px;font-size:11px;color:var(--text4);flex-wrap:wrap}
.premium-tag{color:var(--gold);font-weight:700}
.articles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:22px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:.2s}
.card:hover{box-shadow:var(--shadow2);border-color:var(--border2);transform:translateY(-2px)}
.card-link{display:flex;flex-direction:column;height:100%;color:inherit}
.card-img{height:190px;display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0;overflow:hidden}
.card-emoji{font-size:40px;opacity:.18}
.card-cat-badge{position:absolute;bottom:8px;left:8px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,.88);color:var(--text2)}
.premium-ribbon{position:absolute;top:8px;right:8px;background:#f0c040;color:#5a3e00;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:.06em}
.card-body{padding:15px 16px;flex:1;display:flex;flex-direction:column}
.card-meta{display:flex;align-items:center;gap:7px;margin-bottom:7px;flex-wrap:wrap}
.card-cat{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.card-dot{width:3px;height:3px;border-radius:50%;background:var(--border2);flex-shrink:0}
.card-time{font-size:10px;color:var(--text4);font-family:monospace}
.card-title{font-family:var(--font-d);font-size:17px;font-weight:700;line-height:1.35;color:var(--text);margin-bottom:8px;flex:1}
.card-title:hover{color:var(--accent)}
.card-excerpt{font-size:12px;color:var(--text3);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px}
.card-foot{display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border);font-size:10px;color:var(--text4)}
.card-stats{display:flex;align-items:center;gap:8px}
.badge-new{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:#1a7a3c22;color:#1a7a3c;margin-left:4px}
.badge-today{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:#0066cc22;color:#0066cc;margin-left:4px}
.empty-state{text-align:center;padding:80px 24px;color:var(--text4)}
.empty-icon{font-size:60px;display:block;margin-bottom:16px;opacity:.25}
.empty-title{font-family:var(--font-d);font-size:22px;color:var(--text3)}
.sidebar{display:flex;flex-direction:column;gap:20px;position:sticky;top:110px}
.s-widget{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 20px}
.s-title{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--text4);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.stat-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px}
.stat-row:last-child{border-bottom:none}
.stat-val{font-weight:700;color:var(--text);font-family:monospace;font-size:14px}
.cat-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);transition:.15s;color:inherit}
.cat-row:last-child{border-bottom:none}
.cat-row:hover .cat-name{color:var(--accent)}
.cat-dot-c{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.cat-name{font-size:12px;font-weight:500;color:var(--text2);flex:1;transition:.15s}
.cat-count{font-size:11px;color:var(--text4);font-family:monospace;background:var(--bg3);padding:1px 7px;border-radius:10px}
.support-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;background:linear-gradient(135deg,#f0c040,#e8a800);color:#5a3e00;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font-s);width:100%;justify-content:center;margin-top:8px}
.support-btn:hover{opacity:.9}
.about-text{font-size:12px;color:var(--text3);line-height:1.75}
.about-text p{margin-bottom:8px}
footer{background:var(--text);color:var(--text4);text-align:center;padding:20px;font-size:11px;line-height:2}
footer a{color:#f0c040}
@media(max-width:700px){
  .header-top{padding:10px 12px}
  .logo{font-size:26px}
  .logo-tagline{display:none}
  .nav-inner{padding:0 8px}
  .nav-item{padding:8px 10px;font-size:10px}
  .page-wrap{padding:12px 10px 70px}
  .featured-card{grid-template-columns:1fr}
  .featured-img{min-height:120px}
  .featured-content{padding:14px 16px}
  .featured-title{font-size:18px}
  .articles-grid{grid-template-columns:1fr;gap:14px}
  .card-img{height:160px}
  .card-title{font-size:15px}
  .card-body{padding:12px 13px}
  .sidebar{position:static}
  .ad-strip{padding:0 12px}
}
@media(max-width:400px){.logo{font-size:22px}}
</style>
</head>
<body>

<div class="ticker-wrap">
  <div class="ticker-label">⚡ ÉLŐBEN</div>
  <div class="ticker-scroll">
    <div class="ticker-inner">${tickerHtml}</div>
  </div>
</div>

<header class="site-header">
  <div class="header-top">
    <div>
      <div class="logo">RE<span>A</span>SON</div>
      <div class="logo-tagline">Hírek · Gyorsan · Érthetően</div>
    </div>
    <div class="header-right">
      <a href="${SITE}" style="padding:8px 16px;background:var(--accent);color:#fff;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:.04em">Élő oldal →</a>
    </div>
  </div>
  <nav class="main-nav" aria-label="Főnavigáció">
    <div class="nav-inner">
      <a href="${SITE}" class="nav-item all">📰 Összes <span class="nav-count">${articles.length}</span></a>
      ${navHtml}
    </div>
  </nav>
</header>

<div class="ad-strip">
  <ins class="adsbygoogle" style="display:block;min-height:0" data-ad-client="ca-pub-7856205120757314" data-ad-slot="4427813320" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script>
</div>

<main class="page-wrap">
  <div class="main-layout">
    <div>
      <div class="status-bar">
        <div>
          <span class="live-dot"></span>
          <span class="status-text">Összesen ${articles.length} cikk · Frissítve: ${new Date().toLocaleTimeString('hu-HU')}</span>
        </div>
      </div>
      <div class="section-label">⭐ Kiemelt cikk</div>
      ${articles.length > 0 ? renderCards(articles.slice(0, 1)) : ''}
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:20px">
        <h1 class="strip-title">Legfrissebb hírek<span class="strip-count">${articles.length} cikk</span></h1>
      </div>
      <div class="articles-grid">
        ${articles.length > 1 ? renderCards(articles.slice(1)) : renderCards([])}
      </div>
    </div>
    <aside class="sidebar">
      <div class="s-widget">
        <div class="s-title">📊 Portálstatisztika</div>
        <div class="stat-row"><span style="font-size:12px;color:var(--text3)">Összes cikk</span><span class="stat-val">${articles.length}</span></div>
        <div class="stat-row"><span style="font-size:12px;color:var(--text3)">Mai cikkek</span><span class="stat-val">${todayCount}</span></div>
        <div class="stat-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:10px;border-bottom:none">
          <a href="${SITE}" class="support-btn">❤️ Támogasd a REASON-t</a>
        </div>
      </div>
      <div class="s-widget">
        <div class="s-title">📂 Kategóriák</div>
        ${renderCatList(articles)}
      </div>
      <div class="s-widget">
        <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7856205120757314" data-ad-slot="4427813320" data-ad-format="auto" data-full-width-responsive="true"></ins>
        <script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script>
      </div>
      <div class="s-widget">
        <div class="s-title">ℹ️ A REASON-ról</div>
        <div class="about-text">
          <p>A <strong>REASON</strong> Gyors. Forrásalapú. Automatizált.</p>
          <p>Nyolc témakörben találsz friss tartalmakat: <strong>MI &amp; Tech</strong>, <strong>Klímaváltozás</strong>, <strong>Mentális Egészség</strong>, <strong>Világgazdaság</strong>, <strong>Űrkutatás</strong>, <strong>Orvostudomány</strong>, <strong>Filozófia</strong> és <strong>Oktatás</strong>.</p>
          <p style="font-size:11px;color:var(--text4)">© 2025 REASON · Minden jog fenntartva</p>
        </div>
      </div>
    </aside>
  </div>
</main>

<footer>
  © 2025 REASON ·
  <a href="/aszf.html">ÁSZF</a> ·
  <a href="/adatkezeles.html">Adatkezelés</a> ·
  <a href="/cookie.html">Cookie tájékoztató</a>
</footer>

</body>
</html>`;
}

// ── Fő handler ──────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  const articles = await fetchArticles();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Security-Policy',
    "default-src * blob: data:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval' blob:; " +
    "style-src * 'unsafe-inline'; " +
    "img-src * data: blob:; " +
    "font-src * data: blob:; " +
    "connect-src * blob:; " +
    "worker-src * blob:; " +
    "media-src * blob:; " +
    "frame-src *;"
  );

  return res.status(200).send(renderPage(articles));
};
