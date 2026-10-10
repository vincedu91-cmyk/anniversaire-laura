// Fonds et surimpressions. Si le MP4 de l'asset existe (ex. BG_ENF_*), il est utilisé ;
// sinon un fond procédural approximatif est dessiné, pour juger rythme et ambiance.
import { W, H, TAU, PALETTE, hash, frac, rgba, beatPulse, roundRectPath } from "./util.js";

const E = PALETTE.enfance;
const A = PALETTE.ado;
const C = PALETTE.clown;
const O = PALETTE.outro;
const N = PALETTE.neutre;

function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function vertical(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function sunburst(ctx, t, colors, rays, speed, cx = W / 2, cy = H / 2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * speed);
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * TAU;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, W * 1.2, a0, a0 + TAU / rays);
    ctx.fill();
  }
  ctx.restore();
}

function halftone(ctx, color, step, radiusAt) {
  ctx.fillStyle = color;
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const r = radiusAt(x, y);
      if (r < 0.5) continue;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
}

const PROCEDURAL = {
  BG_INT_ENERGY(ctx, t) {
    fill(ctx, N.fond);
    sunburst(ctx, t, [rgba(N.encre, 0.05), rgba(N.encre, 0)], 36, 0.08);
    const pulse = beatPulse(t, 120);
    ctx.strokeStyle = rgba(N.encre, 0.12 * pulse);
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 180 * i + 60 * (1 - pulse), 0, TAU);
      ctx.stroke();
    }
  },
  BG_ENF(ctx, t) {
    vertical(ctx, [[0, E.bleu], [0.55, E.lavande], [1, E.rose]]);
    for (let i = 0; i < 6; i++) {
      const x = hash(i) * W + 60 * Math.sin(t * 0.3 + i);
      const y = hash(i + 50) * H + 40 * Math.cos(t * 0.25 + i);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 420);
      g.addColorStop(0, rgba([E.jaune, E.rose, E.blanc][i % 3], 0.5));
      g.addColorStop(1, rgba(E.blanc, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  },
  BG_ADO_01_GRILLE_NEON(ctx, t) {
    fill(ctx, A.nuit);
    const horizon = H * 0.45;
    ctx.lineWidth = 2;
    ctx.strokeStyle = rgba(A.magenta, 0.7);
    for (let i = -20; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + i * 12, horizon);
      ctx.lineTo(W / 2 + i * 260, H);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(A.cyan, 0.7);
    for (let i = 0; i < 14; i++) {
      const k = frac(i / 14 + t * 0.6);
      const y = horizon + Math.pow(k, 2.2) * (H - horizon);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    const glow = ctx.createLinearGradient(0, horizon - 200, 0, horizon);
    glow.addColorStop(0, rgba(A.violet, 0));
    glow.addColorStop(1, rgba(A.violet, 0.55));
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - 200, W, 200);
  },
  BG_ADO_02_POPART(ctx, t) {
    fill(ctx, A.violet);
    sunburst(ctx, t, [rgba(A.magenta, 0.6), rgba(A.violet, 0)], 24, 0.4);
    halftone(ctx, rgba(A.jaune, 0.85), 36, (x, y) => 12 * (0.5 + 0.5 * Math.sin(x * 0.004 + y * 0.003 - t * 2)));
  },
  BG_ADO_03_VILLE_NEON(ctx, t) {
    fill(ctx, A.nuit);
    const colors = [A.magenta, A.cyan, A.bleu, A.violet];
    for (let i = 0; i < 18; i++) {
      const x = frac(hash(i) - t * 0.03 * (1 + (i % 3))) * (W + 200) - 100;
      const h = 120 + hash(i + 9) * 380;
      const flicker = 0.55 + 0.45 * Math.sin(t * (3 + (i % 4)) + i);
      ctx.shadowColor = colors[i % 4];
      ctx.shadowBlur = 30;
      ctx.fillStyle = rgba(colors[i % 4], 0.35 + 0.4 * flicker);
      ctx.fillRect(x, H * 0.18 + hash(i + 3) * 200, 18 + hash(i + 7) * 40, h);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(A.blanc, 0.18);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 90; i++) {
      const x = hash(i + 100) * W;
      const y = frac(hash(i + 200) + t * 1.4) * H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y + 40);
      ctx.stroke();
    }
  },
  BG_ADO_04_GRAFFITI(ctx, t) {
    fill(ctx, "#1A1420");
    ctx.strokeStyle = rgba(A.blanc, 0.05);
    ctx.lineWidth = 3;
    for (let row = 0; row < H / 60; row++) {
      for (let col = -1; col < W / 140 + 1; col++) {
        ctx.strokeRect(col * 140 + (row % 2) * 70, row * 60, 140, 60);
      }
    }
    const colors = [A.magenta, A.cyan, A.jaune, A.bleu];
    for (let i = 0; i < 9; i++) {
      const grow = Math.min(1, frac(t * 0.15 + hash(i)) * 3);
      const x = hash(i + 30) * W;
      const y = hash(i + 60) * H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 260 * grow);
      g.addColorStop(0, rgba(colors[i % 4], 0.75));
      g.addColorStop(1, rgba(colors[i % 4], 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 300, y - 300, 600, 600);
    }
  },
  BG_CLO_01_CHAPITEAU(ctx, t) {
    sunburst(ctx, t, [C.rouge, C.jaune], 28, 0.15, W / 2, -H * 0.2);
    const spot = ctx.createRadialGradient(W / 2, H * 0.6, 0, W / 2, H * 0.6, W * 0.5);
    spot.addColorStop(0, rgba(C.papier, 0.45));
    spot.addColorStop(1, rgba(C.papier, 0));
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, W, H);
  },
  BG_CLO_02_BD_RAYONS(ctx, t) {
    fill(ctx, C.jaune);
    sunburst(ctx, t, [rgba(C.papier, 0.35), rgba(C.papier, 0)], 32, -0.2);
    halftone(ctx, rgba(C.rouge, 0.55), 30, (x, y) => {
      const d = Math.hypot(x - W / 2, y - H / 2) / W;
      return 10 * d * (1 + 0.2 * Math.sin(t * 4));
    });
  },
  BG_CLO_03_CONFETTIS(ctx, t) {
    fill(ctx, C.papier);
    const colors = [C.rouge, C.jaune, C.vert, C.bleu];
    for (let i = 0; i < 140; i++) {
      const x = hash(i) * W + 30 * Math.sin(t * 2 + i);
      const y = frac(hash(i + 500) + t * (0.08 + hash(i + 900) * 0.08)) * (H + 40) - 20;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 3 + i);
      ctx.fillStyle = colors[i % 4];
      ctx.fillRect(-9, -4, 18, 8);
      ctx.restore();
    }
  },
  BG_OUT_OR_BOKEH(ctx, t) {
    fill(ctx, O.noir);
    for (let i = 0; i < 40; i++) {
      const r = 20 + hash(i) * 90;
      const x = hash(i + 10) * W + 40 * Math.sin(t * 0.2 + i);
      const y = frac(hash(i + 20) - t * 0.01 * (1 + (i % 3))) * (H + 2 * r) - r;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(O.or, 0.28));
      g.addColorStop(0.7, rgba(O.or, 0.12));
      g.addColorStop(1, rgba(O.or, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  },
};

function proceduralFor(id) {
  if (PROCEDURAL[id]) return PROCEDURAL[id];
  if (id.startsWith("BG_ENF")) return PROCEDURAL.BG_ENF;
  return (ctx) => fill(ctx, N.fond);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} id identifiant d'asset (timeline.json › assets)
 * @param {number} t temps global (s)
 * @param {(id: string) => HTMLVideoElement | null} videoFor
 */
export function drawBackground(ctx, id, t, videoFor) {
  const video = videoFor(id);
  if (video) {
    ctx.drawImage(video, 0, 0, W, H);
    return;
  }
  proceduralFor(id)(ctx, t);
}

function sparkles(ctx, t, color, count, seed, speed) {
  for (let i = 0; i < count; i++) {
    const x = hash(seed + i) * W;
    const y = frac(hash(seed + i + 300) - t * speed * (0.5 + hash(seed + i + 600))) * H;
    const tw = 0.5 + 0.5 * Math.sin(t * 4 + i);
    ctx.fillStyle = rgba(color, 0.35 + 0.6 * tw);
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + 3 * tw, 0, TAU);
    ctx.fill();
  }
}

