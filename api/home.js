import { readFileSync } from 'fs';
import { join } from 'path';

const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';

function isBot(ua) {
  return /googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|applebot|duckduckbot|yandexbot|baidu|sogou|ia_archiver/i.test(ua || '');
}

function isWebView(ua) {
  return /FBAN|FBAV|FB_IAB|FB4A|FBIOS|MessengerForiOS|MessengerForAndroid|Instagram|MicroMessenger|TwitterAndroid|TwitteriPhone/i.test(ua || '');
}

const CAT_COLOR = {
  'Mesterséges Intelligencia és Technológia': '#0066cc',
  'Klímaváltozás és Fenntarthatóság': '#10b981',
  'Mentális Egészség és Önismeret': '#e85d9b',
  'Világgazdaság és Pénzügyek': '#f59e0b',
  'Űrkutatás és Asztrofizika': '#7c3aed',
  'Orvostudomány és Élethosszabbítás': '#ef4444',
  'Filozófia és az Élet Értelme': '#a16207',
  'Oktatás és a Tudás Jövője': '#0891b2',
};

const CAT_EMOJI = {
  'Mesterséges Intelligencia és Technológia': '🤖',
  'Klímaváltozás és Fenntarthatóság': '🌍',
  'Mentális Egészség és Önismeret': '🧠',
  'Világgazdaság és Pénzügyek': '💰',
  'Űrkutatás és Asztrofizika': '🚀',
  'Orvostudomány és Élethosszabbítás': '🩺',
  'Filozófia és az Élet Értelme': '💡',
  'Oktatás és a Tudás Jövője': '📚',
};

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtTime(iso) {
  if (!iso) return '–';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'épp most';
  if (diff < 3600) return Math.floor(diff / 60) + ' perce';
  if (diff < 86400) return Math.floor(diff / 3600) + ' órája';
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

async function fetchArticles() {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/articles?select=id,title,excerpt,category,created_at,read_time,like_count,comment_count,view_count,is_premium,image_url&order=created_at.desc&limit=20`,
      { headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY } }
    );
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

function renderSSRHtml(articles) {
  const cards = articles.map(art => {
    const c = art.category || 'Egyéb';
    const col = CAT_COLOR[c] || '#888';
    const ico = CAT_EMOJI[c] || '📰';
    return `
      <a href="https://reason-five.vercel.app/cikk/${art.id}" style="display:block;background:#fff;border:1px solid #e8e4dc;border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;margin-bottom:16px">
        <div style="height:140px;background:linear-gradient(135deg,${col}22,${col}08);display:flex;align-items:center;justify-content:center;font-size:44px">${ico}</div>
        <div style="padding:14px 16px">
          <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${col};margin-bottom:6px">${esc(c)}</div>
          <div style="font-family:Georgia,serif;font-size:17px;font-weight:700;line-height:1.35;color:#1a1814;margin-bottom:8px">${esc(art.title || '')}</div>
          <div style="font-size:12px;color:#706b62;line-height:1.6;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(art.excerpt || '')}</div>
          <div style="font-size:11px;color:#9e9890">🕐 ${fmtTime(art.created_at)} · ⏱ ${art.read_time || '?'} perc · ❤️ ${art.like_count || 0} · 💬 ${art.comment_count || 0}</div>
        </div>
      </a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>REASON – Friss Hírek</title>
<meta name="description" content="Gyors. Forrásalapú. Automatizált.">
<meta property="og:title" content="REASON – Friss Hírek">
<meta property="og:description" content="Gyors. Forrásalapú. Automatizált.">
<meta property="og:image" content="https://reason-five.vercel.app/og-default.png">
<meta property="og:url" content="https://reason-five.vercel.app/">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f8f7f4;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#1a1814}
.header{background:#fff;border-bottom:1px solid #e8e4dc;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.logo{font-family:Georgia,serif;font-size:28px;font-weight:900;color:#1a1814;letter-spacing:-1px}
.logo span{color:#c8102e}
.open-btn{background:#c8102e;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block}
.container{max-width:640px;margin:0 auto;padding:20px 16px 80px}
.banner{background:#fff3f3;border:1px solid #c8102e44;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#c8102e;font-weight:600;text-align:center;line-height:1.5}
.section-title{font-family:Georgia,serif;font-size:22px;font-weight:900;color:#1a1814;margin-bottom:16px}
.footer{text-align:center;margin-top:32px}
</style>
</head>
<body>
<div class="header">
  <div class="logo">RE<span>A</span>SON</div>
  <a href="https://reason-five.vercel.app/" class="open-btn">Teljes oldal →</a>
</div>
<div class="container">
  <div class="banner">📱 A teljes élményért nyisd meg böngészőben!<br><a href="https://reason-five.vercel.app/" style="color:#c8102e;font-weight:700">reason-five.vercel.app</a></div>
  <div class="section-title">⚡ Legfrissebb cikkek</div>
  ${cards}
  <div class="footer">
    <a href="https://reason-five.vercel.app/" class="open-btn" style="font-size:14px;padding:14px 32px">Összes cikk megtekintése →</a>
  </div>
</div>
</body>
</html>`;
}

function getFullHtml() {
  try {
    return readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  } catch {
    // Ha a readFileSync nem megy Vercelen, redirect az index.html-re
    return null;
  }
}

export default async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');  // ← no-store!
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Security-Policy',
    "default-src * blob: data:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval' blob:; " +
    "style-src * 'unsafe-inline'; " +
    "img-src * data: blob:; " +
    "font-src * data: blob:; " +
    "connect-src * blob:; " +
    "worker-src * blob:; " +
    "media-src * blob:; " +
    "frame-src *;"
  );

  // Bot vagy WebView (Messenger, Instagram, Facebook app)
  if (isBot(ua) || isWebView(ua)) {
    const articles = await fetchArticles();
    return res.status(200).send(renderSSRHtml(articles));
  }

  // Normál böngésző
  const html = getFullHtml();
  if (html) {
    return res.status(200).send(html);
  }

  // Fallback
  res.setHeader('Location', '/index.html');
  return res.status(302).send('');
}
