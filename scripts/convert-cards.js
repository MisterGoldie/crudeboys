const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const SRC = String.raw`C:\Users\mikea\Downloads\Crudeboycards\Crudeboy cards`;
const DEST = path.join(__dirname, "..", "images", "crudeboycards");
const JSON_PATH = path.join(__dirname, "..", "js", "crudeboys_image.json");
const CONCURRENCY = 6;
const TOTAL = 522;

function convertOne(n) {
  const input = path.join(SRC, `${n}.png`);
  const output = path.join(DEST, `${n}.webp`);
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(input)) {
      reject(new Error(`missing source ${input}`));
      return;
    }
    const proc = spawn(
      "ffmpeg",
      ["-y", "-i", input, "-c:v", "libwebp", "-quality", "80", output],
      { stdio: "ignore", windowsHide: true }
    );
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(output)) resolve(output);
      else reject(new Error(`ffmpeg failed for ${n} (code ${code})`));
    });
  });
}

async function convertAll() {
  fs.mkdirSync(DEST, { recursive: true });
  let next = 1;
  let done = 0;
  const failures = [];

  async function worker() {
    while (true) {
      const n = next++;
      if (n > TOTAL) return;
      try {
        await convertOne(n);
      } catch (err) {
        failures.push(String(err.message || err));
      }
      done += 1;
      if (done % 25 === 0 || done === TOTAL) {
        console.log(`converted ${done}/${TOTAL}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  if (failures.length) {
    console.error(failures.join("\n"));
    throw new Error(`${failures.length} conversions failed`);
  }
}

function updateImageJson() {
  const cards = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const updated = cards.map((card) => {
    const match = String(card.meta && card.meta.name).match(/#(\d+)/);
    const num = match ? match[1] : null;
    if (!num) return card;
    return {
      ...card,
      meta: {
        ...card.meta,
        image: `images/crudeboycards/${num}.webp`,
      },
    };
  });
  fs.writeFileSync(JSON_PATH, JSON.stringify(updated, null, 4) + "\n");
  console.log(`updated ${updated.length} image paths in crudeboys_image.json`);
}

(async () => {
  console.log("Converting PNG cards to WebP...");
  await convertAll();
  updateImageJson();
  const files = fs.readdirSync(DEST).filter((f) => /^\d+\.webp$/i.test(f));
  const bytes = files.reduce(
    (sum, f) => sum + fs.statSync(path.join(DEST, f)).size,
    0
  );
  console.log(
    `done: ${files.length} webp files, ${(bytes / (1024 * 1024)).toFixed(1)} MB`
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
