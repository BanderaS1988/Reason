const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

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

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

module.exports = async (req, res) => {
  const id = req.url.split('/cikk/')[1]?.split('?')[0];

  if (!id || id.length < 5) {
    res.status(404).send('Nem található');
    return;
  }

  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const [artRes, commentsRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/articles?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers }),
      fetch(`${SB_URL}/rest/v1/comments?article_id=eq.${encodeURIComponent(id)}&order=created_at.asc`, { headers }),
    ]);

    const artData = await artRes.json();
    const art = artData?.[0];

    if (!art) {
      res.status(404).send('A cikk nem található');
      return;
    }

    const comments = await commentsRes.json() || [];
    const col = CAT_COLOR[art.category] || '#c8102e';
    const url = `${SITE}/cikk/${art.id}`;
    const imageUrl = art.image_url || `${SITE}/og-default.png`;
    const desc = esc((art.meta_description || art.excerpt || '').slice(0, 160));
    const titleEsc = esc(art.title || '');

    const body = art.body || art.excerpt || '';
    const paras = body.split(/\n\n+|\n/).filter(p => p.trim().length > 4);
    const bodyHtml = paras.length
      ? paras.map(p => `<p>${esc(p.trim())}</p>`).join('')
      : `<p>${esc(body)}</p>`;

    const commentsHtml = comments.length
      ? comments.map(c => `
          <div style="border-bottom:1px solid #e8e4dc;padding:14px 0">
            <div style="font-size:11px;font-weight:700;color:#1a1814;margin-bottom:4px">${esc(c.author || 'Névtelen')}</div>
            <div style="font-size:13px;color:#3d3a35;line-height:1.6">${esc(c.body)}</div>
            <div style="font-size:10px;color:#9e9890;margin-top:4px">${fmtDate(c.created_at)}</div>
          </div>`).join('')
      : '<div style="font-size:13px;color:#9e9890;padding:14px 0">Még nincs hozzászólás. Légy az első!</div>';

    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: art.title,
      description: (art.meta_description || art.excerpt || '').slice(0, 160),
      datePublished: new Date(art.created_at).toISOString(),
      dateModified: new Date(art.updated_at || art.created_at).toISOString(),
      author: { '@type': 'Organization', name: 'REASON Szerkesztőség' },
      publisher: { '@type': 'Organization', name: 'REASON', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      inLanguage: 'hu',
      articleSection: art.category || '',
      image: imageUrl,
    });

    const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titleEsc} – REASON</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${titleEsc}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="REASON">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${titleEsc}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(imageUrl)}">
