const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';
const ADSENSE_CLIENT = 'ca-pub-7856205120757314';

const CAT_COLOR = {
  Világ:'#c8102e', Tech:'#0066cc', Gazdaság:'#1a7a3c',
  Életmód:'#b86000', Kultúra:'#7c3aed', Botrány:'#e8152f',
  Sport:'#0099cc', Krimi:'#2d2d2d', Politika:'#8b0000'
};

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json'
};

// AdSense hirdetés blokk
function adBlock() {
  return `
<div style="margin:2rem 0;text-align:center;">
  <ins class="adsbygoogle"
    style="display:block"
    data-ad-client="${ADSENSE_CLIENT}"
    data-ad-slot="4427813320"
    data-ad-format="auto"
    data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>
</div>`;
}

// Cikk szöveg bekezdésekre bontva, középen hirdetéssel
function buildBodyHtml(text) {
  const paras = (text || '')
    .split(/\n\n+|\n/)
    .filter(p => p.trim().length > 4)
    .map(p => `<p>${esc(p.trim())}</p>`);

  if (paras.length <= 4) {
    return paras.join('') + adBlock();
  }

  // Hirdetés a szöveg közepén és végén
  const mid = Math.floor(paras.length / 2);
  paras.splice(mid, 0, adBlock());
  return paras.join('') + adBlock();
}

