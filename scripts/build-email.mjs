// Fabrique l'e-mail d'invitation à partir de email/invitation.template.html.
//
// Sorties dans email/dist/ (ignoré par Git: contient les photos de Laura):
//   invitation.html   version à coller/importer dans l'outil d'envoi (images en URL absolues)
//   invitation.txt    version texte brut (obligatoire pour une bonne délivrabilité)
//   preview.html      aperçu local (images relatives, prénom et lien d'exemple)
//   assets/           qr.png et polaroid-1..3.png à héberger (voir email/README.md)
//
// Usage: npm run email -- [--syntax=mustache|brevo|mailchimp] [--assets=https://exemple.fr/mail]
// Les photos viennent de photos/ (via `npm run photos`). Sans photo, des visuels abstraits les remplacent.

import { promises as fs } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "email", "dist");
const ASSETS = path.join(DIST, "assets");

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [key, value] = a.slice(2).split("=");
    return [key, value ?? true];
  }),
);

const event = JSON.parse(await fs.readFile(path.join(ROOT, "src", "data", "event.json"), "utf8"));
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "src", "data", "photos.generated.json"), "utf8"));
const assetsBase = String(args.assets ?? `${event.siteUrl}/mail`).replace(/\/$/, "");

// Syntaxe des champs de fusion selon l'outil d'envoi.
const SYNTAXES = {
  mustache: { prenom: "{{prenom}}", lien: "{{lien}}" },
  brevo: { prenom: "{{ contact.FIRSTNAME }}", lien: "{{ contact.LIEN }}" },
  mailchimp: { prenom: "*|FNAME|*", lien: "*|LIEN|*" },
};
const syntax = SYNTAXES[String(args.syntax ?? "mustache")];
if (!syntax) {
  console.error(`Syntaxe inconnue. Choix: ${Object.keys(SYNTAXES).join(", ")}`);
  process.exit(1);
}

// ---------------------------------------------------------------- polaroids

const CARD = { width: 560, height: 680, photo: 500, margin: 30 };
const CANVAS = { width: 700, height: 820, left: 70, top: 50 };
const OUTPUT_WIDTH = 360; // affiché à 176 px: définition x2 pour les écrans denses
const UNIVERSES = [
  { id: "childhood", angle: -4, tones: ["#F0E1A0", "#E7B9C4", "#B6D2E8", "#DAD3EC"] },
  { id: "adolescence", angle: 3, tones: ["#08040F", "#FF2BD6", "#00F0FF", "#7B2BFF"] },
  { id: "mischief", angle: -2.5, tones: ["#FFD400", "#E5202E", "#1F4FE0", "#17B857"] },
];

