const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';

const CAT_COLOR = {
  Világ:'#c8102e', Tech:'#0066cc', Gazdaság:'#1a7a3c',
  Életmód:'#b86000', Kultúra:'#7c3aed', Botrány:'#e8152f',
  Sport:'#0099cc', Krimi:'#2d2d2d', Politika:'#8b0000'
};

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json'
};

export async function getServerSideProps({ params }) {
  const { id } = params;

  const [artRes, commentsRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/articles?id=eq.${id}&select=*&limit=1`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/comments?article_id=eq.${id}&order=created_at.asc`, { headers: SB_HEADERS })
  ]);

  const artData = await artRes.json();
  const art = artData?.[0];

  if (!art) {
    return { notFound: true };
  }

  const comments = await commentsRes.json();

  return {
    props: { article: art, comments: comments || [] }
  };
}

export default function CikkPage({ article, comments }) {
  const art = article;
  const col = CAT_COLOR[art.category] || '#c8102e';
  const likeCount = art.like_count ?? 0;

  const paras = (art.body || art.excerpt || '')
    .split(/\n\n+|\n/)
    .filter(p => p.trim().length > 4);
  const bodyHtml = paras.map(p => `<p>${esc(p.trim())}</p>`).join('');

  const commentsHtml = Array.isArray(comments) && comments.length
    ? comments.map(c => `
        <div style="border-bottom:1px solid #e8e4dc;padding:14px 0">
          <div style="font-size:11px;font-weight:700;color:#1a1814;margin-bottom:4px">${esc(c.author)}</div>
          <div style="font-size:13px;color:#3d3a35;line-height:1.6">${esc(c.body)}</div>
          <div style="font-size:10px;color:#9e9890;margin-top:4px">${new Date(c.created_at).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>`).join('')
    : '<div style="font-size:13px;color:#9e9890;padding:14px 0">Még nincs hozzászólás. Légy az első!</div>';

  return (
    <>
      <head>
        <title>{esc(art.title)} – REASON</title>
        <meta name="description" content={esc((art.excerpt || '').slice(0, 160))} />
        <meta property="og:title" content={esc(art.title)} />
        <meta property="og:description" content={esc((art.excerpt || '').slice(0, 160))} />
        <meta property="og:url" content={`${SITE}/cikk/${art.id}`} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`${SITE}/cikk/${art.id}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": art.title,
            "description": (art.excerpt || '').slice(0, 160),
            "datePublished": new Date(art.created_at).toISOString(),
            "publisher": { "@type": "Organization", "name": "REASON", "url": SITE }
          })
        }} />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: '#f8f7f4', color: '#1a1814', fontFamily: "'Inter', sans-serif", fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
        <div style={{ background: col, color: '#fff', textAlign: 'center', padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>
          <a href={SITE} style={{ color: '#fff', textDecoration: 'none' }}>← Vissza a REASON főoldalára</a>
        </div>
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px 80px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: col, marginBottom: '12px' }}>
            {esc(art.category || '')}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: '900', lineHeight: '1.2', marginBottom: '16px' }}>
            {esc(art.title)}
          </h1>
          <div style={{ fontSize: '12px', color: '#9e9890', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e8e4dc' }}>
            {new Date(art.created_at).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            · REASON Szerkesztőség
            · {art.read_time || '?'} perc olvasás
          </div>

          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', lineHeight: '2', color: '#3d3a35' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />

          <div style={{ marginTop: '48px', borderTop: '2px solid #e8e4dc', paddingTop: '32px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>Hozzászólások</h2>
            <div dangerouslySetInnerHTML={{ __html: commentsHtml }} />
          </div>

          <a href={SITE} style={{ display: 'inline-block', marginTop: '40px', padding: '10px 20px', background: col, color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
            ← Vissza a főoldalra
          </a>
        </div>
      </body>
    </>
  );
}
