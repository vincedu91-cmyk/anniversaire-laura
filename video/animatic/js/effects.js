// Effets de la timeline : stickers, bulles BD, texte street-art, stroboscope léger.
import { W, H, TAU, PALETTE, FONTS, clamp, ease, rgba, starPath, roundRectPath } from "./util.js";

const C = PALETTE.clown;
const A = PALETTE.ado;

// Approximations vectorielles des stickers STK_CLO_* (dessinés autour de (0,0), taille s).
const STICKERS = {
  STK_CLO_NEZ_ROUGE(ctx, s) {
    const g = ctx.createRadialGradient(-s * 0.08, -s * 0.08, 0, 0, 0, s * 0.18);
    g.addColorStop(0, "#FF8A8A");
    g.addColorStop(1, C.rouge);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.18, 0, TAU);
    ctx.fill();
  },
  STK_CLO_YEUX_ROLLING(ctx, s, t) {
    [-1, 1].forEach((side, i) => {
      ctx.fillStyle = C.papier;
      ctx.strokeStyle = C.noir;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(side * s * 0.16, -s * 0.2, s * 0.13, 0, TAU);
      ctx.fill();
      ctx.stroke();
      const a = t * 6 + i * 2;
      ctx.fillStyle = C.noir;
      ctx.beginPath();
      ctx.arc(side * s * 0.16 + Math.cos(a) * s * 0.05, -s * 0.2 + Math.sin(a) * s * 0.05, s * 0.06, 0, TAU);
      ctx.fill();
    });
  },
  STK_CLO_CHAPEAU_FETE(ctx, s, t) {
    ctx.save();
    ctx.translate(0, -s * 0.55);
    ctx.rotate(0.15 * Math.sin(t * 5));
    ctx.fillStyle = C.bleu;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, s * 0.05);
    ctx.lineTo(s * 0.2, s * 0.05);
    ctx.lineTo(0, -s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.jaune;
    ctx.beginPath();
    ctx.arc(0, -s * 0.42, s * 0.06, 0, TAU);
    ctx.fill();
    ctx.restore();
  },
  STK_CLO_PERRUQUE_ARC(ctx, s, t) {
    const colors = [C.rouge, C.jaune, C.vert, C.bleu];
    for (let i = 0; i < 12; i++) {
      const a = Math.PI + (i / 11) * Math.PI;
      const bounce = 1 + 0.06 * Math.sin(t * 8 + i);
      ctx.fillStyle = colors[i % 4];
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.4 * bounce, -s * 0.25 + Math.sin(a) * s * 0.35 * bounce, s * 0.12, 0, TAU);
      ctx.fill();
    }
  },
  STK_CLO_MOUSTACHE(ctx, s, t) {
    ctx.fillStyle = C.noir;
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(0.12 * Math.sin(t * 6));
      ctx.beginPath();
      ctx.ellipse(s * 0.12, s * 0.12, s * 0.14, s * 0.05, 0.2, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.27, s * 0.07, s * 0.04, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
  },
  STK_CLO_ETOILES_VERTIGE(ctx, s, t) {
    for (let i = 0; i < 5; i++) {
      const a = t * 3 + (i / 5) * TAU;
      ctx.fillStyle = C.jaune;
      ctx.strokeStyle = C.noir;
      ctx.lineWidth = 3;
      starPath(ctx, Math.cos(a) * s * 0.35, -s * 0.55 + Math.sin(a) * s * 0.1, s * 0.07, s * 0.03, 5);
      ctx.fill();
      ctx.stroke();
    }
  },
  STK_CLO_LARMES_RIRE(ctx, s, t) {
    ctx.fillStyle = C.bleu;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 4; i++) {
        const k = (t * 2 + i / 4) % 1;
        ctx.beginPath();
        ctx.arc(side * (s * 0.2 + k * s * 0.35), -s * 0.15 + k * k * s * 0.3, s * 0.035, 0, TAU);
        ctx.fill();
      }
    });
  },
  STK_CLO_COEURS_YEUX(ctx, s, t) {
    const beat = 1 + 0.15 * Math.abs(Math.sin(t * 6));
    ctx.fillStyle = C.rouge;
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(side * s * 0.16, -s * 0.2);
      ctx.scale(beat, beat);
      ctx.beginPath();
      const r = s * 0.06;
      ctx.moveTo(0, r * 1.6);
      ctx.bezierCurveTo(-r * 2.2, 0, -r * 1.2, -r * 1.6, 0, -r * 0.5);
      ctx.bezierCurveTo(r * 1.2, -r * 1.6, r * 2.2, 0, 0, r * 1.6);
      ctx.fill();
      ctx.restore();
    });
  },
};

