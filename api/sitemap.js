const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE  = 'https://reason-five.vercel.app';

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>
</urlset>`;

async function fetchArticles() {
  // Egyetlen kérés, max 5000 cikk – elég és gyors
  const r = await fetch(
    `${SB_URL}/rest/v1/articles?select=id,created_at&order=created_at.desc&limit=5000`,
    {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: AbortSignal.timeout(20000), // 20s timeout
    }
  );
  if (!r.ok) throw new Error('Supabase HTTP ' + r.status);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error('Nem tömb a válasz');
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');

  try {
    const articles = await fetchArticles();
    const now = Date.now();

    const urls = articles.map(a => {
      const lastmod = (a.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
      const ageDays = (now - new Date(a.created_at || 0).getTime()) / 86400000;
      const priority = ageDays < 1 ? '1.0'
        : ageDays < 7  ? '0.9'
        : ageDays < 30 ? '0.8'
        : '0.7';
      return `  <url><loc>${SITE}/cikk/${a.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>
${urls}
</urlset>`;

    res.status(200).send(xml);
  } catch (e) {
    console.error('[sitemap] hiba:', e.message);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(EMPTY_XML);
  }
};
