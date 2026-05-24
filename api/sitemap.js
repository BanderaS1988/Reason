const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

module.exports = async (req, res) => {
  try {
    const start = Date.now();

    const r = await fetch(
      `${SB_URL}/rest/v1/articles?select=id,created_at&order=created_at.desc&limit=100`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );

    const elapsed = Date.now() - start;

    if (!r.ok) {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(`Supabase hiba: HTTP ${r.status} – ${elapsed}ms`);
      return;
    }

    const articles = await r.json();

    if (!Array.isArray(articles)) {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(`Nem tömb a válasz: ${JSON.stringify(articles).slice(0, 200)}`);
      return;
    }

    const urls = articles.map(a =>
      `\n  <url><loc>${SITE}/cikk/${a.id}</loc></url>`
    ).join('');

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>\n<!-- ${articles.length} cikk, ${elapsed}ms -->`
    );

  } catch (e) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(`Exception: ${e.message}`);
  }
};
