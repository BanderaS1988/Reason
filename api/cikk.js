const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

const CAT_COLOR = {
  'Mesterséges Intelligencia és Technológia': '#0066cc',
  'Klímaváltozás és Fenntarthatóság': '#10b981',
  'Mentális Egészség és Önismeret': '#e85d9b',
  'Világgazdaság és Pénzügyek': '#f59e0b',
  'Űrkutatás és Asztrofizika': '#7c3aed',
  'Orvostudomány és Élethosszabbítás': '#ef4444',
  'Filozófia és az Élet Értelme': '#a16207',
  'Oktatás és a Tudás Jövője': '#0891b2',
};

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('hu-HU',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
}

module.exports = async (req, res) => {
  const id = req.query?.id;
  if (!id || id.length < 5) { res.status(404).send('Nem található'); return; }

  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

  try {
    const [artRes, commentsRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/articles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers }),
      fetch(`${SB_URL}/rest/v1/comments?article_id=eq.${encodeURIComponent(id)}&order=created_at.asc`, { headers }),
    ]);

    const artData = await artRes.json();
    const art = artData?.[0];
    if (!art) { res.status(404).send('A cikk nem található'); return; }

    const comments = await commentsRes.json() || [];
    const col = CAT_COLOR[art.category] || '#c8102e';
    const url = `${SITE}/cikk/${art.id}`;
    const imageUrl = art.image_url || `${SITE}/og-default.png`;
    const desc = esc((art.meta_description || art.excerpt || '').slice(0, 160));
    const titleEsc = esc(art.title || '');
    const likeCount = art.like_count || 0;
    const viewCount = art.view_count || 0;

    const body = art.body || art.excerpt || '';
    const paras = body.split(/\n\n+|\n/).filter(p => p.trim().length > 4);
    const bodyHtml = paras.length
      ? paras.map(p => `<p>${esc(p.trim())}</p>`).join('')
      : `<p>${esc(body)}</p>`;

    const commentsHtml = comments.length
      ? comments.map(c => `
        <div class="comment-item">
          <div class="comment-author">${esc(c.author || 'Névtelen')}</div>
          <div class="comment-body">${esc(c.body)}</div>
          <div class="comment-date">${fmtDate(c.created_at)}</div>
        </div>`).join('')
      : '<div class="no-comments">Még nincs hozzászólás. Légy az első!</div>';

    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'NewsArticle',
      headline: art.title,
      description: (art.meta_description || art.excerpt || '').slice(0, 160),
      datePublished: new Date(art.created_at).toISOString(),
      dateModified: new Date(art.updated_at || art.created_at).toISOString(),
      author: { '@type': 'Organization', name: 'REASON Szerkesztőség' },
      publisher: { '@type': 'Organization', name: 'REASON', url: SITE },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url, inLanguage: 'hu', articleSection: art.category || '', image: imageUrl,
    });

    const html = `<!DOCTYPE html>
<html lang="hu" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titleEsc} – REASON</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${titleEsc}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="REASON">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${titleEsc}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(imageUrl)}">
<meta property="article:published_time" content="${new Date(art.created_at).toISOString()}">
<script type="application/ld+json">${schemaJson}<\/script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7856205120757314" crossorigin="anonymous"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f8f7f4;--bg2:#fff;--bg3:#f2f0ec;
  --text:#1a1814;--text2:#3d3a35;--text3:#706b62;--text4:#9e9890;
  --border:#e8e4dc;--accent:${col};
  --font-size:18px;
}
[data-theme="dark"]{
  --bg:#0f0e0c;--bg2:#1a1814;--bg3:#242018;
  --text:#f0ede6;--text2:#c8c4bc;--text3:#9e9890;--text4:#706b62;
  --border:#2e2a24;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-size:15px;line-height:1.7;transition:background .2s,color .2s}

/* READ PROGRESS */
#readProgress{position:fixed;top:0;left:0;width:0%;height:3px;background:var(--accent);z-index:999;transition:width .1s linear}

/* TOPBAR */
.topbar{background:var(--accent);color:#fff;text-align:center;padding:10px 16px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.topbar a{color:#fff;text-decoration:none}
.topbar-right{display:flex;align-items:center;gap:8px}
.theme-toggle{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif}

/* TOOLBAR */
.toolbar{background:var(--bg2);border-bottom:1px solid var(--border);padding:10px 24px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:100;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.toolbar-label{font-size:10px;color:var(--text4);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.tool-btn{width:32px;height:32px;border-radius:7px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;font-family:'Inter',sans-serif}
.tool-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.font-size-display{font-size:11px;color:var(--text3);font-family:monospace;min-width:34px;text-align:center}
.toolbar-sep{width:1px;height:20px;background:var(--border);margin:0 2px}
.like-btn{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:50px;border:2px solid var(--border);background:var(--bg2);color:var(--text);font-size:13px;font-weight:700;cursor:pointer;transition:.15s;font-family:'Inter',sans-serif}
.like-btn:hover{border-color:var(--accent);color:var(--accent)}
.like-btn.liked{background:var(--accent);color:#fff;border-color:var(--accent)}
.stats-bar{display:flex;align-items:center;gap:14px;font-size:12px;color:var(--text4);margin-left:auto}

/* WRAP */
.wrap{max-width:780px;margin:0 auto;padding:40px 24px 80px}
.cat{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:12px}
h1{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;line-height:1.2;margin-bottom:16px;color:var(--text)}
@media(max-width:600px){h1{font-size:24px}.wrap{padding:20px 16px 60px}.toolbar{padding:8px 12px;gap:6px}}
.meta{font-size:12px;color:var(--text4);margin-bottom:24px;padding-bottom:18px;border-bottom:1px solid var(--border)}
.hero{width:100%;max-height:420px;object-fit:cover;border-radius:10px;margin-bottom:28px}

/* BODY */
.article-body{font-family:'Playfair Display',serif;font-size:var(--font-size);line-height:2;color:var(--text2);margin-top:32px}
.article-body p{margin-bottom:22px;text-align:justify}
.article-body p:first-child::first-letter{font-size:3.5em;font-weight:700;float:left;margin:0 8px -8px 0;line-height:.78;color:var(--accent)}

/* SHARE BAR */
.share-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:20px 0;border-top:1px solid var(--border);margin-top:32px}
.share-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:'Inter',sans-serif;transition:.15s;text-decoration:none;white-space:nowrap}
.share-copy{background:var(--bg3);border:2px solid var(--border);color:var(--text)}
.share-copy:hover{border-color:var(--accent);color:var(--accent)}
.share-fb{background:#1877f2;color:#fff}
.share-tw{background:#000;color:#fff}
.share-wa{background:#25d366;color:#fff}
.share-msg{font-size:12px;color:#1a7a3c;font-weight:600}

/* COMMENTS */
.comments-section{margin-top:48px;border-top:2px solid var(--border);padding-top:32px}
.comments-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:20px;color:var(--text);display:flex;align-items:center;gap:10px}
.comment-count{font-size:12px;background:var(--bg3);color:var(--text4);padding:2px 8px;border-radius:10px;font-family:monospace}
.comment-item{border-bottom:1px solid var(--border);padding:14px 0}
.comment-author{font-size:11px;font-weight:700;color:var(--text);margin-bottom:4px}
.comment-body{font-size:13px;color:var(--text2);line-height:1.6}
.comment-date{font-size:10px;color:var(--text4);margin-top:4px}
.no-comments{font-size:13px;color:var(--text4);padding:14px 0}
.comment-form{margin-top:28px}
.comment-form h3{font-size:14px;font-weight:700;margin-bottom:14px;color:var(--text)}
.comment-form input,.comment-form textarea{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:7px;font-size:13px;margin-bottom:10px;font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);outline:none;transition:.2s}
.comment-form input:focus,.comment-form textarea:focus{border-color:var(--accent)}
.comment-form textarea{min-height:100px;resize:vertical}
.btn-submit{padding:10px 24px;background:var(--accent);color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:.15s}
.btn-submit:hover{opacity:.85}

/* AD */
.ad-wrap{margin:2rem 0;text-align:center;min-height:90px}

/* BACK */
.back{display:inline-block;margin-top:40px;padding:10px 20px;background:var(--accent);color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700}

/* FOOTER */
footer{background:#1a1814;color:#9e9890;text-align:center;padding:20px;font-size:11px;line-height:2}
footer a{color:#f0c040;text-decoration:none}

/* TOAST */
.toast-wrap{position:fixed;bottom:20px;right:20px;z-index:999;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.toast{padding:10px 16px;background:#1a1814;color:#fff;border-radius:8px;font-size:12px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.2);animation:toastIn .3s ease;pointer-events:auto;max-width:260px}
.toast.ok{background:#1a7a3c}
.toast.err{background:#c8102e}
@keyframes toastIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>

<div id="readProgress"></div>

<div class="topbar">
  <a href="${SITE}">← Vissza a REASON főoldalára</a>
  <div class="topbar-right">
    <button class="theme-toggle" onclick="toggleTheme()">🌙 Téma</button>
  </div>
</div>

<div class="toolbar">
  <span class="toolbar-label">Betűméret</span>
  <button class="tool-btn" onclick="changeFontSize(-2)">A−</button>
  <span class="font-size-display" id="fontSizeDisplay">18px</span>
  <button class="tool-btn" onclick="changeFontSize(2)">A+</button>
  <div class="toolbar-sep"></div>
  <button id="likeBtn" class="like-btn" onclick="handleLike()">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    <span id="likeCount">${likeCount}</span>
  </button>
  <div class="stats-bar">
    <span title="Megtekintések">👁 <span id="viewCount">${viewCount}</span></span>
    <span title="Kommentek">💬 <span id="commentCount">${comments.length}</span></span>
    <span title="Olvasási idő">⏱ ${art.read_time || '?'} perc</span>
  </div>
</div>

<div class="wrap">
  <div class="cat">${esc(art.category || '')}</div>
  <h1>${titleEsc}</h1>
  <div class="meta">${fmtDate(art.created_at)} · REASON Szerkesztőség</div>

  ${art.image_url ? `<img class="hero" src="${esc(art.image_url)}" alt="${titleEsc}">` : ''}

  <div class="ad-wrap">
    <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7856205120757314" data-ad-slot="4427813320" data-ad-format="auto" data-full-width-responsive="true"></ins>
    <script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script>
  </div>

  <div class="article-body" id="articleBody">${bodyHtml}</div>

  <div class="ad-wrap">
    <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7856205120757314" data-ad-slot="4427813320" data-ad-format="auto" data-full-width-responsive="true"></ins>
    <script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script>
  </div>

  <!-- MEGOSZTÁS -->
  <div class="share-bar">
    <button class="share-btn share-copy" onclick="copyLink()">🔗 Link másolása</button>
    <a class="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">📘 Facebook</a>
    <a class="share-btn share-tw" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent((art.title||'').slice(0,100))}" target="_blank" rel="noopener">𝕏 Twitter</a>
    <a class="share-btn share-wa" href="https://wa.me/?text=${encodeURIComponent((art.title||'')+' '+url)}" target="_blank" rel="noopener">💬 WhatsApp</a>
    <span class="share-msg" id="shareMsg"></span>
  </div>

  <!-- KOMMENTEK -->
  <div class="comments-section">
    <h2 class="comments-title">
      Hozzászólások
      <span class="comment-count" id="commentBadge">${comments.length}</span>
    </h2>
    <div id="commentList">${commentsHtml}</div>
    <div class="comment-form">
      <h3>Írj hozzászólást</h3>
      <input id="cAuthor" type="text" maxlength="80" placeholder="Neved (opcionális)">
      <textarea id="cBody" maxlength="1000" placeholder="Hozzászólásod..."></textarea>
      <button class="btn-submit" onclick="submitComment()">Küldés</button>
      <div id="cMsg" style="font-size:12px;margin-top:8px;min-height:16px"></div>
    </div>
  </div>

  <a href="${SITE}" class="back">← Vissza a főoldalra</a>
</div>

<footer>© 2025 REASON · <a href="/aszf.html">ÁSZF</a> · <a href="/adatkezeles.html">Adatkezelés</a> · <a href="/cookie.html">Cookie tájékoztató</a></footer>
<div class="toast-wrap" id="toastWrap"></div>

<script>
const ARTICLE_URL = '${url}';
const ARTICLE_ID  = '${art.id}';
const SB_URL_JS   = '${SB_URL}';
const SB_KEY_JS   = '${SB_KEY}';
const SB_HDR      = { apikey: SB_KEY_JS, Authorization: 'Bearer ' + SB_KEY_JS, 'Content-Type': 'application/json' };

// ── TOAST ──────────────────────────────────────────────────────
function toast(msg, type='') {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(()=>t.remove(),400); }, 3500);
}

// ── OLVASÁSI PROGRESS ─────────────────────────────────────────
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
  document.getElementById('readProgress').style.width = Math.min(100, pct) + '%';
});

// ── TÉMA ──────────────────────────────────────────────────────
function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  document.querySelector('.theme-toggle').textContent = t === 'dark' ? '☀️ Téma' : '🌙 Téma';
  localStorage.setItem('reason_theme', t);
}
const savedTheme = localStorage.getItem('reason_theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  if (savedTheme === 'dark') document.querySelector('.theme-toggle').textContent = '☀️ Téma';
}

// ── BETŰMÉRET ─────────────────────────────────────────────────
let fontSize = parseInt(localStorage.getItem('reason_font') || '18', 10);
function applyFont() {
  document.documentElement.style.setProperty('--font-size', fontSize + 'px');
  document.getElementById('fontSizeDisplay').textContent = fontSize + 'px';
  localStorage.setItem('reason_font', fontSize);
}
function changeFontSize(d) {
  fontSize = Math.max(13, Math.min(30, fontSize + d));
  applyFont();
}
applyFont();

// ── VIEW TRACKING ─────────────────────────────────────────────
(async function trackView() {
  const lk = 'reason_viewed_' + ARTICLE_ID;
  try {
    const r = await fetch(SB_URL_JS + '/rest/v1/articles?id=eq.' + ARTICLE_ID + '&select=view_count,like_count&limit=1', { headers: SB_HDR });
    const data = await r.json();
    const row = data?.[0];
    if (!row) return;
    document.getElementById('viewCount').textContent = (row.view_count || 0).toLocaleString('hu');
    document.getElementById('likeCount').textContent = row.like_count || 0;
    if (localStorage.getItem('reason_liked_' + ARTICLE_ID)) {
      document.getElementById('likeBtn').classList.add('liked');
    }
    if (!localStorage.getItem(lk)) {
      localStorage.setItem(lk, '1');
      await fetch(SB_URL_JS + '/rest/v1/articles?id=eq.' + ARTICLE_ID, {
        method: 'PATCH', headers: { ...SB_HDR, Prefer: 'return=minimal' },
        body: JSON.stringify({ view_count: (row.view_count || 0) + 1 })
      });
      document.getElementById('viewCount').textContent = ((row.view_count || 0) + 1).toLocaleString('hu');
    }
  } catch {}
})();

// ── LÁJK ──────────────────────────────────────────────────────
async function handleLike() {
  const lk = 'reason_liked_' + ARTICLE_ID;
  if (localStorage.getItem(lk)) { toast('Ezt már lájkoltad! 👍', ''); return; }
  const btn = document.getElementById('likeBtn');
  const countEl = document.getElementById('likeCount');
  const prev = parseInt(countEl.textContent) || 0;
  btn.classList.add('liked');
  countEl.textContent = prev + 1;
  localStorage.setItem(lk, '1');
  try {
    const r = await fetch(SB_URL_JS + '/rest/v1/articles?id=eq.' + ARTICLE_ID + '&select=like_count&limit=1', { headers: SB_HDR });
    const data = await r.json();
    const cur = data?.[0]?.like_count ?? prev;
    await fetch(SB_URL_JS + '/rest/v1/articles?id=eq.' + ARTICLE_ID, {
      method: 'PATCH', headers: { ...SB_HDR, Prefer: 'return=minimal' },
      body: JSON.stringify({ like_count: cur + 1 })
    });
    countEl.textContent = cur + 1;
    toast('❤️ Köszönjük a lájkot!', 'ok');
  } catch {
    btn.classList.remove('liked');
    countEl.textContent = prev;
    localStorage.removeItem(lk);
    toast('Hiba történt, próbáld újra.', 'err');
  }
}

// ── MEGOSZTÁS ─────────────────────────────────────────────────
async function copyLink() {
  try { await navigator.clipboard.writeText(ARTICLE_URL); }
  catch { const t=document.createElement('textarea');t.value=ARTICLE_URL;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove(); }
  toast('✓ Link másolva!', 'ok');
}

// ── KOMMENT BEKÜLDÉS ─────────────────────────────────────────
async function submitComment() {
  const author = document.getElementById('cAuthor').value.trim() || 'Névtelen olvasó';
  const body   = document.getElementById('cBody').value.trim();
  const msg    = document.getElementById('cMsg');
  if (body.length < 3) { msg.style.color='#c8102e'; msg.textContent='Túl rövid.'; return; }
  const spamKey = 'reason_comment_last';
  if (Date.now() - parseInt(localStorage.getItem(spamKey)||'0') < 30000) {
    msg.style.color='#c8102e'; msg.textContent='Várj 30 másodpercet!'; return;
  }
  localStorage.setItem(spamKey, Date.now());
  msg.style.color='#9e9890'; msg.textContent='Küldés...';
  try {
    const r = await fetch(SB_URL_JS + '/rest/v1/comments', {
      method: 'POST', headers: { ...SB_HDR, Prefer: 'return=minimal' },
      body: JSON.stringify({ article_id: ARTICLE_ID, author, body })
    });
    if (!r.ok) throw new Error();
    // comment_count növelés
    const ar = await fetch(SB_URL_JS + '/rest/v1/articles?id=eq.' + ARTICLE_ID + '&select=comment_count&limit=1', { headers: SB_HDR });
    const ad = await ar.json();
    const cur = ad?.[0]?.comment_count ?? 0;
    await fetch(SB_URL_JS + '/rest/v1/articles?id=eq.' + ARTICLE_ID, {
      method: 'PATCH', headers: { ...SB_HDR, Prefer: 'return=minimal' },
      body: JSON.stringify({ comment_count: cur + 1 })
    });
    msg.style.color='#1a7a3c'; msg.textContent='Köszönjük!';
    document.getElementById('cBody').value = '';
    document.getElementById('cAuthor').value = '';
    toast('✓ Hozzászólás elküldve!', 'ok');
    // Kommentek újratöltése
    await reloadComments();
  } catch { msg.style.color='#c8102e'; msg.textContent='Hiba, próbáld újra.'; }
}

// ── KOMMENTEK ÚJRATÖLTÉSE ─────────────────────────────────────
async function reloadComments() {
  try {
    const r = await fetch(SB_URL_JS + '/rest/v1/comments?article_id=eq.' + ARTICLE_ID + '&order=created_at.asc', { headers: SB_HDR });
    const data = await r.json();
    const cnt = data.length;
    document.getElementById('commentBadge').textContent = cnt;
    document.getElementById('commentCount').textContent = cnt;
    if (!data.length) {
      document.getElementById('commentList').innerHTML = '<div class="no-comments">Még nincs hozzászólás. Légy az első!</div>';
      return;
    }
    document.getElementById('commentList').innerHTML = data.map(c => \`
      <div class="comment-item">
        <div class="comment-author">\${(c.author||'Névtelen').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>
        <div class="comment-body">\${(c.body||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>
        <div class="comment-date">\${new Date(c.created_at).toLocaleString('hu-HU',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
      </div>\`).join('');
  } catch {}
}
<\/script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(html);

    // View tracking szerver oldalon is
    fetch(`${SB_URL}/rest/v1/rpc/increment_view`, {
      method: 'POST', headers,
      body: JSON.stringify({ p_article_id: String(id) }),
    }).catch(() => {});

  } catch (e) {
    res.status(500).send(`Hiba: ${e.message}`);
  }
};
