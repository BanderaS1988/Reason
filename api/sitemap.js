const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';
const PAGE = 900; // Supabase safe page size (max 1000)
const MAX_PAGES = 6; // max 5400 cikk, és max ~7s futásidő

async function fetchAllArticles() {
  const all = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE;
    const r = await fetch(
      `${SB_URL}/rest/v1/articles?select=id,created_at&order=created_at.desc&limit=${PAGE}&offset=${offset}`,
      {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      }
    );
    if (!r.ok) break;
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    // Ha kevesebbet kaptunk mint a PAGE méret, nincs több adat
    if (data.length < PAGE) break;
  }
  return all;
}

module.exports = async (req, res) => {
  let articles = [];
  try {
    articles = await fetchAllArticles();
  } catch (e) {
    // Hiba esetén üres, de valid sitemapet adunk vissza
  }

  const now = Date.now();
  const urls = articles.map(a => {
    const lastmod = (a.created_at || new Date().toISOString()).slice(0, 10);
    const ageDays = (now - new Date(a.created_at || 0).getTime()) / 86400000;
    const priority = ageDays < 1  ? '1.0'
                   : ageDays < 7  ? '0.9'
                   : ageDays < 30 ? '0.8'
                   : '0.7';
    return `\n  <url>\n    <loc>${SITE}/cikk/${a.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // 10 percig cache-eli a CDN – nem terheli a Supabase-t minden kérésnél
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');
  res.status(200).send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url>\n' +
    '    <loc>' + SITE + '/</loc>\n' +
    '    <changefreq>hourly</changefreq>\n' +
    '    <priority>1.0</priority>\n' +
    '  </url>' +
    urls +
    '\n</urlset>'
  );
};