<meta property="article:published_time" content="${new Date(art.created_at).toISOString()}">
<script type="application/ld+json">${schemaJson}<\/script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7856205120757314" crossorigin="anonymous"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#f8f7f4;color:#1a1814;font-family:'Inter',sans-serif;font-size:16px;line-height:1.7}
.topbar{background:${col};color:#fff;text-align:center;padding:10px;font-size:12px;font-weight:700}
.topbar a{color:#fff;text-decoration:none}
.wrap{max-width:780px;margin:0 auto;padding:48px 24px 80px}
.cat{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${col};margin-bottom:12px}
h1{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;line-height:1.2;margin-bottom:16px}
@media(max-width:600px){h1{font-size:26px}.wrap{padding:24px 16px 60px}}
.meta{font-size:12px;color:#9e9890;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e8e4dc}
.hero{width:100%;max-height:420px;object-fit:cover;border-radius:10px;margin-bottom:32px}
.body{font-family:'Playfair Display',serif;font-size:18px;line-height:2;color:#3d3a35;margin-top:40px}
.body p{margin-bottom:22px;text-align:justify}
.body p:first-child::first-letter{font-size:3.5em;font-weight:700;float:left;margin:0 8px -8px 0;line-height:.78;color:${col}}
.share-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:20px 0;border-top:1px solid #e8e4dc;margin-top:32px}
.share-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Inter',sans-serif;transition:.15s;text-decoration:none}
.share-copy{background:#f8f7f4;border:2px solid #e8e4dc;color:#1a1814}
.share-copy:hover{border-color:${col};color:${col}}
.share-fb{background:#1877f2;color:#fff}
.share-tw{background:#000;color:#fff}
.share-msg{font-size:12px;color:#1a7a3c;font-weight:600}
.comments-section{margin-top:48px;border-top:2px solid #e8e4dc;padding-top:32px}
.comments-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:20px}
.comment-form{margin-top:28px}
.comment-form h3{font-size:14px;font-weight:700;margin-bottom:14px}
.comment-form input,.comment-form textarea{width:100%;padding:9px 12px;border:1px solid #e8e4dc;border-radius:7px;font-size:13px;margin-bottom:10px;font-family:'Inter',sans-serif;background:#fff;color:#1a1814;outline:none}
.comment-form input:focus,.comment-form textarea:focus{border-color:${col}}
.comment-form textarea{min-height:100px;resize:vertical}
.btn-comment{padding:10px 24px;background:${col};color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif}
.back{display:inline-block;margin-top:40px;padding:10px 20px;background:${col};color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700}
.ad-wrap{margin:2rem 0;text-align:center;min-height:90px}
footer{background:#1a1814;color:#9e9890;text-align:center;padding:20px;font-size:11px;line-height:2}
footer a{color:#f0c040;text-decoration:none}
</style>
</head>
<body>
<div class="topbar"><a href="${SITE}">← Vissza a REASON főoldalára</a></div>
<div class="wrap">
  <div class="cat">${esc(art.category || '')}</div>
  <h1>${titleEsc}</h1>
  <div class="meta">${fmtDate(art.created_at)} · REASON Szerkesztőség · ${art.read_time || '?'} perc olvasás</div>
  ${art.image_url ? `<img class="hero" src="${esc(art.image_url)}" alt="${titleEsc}">` : ''}
  <div class="ad-wrap"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7856205120757314" data-ad-slot="4427813320" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script></div>
  <div class="body">${bodyHtml}</div>
  <div class="ad-wrap"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7856205120757314" data-ad-slot="4427813320" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script></div>
  <div class="share-bar">
    <button class="share-btn share-copy" onclick="copyLink()">🔗 Link másolása</button>
    <a class="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
    <a class="share-btn share-tw" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent((art.title || '').slice(0, 100))}" target="_blank" rel="noopener">X / Twitter</a>
    <span class="share-msg" id="shareMsg"></span>
  </div>
  <div class="comments-section">
    <h2 class="comments-title">Hozzászólások (${comments.length})</h2>
    <div id="commentList">${commentsHtml}</div>
    <div class="comment-form">
      <h3>Írj hozzászólást</h3>
      <input id="cAuthor" type="text" maxlength="80" placeholder="Neved (opcionális)">
      <textarea id="cBody" maxlength="1000" placeholder="Hozzászólásod..."></textarea>
      <button class="btn-comment" onclick="submitComment()">Küldés</button>
      <div id="cMsg" style="font-size:12px;margin-top:8px;min-height:16px"></div>
    </div>
  </div>
  <a href="${SITE}" class="back">← Vissza a főoldalra</a>
</div>
<footer>© 2025 REASON · <a href="/aszf.html">ÁSZF</a> · <a href="/adatkezeles.html">Adatkezelés</a> · <a href="/cookie.html">Cookie tájékoztató</a></footer>
<script>
const ARTICLE_URL = '${url}';
const ARTICLE_ID = '${art.id}';
const SB_URL = '${SB_URL}';
const SB_KEY = '${SB_KEY}';

async function copyLink(){
  try{ await navigator.clipboard.writeText(ARTICLE_URL); }
  catch{ const t=document.createElement('textarea');t.value=ARTICLE_URL;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove(); }
  const m=document.getElementById('shareMsg');
  m.textContent='✓ Link másolva!';
  setTimeout(()=>{m.textContent=''},2500);
}

async function submitComment(){
  const author=document.getElementById('cAuthor').value.trim()||'Névtelen olvasó';
  const body=document.getElementById('cBody').value.trim();
  const msg=document.getElementById('cMsg');
  if(body.length<3){msg.style.color='#c8102e';msg.textContent='Túl rövid.';return;}
  msg.style.color='#9e9890';msg.textContent='Küldés...';
  try{
    const r=await fetch(SB_URL+'/rest/v1/comments',{
      method:'POST',
      headers:{apikey:SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify({article_id:ARTICLE_ID,author,body})
    });
    if(!r.ok) throw new Error();
    msg.style.color='#1a7a3c';msg.textContent='Köszönjük!';
    document.getElementById('cBody').value='';
    document.getElementById('cAuthor').value='';
    setTimeout(()=>location.reload(),1200);
  }catch{msg.style.color='#c8102e';msg.textContent='Hiba, próbáld újra.';}
}
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(html);

    // View tracking aszinkron
    fetch(`${SB_URL}/rest/v1/rpc/increment_view`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_article_id: String(id) }),
    }).catch(() => {});

  } catch (e) {
    res.status(500).send(`Hiba: ${e.message}`);
  }
};
