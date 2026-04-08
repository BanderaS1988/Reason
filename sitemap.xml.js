// pages/sitemap.xml.js
const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

export async function getServerSideProps({ res }) {
  // 1. Lekérjük az ÖSSZES cikket a Supabase-ból
  const response = await fetch(`${SB_URL}/rest/v1/articles?select=id,updated_at&limit=1000`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`
    }
  });
  
  const articles = await response.json();
  
  // 2. Sitemap XML generálása
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${articles.map(article => `
        <url>
          <loc>${SITE}/cikk/${article.id}</loc>
          <lastmod>${article.updated_at || new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join('')}
    </urlset>`;
  
  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
  
  return { props: {} };
}

export default function Sitemap() {}