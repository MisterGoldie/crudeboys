const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'js');

async function fetchCollection(slug, limit) {
  const url = `https://api.doggy.market/listings/nfts/${slug}?offset=0&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${slug} listings failed: ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json.data) ? json.data : [];
  if (!rows.length) throw new Error(`${slug} listings returned no items`);
  return rows;
}

function compactCruno(rows) {
  return rows
    .map((item) => {
      const num = String(item.itemId || '').trim();
      return {
        id: item.inscriptionId,
        meta: { name: num ? `CrUNO #${num}` : 'CrUNO' },
        attributes: item.attributes || {},
      };
    })
    .filter((item) => item.id)
    .sort((a, b) => {
      const an = parseInt(String(a.meta.name).replace(/\D/g, ''), 10) || 0;
      const bn = parseInt(String(b.meta.name).replace(/\D/g, ''), 10) || 0;
      return an - bn;
    });
}

function compactCups(rows) {
  return rows
    .map((item) => {
      const attrs = item.attributes || {};
      const num = String(attrs['Cup Number'] || '').trim();
      const handle = String(item.itemName || '').trim();
      let name = handle || (num ? `Cups #${num}` : 'Cups');
      if (handle && num) name = `${handle} #${num}`;
      return {
        id: item.inscriptionId,
        meta: { name },
        attributes: attrs,
      };
    })
    .filter((item) => item.id)
    .sort((a, b) => {
      const an = parseInt(a.attributes['Cup Number'], 10) || 0;
      const bn = parseInt(b.attributes['Cup Number'], 10) || 0;
      return an - bn;
    });
}

function writeJson(fileName, data) {
  const filePath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  return filePath;
}

async function main() {
  const [crunoRows, cupsRows] = await Promise.all([
    fetchCollection('cruno', 215),
    fetchCollection('cups', 200),
  ]);

  const cruno = compactCruno(crunoRows);
  const cups = compactCups(cupsRows);

  writeJson('cruno.json', cruno);
  writeJson('cups.json', cups);

  console.log(`wrote js/cruno.json (${cruno.length})`);
  console.log(`wrote js/cups.json (${cups.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
