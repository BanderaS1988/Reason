const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

let cachedXml = null;
let cacheTime = 0;

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=60');

  if (cachedXml && Date.now() - cacheTime < 3600000) {
    return res.status(200).send(cachedXml);
  }

  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const r = await fetch(
      `${SB_URL}/rest/v1/articles?select=id,title,created_at&order=created_at.desc&created_at=gte.${encodeURIComponent(twoDaysAgo)}&limit=50`,
      { 
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    let articles = [];
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) articles = data;
    }

    const valid = articles.filter(a =>
      a && a.id && a.title && typeof a.title === 'string' && a.title.trim().length > 0 && a.created_at
    );

    const items = valid.map(a => `  <url>
    <loc>${SITE}/cikk/${esc(String(a.id))}</loc>
    <news:news>
      <news:publication>
        <news:name>REASON</news:name>
        <news:language>hu</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.created_at).toISOString()}</news:publication_date>
      <news:title>${esc(a.title.trim().slice(0, 200))}</news:title>
    </news:news>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items || '  <url><loc>' + SITE + '/</loc></url>'}
</urlset>`;

    cachedXml = xml;
    cacheTime = Date.now();
    res.status(200).send(xml);
  } catch (e) {
    console.error('[news-sitemap] hiba:', e.message);
    if (cachedXml) {
      res.status(200).send(cachedXml);
    } else {
      res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url><loc>${SITE}/</loc></url>
</urlset>`);
    }
  }
};
