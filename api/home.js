const fs = require('fs');
const path = require('path');
const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

const CAT_COLOR = {
  'Mesterséges Intelligencia és Technológia': '#0066cc',
  'Klímaváltozás és Fenntarthatóság':         '#10b981',
  'Mentális Egészség és Önismeret':           '#e85d9b',
  'Világgazdaság és Pénzügyek':               '#f59e0b',
  'Űrkutatás és Asztrofizika':                '#7c3aed',
  'Orvostudomány és Élethosszabbítás':        '#ef4444',
  'Filozófia és az Élet Értelme':             '#a16207',
  'Oktatás és a Tudás Jövője':                '#0891b2',
};

let cachedArticles = null;
let cacheTime = 0;

function esc(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;
}

async function fetchArticles() {
  const headers = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
  const base = `${SB_URL}/rest/v1/articles?select=id,title,excerpt,category,created_at,read_time,like_count,comment_count,view_count,is_premium,image_url&order=created_at.desc`;
  
  // Csak egy kérés, max 100 cikk
  const r = await fetch(`${base}&limit=100`, { 
    headers, 
    signal: AbortSignal.timeout(5000) 
  });
  
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

function buildArticleListHtml(articles) {
  return articles.slice(0, 30).map(a => {
    const col = CAT_COLOR[a.category] || '#888';
    return `
    <div class="article-card" style="margin-bottom:16px;border-bottom:1px solid #e8e4dc;padding-bottom:12px;">
      <div class="card-cat" style="font-size:11px;font-weight:700;text-transform:uppercase;color:${col};margin-bottom:4px;">${esc(a.category || '')}</div>
      <h3 style="font-size:18px;font-weight:700;margin:0 0 8px 0;"><a href="${SITE}/cikk/${a.id}" style="color:var(--text, #1a1814);text-decoration:none;">${esc(a.title || '')}</a></h3>
      <div class="card-meta" style="font-size:11px;color:var(--text4, #9e9890);margin-bottom:6px;">${fmtDate(a.created_at)} · ${a.read_time || '?'} perc</div>
      <div class="card-excerpt" style="font-size:13px;color:var(--text3, #706b62);line-height:1.6;">${esc((a.excerpt || '').slice(0, 200))}…</div>
    </div>`;
  }).join('');
}

function buildNoscript(articles) {
  const items = articles.slice(0, 50).map(a => {
    const col = CAT_COLOR[a.category] || '#888';
    return `<li><a href="${SITE}/cikk/${esc(String(a.id))}" style="color:${col}">${esc(a.title || '')}</a> <small>${esc(a.category || '')} · ${(a.created_at || '').slice(0, 10)}</small></li>`;
  }).join('\n');
  return `<noscript>
<nav aria-label="Cikkek listája" style="font-family:sans-serif;padding:20px;max-width:900px;margin:0 auto">
  <h1 style="font-size:24px;margin-bottom:16px">REASON – Legfrissebb cikkek</h1>
  <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px">
${items}
  </ul>
</nav>
</noscript>`;
}

module.exports = async function handler(req, res) {
  let html;
  try {
    const htmlPath = path.join(process.cwd(), '_shell.html');
    html = fs.readFileSync(htmlPath, 'utf8');
  } catch (e) {
    return res.status(500).send('_shell.html nem található: ' + e.message);
  }

  // Cache 5 percig
  let articles = cachedArticles;
  if (!articles || Date.now() - cacheTime > 300000) {
    articles = await fetchArticles();
    cachedArticles = articles;
    cacheTime = Date.now();
  }

  const articleListHtml = buildArticleListHtml(articles);

  if (html.includes('<!-- SSR_ARTICLES_LIST -->')) {
    html = html.replace('<!-- SSR_ARTICLES_LIST -->', articleListHtml);
  } else {
    html = html.replace('</main>', `<div class="ssr-articles" style="margin:20px 0;">${articleListHtml}</div>\n</main>`);
  }

  const ssrScript = `<script>window.__SSR_ARTICLES__ = ${JSON.stringify(articles.slice(0, 50))};</script>`;
  const noscript = buildNoscript(articles);

  html = html.replace('</body>', `${noscript}\n${ssrScript}\n</body>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(html);
};
