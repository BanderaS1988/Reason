const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

module.exports = async (req, res) => {
  let articles = [];
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/articles?select=id,created_at&order=created_at.desc&limit=5000`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (r.ok) articles = await r.json();
  } catch (e) {}

  const urls = articles.map(a => {
    const lastmod = (a.created_at || new Date().toISOString()).slice(0, 10);
    return '\n  <url>\n    <loc>' + SITE + '/cikk/' + a.id + '</loc>\n    <lastmod>' + lastmod + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>';
  }).join('');

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'no-store');
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
