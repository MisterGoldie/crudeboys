const IPFS_CID = 'bafybeidm3sremjulcdqefulerybnjqtzcf2o3vvyu5ayg35lbthmhxs5hi';
const IPFS_GATEWAYS = [
  `https://${IPFS_CID}.ipfs.dweb.link`,
  `https://nftstorage.link/ipfs/${IPFS_CID}`,
  `https://w3s.link/ipfs/${IPFS_CID}`,
  `https://ipfs.io/ipfs/${IPFS_CID}`,
];

module.exports = async function handler(req, res) {
  const file = String(req.query.file || '');
  if (!/^\d+\.png$/i.test(file)) {
    res.statusCode = 400;
    res.end('Bad request');
    return;
  }

  for (const base of IPFS_GATEWAYS) {
    try {
      const upstream = await fetch(`${base}/${file}`);
      if (!upstream.ok) continue;
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.statusCode = 200;
      res.end(buf);
      return;
    } catch (e) {
      /* try next gateway */
    }
  }

  res.statusCode = 502;
  res.end('IPFS proxy failed');
};
