const IPFS_CID = 'bafybeidm3sremjulcdqefulerybnjqtzcf2o3vvyu5ayg35lbthmhxs5hi';
const IPFS_GATEWAYS = [
  `https://w3s.link/ipfs/${IPFS_CID}`,
  `https://nftstorage.link/ipfs/${IPFS_CID}`,
  `https://${IPFS_CID}.ipfs.dweb.link`,
  `https://ipfs.io/ipfs/${IPFS_CID}`,
  `https://4everland.io/ipfs/${IPFS_CID}`,
];

async function fetchFromGateway(base, file) {
  const upstream = await fetch(`${base}/${file}`, {
    signal: AbortSignal.timeout(9000),
    headers: { Accept: 'image/png,*/*' },
  });
  if (!upstream.ok) {
    throw new Error(`HTTP ${upstream.status}`);
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  if (buf.length < 100) {
    throw new Error('empty body');
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

  try {
    const buf = await Promise.any(
      IPFS_GATEWAYS.map((base) => fetchFromGateway(base, file))
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.statusCode = 200;
    res.end(buf);
  } catch (e) {
    res.statusCode = 502;
    res.end('IPFS proxy failed');
  }
};
