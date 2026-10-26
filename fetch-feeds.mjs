// يجلب جديد القنوات من تغذيات RSS العامة ويحدّث inbox.json
// يعمل على GitHub Actions (Node 18+) بلا أي مكتبات خارجية.
import { readFile, writeFile } from 'node:fs/promises';

const BASE = process.env.YT_BASE || 'https://www.youtube.com';
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS || 30);
const CONCURRENCY = Number(process.env.CONCURRENCY || 3);
const GAP_MS = Number(process.env.GAP_MS || 250);
const UA = 'ittisaq-feed-reader/1.0 (personal curation; +https://github.com/irtikaz2020/ittisaq)';
const UC = /^UC[\w-]{22}$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = async (f, d) => { try { return JSON.parse(await readFile(f, 'utf8')); } catch { return d; } };

async function get(url, tries = 2) {
  let last;
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 20000);
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' }, signal: ac.signal });
      clearTimeout(t);
      if (r.ok) return await r.text();
      last = new Error('HTTP ' + r.status);
      if (r.status !== 429 && r.status < 500) break;
    } catch (e) { clearTimeout(t); last = e; }
    await sleep(2000 * (i + 1));
  }
  throw last;
}

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');
const tag = (xml, name) => { const m = xml.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>')); return m ? decode(m[1].trim()) : ''; };

export function parseFeed(xml) {
  const head = xml.split('<entry>')[0];
  const author = tag(head, 'name');
  const items = [];
  for (const chunk of xml.split('<entry>').slice(1)) {
    const id = tag(chunk, 'yt:videoId');
    if (!/^[\w-]{11}$/.test(id)) continue;
    items.push({
      id,
      title: tag(chunk, 'title'),
      published: tag(chunk, 'published'),
      desc: tag(chunk, 'media:description').slice(0, 500)
    });
  }
  return { name: tag(head, 'title') || author, items };
}

// يحوّل مدخلاً مثل @handle أو رابط قناة إلى معرّف UC...
// v2: نعتمد على بيانات الصفحة الخاصة بها (canonical / رابط RSS / itemprop) لا على أول معرّف يظهر في الصفحة
const RV = 2;
function pageChannelId(html) {
  const pats = [
    /<link[^>]+rel="canonical"[^>]+href="https?:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/,
    /<link[^>]+href="https?:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=(UC[\w-]{22})"/,
    /<meta[^>]+itemprop="(?:channelId|identifier)"[^>]+content="(UC[\w-]{22})"/,
    /"channelMetadataRenderer":\{[^}]*?"externalId":"(UC[\w-]{22})"/,
    /"browseId":"(UC[\w-]{22})","canonicalBaseUrl":"\/@/
  ];
  for (const re of pats) { const m = html.match(re); if (m) return m[1]; }
  return '';
}
async function resolveKey(key) {
  if (UC.test(key)) return { id: key, v: RV };
  let url = key;
  if (/^@/.test(key)) url = `${BASE}/${key}`;
  else if (!/^https?:/.test(key)) url = `${BASE}/@${key}`;
  const html = await get(url);
  let id = pageChannelId(html);
  let loose = false;
  if (!id) {
    const m = html.match(/"(?:channelId|externalId)":"(UC[\w-]{22})"/) || html.match(/channel\/(UC[\w-]{22})/);
    if (!m) throw new Error('لم أجد معرّف القناة في الصفحة');
    id = m[1]; loose = true;
  }
  const h = html.match(/"canonicalBaseUrl":"\/(@[^"]+)"/);
  const handle = h ? decodeURIComponent(h[1]) : '';
  const typed = /^@/.test(key) ? key : (key.match(/youtube\.com\/(@[^/?#]+)/) || [])[1] || '';
  const r = { id, handle, v: RV };
  if (loose) r.loose = 1;
  if (typed && handle && typed.toLowerCase() !== handle.toLowerCase()) r.mismatch = 1;
  return r;
}

// يجلب الـhandle لقناة معروفة بمعرّفها فقط (من صفحتها)
async function findHandle(id) {
  const html = await get(`${BASE}/channel/${id}`);
  const h = html.match(/"canonicalBaseUrl":"\/(@[^"]+)"/);
  return h ? decodeURIComponent(h[1]) : '';
}

async function pool(list, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < list.length) { const x = list[i++]; await fn(x); await sleep(GAP_MS); }
  }));
}

