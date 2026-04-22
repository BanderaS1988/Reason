import React from 'react';

const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';
const ADSENSE_CLIENT = 'ca-pub-7856205120757314';

const CAT_COLOR = {
  'Tisza Párt': '#0066cc',
  'Fidesz': '#f0a500',
  'Mi Hazánk': '#1a7a3c',
  'Belpolitika': '#c8102e',
  'Vita indító gondolatok': '#7c3aed',
};

const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── LIKE API ROUTE HELYETT: külön Next.js API endpoint ───────────────────────
// pages/api/like.js fájlban kezeljük a POST-ot (ld. alább),
// itt a getServerSideProps CSAK GET-et kezel.
// ──────────────────────────────────────────────────────────────────────────────

export async function getServerSideProps({ params, res }) {
  const { id } = params;

  const [artRes, commentsRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/articles?id=eq.${id}&select=*&limit=1`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/comments?article_id=eq.${id}&order=created_at.asc`, { headers: SB_HEADERS }),
  ]);

  const artData = await artRes.json();
  const art = artData?.[0];

  if (!art) return { notFound: true };

  const comments = await commentsRes.json();

  try {
    await fetch(`${SB_URL}/rest/v1/rpc/increment_view`, {
      method: 'POST',
      headers: SB_HEADERS,
      body: JSON.stringify({ p_article_id: String(id) }),
    });
  } catch { }
res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return {
    props: {
      article: art,
      comments: comments || [],
    },
  };
}

