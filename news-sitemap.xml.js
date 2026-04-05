const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE   = 'https://reason-five.vercel.app';

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function getArticles() {
  const r = await fetch(
    `${SB_URL}/rest/v1/articles?select=id,title,created_at&order=created_at.desc&limit=500`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  return r.ok ? r.json() : [];
}

export default async function handler(req, res) {
  const articles = await getArticles();
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  const recent = articles.filter(a => new Date(a.created_at).getTime() >= twoDaysAgo);

  const items = recent.map(a => `
  <url>
    <loc>${SITE}/cikk/${a.id}</loc>
    <news:news>
      <news:publication>
        <news:name>REASON</news:name>
        <news:language>hu</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.created_at).toISOString()}</news:publication_date>
      <news:title>${esc(a.title)}</news:title>
    </news:news>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=600');
  res.send(xml);
}
