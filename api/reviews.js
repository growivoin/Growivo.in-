const { put, list, del } = require('@vercel/blob');
const crypto = require('crypto');
const P = 'reviews/';
const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const body = (req) => { try { return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch (e) { return {}; } };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: P, limit: 200 });
      const items = await Promise.all(blobs.map((b) => fetch(b.url + '?t=' + Date.now()).then((r) => r.json()).catch(() => null)));
      const reviews = items.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json({ reviews });
    }
    if (req.method === 'POST') {
      const b = body(req);
      if (b.website) return res.status(200).json({ ok: true });
      if (Date.now() - Number(b.t || 0) < 3000) return res.status(400).json({ error: 'Please take a moment to write your review, then send it again.' });
      const name = clean(b.name, 60), text = clean(b.text, 1000), rating = Math.round(Number(b.rating));
      if (!name || text.length < 5 || !(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Please add your name, a star rating and your review.' });
      const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0];
      const h = crypto.createHash('sha256').update(ip + (process.env.ADMIN_KEY || '')).digest('hex').slice(0, 10);
      const { blobs } = await list({ prefix: P, limit: 500 });
      const recent = blobs.filter((x) => x.pathname.includes('-' + h + '-') && Date.now() - new Date(x.uploadedAt).getTime() < 600000);
      if (recent.length >= 2) return res.status(429).json({ error: 'Too many reviews from this device. Please try again later.' });
      if (blobs.length >= 500) return res.status(503).json({ error: 'Reviews are temporarily closed.' });
      const createdAt = Date.now();
      const id = createdAt + '-' + h + '-' + crypto.randomBytes(3).toString('hex');
      const review = { id, name, brand: clean(b.brand, 80), country: clean(b.country, 60), rating, text, createdAt };
      await put(P + id + '.json', JSON.stringify(review), { access: 'public', contentType: 'application/json' });
      return res.status(201).json({ review });
    }
    if (req.method === 'DELETE') {
      const key = String(req.headers['x-admin-key'] || '');
      const real = String(process.env.ADMIN_KEY || '');
      const ok = real && key.length === real.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(real));
      if (!ok) return res.status(401).json({ error: 'Wrong admin key.' });
      const id = String(body(req).id || '').replace(/[^a-zA-Z0-9-]/g, '');
      if (!id) return res.status(400).json({ error: 'Missing review id.' });
      const { blobs } = await list({ prefix: P + id + '.json' });
      if (blobs.length) await del(blobs.map((x) => x.url));
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