export default async function handler(req, res) {
  const { id } = req.query;

  // ── LÁJK POST ──────────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.query.action === 'like') {
    try {
      const getR = await fetch(
        `${SB_URL}/rest/v1/articles?id=eq.${id}&select=like_count&limit=1`,
        { headers: SB_HEADERS }
      );
      const getData = await getR.json();
      const current = getData?.[0]?.like_count ?? 0;

      const patchR = await fetch(
        `${SB_URL}/rest/v1/articles?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: { ...SB_HEADERS, Prefer: 'return=minimal' },
          body: JSON.stringify({ like_count: current + 1 })
        }
      );

      if (!patchR.ok) { res.status(500).json({ error: 'like_update_failed' }); return; }
      res.status(200).json({ like_count: current + 1 });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
    return;
  }

  // ── CIKK + KOMMENTEK LEKÉRÉS ───────────────────────────────────────────────
  const [artRes, commentsRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/articles?id=eq.${id}&select=*&limit=1`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/comments?article_id=eq.${id}&order=created_at.asc`, { headers: SB_HEADERS })
  ]);

  const artData = await artRes.json();
  const art = artData?.[0];

  if (!art) {
    res.status(404).send('<h1>Cikk nem található</h1>');
    return;
  }

  const comments = await commentsRes.json();

  // ── VIEW TRACKING (szerver oldalon) ────────────────────────────────────────
  try {
    await fetch(`${SB_URL}/rest/v1/rpc/increment_view`, {
      method: 'POST',
      headers: SB_HEADERS,
      body: JSON.stringify({ p_article_id: String(id) })
    });
  } catch(e) { /* nem kritikus */ }

  // ── ADATOK ─────────────────────────────────────────────────────────────────
  const col = CAT_COLOR[art.category] || '#c8102e';
  const likeCount = art.like_count ?? 0;
  const bodyHtml = buildBodyHtml(art.body || art.excerpt || '');

  const commentsHtml = Array.isArray(comments) && comments.length
    ? comments.map(c => `
        <div style="border-bottom:1px solid #e8e4dc;padding:14px 0">
          <div style="font-size:11px;font-weight:700;color:#1a1814;margin-bottom:4px">${esc(c.author)}</div>
          <div style="font-size:13px;color:#3d3a35;line-height:1.6">${esc(c.body)}</div>
          <div style="font-size:10px;color:#9e9890;margin-top:4px">${new Date(c.created_at).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>`).join('')
    : '<div style="font-size:13px;color:#9e9890;padding:14px 0">Még nincs hozzászólás. Légy az első!</div>';

  // ── HTML ───────────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(art.title)} – REASON</title>
  <meta name="description" content="${esc((art.excerpt || '').slice(0, 160))}">

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(art.title)}">
  <meta property="og:description" content="${esc((art.excerpt || '').slice(0, 160))}">
  <meta property="og:url" content="${SITE}/cikk/${art.id}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="REASON">
  <meta property="og:image" content="${art.image_url || `${SITE}/og-default.jpg`}">
  <meta property="article:published_time" content="${new Date(art.created_at).toISOString()}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(art.title)}">
  <meta name="twitter:description" content="${esc((art.excerpt || '').slice(0, 160))}">
  <meta name="twitter:image" content="${art.image_url || `${SITE}/og-default.jpg`}">

  <link rel="canonical" href="${SITE}/cikk/${art.id}">

  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${esc(art.title)}",
    "description": "${esc((art.excerpt || '').slice(0, 160))}",
    "datePublished": "${new Date(art.created_at).toISOString()}",
    "dateModified": "${new Date(art.created_at).toISOString()}",
    "author": {"@type": "Organization", "name": "REASON Szerkesztőség"},
    "publisher": {
      "@type": "Organization",
      "name": "REASON",
      "url": "${SITE}",
      "logo": {"@type": "ImageObject", "url": "${SITE}/logo.png"}
    },
    "mainEntityOfPage": {"@type": "WebPage", "@id": "${SITE}/cikk/${art.id}"},
    "url": "${SITE}/cikk/${art.id}",
    "inLanguage": "hu",
    "articleSection": "${esc(art.category || '')}"
  }
  </script>

  <!-- AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>

  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f8f7f4;color:#1a1814;font-family:'Inter',sans-serif;font-size:16px;line-height:1.7}
    .topbar{background:${col};color:#fff;text-align:center;padding:10px;font-size:12px;font-weight:700}
    .topbar a{color:#fff;text-decoration:none}
    .wrap{max-width:780px;margin:0 auto;padding:48px 24px 80px}
    .cat{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${col};margin-bottom:12px}
    h1{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;line-height:1.2;margin-bottom:16px}
    @media(max-width:600px){h1{font-size:26px}}
    .meta{font-size:12px;color:#9e9890;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e8e4dc}
    .body{font-family:'Playfair Display',serif;font-size:18px;line-height:2;color:#3d3a35}
    .body p{margin-bottom:22px;text-align:justify}
    .body p:first-child::first-letter{font-size:3.5em;font-weight:700;float:left;margin:0 8px -8px 0;line-height:.78;color:${col}}
    .action-bar{display:flex;align-items:center;gap:12px;margin:28px 0 0;flex-wrap:wrap}
    .btn-like{display:flex;align-items:center;gap:7px;padding:9px 18px;background:#fff;border:2px solid #e8e4dc;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;transition:border-color .15s,background .15s;color:#1a1814}
    .btn-like:hover{border-color:${col};background:#fff5f5}
    .btn-like.liked{border-color:${col};background:${col};color:#fff}
    .btn-like svg{width:16px;height:16px;flex-shrink:0}
    .btn-share{display:flex;align-items:center;gap:7px;padding:9px 18px;background:${col};border:none;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;color:#fff;transition:opacity .15s}
    .btn-share:hover{opacity:.88}
    .share-msg{font-size:12px;color:#1a7a3c;font-weight:600}
    .comments-section{margin-top:48px;border-top:2px solid #e8e4dc;padding-top:32px}
    .comments-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:20px}
    .comment-form{margin-top:28px}
    .comment-form h3{font-size:14px;font-weight:700;margin-bottom:14px}
    .comment-form input,
    .comment-form textarea{width:100%;padding:9px 12px;border:1px solid #e8e4dc;border-radius:7px;font-size:13px;margin-bottom:10px;box-sizing:border-box;font-family:'Inter',sans-serif}
    .comment-form textarea{min-height:100px;resize:vertical}
    .btn-comment{padding:10px 24px;background:${col};color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer}
    .comment-msg{font-size:12px;margin-top:8px;min-height:16px}
    .back{display:inline-block;margin-top:40px;padding:10px 20px;background:${col};color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700}
    /* AdSense konténer */
    .ad-wrap{margin:2rem 0;text-align:center;min-height:90px}
  </style>
</head>
<body>
  <div class="topbar"><a href="${SITE}">← Vissza a REASON főoldalára</a></div>
  <div class="wrap">
    <div class="cat">${esc(art.category || '')}</div>
    <h1>${esc(art.title)}</h1>
    <div class="meta">
      ${new Date(art.created_at).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      · REASON Szerkesztőség
      · ${art.read_time || '?'} perc olvasás
    </div>

    <!-- Akció sáv -->
    <div class="action-bar">
      <button class="btn-like" id="likeBtn" onclick="handleLike()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span id="likeCount">${likeCount}</span>
      </button>
      <button class="btn-share" onclick="handleShare()">↗ Megosztás</button>
      <span class="share-msg" id="shareMsg"></span>
    </div>

    <!-- Cikk szöveg (hirdetésekkel) -->
    <div class="body" style="margin-top:40px">${bodyHtml}</div>

    <!-- Kommentek -->
    <div class="comments-section">
      <h2 class="comments-title">Hozzászólások</h2>
      <div id="commentList">${commentsHtml}</div>
      <div class="comment-form">
        <h3>Írj hozzászólást</h3>
        <input id="cAuthor" type="text" maxlength="80" placeholder="Neved (opcionális)">
        <textarea id="cBody" maxlength="1000" placeholder="Hozzászólásod..."></textarea>
        <button class="btn-comment" onclick="submitComment()">Küldés</button>
        <div class="comment-msg" id="cMsg"></div>
      </div>
    </div>

    <a href="${SITE}" class="back">← Vissza a főoldalra</a>
  </div>

  <script>
    const ARTICLE_ID = '${art.id}';
    const ARTICLE_TITLE = ${JSON.stringify(art.title)};
    const ARTICLE_URL = '${SITE}/cikk/${art.id}';
    const SB_URL = '${SB_URL}';
    const SB_KEY = '${SB_KEY}';

    const LIKE_KEY = 'reason_liked_' + ARTICLE_ID;
    const btn = document.getElementById('likeBtn');
    const countEl = document.getElementById('likeCount');
    if (localStorage.getItem(LIKE_KEY)) btn.classList.add('liked');

    async function handleLike() {
      if (localStorage.getItem(LIKE_KEY)) return;
      const prev = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = prev + 1;
      btn.classList.add('liked');
      localStorage.setItem(LIKE_KEY, '1');
      try {
        const r = await fetch(ARTICLE_URL + '?action=like', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (!r.ok) throw new Error();
        const data = await r.json();
        countEl.textContent = data.like_count;
      } catch(e) {
        countEl.textContent = prev;
        btn.classList.remove('liked');
        localStorage.removeItem(LIKE_KEY);
      }
    }

    async function handleShare() {
      const msgEl = document.getElementById('shareMsg');
      if (navigator.share) {
        try { await navigator.share({ title: ARTICLE_TITLE, url: ARTICLE_URL }); } catch(e) {}
      } else {
        try {
          await navigator.clipboard.writeText(ARTICLE_URL);
          msgEl.textContent = '✓ Link másolva!';
          setTimeout(() => { msgEl.textContent = ''; }, 2500);
        } catch(e) {
          msgEl.textContent = ARTICLE_URL;
        }
      }
    }

    async function submitComment() {
      const author = document.getElementById('cAuthor').value.trim() || 'Névtelen olvasó';
      const body   = document.getElementById('cBody').value.trim();
      const msg    = document.getElementById('cMsg');
      if (body.length < 3) { msg.style.color='#c8102e'; msg.textContent='Túl rövid.'; return; }
      msg.style.color='#9e9890'; msg.textContent='Küldés...';
      try {
        const r = await fetch(SB_URL + '/rest/v1/comments', {
          method: 'POST',
          headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ article_id: ARTICLE_ID, author, body })
        });
        if (!r.ok) throw new Error();
        msg.style.color='#1a7a3c'; msg.textContent='Elküldve!';
        document.getElementById('cBody').value = '';
        document.getElementById('cAuthor').value = '';
        setTimeout(() => location.reload(), 1200);
      } catch(e) {
        msg.style.color='#c8102e'; msg.textContent='Hiba, próbáld újra.';
      }
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', req.method === 'POST' ? 'no-store' : 's-maxage=60, stale-while-revalidate=30');
  res.send(html);
}
