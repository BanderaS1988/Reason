const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

const CAT_COLOR = {
  Világ:'#c8102e', Tech:'#0066cc', Gazdaság:'#1a7a3c',
  Életmód:'#b86000', Kultúra:'#7c3aed', Botrány:'#e8152f',
  Sport:'#0099cc', Krimi:'#2d2d2d', Politika:'#8b0000'
};

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export default async function handler(req, res) {
  const { id } = req.query;

  const r = await fetch(
    `${SB_URL}/rest/v1/articles?id=eq.${id}&select=*&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );

  const data = await r.json();
  const art = data?.[0];

  if (!art) {
    res.status(404).send('<h1>Cikk nem található</h1>');
    return;
  }

  const col = CAT_COLOR[art.category] || '#c8102e';
  const paras = (art.body || art.excerpt || '').split(/\n\n+|\n/).filter(p => p.trim().length > 4);
  const bodyHtml = paras.map(p => `<p>${esc(p.trim())}</p>`).join('');

  const html = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(art.title)} – REASON</title>
  <meta name="description" content="${esc((art.excerpt||'').slice(0,160))}">
  <meta property="og:title" content="${esc(art.title)}">
  <meta property="og:description" content="${esc((art.excerpt||'').slice(0,160))}">
  <meta property="og:url" content="${SITE}/cikk/${art.id}">
  <meta property="og:type" content="article">
  <link rel="canonical" href="${SITE}/cikk/${art.id}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${esc(art.title)}",
    "description": "${esc((art.excerpt||'').slice(0,160))}",
    "datePublished": "${new Date(art.created_at).toISOString()}",
    "publisher": {"@type": "Organization", "name": "REASON", "url": "${SITE}"}
  }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f8f7f4;color:#1a1814;font-family:'Inter',sans-serif;font-size:16px;line-height:1.7}
    .topbar{background:${col};color:#fff;text-align:center;padding:10px;font-size:12px;font-weight:700}
    .topbar a{color:#fff;text-decoration:none}
    .wrap{max-width:780px;margin:0 auto;padding:48px 24px 80px}
    .cat{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${col};margin-bottom:12px}
    h1{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;line-height:1.2;margin-bottom:16px}
    .meta{font-size:12px;color:#9e9890;margin-bottom:40px;padding-bottom:20px;border-bottom:1px solid #e8e4dc}
    .body{font-family:'Playfair Display',serif;font-size:18px;line-height:2;color:#3d3a35}
    .body p{margin-bottom:22px;text-align:justify}
    .body p:first-child::first-letter{font-size:3.5em;font-weight:700;float:left;margin:0 8px -8px 0;line-height:.78;color:${col}}
    .back{display:inline-block;margin-top:40px;padding:10px 20px;background:${col};color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700}
  </style>
</head>
<body>
  <div class="topbar"><a href="${SITE}">← Vissza a REASON főoldalára</a></div>
  <div class="wrap">
    <div class="cat">${esc(art.category||'')}</div>
    <h1>${esc(art.title)}</h1>
    <div class="meta">
      ${new Date(art.created_at).toLocaleString('hu-HU',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}
      · REASON Szerkesztőség
      · ${art.read_time||'?'} perc olvasás
    </div>
    <div class="body">${bodyHtml}</div>
    <a href="${SITE}" class="back">← Vissza a főoldalra</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.send(html);
}
