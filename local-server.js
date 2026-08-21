const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 8000;
const IPFS_CID = "bafybeidm3sremjulcdqefulerybnjqtzcf2o3vvyu5ayg35lbthmhxs5hi";
const IPFS_GATEWAYS = [
  `https://${IPFS_CID}.ipfs.dweb.link`,
  `https://nftstorage.link/ipfs/${IPFS_CID}`,
  `https://w3s.link/ipfs/${IPFS_CID}`,
  `https://ipfs.io/ipfs/${IPFS_CID}`,
];

const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

async function proxyIpfsCard(res, fileName) {
  if (!/^\d+\.png$/i.test(fileName)) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  for (const base of IPFS_GATEWAYS) {
    const url = `${base}/${fileName}`;
    try {
      const upstream = await fetch(url);
      if (!upstream.ok) continue;
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      });
      res.end(buf);
      return;
    } catch (e) {
      /* try next gateway */
    }
  }

  res.writeHead(502);
  res.end("IPFS proxy failed");
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";

    // Localhost-only helper: same-origin card images so the browser
    // is not blocked by IPFS gateway Cross-Origin-Resource-Policy.
    const proxyMatch = urlPath.match(/^\/ipfs-proxy\/([^/]+)$/);
    if (proxyMatch) {
      proxyIpfsCard(res, proxyMatch[1]);
      return;
    }

    const filePath = path.join(root, urlPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`Serving at http://localhost:${port}`);
  });
