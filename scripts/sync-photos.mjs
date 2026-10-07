// Synchronise le dossier photos/ avec le site.
//   photos/Naissance-Enfance     -> childhood
//   photos/Adolescence           -> adolescence
//   photos/Laura-le-petit-clown  -> mischief
//
// Produit: public/photos/<univers>/*.webp (max 2200 px), un blurDataURL, l'année quand elle est certaine
// (EXIF DateTimeOriginal, sinon année présente dans le nom du fichier, sinon rien),
// des vignettes JPEG pour l'image Open Graph, et src/data/photos.generated.json.
//
// Usage: npm run photos   (lancé aussi avant `dev` et `build`)

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";

const ROOT = process.cwd();
const SOURCES = {
  childhood: "Naissance-Enfance",
  adolescence: "Adolescence",
  mischief: "Laura-le-petit-clown",
};
const SRC_DIR = path.join(ROOT, "photos");
const OUT_DIR = path.join(ROOT, "public", "photos");
const MANIFEST = path.join(ROOT, "src", "data", "photos.generated.json");
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff", ".heic"]);
const MAX_WIDTH = 2200;
const OG_MAX = 24;
const OG_SIZE = 240;
const MIN_YEAR = 1990;

const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "photo";

async function readYear(file, name) {
  try {
    const exif = await exifr.parse(file, ["DateTimeOriginal", "CreateDate"]);
    const date = exif?.DateTimeOriginal ?? exif?.CreateDate;
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year >= MIN_YEAR && year <= new Date().getFullYear()) return year;
    }
  } catch {
    // Pas d'EXIF lisible: on retombe sur le nom du fichier.
  }
  const match = name.match(/(?:^|[^0-9])((?:19|20)\d{2})(?:[^0-9]|$)/);
  return match ? Number(match[1]) : undefined;
}

async function readPrevious() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    return {};
  }
}

async function listSources(dir) {
  try {
    const names = await fs.readdir(dir);
    return names
      .filter((name) => EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => collator.compare(a, b));
  } catch {
    return [];
  }
}

async function processUniverse(universe, previous) {
  const sourceDir = path.join(SRC_DIR, SOURCES[universe]);
  const outDir = path.join(OUT_DIR, universe);
  await fs.mkdir(outDir, { recursive: true });
  const files = await listSources(sourceDir);
  const known = new Map((previous[universe] ?? []).map((entry) => [entry.file, entry]));
  const used = new Set();
  const entries = [];

  for (const file of files) {
    const input = path.join(sourceDir, file);
    const stat = await fs.stat(input);
    const base = slugify(file);
    let outName = `${base}.webp`;
    for (let n = 2; used.has(outName); n += 1) outName = `${base}-${n}.webp`;
    used.add(outName);
    const output = path.join(outDir, outName);

    const cached = known.get(file);
    const fresh =
      cached && cached.mtimeMs === stat.mtimeMs && (await fs.stat(output).then(() => true, () => false));
    if (fresh) {
      entries.push({ ...cached, source: input });
      continue;
    }

    try {
      const image = sharp(input, { failOn: "none" }).rotate();
      const info = await image
        .clone()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(output);
      const blur = await image
        .clone()
        .resize({ width: 16 })
        .webp({ quality: 40 })
        .toBuffer();
      const year = await readYear(input, file);
      entries.push({
        file,
        src: `/photos/${universe}/${outName}`,
        width: info.width,
        height: info.height,
        blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
        ...(year ? { year } : {}),
        mtimeMs: stat.mtimeMs,
        source: input,
      });
    } catch (error) {
      console.warn(`[photos] ${universe}/${file} ignorée: ${error.message}`);
    }
  }

  // Nettoie les fichiers générés qui n'ont plus de source.
  const keep = new Set(entries.map((entry) => path.basename(entry.src)));
  for (const existing of await fs.readdir(outDir)) {
    if (!keep.has(existing)) await fs.rm(path.join(outDir, existing), { force: true });
  }
  return entries;
}

async function buildOgThumbs(byUniverse) {
  const ogDir = path.join(OUT_DIR, "_og");
  await fs.rm(ogDir, { recursive: true, force: true });
  const queues = Object.values(byUniverse).filter((list) => list.length > 0);
  if (queues.length === 0) return [];
  await fs.mkdir(ogDir, { recursive: true });

  const picked = [];
  for (let round = 0; picked.length < OG_MAX; round += 1) {
    let added = false;
    for (const list of queues) {
      if (picked.length >= OG_MAX) break;
      if (round < list.length) {
        picked.push(list[round]);
        added = true;
      }
    }
    if (!added) break;
  }

  const result = [];
  for (const [index, entry] of picked.entries()) {
    const name = `${String(index + 1).padStart(2, "0")}.jpg`;
    try {
      await sharp(entry.source, { failOn: "none" })
        .rotate()
        .resize(OG_SIZE, OG_SIZE, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toFile(path.join(ogDir, name));
      result.push(`/photos/_og/${name}`);
    } catch {
      // vignette ignorée
    }
  }
  return result;
}

async function main() {
  const previous = await readPrevious();
  const byUniverse = {};
  for (const universe of Object.keys(SOURCES)) {
    byUniverse[universe] = await processUniverse(universe, previous);
  }
  const og = await buildOgThumbs(byUniverse);

  const manifest = { og };
  for (const universe of Object.keys(SOURCES)) {
    manifest[universe] = byUniverse[universe].map((entry) => {
      const copy = { ...entry };
      delete copy.source;
      return copy;
    });
  }
  const ordered = {
    childhood: manifest.childhood,
    adolescence: manifest.adolescence,
    mischief: manifest.mischief,
    og: manifest.og,
  };
  const serialized = `${JSON.stringify(ordered, null, 2)}\n`;
  const existing = await fs.readFile(MANIFEST, "utf8").catch(() => "");
  if (existing !== serialized) await fs.writeFile(MANIFEST, serialized);

  const counts = Object.keys(SOURCES).map((u) => `${u}: ${byUniverse[u].length}`).join(", ");
  console.log(`[photos] ${counts}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
