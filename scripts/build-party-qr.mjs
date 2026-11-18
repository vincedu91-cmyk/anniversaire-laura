// Fabrique les visuels imprimables du QR code de la galerie photo de la soirée.
//
// Sorties dans qr/dist/ (ignoré par Git: le QR contient la clé secrète de la soirée):
//   affiche-porte-nuit.pdf|png     affiche A4 portrait, charte noir et or
//   affiche-porte-clair.pdf|png    même affiche sur fond clair (économe en encre)
//   cartes-table-nuit.pdf|png      planche A4 de 4 cartes A6 à découper
//   cartes-table-clair.pdf|png     même planche sur fond clair
//   qr.svg                         le QR seul (vectoriel), pour un autre montage
//   *.html                         sources (ouvrables dans un navigateur: Ctrl+P > PDF)
//
// Usage: npm run qr
//   Clé lue dans .env.local (PARTY_KEY). Sinon: npm run qr -- --key=xxxxxxxxxxxx
//   Autre adresse: npm run qr -- --site=https://exemple.fr
// PDF et PNG exigent Microsoft Edge ou Chrome (détectés automatiquement, ou EDGE_PATH=...).

import { execFileSync } from "node:child_process";
import { existsSync, promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import QRCode from "qrcode";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "qr", "dist");

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.slice(2).split("=");
    return [k, v ?? true];
  }),
);

function readEnv() {
  try {
    return Object.fromEntries(
      readFileSync(path.join(ROOT, ".env.local"), "utf8")
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
    );
  } catch {
    return {};
  }
}

