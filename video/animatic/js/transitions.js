// Transitions : mélange du plan sortant (A) et du plan entrant (B), k ∈ [0, 1].
// Chaque style de timeline.json est ramené à une famille de masque dessinée en canvas 2D.
import { W, H, TAU, PALETTE, clamp, ease, hash, rgba, starPath } from "./util.js";

const FAMILY = {
  fade_from_black: "fade",
  fondu_enchaine_doux: "fade",
  continu: "fade",
  crossfade_aquarelle: "ink",
  aquarelle_depuis_titre: "ink",
  bulles_de_savon: "bubbles",
  page_tournee_pastel: "page",
  etoiles_scintillantes: "fade",
  glitch_rgb: "glitch",
  record_scratch_glitch: "glitch",
  datamosh_vhs: "glitch",
  flash_stroboscopique_leger: "flash",
  whip_pan_neon: "whip",
  demi_teinte_pop_art: "dots",
  tag_graffiti_wipe: "wipe",
  explosion_bulle_bd: "star",
  etoile_wipe: "star",
  iris_cercle_cartoon: "iris",
  tarte_a_la_creme_splat: "splat",
  confettis_burst: "flash",
  squash_stretch: "squash",
  flash_dore: "flash",
};

const DIAG = Math.hypot(W, H);

function blobPath(ctx, cx, cy, r, wobble, seed) {
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * TAU;
    const rr = r * (1 + wobble * Math.sin(5 * a + seed) + wobble * 0.6 * Math.sin(9 * a + seed * 2));
    ctx[i === 0 ? "moveTo" : "lineTo"](cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  }
  ctx.closePath();
}

// Chaque masque trace le chemin de la zone où B est visible.
const MASKS = {
  ink: (ctx, k) => blobPath(ctx, W / 2, H / 2, ease.inOutSine(k) * DIAG * 0.62, 0.12, 2),
  iris: (ctx, k) => {
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, ease.inOutSine(k) * DIAG * 0.52, 0, TAU);
  },
  star: (ctx, k) => {
    const r = ease.inOutSine(k) * DIAG * 1.1;
    starPath(ctx, W / 2, H / 2, r, r * 0.55, 8);
  },
  splat: (ctx, k) => blobPath(ctx, W * 0.5, H * 0.45, ease.outCubic(k) * DIAG * 0.6, 0.22, 5),
  bubbles: (ctx, k) => {
    ctx.beginPath();
    for (let i = 0; i < 26; i++) {
      const delay = hash(i + 3) * 0.4;
      const r = clamp((k - delay) / 0.6) * (180 + hash(i + 9) * 260);
      if (r <= 0) continue;
      const x = hash(i + 5) * W;
      const y = hash(i + 7) * H;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
  },
  dots: (ctx, k) => {
    const step = 48;
    const r = ease.inOutSine(k) * step * 0.75;
    ctx.beginPath();
    for (let y = 0; y <= H + step; y += step) {
      for (let x = 0; x <= W + step; x += step) {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
    }
  },
  wipe: (ctx, k) => {
    const edge = ease.inOutSine(k) * (W + 240) - 120;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    for (let y = 0; y <= H; y += 40) ctx.lineTo(edge + (hash(y) - 0.5) * 120, y); // bord de bombe irrégulier
    ctx.lineTo(-10, H + 10);
    ctx.closePath();
  },
  page: (ctx, k) => {
    const x = W * (1 - ease.inOutSine(k));
    ctx.beginPath();
    ctx.rect(x, 0, W - x, H);
  },
};

function drawMasked(ctx, a, b, maskFn, k) {
  ctx.drawImage(a, 0, 0);
  ctx.save();
  maskFn(ctx, k);
  ctx.clip();
  ctx.drawImage(b, 0, 0);
  ctx.restore();
}

function drawGlitch(ctx, a, b, k, frame) {
  const bands = 24;
  const bandH = H / bands;
  for (let i = 0; i < bands; i++) {
    const useB = hash(i * 31 + frame) < k;
    const offset = (hash(i * 17 + frame * 3) - 0.5) * 160 * Math.sin(Math.PI * k);
    ctx.drawImage(useB ? b : a, 0, i * bandH, W, bandH, offset, i * bandH, W, bandH);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.25 * Math.sin(Math.PI * k); // séparation RGB
  ctx.drawImage(k < 0.5 ? a : b, 14, 0);
  ctx.restore();
}

function drawFlash(ctx, a, b, k, style) {
  ctx.drawImage(k < 0.5 ? a : b, 0, 0);
  const color = style === "flash_dore" ? PALETTE.outro.or : PALETTE.ado.blanc;
  ctx.fillStyle = rgba(color, 0.85 * (1 - Math.abs(k - 0.5) * 2));
  ctx.fillRect(0, 0, W, H);
}

function drawWhip(ctx, a, b, k) {
  const e = ease.inOutSine(k);
  for (let i = 0; i < 4; i++) {
    const blur = (i - 1.5) * 30 * Math.sin(Math.PI * k);
    ctx.globalAlpha = i === 0 ? 1 : 0.35;
    ctx.drawImage(a, -e * W + blur, 0);
    ctx.drawImage(b, W - e * W + blur, 0);
  }
  ctx.globalAlpha = 1;
}

function drawSquash(ctx, a, b, k) {
  const first = k < 0.5;
  const q = first ? k * 2 : (1 - k) * 2;
  ctx.fillStyle = PALETTE.clown.papier;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H);
  ctx.scale(1 + 0.35 * q, 1 - 0.9 * q);
  ctx.drawImage(first ? a : b, -W / 2, -H);
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx destination
 * @param {HTMLCanvasElement} a plan sortant
 * @param {HTMLCanvasElement} b plan entrant
 * @param {string} style transition_in.style
 * @param {number} k progression 0 → 1
 * @param {number} frame index d'image (pour le glitch)
 */
export function composite(ctx, a, b, style, k, frame) {
  const family = FAMILY[style] ?? "fade";
  if (family === "fade") {
    ctx.drawImage(a, 0, 0);
    ctx.globalAlpha = ease.inOutSine(k);
    ctx.drawImage(b, 0, 0);
    ctx.globalAlpha = 1;
  } else if (family === "glitch") drawGlitch(ctx, a, b, k, frame);
  else if (family === "flash") drawFlash(ctx, a, b, k, style);
  else if (family === "whip") drawWhip(ctx, a, b, k);
  else if (family === "squash") drawSquash(ctx, a, b, k);
  else drawMasked(ctx, a, b, MASKS[family], k);
}
