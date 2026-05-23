import { readFileSync } from 'fs';
import { join } from 'path';

function isBot(ua) {
  return /googlebot|bingbot|facebookexternalhit|twitterbot/i.test(ua || '');
}

export default async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  
  if (!isBot(ua)) {
    // Normál látogató – index.html kiszolgálása
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }
  
  // Bot – SSR tartalom...
}
