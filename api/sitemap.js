const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';
const PAGE = 900;

async function fetchAllArticles() {
  const all = [];
  for (let page = 0; page < 10; page++) {
    const r = await fetch(
      `${SB_URL}/rest/v1/articles?select=id,created_at&order=created_at.desc&limit=${PAGE}&offset=${page * PAGE}`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!r.ok) break;
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

module.exports = async (req, res) => {
  try {
    const articles = await fetchAllArticles();
    const now = Date.now();

    const urls = articles.map(a => {
      const lastmod = (a.created_at || '').slice(0, 10);
      const ageDays = (now - new Date(a.created_at || 0).getTime()) / 86400000;
      const priority = ageDays < 1 ? '1.0' : ageDays < 7 ? '0.9' : ageDays < 30 ? '0.8' : '0.7';
      return `\n  <url><loc>${SITE}/cikk/${a.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>${urls}
</urlset>`;

    // Felülírjuk a globális Cache-Control headert
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');
    res.status(200).send(xml);

  } catch (e) {
    // Hiba esetén is valid XML jön vissza, nem 500
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
};