const OVERLAYS = {
  OVL_INT_LIGHT_STREAKS(ctx, t) {
    for (let i = 0; i < 5; i++) {
      const y = hash(i + 40) * H;
      const x = frac(t * 0.5 + hash(i)) * (W * 1.6) - W * 0.3;
      const g = ctx.createLinearGradient(x - 500, 0, x + 500, 0);
      g.addColorStop(0, rgba(N.fond, 0));
      g.addColorStop(0.5, rgba(i % 2 ? "#BFF6FF" : "#FFFFFF", 0.55));
      g.addColorStop(1, rgba(N.fond, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 500, y - 3, 1000, 6);
    }
  },
  OVL_ENF_BULLES(ctx, t) {
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const r = 14 + hash(i + 70) * 40;
      const x = hash(i + 80) * W + 25 * Math.sin(t + i);
      const y = H + r - frac(t / 10 + hash(i + 90)) * (H + 2 * r);
      ctx.strokeStyle = rgba(E.blanc, 0.7);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(E.blanc, 0.6);
      ctx.beginPath();
      ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.11, -0.6, 0, TAU);
      ctx.fill();
    }
  },
  OVL_ENF_PARTICULES: (ctx, t) => sparkles(ctx, t, E.jaune, 60, 1000, 0.04),
  OVL_ADO_NEON_FLARES(ctx, t, env) {
    const pulse = beatPulse(t, env?.bpm?.ado ?? 128, env?.sectionStart?.ado ?? 0);
    [[0.15, 0.2, A.magenta], [0.85, 0.75, A.cyan]].forEach(([fx, fy, color]) => {
      const g = ctx.createRadialGradient(W * fx, H * fy, 0, W * fx, H * fy, 520);
      g.addColorStop(0, rgba(color, 0.25 + 0.3 * pulse));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  },
  OVL_OUT_PAILLETTES: (ctx, t) => sparkles(ctx, t, O.or, 90, 2000, 0.03),
  OVL_OUT_FEUX_ARTIFICE(ctx, t) {
    for (let b = 0; b < 4; b++) {
      const k = frac(t / 2.2 + b / 4);
      const cx = (0.15 + 0.7 * hash(b + Math.floor(t / 2.2 + b / 4) * 7)) * W;
      const cy = (0.12 + 0.3 * hash(b + 31)) * H;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * TAU;
        const r = 40 + k * 260;
        ctx.fillStyle = rgba(i % 2 ? O.or : O.creme, (1 - k) * 0.9);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r + k * k * 60, 4, 0, TAU);
        ctx.fill();
      }
    }
  },
};

export function drawOverlay(ctx, id, t, opacity, env) {
  const draw = OVERLAYS[id];
  if (!draw) return;
  ctx.save();
  ctx.globalAlpha = opacity ?? 1;
  draw(ctx, t, env);
  ctx.restore();
}

// Élément de collage (rubans adhésifs) — approximation de ELT_ADO_COLLAGE.
export function drawTape(ctx, x, y, w, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = rgba(color, 0.75);
  roundRectPath(ctx, -w / 2, -18, w, 36, 0);
  ctx.fill();
  ctx.restore();
}
