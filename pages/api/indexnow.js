export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body || {};
  const targetUrl = url || 'https://reason-five.vercel.app';

  try {
    const response = await fetch(
      `https://www.bing.com/indexnow?url=${encodeURIComponent(targetUrl)}&key=reason2025xyz`
    );
    return res.status(200).json({ ok: true, status: response.status });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
