const SB_URL  = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE    = 'https://reason-five.vercel.app';
const IK      = 'reason2025xyz';  // IndexNow kulcs

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body || {};

  try {
    let urls = [];

    if (url) {
      // Egyetlen URL – pl. új cikk publikálásakor
      urls = [url];
    } else {
      // Tömeges – összes cikk lekérése Supabase-ből
      let offset = 0;
      const limit = 1000;
      while (true) {
        const r = await fetch(
          `${SB_URL}/rest/v1/articles?select=id&order=created_at.desc&limit=${limit}&offset=${offset}`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
        );
        const data = await r.json();
        if (!data || !data.length) break;
        urls.push(...data.map(a => `${SITE}/cikk/${a.id}`));
        if (data.length < limit) break;
        offset += limit;
      }
      // Főoldal is
      urls.unshift(SITE + '/');
    }

    if (!urls.length) {
      return res.status(200).json({ ok: true, sent: 0, message: 'Nincs URL' });
    }

    // Bing IndexNow tömeges küldés (max 10 000 URL / kérés)
    const chunks = [];
    for (let i = 0; i < urls.length; i += 10000) {
      chunks.push(urls.slice(i, i + 10000));
    }

    const results = [];
    for (const chunk of chunks) {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host:    'reason-five.vercel.app',
          key:     IK,
          keyLocation: `${SITE}/${IK}.txt`,
          urlList: chunk
        })const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';
const SITE = 'https://reason-five.vercel.app';
const IK = 'reason2025xyz';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { url } = req.body || {};
  try {
    let urls = [];
    if (url) {
      urls = [url];
    } else {
      let offset = 0;
      const limit = 1000;
      while (true) {
        const r = await fetch(
          `${SB_URL}/rest/v1/articles?select=id&order=created_at.desc&limit=${limit}&offset=${offset}`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
        );
        const data = await r.json();
        if (!data || !data.length) break;
        urls.push(...data.map(a => `${SITE}/cikk/${a.id}`));
        if (data.length < limit) break;
        offset += limit;
      }
      urls.unshift(SITE + '/');
    }
    if (!urls.length) {
      return res.status(200).json({ ok: true, sent: 0, message: 'Nincs URL' });
    }
    const chunks = [];
    for (let i = 0; i < urls.length; i += 10000) {
      chunks.push(urls.slice(i, i + 10000));
    }
    const results = [];
    for (const chunk of chunks) {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'reason-five.vercel.app',
          key: IK,
          keyLocation: `${SITE}/${IK}.txt`,
          urlList: chunk,
        }),
      });
      results.push({ status: r.status, count: chunk.length });
    }
    return res.status(200).json({
      ok: true,
      sent: urls.length,
      chunks: results,
      message: `${urls.length} URL elküldve Bingnek`,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
      });
      results.push({ status: r.status, count: chunk.length });
    }

    return res.status(200).json({
      ok:      true,
      sent:    urls.length,
      chunks:  results,
      message: `${urls.length} URL elküldve Bingnek`
    });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
