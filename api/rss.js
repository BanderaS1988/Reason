const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function getArticles() {
  const r = await fetch(
    `${SB_URL}/rest/v1/articles?select=id,title,excerpt,created_at&order=created_at.desc&limit=500`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  return r.ok ? r.json() : [];
}

module.exports = async (req, res) => {
  const articles = await getArticles();
  const items = articles.slice(0, 30).map(a => `
    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE}/cikk/${a.id}</link>
      <description>${esc(a.excerpt || '')}</description>
      <pubDate>${new Date(a.created_at).toUTCString()}</pubDate>
      <guid>${SITE}/cikk/${a.id}</guid>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>REASON – Független Hírek</title>
    <link>${SITE}</link>
    <description>Intelligens hírek, értékalapú algoritmussal</description>
    <language>hu</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
  res.setHeader('Content-Type', 'application/rss+xml');
  res.setHeader('Cache-Control', 's-maxage=1800');
  res.send(xml);
};
