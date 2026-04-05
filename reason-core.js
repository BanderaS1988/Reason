// reason-core.js
// Egyetlen fájl, minden benne van. A többiek ezt hívják.

async function groqNoStreamFallback(_, model, system, prompt, maxTokens) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer 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`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      max_tokens: maxTokens || 1000
    })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}


const REASON_CORE = (function() {
  'use strict';

  // ==================== KONFIG ====================
  const SITE_URL = 'https://reason-five.vercel.app';
  const BUFFER_TOKEN = '';
  const GROQ_API_KEY = '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';

  // AdSense publisher ID – ide a sajátod kerül ha megvan
  const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXX';

  // Affiliate programok – minden kulcsszóhoz link
  const AFFILIATE_MAP = {
    'szállás': 'https://www.booking.com/affiliate?aid=XXXXX',
    'hotel': 'https://www.booking.com/affiliate?aid=XXXXX',
    'termék': 'https://www.arukereso.hu/affiliate?id=XXXXX',
    'vásárlás': 'https://www.arukereso.hu/affiliate?id=XXXXX',
    'webáruház': 'https://www.shoprenter.hu/affiliate?ref=XXXXX',
    'utazás': 'https://www.booking.com/affiliate?aid=XXXXX',
  };

  // Email lista – Mailchimp list ID ha van
  const MAILCHIMP_LIST_ID = '';
  const MAILCHIMP_API_KEY = '';

  // Prémium tartalom – ezek a cikk típusok kerülnek paywall mögé
  const PREMIUM_TYPES = [];

  // IndexNow API kulcs – Bing/Yandex azonnali indexeléshez (generálj egy random stringet)
  const INDEXNOW_KEY = 'reason2025xyz';

  // AI crawler user-agentek akiket engedélyezünk (GEO)
  const ALLOWED_AI_CRAWLERS = [
    'GPTBot', 'ChatGPT-User', 'PerplexityBot',
    'ClaudeBot', 'Google-Extended', 'Amazonbot'
  ];


  // ==================== 1. GOOGLE PING ====================
  async function pingGoogle() {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
      console.log('[SEO] Google/Bing ping sikeres');
      return true;
    } catch(e) {
      console.warn('[SEO] Ping hiba:', e);
      return false;
    }
  }


  // ==================== 2. SITEMAP ====================
  function generateSitemap(articles) {
    const urls = articles.map(art => `
      <url>
        <loc>${SITE_URL}/cikk/${art.id}</loc>
        <lastmod>${new Date(art.timestamp || Date.now()).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>
    `).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  async function updateSitemap(articles) {
    const xml = generateSitemap(articles);
    localStorage.setItem('reason_sitemap', xml);
    console.log(`[SEO] Sitemap frissítve, ${articles.length} URL`);
    return xml;
  }


  // ==================== 3. RSS ====================
  function generateRSS(articles) {
    const items = articles.slice(0, 30).map(art => `
      <item>
        <title>${escapeXml(art.title)}</title>
        <link>${SITE_URL}/cikk/${art.id}</link>
        <description>${escapeXml(art.excerpt || '')}</description>
        <pubDate>${new Date(art.timestamp || Date.now()).toUTCString()}</pubDate>
        <guid>${SITE_URL}/cikk/${art.id}</guid>
      </item>
    `).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>REASON</title>
    <link>${SITE_URL}</link>
    <description>Intelligens hírek, értékalapú algoritmussal</description>
    <language>hu</language>
    ${items}
  </channel>
</rss>`;
  }

  async function updateRSS(articles) {
    const xml = generateRSS(articles);
    localStorage.setItem('reason_rss', xml);
    console.log('[SEO] RSS feed frissítve');
    return xml;
  }


  // ==================== 4. SOCIAL POSZTOK (Groq) ====================
  async function generateSocialPosts(article) {
    if (typeof groqNoStreamFallback !== 'function' && !GROQ_API_KEY) {
      console.warn('[Social] Groq nem elérhető');
      return null;
    }

    const prompt = `Írj 3 különböző Twitter/LinkedIn posztot ehhez a cikkhez. 
Cím: ${article.title}
Összefoglaló: ${article.excerpt || ''}
Minden poszt max 240 karakter, legyen kattintható, és legyen benne 1-2 emoji.
A végén minden poszt után írd: ---
Csak a posztokat írd, semmi mást.`;

    try {
      let result;
      if (typeof groqNoStreamFallback === 'function') {
        result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'Posztíró vagy.', prompt, 800);
      } else if (GROQ_API_KEY) {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: 'Posztíró vagy.' }, { role: 'user', content: prompt }],
            max_tokens: 800
          })
        });
        const data = await resp.json();
        result = data.choices?.[0]?.message?.content || '';
      } else {
        return null;
      }

      const posts = result.split('---').filter(p => p.trim().length > 20);
      localStorage.setItem(`social_${article.id}`, JSON.stringify(posts));
      console.log(`[Social] ${posts.length} poszt generálva`);
      return posts;
    } catch(e) {
      console.error('[Social] Hiba:', e);
      return null;
    }
  }


  // ==================== 5. BUFFER ====================
  async function sendToBuffer(text, profileId) {
    if (!BUFFER_TOKEN || !profileId) {
      console.log('[Buffer] Nincs token vagy profileId, kihagyva');
      return false;
    }
    try {
      await fetch('https://api.bufferapp.com/1/updates/create.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: BUFFER_TOKEN,
          text: text,
          profile_ids: profileId
        })
      });
      return true;
    } catch(e) {
      console.warn('[Buffer] Hiba:', e);
      return false;
    }
  }


  // ==================== 6. NAPI HÍRLEVÉL ====================
  async function generateNewsletter(articles) {
    if (typeof groqNoStreamFallback !== 'function') return null;

    const today = new Date().toLocaleDateString('hu');
    const summary = articles.slice(0, 10).map(a => `- ${a.title}`).join('\n');

    const prompt = `Írj egy rövid, figyelemfelkeltő hírlevelet a mai ${articles.length} cikkből.
Dátum: ${today}
Cikkek: ${summary}
A hírlevél max 500 szó, legyen egy erős tárgysor, és minden cikkhez 1-2 mondat.
Végén egy link: ${SITE_URL}`;

    try {
      const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'Hírlevél szerkesztő vagy.', prompt, 1000);
      localStorage.setItem('reason_newsletter', JSON.stringify({
        date: today,
        content: result,
        subject: result.split('\n')[0].slice(0, 60)
      }));
      console.log('[Newsletter] Napi összegzés elkészült');
      return result;
    } catch(e) {
      console.error('[Newsletter] Hiba:', e);
      return null;
    }
  }


  // ==================== 7. SEO META ====================
  async function generateMetaTags(article) {
    if (typeof groqNoStreamFallback !== 'function') {
      return {
        title: article.title.slice(0, 60),
        description: (article.excerpt || '').slice(0, 160),
        keywords: article.type
      };
    }

    const prompt = `Adj SEO meta adatokat ehhez a cikkhez:
Cím: ${article.title}
Tartalom: ${article.excerpt || ''}
Válasz csak JSON formátumban, semmi más:
{"title":"...", "description":"...", "keywords":"kulcs1, kulcs2, kulcs3"}
Title max 60 karakter, description max 160 karakter.`;

    try {
      const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'SEO szakértő vagy.', prompt, 300);
      // törékeny JSON parse védelem
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Nincs JSON a válaszban');
      return JSON.parse(jsonMatch[0]);
    } catch(e) {
      return { title: article.title.slice(0, 60), description: (article.excerpt || '').slice(0, 160), keywords: '' };
    }
  }


  // ==================== 8. ADSENSE AUTOMATIKUS BEILLESZTÉS ====================
  // A cikk HTML tartalmába automatikusan beilleszt AdSense blokkokat.
  // A cikk közepe után és a végén jelenik meg egy-egy hirdetés.
  function injectAdSense(articleHtml) {
    if (!ADSENSE_CLIENT) return articleHtml;

    const adBlock = `
      <div class="reason-ad" style="margin:2rem 0;text-align:center;">
        <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="${ADSENSE_CLIENT}"
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      </div>`;

    // Bekezdések alapján felezi a cikket és középre, végre rakja a hirdetést
    const paragraphs = articleHtml.split('</p>');
    if (paragraphs.length < 4) {
      return articleHtml + adBlock;
    }
    const mid = Math.floor(paragraphs.length / 2);
    paragraphs.splice(mid, 0, adBlock);
    return paragraphs.join('</p>') + adBlock;
  }


  // ==================== 9. AFFILIATE LINK INJEKTÁLÁS ====================
  // Végigmegy a cikk szövegén, és ha talál kulcsszót az AFFILIATE_MAP-ben,
  // automatikusan linkké alakítja. Minden kulcsszót csak egyszer linkeli.
  function injectAffiliateLinks(articleHtml) {
    let result = articleHtml;
    const linked = new Set();

    for (const [keyword, url] of Object.entries(AFFILIATE_MAP)) {
      if (linked.has(keyword)) continue;
      // kis-nagybetű érzéketlen keresés, de csak az első előfordulást linkeli
      const regex = new RegExp(`(?<!<[^>]*)(${keyword})(?![^<]*>)`, 'i');
      if (regex.test(result)) {
        result = result.replace(regex, `<a href="${url}" target="_blank" rel="noopener sponsored">$1</a>`);
        linked.add(keyword);
        console.log(`[Affiliate] Link beillesztve: ${keyword}`);
      }
    }
    return result;
  }


  // ==================== 10. EMAIL FELIRATKOZÓ GYŰJTÉS ====================
  // Visszaad egy HTML blokkot amit a cikk alá lehet rakni.
  // Ha van Mailchimp konfig, az adatokat oda küldi, különben localStorage-ba menti.
  function getSubscribeForm(articleId) {
    return `
      <div class="reason-subscribe" style="margin:3rem 0;padding:2rem;background:#f9f9f9;border-radius:8px;text-align:center;">
        <h3 style="margin:0 0 0.5rem">Ne maradj le semmiről</h3>
        <p style="margin:0 0 1rem;color:#666;">Napi összegző egyenesen a postaládádba.</p>
        <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
          <input type="email" id="reason-email-${articleId}" placeholder="email@cimed.hu"
            style="padding:0.6rem 1rem;border:1px solid #ddd;border-radius:4px;font-size:1rem;width:260px;" />
          <button onclick="REASON_CORE.submitSubscribe('${articleId}')"
            style="padding:0.6rem 1.2rem;background:#111;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:1rem;">
            Feliratkozom
          </button>
        </div>
        <p id="reason-subscribe-msg-${articleId}" style="margin:0.5rem 0 0;font-size:0.85rem;color:green;display:none;">
          Sikeresen feliratkoztál! ✓
        </p>
      </div>`;
  }

  async function submitSubscribe(articleId) {
    const input = document.getElementById(`reason-email-${articleId}`);
    const msg = document.getElementById(`reason-subscribe-msg-${articleId}`);
    if (!input || !input.value.includes('@')) return;

    const email = input.value.trim();

    // LocalStorage mentés (mindig)
    const existing = JSON.parse(localStorage.getItem('reason_subscribers') || '[]');
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem('reason_subscribers', JSON.stringify(existing));
    }

    // Mailchimp küldés ha van konfig
    if (MAILCHIMP_LIST_ID && MAILCHIMP_API_KEY) {
      try {
        await fetch(`https://us1.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`, {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email_address: email, status: 'subscribed' })
        });
      } catch(e) {
        console.warn('[Subscribe] Mailchimp hiba:', e);
      }
    }

    input.value = '';
    if (msg) { msg.style.display = 'block'; }
    console.log(`[Subscribe] Új feliratkozó: ${email}`);
  }


  // ==================== 11. PRÉMIUM / PAYWALL LOGIKA ====================
  // Ha a cikk prémium típusú, a szöveg felét elvágja és email megadást kér.
  // Ha az olvasó már feliratkozott (localStorage), szabadon olvashatja.
  function applyPaywall(articleHtml, article) {
    if (!PREMIUM_TYPES.includes(article.type)) return articleHtml;

    const subscribers = JSON.parse(localStorage.getItem('reason_subscribers') || '[]');
    const unlocked = localStorage.getItem(`unlocked_${article.id}`);

    // Ha már feliratkozott vagy feloldotta, teljes cikk
    if (subscribers.length > 0 || unlocked) return articleHtml;

    // Elvágás a cikk 40%-ánál
    const cutPoint = Math.floor(articleHtml.length * 0.4);
    const preview = articleHtml.slice(0, cutPoint);

    const gate = `
      <div class="reason-paywall" style="margin:2rem 0;padding:2rem;background:linear-gradient(to bottom,transparent,#fff 40%);text-align:center;position:relative;margin-top:-4rem;">
        <div style="padding-top:3rem;">
          <h3 style="margin:0 0 0.5rem">Ez a cikk prémium tartalom</h3>
          <p style="color:#666;margin:0 0 1rem">Iratkozz fel ingyenesen a teljes olvasáshoz.</p>
          <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
            <input type="email" id="reason-gate-email-${article.id}" placeholder="email@cimed.hu"
              style="padding:0.6rem 1rem;border:1px solid #ddd;border-radius:4px;font-size:1rem;width:260px;" />
            <button onclick="REASON_CORE.unlockArticle('${article.id}')"
              style="padding:0.6rem 1.2rem;background:#111;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:1rem;">
              Teljes cikk
            </button>
          </div>
        </div>
      </div>`;

    return preview + gate;
  }

  async function unlockArticle(articleId) {
    const input = document.getElementById(`reason-gate-email-${articleId}`);
    if (!input || !input.value.includes('@')) return;

    await submitSubscribe(articleId);
    localStorage.setItem(`unlocked_${articleId}`, '1');

    // Újratölti a cikket paywall nélkül – ez az oldaltól függ hogyan van kezelve
    window.location.reload();
  }


  // ==================== 12. SPONSORED CONTENT OLDAL GENERÁLÁS ====================
  // Automatikusan generál egy hirdetési adatlapot a weboldal forgalma alapján.
  // Ez egy HTML stringet ad vissza amit ki lehet tenni pl. /hirdess oldalra.
  function generateSponsoredPage(stats) {
    const { articleCount = 0, subscriberCount = 0 } = stats || {};
    const subscribers = JSON.parse(localStorage.getItem('reason_subscribers') || '[]');
    const totalSubs = subscriberCount || subscribers.length;

    return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>Hirdetési lehetőségek – REASON</title>
</head>
<body style="font-family:sans-serif;max-width:700px;margin:4rem auto;padding:0 1rem;color:#111;">
  <h1>Hirdetési lehetőségek</h1>
  <p>A REASON intelligens hírportál automatizált, értékalapú tartalommal.</p>
  <h2>Számok</h2>
  <ul>
    <li><strong>${articleCount}</strong> megjelent cikk</li>
    <li><strong>${totalSubs}</strong> email feliratkozó</li>
    <li>Frissítés: naponta, automatikusan</li>
  </ul>
  <h2>Lehetőségek</h2>
  <ul>
    <li>Banner hirdetés (cikk közben / oldalsáv)</li>
    <li>Szponzorált cikk (jelölt tartalom)</li>
    <li>Hírlevél szponzoráció</li>
  </ul>
  <h2>Kapcsolat</h2>
  <p>Email: <a href="mailto:hirdetes@reason.hu">hirdetes@reason.hu</a></p>
  <p style="color:#999;font-size:0.8rem;">Generálva: ${new Date().toLocaleDateString('hu')}</p>
</body>
</html>`;
  }


  // ==================== 13. FŐFÜGGVÉNY (minden cikk után) ====================
  async function afterPublish(article, allArticles) {
    console.log('[REASON Core] Új cikk feldolgozása:', article.title);

    // SEO
    await updateSitemap(allArticles);
    await updateRSS(allArticles);
    await updateNewsSitemap(allArticles);
    await pingGoogle();

    // Social – minden platformra
    const posts = await generateSocialPosts(article);
    if (posts && posts.length) {
      if (BUFFER_TOKEN) await sendToBuffer(posts[0], article.bufferProfileId || '');
      await postToFacebook(article, posts[0]);
      await postToTelegram(article, posts[0]);
      await postToPinterest(article);
      await postToReddit(article);
    }

    // Push notification
    await sendPushNotification(article);

    // Meta
    const meta = await generateMetaTags(article);

    // Schema + Open Graph meta tagek
    const schema = generateSchemaMarkup(article);
    const ogTags = generateOpenGraphTags(article);

    // Bevétel: AdSense + affiliate + belső linkelés + paywall
    let html = article.html || '';
    if (html) {
      html = injectInternalLinks(html, article, allArticles);
      html = injectAffiliateLinks(html);
      html = injectAdSense(html);
      html = applyPaywall(html, article);
      // GEO – statisztika injektálás a meglévő HTML-be
      html = await injectGEOStatistics(article, html);
      article.processedHtml = html;
    }

    // GEO – definíció-first struktúra (a cikk elé kerül)
    const geoIntro = await applyGEOStructure(article);
    if (geoIntro && article.processedHtml) {
      article.processedHtml = geoIntro + article.processedHtml;
    }

    // Feliratkozó form HTML
    const subscribeForm = getSubscribeForm(article.id);

    // Sponsored oldal + média kit frissítése
    const sponsoredHtml = generateSponsoredPage({ articleCount: allArticles.length });
    localStorage.setItem('reason_sponsored_page', sponsoredHtml);
    generateMediaKit(allArticles);

    // Sajtóközlemény minden 10. cikknél
    await generatePressRelease(allArticles);

    // OG kép generálás ha nincs saját kép
    if (!article.image) {
      article.ogImage = generateOGImage(article);
    }

    // Fordítás angolra
    await translateArticle(article);

    // Sebesség monitor
    monitorPageSpeed();

    // Wikipedia hivatkozás javaslat
    await generateWikipediaReference(article);

    // Knowledge Graph – 50 cikk felett indul
    await submitToKnowledgeGraph(allArticles);

    // Tudományos források injektálása
    if (article.processedHtml) {
      article.processedHtml = await injectExpertSources(article, article.processedHtml);
    }

    // Tartalom rés elemzés – minden 5. cikknél
    if (allArticles.length % 5 === 0) {
      await analyzeContentGaps(allArticles);
    }

    // FAQ + Entity schema
    const faqSchema = await generateFAQSchema(article);
    const entitySchema = await generateEntityMarkup(article);

    // Hreflang
    const hreflang = generateHreflangTags(article);

    // AMP verzió
    generateAMPVersion(article, article.processedHtml || '');

    // Embed kód
    const embedCode = generateEmbedCode(article);

    // GEO – IndexNow azonnali indexelés Bing + Yandex
    await submitToIndexNow(article);

    // GEO – llms.txt és robots.txt frissítése minden új cikknél
    generateLLMSTxt(allArticles);
    generateRobotsTxt();

    // Programmatic SEO oldalak frissítése
    generateProgrammaticPages(allArticles);

    console.log('[REASON Core] Feldolgozás kész');
    return {
      success: true,
      meta,
      schema,
      ogTags,
      faqSchema,
      entitySchema,
      hreflang,
      embedCode,
      geoIntro,
      postsGenerated: posts?.length || 0,
      subscribeForm,
      processedHtml: article.processedHtml || '',
      ogImage: article.ogImage || null
    };
  }


  // ==================== 14. NAPI IDŐZÍTŐ ====================
  let cronInterval = null;

  function startDailyTasks(getArticlesCallback) {
    if (cronInterval) clearInterval(cronInterval);

    cronInterval = setInterval(async () => {
      console.log('[Cron] Napi feladatok indítása...');
      const articles = typeof getArticlesCallback === 'function' ? getArticlesCallback() : [];
      if (articles.length) {
        await updateSitemap(articles);
        await updateRSS(articles);
        await generateNewsletter(articles);
        await pingGoogle();
      }
    }, 24 * 60 * 60 * 1000);

    console.log('[Cron] Napi feladatok beütemezve');
  }


  // ==================== SEGÉD ====================
  function escapeXml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }


  // ==================== 15. GOOGLE NEWS SITEMAP ====================
  // A Google News külön sitemap formátumot vár. Ez csak az elmúlt 48 órában
  // megjelent cikkeket tartalmazza – a Google News ezt indexeli.
  // A fájlt /news-sitemap.xml URL-en kell elérhetővé tenni.
  function generateNewsSitemap(articles) {
    const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
    const recentArticles = articles.filter(art => (art.timestamp || Date.now()) >= twoDaysAgo);

    const items = recentArticles.map(art => `
    <url>
      <loc>${SITE_URL}/cikk/${art.id}</loc>
      <news:news>
        <news:publication>
          <news:name>REASON</news:name>
          <news:language>hu</news:language>
        </news:publication>
        <news:publication_date>${new Date(art.timestamp || Date.now()).toISOString()}</news:publication_date>
        <news:title>${escapeXml(art.title)}</news:title>
      </news:news>
    </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;
  }

  async function updateNewsSitemap(articles) {
    const xml = generateNewsSitemap(articles);
    localStorage.setItem('reason_news_sitemap', xml);
    // Google News ping – külön URL a news sitemaphoz
    const newsSitemapUrl = `${SITE_URL}/news-sitemap.xml`;
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(newsSitemapUrl)}`);
      console.log('[Google News] News sitemap frissítve és pingelte');
    } catch(e) {
      console.warn('[Google News] Ping hiba:', e);
    }
    return xml;
  }


  // ==================== 16. SCHEMA MARKUP (JSON-LD) ====================
  // Minden cikkhez strukturált adatot generál amit a Google rich result-ként jelenít meg.
  // Megjelenhet kiemelt találatként, hírdobozban, szerzői kártyán.
  function generateSchemaMarkup(article) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': article.title,
      'description': article.excerpt || '',
      'datePublished': new Date(article.timestamp || Date.now()).toISOString(),
      'dateModified': new Date(article.timestamp || Date.now()).toISOString(),
      'author': {
        '@type': 'Organization',
        'name': 'REASON',
        'url': SITE_URL
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'REASON',
        'url': SITE_URL,
        'logo': {
          '@type': 'ImageObject',
          'url': `${SITE_URL}/logo.png`
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/cikk/${article.id}`
      },
      'url': `${SITE_URL}/cikk/${article.id}`,
      'inLanguage': 'hu'
    };

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }


  // ==================== 17. OPEN GRAPH + TWITTER CARD META ====================
  // Ha valaki megosztja a cikket Facebookon, WhatsApp-on, Twitteren,
  // ezek a tagek határozzák meg mit lát a megosztásban.
  // Enélkül csak egy csupasz link jelenik meg – ezzel szép kártya.
  function generateOpenGraphTags(article) {
    const url = `${SITE_URL}/cikk/${article.id}`;
    const image = article.image || `${SITE_URL}/og-default.jpg`;
    const title = (article.title || '').slice(0, 60);
    const description = (article.excerpt || '').slice(0, 160);

    return `
<!-- Open Graph -->
<meta property="og:type" content="article" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:site_name" content="REASON" />
<meta property="og:locale" content="hu_HU" />
<meta property="article:published_time" content="${new Date(article.timestamp || Date.now()).toISOString()}" />
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
<!-- Canonical -->
<link rel="canonical" href="${url}" />`.trim();
  }


  // ==================== 18. BELSŐ LINKELÉS AUTOMATIKUSAN ====================
  // A cikk szövegében keres más cikkekre utaló kulcsszavakat,
  // és automatikusan belinkel más Reason cikkeket.
  // Ez csökkenti a bounce rate-et és javítja a SEO-t egyaránt.
  function injectInternalLinks(articleHtml, article, allArticles) {
    let result = articleHtml;
    const linked = new Set();

    for (const other of allArticles) {
      if (other.id === article.id) continue;
      if (!other.title || linked.has(other.id)) continue;

      // Ha a másik cikk címéből egy 4+ karakteres szó szerepel a szövegben
      const words = other.title.split(' ').filter(w => w.length >= 4);
      for (const word of words) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<!<[^>]*)(${escaped})(?![^<]*>)`, 'i');
        if (regex.test(result)) {
          result = result.replace(regex,
            `<a href="${SITE_URL}/cikk/${other.id}" title="${escapeXml(other.title)}">$1</a>`
          );
          linked.add(other.id);
          break; // cikkenként max egy belső link
        }
      }

      if (linked.size >= 5) break; // max 5 belső link per cikk
    }

    console.log(`[InternalLink] ${linked.size} belső link beillesztve`);
    return result;
  }


  // ==================== 19. AUTOMATIKUS SAJTÓKÖZLEMÉNY GENERÁLÁS ====================
  // Minden 10. cikk után generál egy sajtóközleményt a Reason növekedéséről.
  // Ezt el lehet küldeni médiának, PR oldalakra, vagy kitenni /sajto oldalra.
  // Ingyen megjelenés más oldalakon = backlink = jobb SEO.
  async function generatePressRelease(allArticles) {
    if (typeof groqNoStreamFallback !== 'function') return null;
    if (allArticles.length % 10 !== 0) return null; // csak minden 10. cikknél

    const prompt = `Írj egy rövid, professzionális sajtóközleményt magyar nyelven a REASON hírportálról.
Tények: ${allArticles.length} cikk jelent meg eddig, automatizált szerkesztőség, értékalapú algoritmus.
A sajtóközlemény max 300 szó, legyen egy erős cím, egy bevezető bekezdés, és kapcsolati info: info@reason.hu
Csak a sajtóközleményt írd.`;

    try {
      const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'PR szakértő vagy.', prompt, 600);
      localStorage.setItem('reason_press_release', JSON.stringify({
        date: new Date().toLocaleDateString('hu'),
        content: result,
        articleCount: allArticles.length
      }));
      console.log('[PR] Sajtóközlemény generálva');
      return result;
    } catch(e) {
      console.error('[PR] Hiba:', e);
      return null;
    }
  }


  // ==================== 20. MÉDIA KIT AUTOMATIKUS GENERÁLÁS ====================
  // Egy letölthető/linkelhető oldalt generál hirdetők számára
  // a weboldal adataival, célközönségével, hirdetési lehetőségeivel.
  // Ez az első dolog amit egy hirdető keres mielőtt fizet.
  function generateMediaKit(allArticles) {
    const subscribers = JSON.parse(localStorage.getItem('reason_subscribers') || '[]');
    const categories = [...new Set(allArticles.map(a => a.type).filter(Boolean))];

    const html = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REASON – Média Kit</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 4rem auto; padding: 0 2rem; color: #111; line-height: 1.6; }
    h1 { font-size: 2.5rem; border-bottom: 3px solid #111; padding-bottom: 1rem; }
    h2 { margin-top: 2.5rem; }
    .stat { display: inline-block; margin: 0.5rem 1rem 0.5rem 0; padding: 1rem 1.5rem; background: #f5f5f5; border-radius: 4px; }
    .stat strong { display: block; font-size: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    td, th { padding: 0.75rem; border: 1px solid #ddd; text-align: left; }
    th { background: #f5f5f5; }
    footer { margin-top: 3rem; color: #999; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>REASON<br><small style="font-size:1rem;font-weight:normal;">Média Kit – ${new Date().getFullYear()}</small></h1>
  <p>A REASON intelligens, automatizált magyar hírportál – értékalapú algoritmussal szerkesztett tartalom.</p>

  <h2>Számok</h2>
  <div class="stat"><strong>${allArticles.length}</strong> megjelent cikk</div>
  <div class="stat"><strong>${subscribers.length}</strong> email feliratkozó</div>
  <div class="stat"><strong>Napi</strong> frissítés</div>

  <h2>Célközönség</h2>
  <p>Magyar olvasók, 25–55 év, érdeklődési körök: ${categories.join(', ') || 'hírek, gazdaság, technológia'}.</p>

  <h2>Hirdetési lehetőségek</h2>
  <table>
    <tr><th>Formátum</th><th>Elhelyezés</th><th>Megjegyzés</th></tr>
    <tr><td>Banner hirdetés</td><td>Cikk közben, oldalsáv</td><td>Google AdSense kompatibilis</td></tr>
    <tr><td>Szponzorált cikk</td><td>Főoldal + cikklista</td><td>Jelölt tartalom</td></tr>
    <tr><td>Hírlevél szponzoráció</td><td>Napi összegző email</td><td>${subscribers.length} feliratkozó</td></tr>
    <tr><td>Prémium pozíció</td><td>Főoldal teteje</td><td>Korlátozott elérhetőség</td></tr>
  </table>

  <h2>Kapcsolat</h2>
  <p>Email: <a href="mailto:hirdetes@reason.hu">hirdetes@reason.hu</a><br>
  Web: <a href="${SITE_URL}">${SITE_URL}</a></p>

  <footer>Generálva: ${new Date().toLocaleDateString('hu')} – REASON automatizált rendszer</footer>
</body>
</html>`;

    localStorage.setItem('reason_media_kit', html);
    console.log('[MediaKit] Média kit frissítve');
    return html;
  }


  // ==================== 21. FACEBOOK AUTOMATIKUS POSZTOLÁS ====================
  // Meta Graph API-val közvetlenül poszt az oldal falára.
  // FACEBOOK_PAGE_ID és FACEBOOK_TOKEN kell hozzá – Meta Developer Console-ból.
  const FACEBOOK_PAGE_ID = '';
  const FACEBOOK_TOKEN = '';

  async function postToFacebook(article, postText) {
    if (!FACEBOOK_PAGE_ID || !FACEBOOK_TOKEN) {
      console.log('[Facebook] Nincs konfig, kihagyva');
      return false;
    }
    try {
      const resp = await fetch(`https://graph.facebook.com/${FACEBOOK_PAGE_ID}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: postText || article.title,
          link: `${SITE_URL}/cikk/${article.id}`,
          access_token: FACEBOOK_TOKEN
        })
      });
      const data = await resp.json();
      if (data.id) {
        console.log('[Facebook] Poszt sikeres:', data.id);
        return true;
      }
      console.warn('[Facebook] Hiba:', data);
      return false;
    } catch(e) {
      console.error('[Facebook] Hiba:', e);
      return false;
    }
  }


  // ==================== 22. TELEGRAM AUTOMATIKUS POSZTOLÁS ====================
  // Telegram Bot API – ingyenes, nincs algoritmus, minden feliratkozó látja.
  // TELEGRAM_BOT_TOKEN: @BotFather-től, TELEGRAM_CHANNEL: pl. @reasonhu
  const TELEGRAM_BOT_TOKEN = '';
  const TELEGRAM_CHANNEL = '';

  async function postToTelegram(article, postText) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL) {
      console.log('[Telegram] Nincs konfig, kihagyva');
      return false;
    }
    const text = (postText || article.title) + `\n\n🔗 ${SITE_URL}/cikk/${article.id}`;
    try {
      const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      });
      const data = await resp.json();
      if (data.ok) {
        console.log('[Telegram] Poszt sikeres');
        return true;
      }
      console.warn('[Telegram] Hiba:', data);
      return false;
    } catch(e) {
      console.error('[Telegram] Hiba:', e);
      return false;
    }
  }


  // ==================== 23. PINTEREST AUTOMATIKUS POSZTOLÁS ====================
  // Pinterest API v5 – képpel együtt poszt, hosszú élettartamú forgalom.
  // PINTEREST_TOKEN: Pinterest Developer Console-ból, PINTEREST_BOARD_ID: a célboard ID-ja.
  const PINTEREST_TOKEN = '';
  const PINTEREST_BOARD_ID = '';

  async function postToPinterest(article) {
    if (!PINTEREST_TOKEN || !PINTEREST_BOARD_ID) {
      console.log('[Pinterest] Nincs konfig, kihagyva');
      return false;
    }
    try {
      const resp = await fetch('https://api.pinterest.com/v5/pins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINTEREST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          board_id: PINTEREST_BOARD_ID,
          title: article.title,
          description: article.excerpt || '',
          link: `${SITE_URL}/cikk/${article.id}`,
          media_source: {
            source_type: 'image_url',
            url: article.image || `${SITE_URL}/og-default.jpg`
          }
        })
      });
      const data = await resp.json();
      if (data.id) {
        console.log('[Pinterest] Pin létrehozva:', data.id);
        return true;
      }
      console.warn('[Pinterest] Hiba:', data);
      return false;
    } catch(e) {
      console.error('[Pinterest] Hiba:', e);
      return false;
    }
  }


  // ==================== 24. REDDIT AUTOMATIKUS POSZTOLÁS ====================
  // Reddit API – r/hungary és más releváns subredditek.
  // REDDIT_CLIENT_ID, REDDIT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD kell.
  const REDDIT_CLIENT_ID = '';
  const REDDIT_SECRET = '';
  const REDDIT_USERNAME = '';
  const REDDIT_PASSWORD = '';
  const REDDIT_SUBREDDITS = ['hungary', 'magyarország'];

  async function postToReddit(article) {
    if (!REDDIT_CLIENT_ID || !REDDIT_SECRET) {
      console.log('[Reddit] Nincs konfig, kihagyva');
      return false;
    }
    try {
      // Token megszerzése
      const tokenResp = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${REDDIT_CLIENT_ID}:${REDDIT_SECRET}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: REDDIT_USERNAME,
          password: REDDIT_PASSWORD
        })
      });
      const tokenData = await tokenResp.json();
      if (!tokenData.access_token) throw new Error('Token hiba');

      // Posztolás minden subredditbe
      for (const sub of REDDIT_SUBREDDITS) {
        await fetch('https://oauth.reddit.com/api/submit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ReasonBot/1.0'
          },
          body: new URLSearchParams({
            sr: sub,
            kind: 'link',
            title: article.title,
            url: `${SITE_URL}/cikk/${article.id}`,
            resubmit: 'false'
          })
        });
        console.log(`[Reddit] Posztolva: r/${sub}`);
      }
      return true;
    } catch(e) {
      console.error('[Reddit] Hiba:', e);
      return false;
    }
  }


  // ==================== 25. WEB PUSH NOTIFICATION (OneSignal) ====================
  // OneSignal ingyenes – push értesítés minden feliratkozó böngészőjébe/telefonjára.
  // ONESIGNAL_APP_ID és ONESIGNAL_API_KEY: OneSignal dashboard-ból.
  const ONESIGNAL_APP_ID = '';
  const ONESIGNAL_API_KEY = '';

  async function sendPushNotification(article) {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.log('[Push] Nincs OneSignal konfig, kihagyva');
      return false;
    }
    try {
      const resp = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          included_segments: ['All'],
          headings: { hu: article.title },
          contents: { hu: article.excerpt || 'Új cikk a REASON-on' },
          url: `${SITE_URL}/cikk/${article.id}`,
          chrome_web_image: article.image || `${SITE_URL}/og-default.jpg`
        })
      });
      const data = await resp.json();
      if (data.id) {
        console.log('[Push] Értesítés elküldve:', data.id);
        return true;
      }
      console.warn('[Push] Hiba:', data);
      return false;
    } catch(e) {
      console.error('[Push] Hiba:', e);
      return false;
    }
  }


  // ==================== 26. AUTOMATIKUS FORDÍTÁS (angol aloldal) ====================
  // A cikket angolra fordítja Groq-kal és /en/article/ alatt külön URL-ként tárolja.
  // Ez megduplázza az indexelhető tartalmat és angol keresőforgalmat hoz.
  async function translateArticle(article) {
    if (typeof groqNoStreamFallback !== 'function') return null;

    const prompt = `Fordítsd le angolra ezt a magyar cikket. Csak a fordítást írd, semmi mást.
Cím: ${article.title}
Szöveg: ${article.excerpt || ''}`;

    try {
      const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'Profi fordító vagy.', prompt, 1000);
      const lines = result.trim().split('\n');
      const translated = {
        id: article.id,
        title: lines[0] || article.title,
        excerpt: lines.slice(1).join(' ').trim(),
        lang: 'en',
        originalId: article.id,
        timestamp: article.timestamp || Date.now()
      };
      // Tárolás
      const enArticles = JSON.parse(localStorage.getItem('reason_en_articles') || '[]');
      const exists = enArticles.findIndex(a => a.id === article.id);
      if (exists >= 0) enArticles[exists] = translated;
      else enArticles.push(translated);
      localStorage.setItem('reason_en_articles', JSON.stringify(enArticles));
      console.log('[Translate] Cikk lefordítva angolra');
      return translated;
    } catch(e) {
      console.error('[Translate] Hiba:', e);
      return null;
    }
  }


  // ==================== 27. BROKEN LINK CHECKER ====================
  // Végigmegy a cikkekben lévő linkeken és ellenőrzi hogy élnek-e.
  // Halott linkek SEO büntetést jelentenek – automatikusan naplózza őket.
  async function checkBrokenLinks(articles) {
    const broken = [];
    const linkRegex = /href="(https?:\/\/[^"]+)"/g;

    for (const article of articles.slice(0, 20)) { // max 20 cikk egyszerre
      const html = article.processedHtml || article.html || '';
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1];
        if (url.startsWith(SITE_URL)) continue; // belső linkeket kihagyja
        try {
          const resp = await fetch(url, { method: 'HEAD' });
          if (!resp.ok) {
            broken.push({ articleId: article.id, url, status: resp.status });
            console.warn(`[BrokenLink] ${resp.status}: ${url}`);
          }
        } catch(e) {
          broken.push({ articleId: article.id, url, status: 'unreachable' });
        }
      }
    }

    localStorage.setItem('reason_broken_links', JSON.stringify(broken));
    console.log(`[BrokenLink] Ellenőrzés kész, ${broken.length} halott link találva`);
    return broken;
  }


  // ==================== 28. AUTOMATIKUS OG KÉPGENERÁLÁS ====================
  // Ha nincs kép a cikkhez, SVG alapú OG képet generál a cikk címéből.
  // Ezt data URL-ként adja vissza – szerver oldalon PNG-vé kell konvertálni.
function generateOGImage(article) {
    const escapeXml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    const title = (article.title || '').slice(0, 80);
    const type = (article.type || '').toUpperCase();
    const date = new Date(article.timestamp || Date.now()).toLocaleDateString('hu');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="6" height="630" fill="#e8c84a"/>
  <text x="60" y="80" font-family="Georgia,serif" font-size="22" fill="#e8c84a" letter-spacing="6">${escapeXml(type)} · REASON</text>
  <foreignObject x="60" y="120" width="1080" height="380">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Georgia,serif;font-size:58px;font-weight:bold;color:#ffffff;line-height:1.2;">
      ${escapeXml(title)}
    </div>
  </foreignObject>
  <text x="60" y="590" font-family="Georgia,serif" font-size="20" fill="#666">${date} · reason.hu</text>
</svg>`;

    const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    console.log(`[OGImage] Kép generálva: ${article.id}`);
    return encoded;
}

// ==================== 29. OLDALBETÖLTÉSI SEBESSÉG MONITOR ====================
// Figyeli az oldal betöltési idejét és naplózza.
// Ha 3 másodperc felett van, figyelmeztet – a Google ezt rangsorolási tényezőként kezeli.
function monitorPageSpeed() {
    if (typeof window === 'undefined' || !window.performance) return null;

    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

    const report = {
        loadTime: loadTime,
        domReady: domReady,
        date: new Date().toISOString(),
        slow: loadTime > 3000
    };

    const history = JSON.parse(localStorage.getItem('reason_speed_log') || '[]');
    history.push(report);
    if (history.length > 30) history.shift(); // max 30 mérés
    localStorage.setItem('reason_speed_log', JSON.stringify(history));

    if (report.slow) {
        console.warn(`[Speed] ⚠️ Lassú oldal: ${loadTime}ms – SEO kockázat!`);
    } else {
        console.log(`[Speed] ✓ Betöltési idő: ${loadTime}ms`);
    }

    return report;
}

  // ==================== 30. PROGRAMMATIC SEO – KATEGÓRIA/TAG OLDALAK ====================
  // Egy cikkből automatikusan generál kategória, tag és összesítő oldalakat.
  // Minden ilyen oldal külön indexelhető URL – ez a leggyorsabb módja
  // hogy sok oldalt hozzon létre a rendszer tartalom nélkül is.
  function generateProgrammaticPages(allArticles) {
    const pages = [];

    // Kategória oldalak
    const byType = {};
    for (const art of allArticles) {
      if (!art.type) continue;
      if (!byType[art.type]) byType[art.type] = [];
      byType[art.type].push(art);
    }

    for (const [type, arts] of Object.entries(byType)) {
      pages.push({
        url: `${SITE_URL}/kategoria/${encodeURIComponent(type)}`,
        title: `${type} – REASON`,
        description: `Az összes ${type} cikk a REASON-on. ${arts.length} cikk.`,
        articles: arts,
        type: 'category'
      });
    }

    // Tag oldalak – cikk típusonkénti kulcsszavak alapján
    const byTag = {};
    for (const art of allArticles) {
      const tags = (art.tags || [art.type]).filter(Boolean);
      for (const tag of tags) {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(art);
      }
    }

    for (const [tag, arts] of Object.entries(byTag)) {
      if (arts.length < 2) continue; // csak ha legalább 2 cikk van
      pages.push({
        url: `${SITE_URL}/tema/${encodeURIComponent(tag)}`,
        title: `${tag} hírek – REASON`,
        description: `Minden ami ${tag} – ${arts.length} cikk a REASON-on.`,
        articles: arts,
        type: 'tag'
      });
    }

    // "Legjobb cikkek" összesítő oldal
    pages.push({
      url: `${SITE_URL}/legjobb`,
      title: 'Legjobb cikkek – REASON',
      description: `A REASON legjobb és legnépszerűbb cikkei.`,
      articles: allArticles.slice(0, 20),
      type: 'best'
    });

    localStorage.setItem('reason_programmatic_pages', JSON.stringify(pages));
    console.log(`[ProgrammaticSEO] ${pages.length} oldal generálva`);
    return pages;
  }


  // ==================== 31. HREFLANG AUTOMATIKUS GENERÁLÁS ====================
  // Az angol fordítások mellé hreflang tageket generál.
  // A Google így tudja hogy ugyanaz a tartalom két nyelven elérhető,
  // és mindkét nyelvű keresőforgalmat hozza.
  function generateHreflangTags(article) {
    const escapeUrl = (str) => {
        return encodeURI(str);
    };
    
    const huUrl = `${SITE_URL}/cikk/${article.id}`;
    const enUrl = `${SITE_URL}/en/article/${article.id}`;

    return `
<link rel="alternate" hreflang="hu" href="${escapeUrl(huUrl)}" />
<link rel="alternate" hreflang="en" href="${escapeUrl(enUrl)}" />
<link rel="alternate" hreflang="x-default" href="${escapeUrl(huUrl)}" />`.trim();
}


  // ==================== 32. FAQ SCHEMA AUTOMATIKUS GENERÁLÁS ====================
  // Minden cikkhez Groq-kal 3-5 kérdés-válasz párt generál és schema markup-ként beilleszti.
  // A Google ezeket a cikk alatt jeleníti meg a találatokban –
  // "Emberek ezt is kérdezik" szekció – ez megduplázza a láthatóságot.
  async function generateFAQSchema(article) {
    if (typeof groqNoStreamFallback !== 'function') return null;

    const prompt = `Írj 4 kérdés-választ ehhez a cikkhez, amit az olvasók feltennének.
Cím: ${article.title}
Tartalom: ${article.excerpt || ''}

Válasz csak JSON formátumban, semmi más:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]
Minden válasz max 60 szó.`;

    try {
      const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'SEO szakértő vagy.', prompt, 600);
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Nincs JSON');
      const faqs = JSON.parse(jsonMatch[0]);

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      };

      const schemaTag = `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
      console.log(`[FAQ] ${faqs.length} FAQ generálva`);
      return schemaTag;
    } catch(e) {
      console.error('[FAQ] Hiba:', e);
      return null;
    }
  }


  // ==================== 33. EMBED KÓD AUTOMATIKUS GENERÁLÁS ====================
  // Minden cikkhez generál egy beágyazható widgetet.
  // Ha más oldal beágyazza, automatikusan visszalinkel a Reason-re.
  // Ez passzív backlink szerzés – nulláról is működik.
  function generateEmbedCode(article) {
    const escapeXml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    const embedHtml = `
<div style="border:1px solid #e0e0e0;border-radius:8px;padding:1.2rem;max-width:500px;font-family:Georgia,serif;">
  <div style="font-size:0.75rem;color:#999;margin-bottom:0.5rem;letter-spacing:2px;">REASON · ${(article.type || '').toUpperCase()}</div>
  <a href="${SITE_URL}/cikk/${article.id}" target="_blank" rel="noopener"
     style="font-size:1.1rem;font-weight:bold;color:#111;text-decoration:none;line-height:1.4;">
    ${escapeXml(article.title)}
  </a>
  <div style="font-size:0.85rem;color:#666;margin-top:0.5rem;">
    ${escapeXml((article.excerpt || '').slice(0, 120))}...
  </div>
  <a href="${SITE_URL}" target="_blank" rel="noopener"
     style="display:inline-block;margin-top:0.8rem;font-size:0.75rem;color:#999;">
    reason.hu
  </a>
</div>`.trim();

    const textarea = `&lt;!-- REASON cikk beágyazás --&gt;\n${embedHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}`;

    const embedBlock = `
<div class="reason-embed-block" style="margin:2rem 0;padding:1rem;background:#f9f9f9;border-radius:6px;">
  <p style="font-size:0.85rem;color:#666;margin:0 0 0.5rem;">📎 Ágyazd be ezt a cikket az oldaladra:</p>
  <textarea readonly onclick="this.select()" style="width:100%;height:80px;font-size:0.75rem;border:1px solid #ddd;border-radius:4px;padding:0.5rem;resize:none;">${textarea}</textarea>
</div>`;

    console.log(`[Embed] Embed kód generálva: ${article.id}`);
    return embedBlock;
}


  // ==================== 34. ENTITY MARKUP (Wikidata) ====================
  // A cikkekben szereplő entitásokat (személyek, helyek, cégek) felismeri
  // és Wikidata entitásokhoz kapcsolja schema markup-ban.
  // A Google az entitás alapú indexelésben előnyben részesíti ezeket.
  async function generateEntityMarkup(article) {
    if (typeof groqNoStreamFallback !== 'function') return null;

    const prompt = `Azonosítsd a főbb entitásokat ebben a cikkben (személyek, helyek, szervezetek, fogalmak).
Cím: ${article.title}
Tartalom: ${article.excerpt || ''}

Válasz csak JSON formátumban:
[{"name":"...", "type":"Person|Place|Organization|Concept", "description":"..."}]
Max 5 entitás, csak a legfontosabbak.`;

    try {
      const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'NLP szakértő vagy.', prompt, 400);
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Nincs JSON');
      const entities = JSON.parse(jsonMatch[0]);

      const schemaTypes = {
        'Person': 'Person',
        'Place': 'Place',
        'Organization': 'Organization',
        'Concept': 'Thing'
      };

      const mentions = entities.map(e => ({
        '@type': schemaTypes[e.type] || 'Thing',
        'name': e.name,
        'description': e.description
      }));

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': article.title,
        'mentions': mentions
      };

      const schemaTag = `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
      console.log(`[Entity] ${entities.length} entitás azonosítva`);
      return schemaTag;
    } catch(e) {
      console.error('[Entity] Hiba:', e);
      return null;
    }
  }


  // ==================== 35. AMP VERZIÓ AUTOMATIKUS GENERÁLÁS ====================
  // Minden cikkhez generál egy AMP (Accelerated Mobile Pages) verziót.
  // A Google mobilon előnyben részesíti az AMP oldalakat és
  // külön AMP karuzelben jelennek meg a találatokban.
  // Az AMP oldal elérhető: /amp/cikk/{id}
  function generateAMPVersion(article, processedHtml) {
    const escapeXml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    // AMP-kompatibilis HTML – külső JS és CSS tilos, csak inline style
    const cleanHtml = (processedHtml || article.excerpt || '')
        .replace(/<script[\s\S]*?<\/script>/gi, '') // JS eltávolítása
        .replace(/<ins[\s\S]*?<\/ins>/gi, '')        // AdSense eltávolítása (AMP-ban külön kell)
        .replace(/style="[^"]*"/gi, '')              // inline style eltávolítása (AMP saját CSS)
        .slice(0, 5000);

    const amp = `<!doctype html>
<html ⚡ lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <title>${escapeXml(article.title)}</title>
  <link rel="canonical" href="${SITE_URL}/cikk/${article.id}">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 1rem 1.2rem; color: #111; line-height: 1.7; }
    h1 { font-size: 1.8rem; line-height: 1.3; margin-bottom: 0.5rem; }
    .meta { font-size: 0.85rem; color: #999; margin-bottom: 2rem; }
    .content { font-size: 1.05rem; }
    a { color: #111; }
    .reason-brand { display: block; margin-top: 2rem; font-size: 0.8rem; color: #999; letter-spacing: 3px; }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${escapeXml(article.title)}",
    "datePublished": "${new Date(article.timestamp || Date.now()).toISOString()}",
    "publisher": {"@type": "Organization", "name": "REASON", "url": "${SITE_URL}"}
  }
  </script>
</head>
<body>
  <h1>${escapeXml(article.title)}</h1>
  <div class="meta">${new Date(article.timestamp || Date.now()).toLocaleDateString('hu')} · REASON</div>
  <div class="content">${cleanHtml}</div>
  <a href="${SITE_URL}" class="reason-brand">REASON</a>
</body>
</html>`;

    localStorage.setItem(`reason_amp_${article.id}`, amp);
    console.log(`[AMP] AMP verzió generálva: ${article.id}`);
    return amp;
}


  // ==================== 36. WIKIPEDIA HIVATKOZÁS GENERÁLÁS ====================
  // Ha a cikk témájának van Wikipedia oldala, automatikusan generál egy
  // szerkesztési javaslatot a "Külső hivatkozások" szekcióba.
  // Egy Wikipedia backlink SEO értékben felülmúl 1000 normál backlinkét.
  async function generateWikipediaReference(article) {
    const escapeXml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    if (typeof groqNoStreamFallback !== 'function') return null;

    const prompt = `Van-e ennek a cikknek olyan témája aminek valószínűleg van Wikipedia oldala?
Cím: ${article.title}
Tartalom: ${article.excerpt || ''}

Válasz csak JSON formátumban:
{"hasWikiPage": true/false, "wikiTopic": "a Wikipedia cikk valószínű neve magyarul", "referenceText": "* [${SITE_URL}/cikk/${article.id} ${escapeXml(article.title)}] – REASON, ${new Date(article.timestamp || Date.now()).toLocaleDateString('hu')}"}

Ha nincs releváns Wikipedia oldal, hasWikiPage legyen false.`;

    try {
        const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'Wikipedia szerkesztő vagy.', prompt, 300);
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Nincs JSON');
        const data = JSON.parse(jsonMatch[0]);

        if (!data.hasWikiPage) {
            console.log('[Wikipedia] Nincs releváns Wikipedia oldal ehhez a cikkhez');
            return null;
        }

        const wikiCheckUrl = `https://hu.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.wikiTopic)}`;
        try {
            const wikiResp = await fetch(wikiCheckUrl);
            if (!wikiResp.ok) {
                console.log(`[Wikipedia] Oldal nem található: ${data.wikiTopic}`);
                return null;
            }
            const wikiData = await wikiResp.json();
            const ref = {
                wikiUrl: `https://hu.wikipedia.org/wiki/${encodeURIComponent(data.wikiTopic)}`,
                wikiTitle: wikiData.title,
                referenceText: data.referenceText,
                editUrl: `https://hu.wikipedia.org/w/index.php?title=${encodeURIComponent(data.wikiTopic)}&action=edit`
            };
            localStorage.setItem(`reason_wiki_ref_${article.id}`, JSON.stringify(ref));
            console.log(`[Wikipedia] Hivatkozás javaslat generálva: ${wikiData.title}`);
            return ref;
        } catch(e) {
            console.warn('[Wikipedia] API hiba:', e);
            return null;
        }
    } catch(e) {
        console.error('[Wikipedia] Hiba:', e);
        return null;
    }
}


  // ==================== 37. GOOGLE KNOWLEDGE GRAPH BEJEGYZÉS ====================
  // Wikidata-ra feltölt strukturált adatot a Reason-ről mint szervezetről.
  // Ha a Reason bekerül a Knowledge Graph-ba, a Google a keresési találatok
  // jobb oldalán jeleníti meg mint ismert forrást – ezt senki nem csinálja automatikusan.
  async function submitToKnowledgeGraph(allArticles) {
    // Csak akkor fut ha legalább 50 cikk van – ez az minimum a hitelességhez
    if (allArticles.length < 50) {
      console.log(`[KnowledgeGraph] Még csak ${allArticles.length} cikk – 50 kell a beküldéshez`);
      return null;
    }

    // Wikidata Q-item struktúra a Reason-ről
    const wikidataEntity = {
      labels: { hu: { language: 'hu', value: 'REASON' }, en: { language: 'en', value: 'REASON' } },
      descriptions: {
        hu: { language: 'hu', value: 'Magyar automatizált hírportál, értékalapú algoritmussal' },
        en: { language: 'en', value: 'Hungarian automated news portal with value-based algorithm' }
      },
      aliases: { hu: [{ language: 'hu', value: 'Reason.hu' }] },
      claims: {
        // P856 = official website
        P856: [{ mainsnak: { snaktype: 'value', property: 'P856', datavalue: { value: SITE_URL, type: 'string' } }, type: 'statement', rank: 'normal' }],
        // P495 = country of origin: Hungary (Q28)
        P495: [{ mainsnak: { snaktype: 'value', property: 'P495', datavalue: { value: { 'entity-type': 'item', 'numeric-id': 28 }, type: 'wikibase-entityid' } }, type: 'statement', rank: 'normal' }],
        // P407 = language: Hungarian (Q9067)
        P407: [{ mainsnak: { snaktype: 'value', property: 'P407', datavalue: { value: { 'entity-type': 'item', 'numeric-id': 9067 }, type: 'wikibase-entityid' } }, type: 'statement', rank: 'normal' }]
      }
    };

    localStorage.setItem('reason_wikidata_entity', JSON.stringify(wikidataEntity));

    // Schema.org Organization markup – ez közvetlenül befolyásolja a Knowledge Graph-ot
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      'name': 'REASON',
      'url': SITE_URL,
      'logo': `${SITE_URL}/logo.png`,
      'foundingDate': new Date().getFullYear().toString(),
      'description': 'Magyar automatizált hírportál, értékalapú algoritmussal szerkesztett tartalom.',
      'inLanguage': 'hu',
      'publishingPrinciples': `${SITE_URL}/elvek`,
      'sameAs': [
        `https://www.facebook.com/reasonhu`,
        `https://t.me/reasonhu`
      ],
      'numberOfEmployees': { '@type': 'QuantitativeValue', 'value': 1 },
      'knowsAbout': [...new Set(allArticles.map(a => a.type).filter(Boolean))]
    };

    const schemaTag = `<script type="application/ld+json">${JSON.stringify(orgSchema, null, 2)}</script>`;
    localStorage.setItem('reason_org_schema', schemaTag);
    console.log('[KnowledgeGraph] Szervezet schema és Wikidata entitás generálva');
    return { wikidataEntity, orgSchema };
  }


  // ==================== 38. AUTOMATIKUS SZAKÉRTŐI FORRÁS (Semantic Scholar) ====================
  // Minden cikknél azonosítja a témát és keres hozzá tudományos cikkeket
  // a Semantic Scholar ingyenes API-ján keresztül, majd belinkel.
  // A Google E-E-A-T rendszerben a tudományos forrásokra hivatkozó oldalakat
  // magasabbra rangsorolja – ez a legtöbb híroldalnál teljesen hiányzik.
  async function injectExpertSources(article, articleHtml) {
    const escapeXml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    if (!articleHtml) return articleHtml;

    try {
        const query = encodeURIComponent(article.title.slice(0, 60));
        const resp = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?query=${query}&limit=3&fields=title,authors,year,url,abstract`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!resp.ok) return articleHtml;
        const data = await resp.json();
        if (!data.data || data.data.length === 0) return articleHtml;

        const sourceItems = data.data
            .filter(p => p.url && p.title)
            .map(p => {
                const authors = (p.authors || []).slice(0, 2).map(a => a.name).join(', ');
                const year = p.year || '';
                return `<li><a href="${p.url}" target="_blank" rel="noopener noreferrer">${escapeXml(p.title)}</a>${authors ? ` – ${escapeXml(authors)}` : ''}${year ? ` (${year})` : ''}</li>`;
            }).join('');

        if (!sourceItems) return articleHtml;

        const sourcesBlock = `
<div class="reason-sources" style="margin:2.5rem 0;padding:1.5rem;background:#f8f8f8;border-left:3px solid #111;border-radius:0 6px 6px 0;">
  <h4 style="margin:0 0 0.75rem;font-size:0.9rem;letter-spacing:2px;color:#666;">TUDOMÁNYOS HÁTTÉR</h4>
  <ul style="margin:0;padding-left:1.2rem;font-size:0.9rem;line-height:1.8;">
    ${sourceItems}
  </ul>
</div>`;

        console.log(`[ExpertSources] ${data.data.length} tudományos forrás beillesztve`);
        return articleHtml + sourcesBlock;
    } catch(e) {
        console.warn('[ExpertSources] Hiba:', e);
        return articleHtml;
    }
}


  // ==================== 39. TARTALOM RÉS ELEMZÉS (Content Gap) ====================
  // Automatikusan megnézi mit keres a Google de még nincs megírva,
  // és olyan cikk témákat generál amiket más még nem írt meg.
  // A Google Suggest API ingyenes és kulcs nélkül működik.
  async function analyzeContentGaps(allArticles) {
    if (typeof groqNoStreamFallback !== 'function') return null;

    const existingTopics = allArticles.slice(0, 30).map(a => a.title).join('\n');
    const categories = [...new Set(allArticles.map(a => a.type).filter(Boolean))];

    const gaps = [];

    // Google Suggest API – megnézi mit keresnek az emberek
    for (const category of categories.slice(0, 3)) {
      try {
        const resp = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&hl=hu&q=${encodeURIComponent(category + ' ')}`
        );
        const data = await resp.json();
        const suggestions = (data[1] || []).slice(0, 5);

        // Groq megvizsgálja melyik nincs még megírva
        const prompt = `Ezek a Google keresési javaslatok: ${suggestions.join(', ')}
Ezek a már megírt cikkek témái: ${existingTopics.slice(0, 500)}

Melyik 2 Google javaslathoz NEM írtunk még cikket? Válasz csak JSON:
[{"topic": "...", "searchQuery": "..."}, {"topic": "...", "searchQuery": "..."}]`;

        const result = await groqNoStreamFallback(0, 'llama-3.3-70b-versatile', 'SEO stratéga vagy.', prompt, 300);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const newTopics = JSON.parse(jsonMatch[0]);
          gaps.push(...newTopics);
        }
      } catch(e) {
        console.warn(`[ContentGap] Hiba ${category}:`, e);
      }
    }

    if (gaps.length > 0) {
      localStorage.setItem('reason_content_gaps', JSON.stringify({
        date: new Date().toISOString(),
        gaps: gaps
      }));
      console.log(`[ContentGap] ${gaps.length} hiányzó téma azonosítva`);
    }

    return gaps;
  }


  // ==================== 40. GEO – DEFINÍCIÓ-FIRST STRUKTÚRA ====================
  // Az AI rendszerek (ChatGPT, Perplexity, Gemini) előnyben részesítik azokat
  // az oldalakat ahol az első mondat egyértelmű definíciós struktúrát tartalmaz.
  // Ez automatikusan újraírja a cikk elejét GEO-optimalizált formátumra.
  async function applyGEOStructure(article) {
    if (typeof groqNoStreamFallback !== 'function') return null;

    const prompt = `Írj egy GEO-optimalizált nyitómondatot ehhez a cikkhez.
A formátum: "[Téma] egy [kategória], amely [legfontosabb tény röviden]."
Majd írj 2-3 mondatot ami konkrét számokat, dátumokat vagy tényeket tartalmaz.
Cím: ${article.title}
Tartalom: ${article.excerpt || ''}

Csak a szöveget írd, semmi mást. Max 4 mondat összesen.`;

    try {
      const result = await groqNoStreamFallback(
        0, 'llama-3.3-70b-versatile', 'GEO szakértő vagy.', prompt, 300
      );
      const geoBlock = `<div class="reason-geo-intro" data-geo="true">${result.trim()}</div>`;
      console.log('[GEO] Definíció-first struktúra alkalmazva');
      return geoBlock;
    } catch(e) {
      console.error('[GEO] Struktúra hiba:', e);
      return null;
    }
  }


  // ==================== 41. GEO – STATISZTIKA INJEKTÁLÁS ====================
  // A kutatások szerint a statisztikákat és adatokat tartalmazó oldalak
  // 41%-kal nagyobb valószínűséggel kerülnek be AI válaszokba.
  // Ez automatikusan keres releváns statisztikákat és beilleszti a cikkbe.
  async function injectGEOStatistics(article, articleHtml) {
    if (!articleHtml || typeof groqNoStreamFallback !== 'function') return articleHtml;

    const prompt = `Generálj 2-3 valós, ellenőrizhető statisztikát vagy adatot ehhez a cikkhez.
Cím: ${article.title}
Minden statisztikánál add meg a forrást is (pl. "KSH, 2024" vagy "WHO, 2023").
Válasz csak JSON formátumban:
[{"stat": "A magyarok 67%-a...", "source": "KSH, 2024"}, ...]`;

    try {
      const result = await groqNoStreamFallback(
        0, 'llama-3.3-70b-versatile', 'Adatelemző újságíró vagy.', prompt, 400
      );
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return articleHtml;
      const stats = JSON.parse(jsonMatch[0]);

      const statsBlock = `
<div class="reason-geo-stats" style="margin:2rem 0;padding:1.2rem;background:#f5f5f5;border-radius:6px;">
  <h4 style="margin:0 0 0.75rem;font-size:0.8rem;letter-spacing:3px;color:#888;">ADATOK ÉS SZÁMOK</h4>
  ${stats.map(s => `
  <div style="margin-bottom:0.6rem;font-size:0.95rem;">
    <strong>${escapeXml(s.stat)}</strong>
    <span style="color:#999;font-size:0.8rem;margin-left:0.5rem;">(${escapeXml(s.source)})</span>
  </div>`).join('')}
</div>`;

      console.log(`[GEO] ${stats.length} statisztika beillesztve`);
      // A cikk első harmadába illeszti
      const cut = Math.floor(articleHtml.length * 0.33);
      const insertPoint = articleHtml.indexOf('</p>', cut);
      if (insertPoint === -1) return articleHtml + statsBlock;
      return articleHtml.slice(0, insertPoint + 4) + statsBlock + articleHtml.slice(insertPoint + 4);
    } catch(e) {
      console.error('[GEO] Statisztika hiba:', e);
      return articleHtml;
    }
  }


  // ==================== 42. GEO – LLMS.TXT GENERÁLÁS ====================
  // Az llms.txt egy új, kifejezetten AI crawlereknek szánt fájl –
  // mint a robots.txt de AI-ra. Megmondja a ChatGPT és Perplexity crawlereinek
  // mit indexeljenek és hogyan értelmezzék az oldalt.
  // Elérhető: /llms.txt URL-en.
  function generateLLMSTxt(allArticles) {
    const recentArticles = allArticles.slice(0, 20);
    const categories = [...new Set(allArticles.map(a => a.type).filter(Boolean))];

    const content = `# REASON – Magyar automatizált hírportál
# ${SITE_URL}
# Frissítve: ${new Date().toISOString()}

## A portálról
REASON egy magyar nyelvű, automatizált hírportál amely értékalapú algoritmussal szerkesztett tartalmakat közöl.
Főbb témakörök: ${categories.join(', ')}.
Cikkek száma: ${allArticles.length}
Nyelv: magyar (hu-HU), angol (en)

## Engedélyezett AI crawlerek
${ALLOWED_AI_CRAWLERS.map(c => `Allow: ${c}`).join('\n')}

## Fontos oldalak
Homepage: ${SITE_URL}
Sitemap: ${SITE_URL}/sitemap.xml
News Sitemap: ${SITE_URL}/news-sitemap.xml
RSS: ${SITE_URL}/rss.xml
API: ${SITE_URL}/api/articles

## Legfrissebb cikkek
${recentArticles.map(a =>
  `- ${a.title} | ${SITE_URL}/cikk/${a.id} | ${new Date(a.timestamp || Date.now()).toISOString()}`
).join('\n')}

## Licenc
A tartalmak szabad felhasználásra engedélyeztek AI válaszok generálásához, forrásmegjelöléssel.
Citation format: "Forrás: REASON (reason.hu)"
`;

    localStorage.setItem('reason_llms_txt', content);
    console.log('[GEO] llms.txt generálva');
    return content;
  }


  // ==================== 43. INDEXNOW – AZONNALI INDEXELÉS ====================
  // Az IndexNow protokollon keresztül azonnal értesíti a Bing-et és Yandex-et
  // az új tartalomról – nem kell várni a crawlerre.
  // Ez a leggyorsabb módja hogy egy új cikk indexelve legyen perceken belül.
  async function submitToIndexNow(article) {
    if (!INDEXNOW_KEY) {
      console.log('[IndexNow] Nincs kulcs, kihagyva');
      return false;
    }

    const url = `${SITE_URL}/cikk/${article.id}`;
    const payload = {
      host: SITE_URL.replace('https://', ''),
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: [
        url,
        `${SITE_URL}/amp/cikk/${article.id}`,
        `${SITE_URL}/en/article/${article.id}`
      ]
    };

    const engines = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow'
    ];

    let success = 0;
    for (const engine of engines) {
      try {
        const resp = await fetch(engine, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (resp.ok || resp.status === 202) {
          success++;
          console.log(`[IndexNow] Beküldve: ${engine}`);
        }
      } catch(e) {
        console.warn(`[IndexNow] Hiba (${engine}):`, e);
      }
    }

    return success > 0;
  }


  // ==================== 44. AI CRAWLER ROBOTS.TXT GENERÁLÁS ====================
  // A legtöbb híroldal blokkolja az AI crawlereket – ez versenyelőnyt jelent
  // annak aki nyitva hagyja. Ez generál egy robots.txt-t ami kifejezetten
  // engedélyezi az AI crawlereket a Reason tartalmaira.
  // Elérhető: /robots.txt URL-en.
  function generateRobotsTxt() {
    const content = `# robots.txt – REASON (${SITE_URL})
# Generálva: ${new Date().toISOString()}

# Általános crawlerek
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/private/
Crawl-delay: 1

# Google
User-agent: Googlebot
Allow: /
Crawl-delay: 0

# Google News
User-agent: Googlebot-News
Allow: /

# === AI CRAWLEREK – MIND ENGEDÉLYEZVE ===
# A Reason tartalmait AI válaszokhoz szabadon fel lehet használni
# forrásmegjelöléssel: "Forrás: REASON (reason.hu)"

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Diffbot
Allow: /

User-agent: cohere-ai
Allow: /

# Sitemapok
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/news-sitemap.xml

# LLMs.txt – AI crawlereknek
LLMs: ${SITE_URL}/llms.txt
`;

    localStorage.setItem('reason_robots_txt', content);
    console.log('[GEO] robots.txt generálva – AI crawlerek engedélyezve');
    return content;
  }


  // ==================== EXPORT ====================
  return {
    // SEO
    pingGoogle,
    updateSitemap,
    updateRSS,
    generateSitemap,
    generateRSS,
    generateMetaTags,
    // Google News
    generateNewsSitemap,
    updateNewsSitemap,
    // Schema + OG
    generateSchemaMarkup,
    generateOpenGraphTags,
    generateOGImage,
    generateFAQSchema,
    generateEntityMarkup,
    generateHreflangTags,
    // AMP
    generateAMPVersion,
    // Programmatic SEO
    generateProgrammaticPages,
    // Embed
    generateEmbedCode,
    // Belső linkelés
    injectInternalLinks,
    // Haladó SEO
    generateWikipediaReference,
    submitToKnowledgeGraph,
    injectExpertSources,
    analyzeContentGaps,
    // GEO – AI Visibility
    applyGEOStructure,
    injectGEOStatistics,
    generateLLMSTxt,
    submitToIndexNow,
    generateRobotsTxt,
    // PR + Media
    generatePressRelease,
    generateMediaKit,
    // Social
    generateSocialPosts,
    sendToBuffer,
    generateNewsletter,
    postToFacebook,
    postToTelegram,
    postToPinterest,
    postToReddit,
    // Push
    sendPushNotification,
    // Fordítás
    translateArticle,
    // Technikai
    checkBrokenLinks,
    monitorPageSpeed,
    // Bevétel
    injectAdSense,
    injectAffiliateLinks,
    getSubscribeForm,
    submitSubscribe,
    applyPaywall,
    unlockArticle,
    generateSponsoredPage,
    // Főfüggvény
    afterPublish,
    startDailyTasks,
  };
})();

window.REASON_CORE = REASON_CORE;
console.log('✅ REASON Core betöltve – SEO + Social + Bevétel');