const event = JSON.parse(readFileSync(path.join(ROOT, "src", "data", "event.json"), "utf8"));
const key = String(args.key ?? readEnv().PARTY_KEY ?? "").trim().toLowerCase();
if (!/^[a-z0-9]{8,}$/.test(key)) {
  console.error("Clé introuvable. Ajoute PARTY_KEY=... dans .env.local (la clé est affichée dans /gestion-photos), ou lance: npm run qr -- --key=...");
  process.exit(1);
}
const site = String(args.site ?? event.siteUrl).replace(/\/$/, "");
const host = site.replace(/^https?:\/\//, "");
const target = `${site}/photos?k=${key}`;

const THEMES = {
  nuit: { bg: "#070605", ink: "#f4ebdd", accent: "#ffd27a", tile: "#f4ebdd", tileInk: "#070605", muted: "rgba(244,235,221,0.72)", rule: "rgba(244,235,221,0.35)" },
  clair: { bg: "#f4ebdd", ink: "#070605", accent: "#9a6a00", tile: "#ffffff", tileInk: "#070605", muted: "rgba(7,6,5,0.72)", rule: "rgba(7,6,5,0.35)" },
};

const qrSvg = (await QRCode.toString(target, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#070605", light: "#00000000" } }))
  .replace(/<svg /, '<svg class="qr" ');

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,800&family=Caveat:wght@600&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">`;

const BASE_CSS = (t, page) => `
  @page { size: ${page}; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${t.bg}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { color: ${t.ink}; font-family: "Bricolage Grotesque", system-ui, sans-serif; }
  .display { font-weight: 800; font-variation-settings: "wdth" 80; text-transform: uppercase; line-height: .84; letter-spacing: -0.055em; }
  .mono { font-family: "Geist Mono", ui-monospace, monospace; font-weight: 500; text-transform: uppercase; letter-spacing: .08em; }
  .hand { font-family: "Caveat", cursive; font-weight: 600; }
  .gold { color: ${t.accent}; }
  .tile { position: relative; background: ${t.tile}; padding: var(--pad); box-shadow: 0 2mm 6mm rgb(0 0 0 / .35); }
  .tile .qr { display: block; width: 100%; height: auto; }
  .tape { position: absolute; top: -4mm; left: 50%; width: 30mm; height: 8mm; margin-left: -15mm; transform: rotate(-2deg); background: ${t.accent}; opacity: .92; }
`;

function poster(t) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Affiche porte, galerie de la soirée de Laura</title>${FONTS}
<style>${BASE_CSS(t, "A4")}
  body { width: 210mm; height: 297mm; overflow: hidden; position: relative; }
  .sheet { position: absolute; inset: 0; padding: 12mm 14mm 11mm; display: flex; flex-direction: column; }
  .top { display: flex; justify-content: space-between; font-size: 3.4mm; color: ${t.accent}; }
  h1 { font-size: 25mm; margin-top: 8mm; word-spacing: .1em; }
  .lead { margin-top: 6mm; font-size: 5.6mm; line-height: 1.25; max-width: 150mm; }
  .stage { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6mm; }
  .tile { --pad: 6mm; width: 98mm; transform: rotate(-2deg); }
  .scan { font-size: 11mm; color: ${t.accent}; transform: rotate(-3deg); line-height: 1; }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; border-top: .5mm solid ${t.rule}; padding-top: 5mm; }
  .step b { display: block; font-size: 11mm; line-height: 1; color: ${t.accent}; font-weight: 800; font-variation-settings: "wdth" 80; }
  .step span { display: block; margin-top: 2mm; font-size: 3.2mm; line-height: 1.45; }
  .foot { margin-top: 6mm; display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; font-size: 3mm; color: ${t.muted}; }
  .foot .url { text-transform: none; letter-spacing: .02em; word-break: break-all; line-height: 1.5; }
  .big18 { font-size: 20mm; color: ${t.accent}; line-height: .8; }
</style></head><body>
<div class="sheet">
  <div class="top mono"><span>LA SOIRÉE DE LAURA</span><span>${host}</span></div>
  <h1 class="display">TA PHOTO,<br><span class="gold">DANS LA GALERIE.</span></h1>
  <p class="lead">Elle s&rsquo;affiche tout de suite, sur le site et sur l&rsquo;écran de la salle.</p>
  <div class="stage">
    <div class="tile"><span class="tape"></span>${qrSvg}</div>
    <p class="scan hand">Scanne-moi !</p>
  </div>
  <div class="steps">
    <div class="step"><b>1</b><span class="mono">Scanne le QR code avec l&rsquo;appareil photo du téléphone</span></div>
    <div class="step"><b>2</b><span class="mono">Prends une photo, ou choisis-en dans ta galerie</span></div>
    <div class="step"><b>3</b><span class="mono">Regarde-la apparaître sur l&rsquo;écran</span></div>
  </div>
  <div class="foot">
    <p class="mono url">Pas de QR code ? Ouvre ce lien :<br>${site.replace(/^https?:\/\//, "")}/photos?k=${key}</p>
    <p class="display big18">18</p>
  </div>
</div></body></html>`;
}

function card() {
  return `<div class="card">
    <p class="mono kicker">LES 18 ANS DE LAURA</p>
    <h2 class="display">POSTE<br><span class="gold">TA PHOTO</span></h2>
    <div class="tile"><span class="tape"></span>${qrSvg}</div>
    <p class="hand how">Scanne, envoie, regarde l&rsquo;écran.</p>
    <p class="mono small">${host}</p>
  </div>`;
}

function cards(t) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cartes de table, galerie de la soirée de Laura</title>${FONTS}
<style>${BASE_CSS(t, "A4")}
  body { width: 210mm; height: 297mm; overflow: hidden; background: #fff; }
  .grid { display: grid; grid-template-columns: 105mm 105mm; grid-template-rows: 148.5mm 148.5mm; }
  .card { width: 105mm; height: 148.5mm; background: ${t.bg}; color: ${t.ink}; padding: 9mm 8mm; display: flex; flex-direction: column; align-items: center; text-align: center; outline: .25mm dashed rgba(128,128,128,.7); outline-offset: -.25mm; }
  .kicker { font-size: 2.6mm; color: ${t.accent}; }
  h2 { font-size: 15mm; margin-top: 4mm; }
  .tile { --pad: 3.4mm; width: 56mm; margin-top: 8mm; transform: rotate(-2deg); }
  .tape { width: 17mm; height: 5mm; top: -2.8mm; margin-left: -8.5mm; }
  .how { margin-top: 7mm; font-size: 7mm; line-height: 1.05; color: ${t.accent}; }
  .small { margin-top: auto; font-size: 2.6mm; color: ${t.muted}; }
</style></head><body><div class="grid">${card()}${card()}${card()}${card()}</div></body></html>`;
}

await fs.mkdir(DIST, { recursive: true });
await fs.writeFile(path.join(DIST, "qr.svg"), qrSvg.replace('class="qr" ', ""), "utf8");

const PAGES = { affiche: poster, cartes: cards };
const outputs = [];
for (const [name, build] of Object.entries(PAGES)) {
  for (const [themeName, theme] of Object.entries(THEMES)) {
    const base = `${name === "affiche" ? "affiche-porte" : "cartes-table"}-${themeName}`;
    const html = path.join(DIST, `${base}.html`);
    await fs.writeFile(html, build(theme), "utf8");
    outputs.push({ base, html });
  }
}

const candidates = [
  process.env.EDGE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = candidates.find((candidate) => existsSync(candidate));

if (!browser) {
  console.log(`Sources HTML écrites dans ${DIST}. Aucun navigateur détecté: ouvre-les et imprime en PDF (marges: aucune, graphiques d'arrière-plan: oui).`);
  process.exit(0);
}

const profile = path.join(DIST, ".profile");
for (const { base, html } of outputs) {
  const url = pathToFileURL(html).href;
  const common = ["--headless", "--disable-gpu", `--user-data-dir=${profile}`, "--virtual-time-budget=12000"];
  execFileSync(browser, [...common, "--no-pdf-header-footer", `--print-to-pdf=${path.join(DIST, `${base}.pdf`)}`, url], { stdio: "ignore", timeout: 120_000 });
  execFileSync(browser, [...common, "--hide-scrollbars", "--window-size=794,1123", "--force-device-scale-factor=3", `--screenshot=${path.join(DIST, `${base}.png`)}`, url], { stdio: "ignore", timeout: 120_000 });
  console.log(`OK  ${base}.pdf / ${base}.png`);
}
await fs.rm(profile, { recursive: true, force: true });
console.log(`\nVisuels dans ${DIST}\nLe QR pointe vers: ${target}`);
