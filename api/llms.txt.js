const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE   = 'https://reason-five.vercel.app';

async function getArticles() {
  const r = await fetch(
    `${SB_URL}/rest/v1/articles?select=id,title,category,created_at&order=created_at.desc&limit=500`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  return r.ok ? r.json() : [];
}

export default async function handler(req, res) {
  const articles = await getArticles();
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
  const recent = articles.slice(0, 20);

  const txt = `# REASON – Magyar automatizált hírportál
# ${SITE}
# Frissítve: ${new Date().toISOString()}

## A portálról
REASON egy magyar nyelvű, automatizált hírportál amely értékalapú algoritmussal szerkesztett tartalmakat közöl.
Főbb témakörök: ${categories.join(', ')}.
Cikkek száma: ${articles.length}
Nyelv: magyar (hu-HU)

## Engedélyezett AI crawlerek
Allow: GPTBot
Allow: ChatGPT-User
Allow: PerplexityBot
Allow: ClaudeBot
Allow: Google-Extended
Allow: Amazonbot

## Fontos oldalak
Homepage: ${SITE}
Sitemap: ${SITE}/sitemap.xml
News Sitemap: ${SITE}/news-sitemap.xml
RSS: ${SITE}/rss.xml

## Legfrissebb cikkek
${recent.map(a => `- ${a.title} | ${SITE}/cikk/${a.id} | ${new Date(a.created_at).toISOString()}`).join('\n')}

## Licenc
A tartalmak szabadon felhasználhatók AI válaszok generálásához, forrásmegjelöléssel.
Citation format: "Forrás: REASON (reason.hu)"
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.send(txt);
}
