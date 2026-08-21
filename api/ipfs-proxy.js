const IPFS_CID = 'bafybeidm3sremjulcdqefulerybnjqtzcf2o3vvyu5ayg35lbthmhxs5hi';
const IPFS_GATEWAYS = [
  `https://w3s.link/ipfs/${IPFS_CID}`,
  `https://nftstorage.link/ipfs/${IPFS_CID}`,
  `https://ipfs.io/ipfs/${IPFS_CID}`,
  `https://${IPFS_CID}.ipfs.dweb.link`,
];

async function fetchFromGateway(base, file) {
  const upstream = await fetch(`${base}/${file}`, {
    headers: { Accept: 'image/png,application/octet-stream,*/*' },
  });
  if (!upstream.ok) {
    throw new Error(`${base} -> ${upstream.status}`);
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  if (!buf.length || buf[0] !== 0x89) {
    throw new Error(`${base} -> not a png`);
  }
  return buf;
}

module.exports = async function handler(req, res) {
  const file = String((req.query && req.query.file) || '');
  if (!/^\d+\.png$/i.test(file)) {
    res.statusCode = 400;
    res.end('Bad request');
    return;
  }

  const errors = [];
  for (const base of IPFS_GATEWAYS) {
    try {
      const buf = await fetchFromGateway(base, file);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.setHeader('X-IPFS-Gateway', base);
      res.statusCode = 200;
      res.end(buf);
      return;
    } catch (e) {
      errors.push(String(e && e.message ? e.message : e));
    }
  }

  res.statusCode = 502;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(`IPFS proxy failed\n${errors.join('\n')}`);
};
