const fs     = require('fs');
const path   = require('path');
const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE   = 'https://reason-five.vercel.app';

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

function esc(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchArticles() {
  try {
    const headers = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
    const base = `${SB_URL}/rest/v1/articles?select=id,title,excerpt,category,created_at,read_time,like_count,comment_count,view_count,is_premium,image_url&order=created_at.desc`;
    const r1 = await fetch(`${base}&limit=1000&offset=0`, { headers, signal: AbortSignal.timeout(20000) });
    if (!r1.ok) return [];
    const batch1 = await r1.json();
    if (!Array.isArray(batch1)) return [];
    if (batch1.length === 1000) {
      const r2 = await fetch(`${base}&limit=1000&offset=1000`, { headers, signal: AbortSignal.timeout(20000) });
      if (r2.ok) {
        const batch2 = await r2.json();
        if (Array.isArray(batch2)) return [...batch1, ...batch2];
      }
    }
    return batch1;
  } catch {
    return [];
  }
}

// Noscript cikklista a Google számára – tiszta HTML linkek
function buildNoscript(articles) {
  const items = articles.slice(0, 100).map(a => {
    const col = CAT_COLOR[a.category] || '#888';
    return `<li><a href="${SITE}/cikk/${esc(String(a.id))}" style="color:${col}">${esc(a.title || '')}</a> <small>${esc(a.category || '')} · ${(a.created_at || '').slice(0, 10)}</small></li>`;
  }).join('\n');
  return `<noscript>
<nav aria-label="Cikkek listája" style="font-family:sans-serif;padding:20px;max-width:900px;margin:0 auto">
  <h1 style="font-size:24px;margin-bottom:16px">REASON – Legfrissebb cikkek</h1>
  <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px">
${items}
  </ul>
</nav>
</noscript>`;
}

module.exports = async function handler(req, res) {
  // index.html beolvasása – Vercel-en a projekt gyökere process.cwd()
  let html;
  try {
    const htmlPath = path.join(process.cwd(), '_shell.html');
    html = fs.readFileSync(htmlPath, 'utf8');
  } catch (e) {
    return res.status(500).send('index.html nem olvasható: ' + e.message);
  }

  // Cikkek lekérése Supabase-ből
  const articles = await fetchArticles();

  // SSR inject: window.__SSR_ARTICLES__ + noscript linklist
  // A fetchArticles() az index.html-ben ezt észleli és nem csinál külön Supabase-hívást
  const ssrScript = `<script>
window.__SSR_ARTICLES__ = ${JSON.stringify(articles)};
</script>`;

  const noscript = buildNoscript(articles);

  // Beinjektálás a </body> elé
  html = html.replace('</body>', `${noscript}\n${ssrScript}\n</body>`);

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

  return res.status(200).send(html);
};
