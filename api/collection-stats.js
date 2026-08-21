const KOINU = 100000000;
const COLLECTIONS = ['crudeboys', 'cruno', 'cups'];

async function fetchJson(url, timeoutMs) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function toDoge(koinu) {
  const n = Number(koinu);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n / KOINU;
}

function toCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

async function fetchDogeUsd() {
  try {
    const json = await fetchJson(
      'https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd',
      8000
    );
    const price = Number(json && json.dogecoin && json.dogecoin.usd);
    if (price > 0) return price;
  } catch (e) {
    /* try coinbase */
  }

  const json = await fetchJson('https://api.coinbase.com/v2/prices/DOGE-USD/spot', 8000);
  const price = Number(json && json.data && json.data.amount);
  if (price > 0) return price;
  throw new Error('DOGE price unavailable');
}

async function fetchCollectionStats(slug) {
  const json = await fetchJson(`https://api.doggy.market/nfts/${slug}`, 10000);
  const volumeDoge = toDoge(json && json.volume);
  const floorDoge = toDoge(json && json.floorPrice);
  return {
    volumeDoge,
    floorDoge,
    listed: toCount(json && json.listed),
    owners: toCount(json && json.owners),
    supply: toCount(json && json.supply),
    sales: toCount(json && json.trades),
  };
}

function send(res, status, body, cacheSeconds) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (cacheSeconds) {
    res.setHeader(
      'Cache-Control',
      `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
    );
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const [priceUsd, rows] = await Promise.all([
      fetchDogeUsd(),
      Promise.all(COLLECTIONS.map((slug) => fetchCollectionStats(slug))),
    ]);

    const collections = {};
    COLLECTIONS.forEach((slug, index) => {
      const row = rows[index];
      collections[slug] = {
        ...row,
        volumeUsd: row.volumeDoge * priceUsd,
        floorUsd: row.floorDoge * priceUsd,
      };
    });

    send(
      res,
      200,
      {
        priceUsd,
        collections,
      },
      60
    );
  } catch (err) {
    send(res, 502, { error: err && err.message ? err.message : 'stats failed' });
  }
};
