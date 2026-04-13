const SB_URL = 'https://kqugolmndqonbnjetdyi.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdvbG1uZHFvbmJuamV0ZHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTM3NjMsImV4cCI6MjA4ODI2OTc2M30.wGEBEJDPUKsUPu9W5vxvH7Do0wX9U3FdgKzEzny_zBg';

const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const getR = await fetch(
      `${SB_URL}/rest/v1/articles?id=eq.${id}&select=like_count&limit=1`,
      { headers: SB_HEADERS }
    );
    const getData = await getR.json();
    const current = getData?.[0]?.like_count ?? 0;

    const patchR = await fetch(`${SB_URL}/rest/v1/articles?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...SB_HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({ like_count: current + 1 }),
    });

    if (!patchR.ok) throw new Error('patch_failed');

    return res.status(200).json({ like_count: current + 1 });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