const now = Date.now();
const cutoff = now - RETENTION_DAYS * 86400000;
const channels = (await readJson('channels.json', { channels: [] })).channels || [];
const old = await readJson('inbox.json', {});
const resolved = { ...(old.resolved || {}) };
const chmeta = {};
const bucket = new Map((old.items || []).map((it) => [it.id, it]));
const unresolved = {};

// 1) حلّ المفاتيح
const keys = [...new Set(channels.map((c) => c.k).filter(Boolean))];
await pool(keys.filter((k) => !UC.test(k) && (!resolved[k] || resolved[k].v !== RV)), CONCURRENCY, async (k) => {
  try { resolved[k] = await resolveKey(k); } catch (e) { unresolved[k] = String(e.message || e); }
});
for (const k of Object.keys(resolved)) if (!keys.includes(k)) delete resolved[k];

// 2) اجلب التغذيات
const ids = [...new Set(keys.map((k) => (UC.test(k) ? k : resolved[k]?.id)).filter(Boolean))];
await pool(ids, CONCURRENCY, async (id) => {
  try {
    const feed = parseFeed(await get(`${BASE}/feeds/videos.xml?channel_id=${id}`));
    chmeta[id] = { name: feed.name, ok: now, handle: old.chmeta?.[id]?.handle || '' };
    for (const it of feed.items) {
      const prev = bucket.get(it.id);
      bucket.set(it.id, { id: it.id, ch: id, title: it.title, published: it.published, desc: it.desc, fetched: prev?.fetched || new Date(now).toISOString() });
    }
  } catch (e) {
    chmeta[id] = { name: old.chmeta?.[id]?.name || '', handle: old.chmeta?.[id]?.handle || '', err: String(e.message || e), at: now };
  }
});

// 2b) أسماء المستخدمين (@handle): من حلّ الروابط إن وُجد، وإلا بجلب صفحة القناة (حدّ أقصى لكل تشغيل كي لا نُكثر الطلبات)
for (const k of Object.keys(resolved)) { const r = resolved[k]; if (r.handle && chmeta[r.id] && !chmeta[r.id].handle) chmeta[r.id].handle = r.handle; }
const HANDLE_CAP = Number(process.env.HANDLE_CAP || 40);
const needH = ids.filter((id) => chmeta[id] && !chmeta[id].handle && !chmeta[id].noHandle).slice(0, HANDLE_CAP);
await pool(needH, CONCURRENCY, async (id) => {
  try { const h = await findHandle(id); if (h) chmeta[id].handle = h; else chmeta[id].noHandle = 1; } catch (e) { /* يُعاد المحاولة في التشغيل القادم */ }
});
for (const id of ids) if (chmeta[id] && !chmeta[id].handle && old.chmeta?.[id]?.noHandle) chmeta[id].noHandle = 1;

// 3) نظّف: أبقِ ما نُشر خلال المدة الأخيرة ولقنوات ما زالت في القائمة
const idSet = new Set(ids);
const items = [...bucket.values()]
  .filter((it) => idSet.has(it.ch) && Date.parse(it.published) >= cutoff)
  .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));

const failed = Object.values(chmeta).filter((m) => m.err).length;
const out = {
  version: 1,
  updated: new Date(now).toISOString(),
  retentionDays: RETENTION_DAYS,
  stats: { channels: ids.length, failed, items: items.length },
  resolved, unresolved, chmeta, items
};
await writeFile('inbox.json', JSON.stringify(out));
console.log(`channels=${ids.length} failed=${failed} items=${items.length} unresolved=${Object.keys(unresolved).length}`);
