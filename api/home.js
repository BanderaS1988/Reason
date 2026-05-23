const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE   = 'https://reason-five.vercel.app';

const CAT_COLOR = {
  'Mesterséges Intelligencia és Technológia': '#0066cc',
  'Klímaváltozás és Fenntarthatóság':         '#10b981',
  'Mentális Egészség és Önismeret':            '#e85d9b',
  'Világgazdaság és Pénzügyek':               '#f59e0b',
  'Űrkutatás és Asztrofizika':                '#7c3aed',
  'Orvostudomány és Élethosszabbítás':        '#ef4444',
  'Filozófia és az Élet Értelme':             '#a16207',
  'Oktatás és a Tudás Jövője':                '#0891b2',
};

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('hu-HU', { year:'numeric', month:'long', day:'numeric' });
}

// Bot felismerés
function isBot(ua) {
  if (!ua) return false;
  return /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|exabot|facebot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora|outbrain|pinterest|developers\.google\.com|applebot|petalbot|perplexity|claudebot|gptbot|chatgpt/i.test(ua);
}

export default async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';

  // Normál látogató – átirányítás az index.html-re
  if (!isBot(ua)) {
    res.setHeader('Location', '/index.html');
    return res.status(302).end();
  }

  // Bot – SSR főoldal
  try {
    let allArticles = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const r = await fetch(
        `${SB_URL}/rest/v1/articles?select=id,title,excerpt,category,created_at,read_time&order=created_at.desc&limit=${limit}&offset=${offset}`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      const data = await r.json();
      if (!data || !data.length) break;
      allArticles = [...allArticles, ...data];
      if (data.length < limit) break;
      offset += limit;
    }

    const cats = [...new Set(allArticles.map(a => a.category).filter(Boolean))];

    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'REASON',
      url: SITE,
      description: 'Magyar automatizált hírportál – Gyors. Forrásalapú. Automatizált.',
      inLanguage: 'hu',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });

    const articlesHtml = allArticles.map(a => {
      const col = CAT_COLOR[a.category] || '#c8102e';
      return `<article style="border-bottom:1px solid #e8e4dc;padding:20px 0">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${col};margin-bottom:6px">${esc(a.category || '')}</div>
        <h2 style="margin:0 0 8px">
          <a href="${SITE}/cikk/${a.id}" style="color:#1a1814;text-decoration:none;font-family:'Playfair Display',serif;font-size:20px;font-weight:700;line-height:1.3">${esc(a.title || '')}</a>
        </h2>
        <p style="font-size:13px;color:#706b62;line-height:1.6;margin:0 0 8px">${esc((a.excerpt || '').slice(0, 200))}</p>
        <div style="font-size:11px;color:#9e9890">${fmtDate(a.created_at)} · ${a.read_time || '?'} perc olvasás</div>
      </article>`;
    }).join('');

    const catLinksHtml = cats.map(c => {
      const col = CAT_COLOR[c] || '#888';
      const count = allArticles.filter(a => a.category === c).length;
      return `<a href="${SITE}/?cat=${encodeURIComponent(c)}" style="display:inline-block;padding:6px 14px;border-radius:20px;background:${col}18;color:${col};font-size:12px;font-weight:700;text-decoration:none;margin:4px">${esc(c)} (${count})</a>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>REASON – Friss Magyar Hírek</title>
<meta name="description" content="REASON – Gyors. Forrásalapú. Automatizált. Magyar hírportál ${allArticles.length} cikkel.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}/">
<meta property="og:title" content="REASON – Friss Magyar Hírek">
<meta property="og:description" content="Gyors. Forrásalapú. Automatizált. ${allArticles.length} cikk.">
<meta property="og:url" content="${SITE}/">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE}/og-default.png">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="REASON">
<script type="application/ld+json">${schemaJson}</script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f8f7f4;color:#1a1814;font-family:'Inter',sans-serif;line-height:1.6}
.header{background:#fff;border-bottom:1px solid #e8e4dc;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:#1a1814;text-decoration:none;letter-spacing:-1px}
.logo span{color:#c8102e}
.wrap{max-width:860px;margin:0 auto;padding:40px 24px 80px}
.hero{text-align:center;padding:40px 0 32px;border-bottom:1px solid #e8e4dc;margin-bottom:32px}
.hero h1{font-family:'Playfair Display',serif;font-size:42px;font-weight:900;color:#1a1814;margin-bottom:12px}
.hero p{font-size:16px;color:#706b62;margin-bottom:20px}
.stats{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;font-size:13px;color:#9e9890}
.stats strong{color:#1a1814;font-size:18px;display:block}
.cats{margin-bottom:32px}
.cats h2{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:12px}
.articles h2{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;margin-bottom:20px}
footer{background:#1a1814;color:#9e9890;text-align:center;padding:20px;font-size:11px;line-height:2}
footer a{color:#f0c040;text-decoration:none}
@media(max-width:600px){.hero h1{font-size:28px}.wrap{padding:24px 16px 60px}}
</style>
</head>
<body>
<header class="header">
  <a class="logo" href="${SITE}/">RE<span>A</span>SON</a>
  <span style="font-size:12px;color:#9e9890">${allArticles.length} cikk · Magyar hírportál</span>
</header>
<div class="wrap">
  <div class="hero">
    <h1>REASON – Friss Magyar Hírek</h1>
    <p>Gyors. Forrásalapú. Automatizált.</p>
    <div class="stats">
      <div><strong>${allArticles.length}</strong>Összes cikk</div>
      <div><strong>${cats.length}</strong>Kategória</div>
      <div><strong>${allArticles.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length}</strong>Mai cikk</div>
    </div>
  </div>
  <div class="cats">
    <h2>Kategóriák</h2>
    ${catLinksHtml}
  </div>
  <div class="articles">
    <h2>Legfrissebb cikkek</h2>
    ${articlesHtml}
  </div>
</div>
<footer>© 2025 REASON · <a href="${SITE}/aszf.html">ÁSZF</a> · <a href="${SITE}/adatkezeles.html">Adatkezelés</a> · <a href="${SITE}/sitemap.xml">Sitemap</a></footer>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).send(html);

  } catch (e) {
    res.status(500).send(`Hiba: ${e.message}`);
  }
}
