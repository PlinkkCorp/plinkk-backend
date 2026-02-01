import http from 'http';
import https from 'https';

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
  });
}

async function check(base, slug) {
  const results = [];
  const urls = [
    `${base}/${slug}?preview=1`,
    `${base}/${slug}/js/init.js`,
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u);
      results.push({ url: u, status: r.status, length: r.body.length });
    } catch (e) {
      results.push({ url: u, error: String(e) });
    }
  }
  return results;
}

async function main() {
  const base = process.argv[2] || 'http://127.0.0.1:3001';
  const slugs = process.argv.slice(3);
  if (slugs.length === 0) slugs.push('klaynight', 'grgrg');
  for (const s of slugs) {
    console.log(`Checking slug: ${s}`);
    const r = await check(base, s);
    for (const e of r) console.log(e);
    console.log('---');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