// Visuel de remplacement sans texte: lumières floues aux couleurs de l'univers.
function placeholder({ tones }) {
  const [bg, a, b, c] = tones;
  const size = CARD.photo;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="34"/></filter></defs>
    <rect width="${size}" height="${size}" fill="${bg}"/>
    <g filter="url(#f)"><circle cx="150" cy="170" r="130" fill="${a}"/><circle cx="360" cy="300" r="150" fill="${b}"/><circle cx="210" cy="400" r="110" fill="${c}"/></g>
  </svg>`);
}

async function photoFor(universe) {
  const entry = manifest[universe.id]?.[0];
  if (!entry) return { buffer: await sharp(placeholder(universe)).png().toBuffer(), real: false };
  const file = path.join(ROOT, "public", entry.src);
  const buffer = await sharp(file).resize(CARD.photo, CARD.photo, { fit: "cover" }).png().toBuffer();
  return { buffer, real: true };
}

async function polaroid(universe) {
  const { buffer, real } = await photoFor(universe);
  const card = await sharp({ create: { width: CARD.width, height: CARD.height, channels: 4, background: "#FBFAF6" } })
    .composite([{ input: buffer, left: CARD.margin, top: CARD.margin }])
    .png()
    .toBuffer();
  const shadowBlock = await sharp({ create: { width: CARD.width, height: CARD.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.45 } } })
    .png()
    .toBuffer();
  const shadow = await sharp({ create: { width: CANVAS.width, height: CANVAS.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: shadowBlock, left: CANVAS.left + 6, top: CANVAS.top + 16 }])
    .blur(16)
    .png()
    .toBuffer();
  const flat = await sharp(shadow)
    .composite([{ input: card, left: CANVAS.left, top: CANVAS.top }])
    .png()
    .toBuffer();
  const tilted = await sharp(flat).rotate(universe.angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return {
    png: await sharp(tilted).resize({ width: OUTPUT_WIDTH }).png({ compressionLevel: 9 }).toBuffer(),
    real,
  };
}

// ---------------------------------------------------------------- QR code

async function qr() {
  return QRCode.toBuffer(event.siteUrl, {
    type: "png",
    width: 560, // affiché à 140 px
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0D0D11", light: "#FFFFFF" },
  });
}

// ---------------------------------------------------------------- assemblage

const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function fill(template, { assets, prenom, lien }) {
  const tokens = {
    ASSETS: assets,
    DATE: escapeHtml(event.date),
    TIME: escapeHtml(event.time),
    PLACE: escapeHtml(event.place),
    REPLY_BEFORE: escapeHtml(event.replyBefore),
    CONTACT: escapeHtml(event.organizerContact),
    SITE_URL: event.siteUrl,
    SITE_HOST: event.siteHost,
  };
  return template
    .replace(/\[\[([A-Z_]+)\]\]/g, (match, key) => (key in tokens ? tokens[key] : match))
    .replaceAll("{{prenom}}", prenom)
    .replaceAll("{{lien}}", lien);
}

function plainText(prenom, lien) {
  return `Une histoire commence ici.

LAURA, 18 ANS

Salut ${prenom},

Laura a 18 ans. Une histoire, trois visages, et une soirée pour la fêter avec toi.

LA SOIRÉE
${event.date}
Heure : ${event.time}
Lieu : ${event.place}

TU SERAS LÀ ?
Présent(e), peut-être ou absent(e) : un seul clic.
Réponse souhaitée avant le ${event.replyBefore}. Tu pourras changer d'avis.

Je réponds : ${lien}

Découvre l'histoire de Laura : ${event.siteUrl}

Tu reçois ce message parce que tu es invité(e) aux 18 ans de Laura.
Une question ? ${event.organizerContact}
`;
}

async function main() {
  const template = await fs.readFile(path.join(ROOT, "email", "invitation.template.html"), "utf8");
  await fs.mkdir(ASSETS, { recursive: true });

  const made = [];
  for (const [index, universe] of UNIVERSES.entries()) {
    const { png, real } = await polaroid(universe);
    await fs.writeFile(path.join(ASSETS, `polaroid-${index + 1}.png`), png);
    made.push(`polaroid-${index + 1} (${real ? "photo" : "visuel de remplacement"}, ${Math.round(png.length / 1024)} Ko)`);
  }
  await fs.writeFile(path.join(ASSETS, "qr.png"), await qr());

  const sampleLink = `${event.siteUrl}/invitation?c=a1b2c3d4e5f60718293a4b5c6d7e8f901234`;
  await fs.writeFile(path.join(DIST, "invitation.html"), fill(template, { assets: assetsBase, prenom: syntax.prenom, lien: syntax.lien }));
  await fs.writeFile(path.join(DIST, "invitation.txt"), plainText(syntax.prenom, syntax.lien));
  await fs.writeFile(path.join(DIST, "preview.html"), fill(template, { assets: "assets", prenom: "Camille", lien: sampleLink }));

  console.log(`[email] ${made.join(", ")}, qr.png (${event.siteUrl})`);
  console.log(`[email] syntaxe ${args.syntax ?? "mustache"}, images en ligne: ${assetsBase}/`);
  console.log(`[email] sorties: ${path.relative(ROOT, DIST)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