export default function CikkPage({ article, comments }) {
  if (!article) return null;

  const art = article;
  const col = CAT_COLOR[art.category] || '#c8102e';
  const likeCount = art.like_count ?? 0;

  const paras = (art.body || art.excerpt || '')
    .split(/\n\n+|\n/)
    .filter(p => p.trim().length > 4)
    .map(p => `<p>${esc(p.trim())}</p>`);

  const adHtml = `<div class="ad-wrap"><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="4427813320" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script></div>`;

  let bodyHtml;
  if (paras.length <= 4) {
    bodyHtml = paras.join('') + adHtml;
  } else {
    const mid = Math.floor(paras.length / 2);
    paras.splice(mid, 0, adHtml);
    bodyHtml = paras.join('') + adHtml;
  }

  const commentsHtml = Array.isArray(comments) && comments.length
    ? comments.map(c => `
        <div style="border-bottom:1px solid #e8e4dc;padding:14px 0">
          <div style="font-size:11px;font-weight:700;color:#1a1814;margin-bottom:4px">${esc(c.author || 'Névtelen')}</div>
          <div style="font-size:13px;color:#3d3a35;line-height:1.6">${esc(c.body)}</div>
          <div style="font-size:10px;color:#9e9890;margin-top:4px">${new Date(c.created_at).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>`).join('')
    : '<div style="font-size:13px;color:#9e9890;padding:14px 0">Még nincs hozzászólás. Légy az első!</div>';

  const publishedISO = new Date(art.created_at).toISOString();
  const dateFormatted = new Date(art.created_at).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const descriptionEsc = esc((art.meta_description || art.excerpt || '').slice(0, 160));
  const titleEsc = esc(art.title || '');
  const imageUrl = art.image_url || `${SITE}/og-default.png`;

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: art.title,
    description: (art.meta_description || art.excerpt || '').slice(0, 160),
    datePublished: publishedISO,
    dateModified: publishedISO,
    author: { '@type': 'Organization', name: 'REASON Szerkesztőség' },
    publisher: {
      '@type': 'Organization', name: 'REASON', url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/cikk/${art.id}` },
    url: `${SITE}/cikk/${art.id}`,
    inLanguage: 'hu',
    articleSection: art.category || '',
    image: imageUrl,
  });

  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f8f7f4;color:#1a1814;font-family:'Inter',sans-serif;font-size:16px;line-height:1.7}
    .topbar{background:${col};color:#fff;text-align:center;padding:10px;font-size:12px;font-weight:700}
    .topbar a{color:#fff;text-decoration:none}
    .wrap{max-width:780px;margin:0 auto;padding:48px 24px 80px}
    .cat{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${col};margin-bottom:12px}
    h1{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;line-height:1.2;margin-bottom:16px}
    @media(max-width:600px){h1{font-size:26px}.wrap{padding:24px 16px 60px}}
    .meta{font-size:12px;color:#9e9890;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e8e4dc}
    .body{font-family:'Playfair Display',serif;font-size:18px;line-height:2;color:#3d3a35;margin-top:40px}
    .body p{margin-bottom:22px;text-align:justify}
    .body p:first-child::first-letter{font-size:3.5em;font-weight:700;float:left;margin:0 8px -8px 0;line-height:.78;color:${col}}
    .action-bar{display:flex;align-items:center;gap:12px;margin:28px 0 0;flex-wrap:wrap}
    .btn-like{display:flex;align-items:center;gap:7px;padding:9px 18px;background:#fff;border:2px solid #e8e4dc;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;transition:border-color .15s,background .15s;color:#1a1814;font-family:'Inter',sans-serif}
    .btn-like:hover{border-color:${col}}
    .btn-like.liked{border-color:${col};background:${col};color:#fff}
    .btn-like svg{width:16px;height:16px;flex-shrink:0}
    .btn-share{display:flex;align-items:center;gap:7px;padding:9px 18px;background:${col};border:none;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;color:#fff;font-family:'Inter',sans-serif;transition:opacity .15s}
    .btn-share:hover{opacity:.88}
    .share-msg{font-size:12px;color:#1a7a3c;font-weight:600}
    .comments-section{margin-top:48px;border-top:2px solid #e8e4dc;padding-top:32px}
    .comments-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:20px}
    .comment-form{margin-top:28px}
    .comment-form h3{font-size:14px;font-weight:700;margin-bottom:14px;color:#1a1814}
    .comment-form input,.comment-form textarea{width:100%;padding:9px 12px;border:1px solid #e8e4dc;border-radius:7px;font-size:13px;margin-bottom:10px;box-sizing:border-box;font-family:'Inter',sans-serif;background:#fff;color:#1a1814;outline:none}
    .comment-form input:focus,.comment-form textarea:focus{border-color:${col}}
    .comment-form textarea{min-height:100px;resize:vertical}
    .btn-comment{padding:10px 24px;background:${col};color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif}
    .comment-msg{font-size:12px;margin-top:8px;min-height:16px}
    .back{display:inline-block;margin-top:40px;padding:10px 20px;background:${col};color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700}
    .ad-wrap{margin:2rem 0;text-align:center;min-height:90px}
  `;

  // ── JAVÍTOTT clientScript: like POST az /api/like endpoint-ra megy ──────────
  const clientScript = `
    const ARTICLE_ID = '${art.id}';
    const ARTICLE_TITLE = ${JSON.stringify(art.title)};
    const ARTICLE_URL = '${SITE}/cikk/${art.id}';
    const LIKE_KEY = 'reason_liked_' + ARTICLE_ID;
    const btn = document.getElementById('likeBtn');
    const countEl = document.getElementById('likeCount');
    if (localStorage.getItem(LIKE_KEY)) btn.classList.add('liked');

    async function handleLike() {
      if (localStorage.getItem(LIKE_KEY)) return;
      const prev = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = prev + 1;
      btn.classList.add('liked');
      localStorage.setItem(LIKE_KEY, '1');
      try {
        const r = await fetch('/api/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ARTICLE_ID })
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        countEl.textContent = data.like_count;
      } catch {
        countEl.textContent = prev;
        btn.classList.remove('liked');
        localStorage.removeItem(LIKE_KEY);
      }
    }

    async function handleShare() {
      const msgEl = document.getElementById('shareMsg');
      if (navigator.share) {
        try { await navigator.share({ title: ARTICLE_TITLE, url: ARTICLE_URL }); return; } catch {}
      }
      try {
        await navigator.clipboard.writeText(ARTICLE_URL);
        msgEl.textContent = '✓ Link másolva!';
        setTimeout(() => { msgEl.textContent = ''; }, 2500);
      } catch {
        msgEl.textContent = ARTICLE_URL;
      }
    }

    async function submitComment() {
      const author = document.getElementById('cAuthor').value.trim() || 'Névtelen olvasó';
      const body = document.getElementById('cBody').value.trim();
      const msg = document.getElementById('cMsg');
      if (body.length < 3) { msg.style.color='#c8102e'; msg.textContent='Túl rövid.'; return; }
      msg.style.color='#9e9890'; msg.textContent='Küldés...';
      try {
        const r = await fetch('${SB_URL}/rest/v1/comments', {
          method: 'POST',
          headers: {
            apikey: '${SB_KEY}',
            Authorization: 'Bearer ${SB_KEY}',
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ article_id: ARTICLE_ID, author, body })
        });
        if (!r.ok) throw new Error();
        msg.style.color='#1a7a3c'; msg.textContent='Elküldve!';
        document.getElementById('cBody').value = '';
        document.getElementById('cAuthor').value = '';
        setTimeout(() => location.reload(), 1200);
      } catch {
        msg.style.color='#c8102e'; msg.textContent='Hiba, próbáld újra.';
      }
    }
  `;

  return (
    <html lang="hu">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{titleEsc} – REASON</title>
        <meta name="description" content={descriptionEsc} />
        {art.seo_keywords && <meta name="keywords" content={esc(art.seo_keywords)} />}
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={titleEsc} />
        <meta property="og:description" content={descriptionEsc} />
        <meta property="og:url" content={`${SITE}/cikk/${art.id}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="REASON" />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="hu_HU" />
        <meta property="article:published_time" content={publishedISO} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={titleEsc} />
        <meta name="twitter:description" content={descriptionEsc} />
        <meta name="twitter:image" content={imageUrl} />
        <link rel="canonical" href={`${SITE}/cikk/${art.id}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="topbar">
          <a href={SITE}>← Vissza a REASON főoldalára</a>
        </div>
        <div className="wrap">
          <div className="cat">{art.category || ''}</div>
          <h1>{art.title}</h1>
          <div className="meta">
            {dateFormatted} · REASON Szerkesztőség · {art.read_time || '?'} perc olvasás
          </div>
          <div className="action-bar">
            <button className="btn-like" id="likeBtn" onClick="handleLike()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span id="likeCount">{likeCount}</span>
            </button>
            <button className="btn-share" onClick="handleShare()">↗ Megosztás</button>
            <span className="share-msg" id="shareMsg"></span>
          </div>
          <div className="body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          <div className="comments-section">
            <h2 className="comments-title">Hozzászólások</h2>
            <div id="commentList" dangerouslySetInnerHTML={{ __html: commentsHtml }} />
            <div className="comment-form">
              <h3>Írj hozzászólást</h3>
              <input id="cAuthor" type="text" maxLength={80} placeholder="Neved (opcionális)" />
              <textarea id="cBody" maxLength={1000} placeholder="Hozzászólásod..." />
              <button className="btn-comment" onClick="submitComment()">Küldés</button>
              <div className="comment-msg" id="cMsg"></div>
            </div>
          </div>
          <a href={SITE} className="back">← Vissza a főoldalra</a>
        </div>
        <script dangerouslySetInnerHTML={{ __html: clientScript }} />
      </body>
    </html>
  );
}
