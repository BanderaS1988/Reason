const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE   = 'https://reason-five.vercel.app';

export default async function handler(req, res) {
  let articles = [];
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/articles?select=id,updated_at,created_at&order=created_at.desc&limit=5000`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (r.ok) {
      articles = await r.json();
    } else {
      console.error('Supabase hiba:', r.status, await r.text());
    }
  } catch (e) {
    console.error('Fetch hiba:', e.message);
  }

  const urls = articles.map(a => {
    const lastmod = (a.updated_at || a.created_at || new Date().toISOString()).slice(0, 10);
    return `
  <url>
    <loc>${SITE}/cikk/${a.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
  res.status(200).send(xml);
}