/** Sticker suivi sur le visage : sans détection de visage, on le place en haut au centre de la photo. */
export function drawSticker(ctx, effect, rect, local) {
  const k = clamp((local - effect.in_offset_s) / 0.45);
  const alive = local >= effect.in_offset_s && local <= effect.in_offset_s + effect.duration_s;
  if (!alive) return;
  const draw = STICKERS[effect.asset];
  if (!draw) return;
  const size = rect.h * 0.9;
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h * 0.42);
  ctx.scale(ease.outElastic(k), ease.outElastic(k));
  draw(ctx, size, local);
  ctx.restore();
}

export function drawComicBubble(ctx, effect, rect, local) {
  const start = effect.in_offset_s;
  if (local < start || local > start + effect.duration_s) return;
  const k = ease.outElastic(clamp((local - start) / 0.5));
  const spiky = effect.asset === "STK_CLO_BULLE_CRI";
  const cx = rect.x + rect.w * 0.82;
  const cy = rect.y + rect.h * 0.24; // assez bas pour que la bulle (rayon ~230 px) reste dans l'image
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.rotate(spiky ? -0.08 : 0.05);
  ctx.lineWidth = 8;
  ctx.strokeStyle = C.noir;
  ctx.fillStyle = spiky ? C.jaune : C.papier;
  if (spiky) {
    starPath(ctx, 0, 0, 230, 160, 14, 0);
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, 220, 130, 0, 0, TAU);
    ctx.moveTo(-60, 110);
    ctx.lineTo(-140, 200);
    ctx.lineTo(-10, 125);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = spiky ? C.rouge : C.noir;
  ctx.font = `86px ${FONTS.clown}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(effect.text, 0, 6, 380);
  ctx.restore();
}

export function drawStreetText(ctx, effect, local) {
  const start = effect.in_offset_s;
  const end = start + effect.hold_s + 0.3;
  if (local < start || local > end) return;
  const reveal = clamp((local - start) / 0.3);
  ctx.save();
  ctx.translate(W * 0.7, H * 0.78);
  ctx.rotate(-0.1);
  ctx.font = `200px ${FONTS.ado}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = ctx.measureText(effect.text).width + 40;
  ctx.beginPath();
  ctx.rect(-width / 2, -150, width * reveal, 300); // révélation « à la bombe » de gauche à droite
  ctx.clip();
  ctx.lineWidth = 14;
  ctx.strokeStyle = A.nuit;
  ctx.strokeText(effect.text, 0, 0);
  ctx.shadowColor = A.magenta;
  ctx.shadowBlur = 30;
  ctx.fillStyle = A.jaune;
  ctx.fillText(effect.text, 0, 0);
  ctx.restore();
}

// Stroboscope léger : 2 flashs max par seconde (seuil photosensibilité : 3 / s).
export function drawStrobe(ctx, effect, local) {
  if (local > effect.window_s) return;
  const phase = (local * effect.flashes) / effect.window_s;
  if (phase % 1 > 0.18) return;
  ctx.save();
  ctx.fillStyle = rgba(A.blanc, effect.intensity);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Texte à l'écran (timeline.audio.screen_texts), ex. la date de naissance en manuscrit. */
export function drawScreenText(ctx, item, t) {
  if (t < item.start || t > item.end) return;
  const fade = Math.min(clamp((t - item.start) / 0.6), clamp((item.end - t) / 0.6));
  const write = clamp((t - item.start) / 1.2); // écriture de gauche à droite
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(150, 190);
  ctx.rotate(-0.05);
  ctx.font = `700 130px ${FONTS.enfance}`;
  ctx.textBaseline = "alphabetic";
  const width = ctx.measureText(item.text).width;
  ctx.beginPath();
  ctx.rect(-20, -140, (width + 40) * write, 220);
  ctx.clip();
  ctx.shadowColor = rgba(PALETTE.enfance.blanc, 0.9);
  ctx.shadowBlur = 18;
  ctx.fillStyle = PALETTE.enfance.prune;
  ctx.fillText(item.text, 0, 0);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(PALETTE.enfance.rose, 0.9);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.quadraticCurveTo(width / 2, 40, width, 20); // soulignement à la main
  ctx.stroke();
  ctx.restore();
}

export function drawNeonFrame(ctx, rect, color, glow) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow * 1.6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 0);
  ctx.stroke();
  ctx.restore();
}
