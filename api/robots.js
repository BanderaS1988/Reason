const SITE = 'https://reason-five.vercel.app';

module.exports = (req, res) => {
  const txt = `# robots.txt – REASON (${SITE})
User-agent: *
Allow: /
Disallow: /admin/
Crawl-delay: 1
User-agent: Googlebot
Allow: /
Crawl-delay: 0
User-agent: Googlebot-News
Allow: /
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
Sitemap: ${SITE}/api/sitemap
Sitemap: ${SITE}/api/news-sitemap
`;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 's-maxage=86400');
  res.send(txt);
};
