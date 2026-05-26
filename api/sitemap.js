const SITE = 'https://reason-five.vercel.app';

module.exports = (req, res) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE}/cikk/e0094c7a-0e63-47c4-91ae-b50c9a00e32b</loc><priority>0.9</priority></url>
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xml);
};
