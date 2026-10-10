// Constantes et utilitaires partagés par l'animatique (canvas 2D, 1920x1080).

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const TAU = Math.PI * 2;

// Palettes : DESIGN.md › 3. Palettes.
export const PALETTE = {
  neutre: { fond: "#E7E8EB", encre: "#0D0D11" },
  enfance: { rose: "#E7B9C4", bleu: "#B6D2E8", jaune: "#F0E1A0", lavande: "#DAD3EC", blanc: "#F5F1F2", prune: "#3B3042" },
  ado: { nuit: "#08040F", magenta: "#FF2BD6", cyan: "#00F0FF", violet: "#7B2BFF", bleu: "#2D5BFF", jaune: "#E4FF1A", blanc: "#F6F3FF" },
  clown: { jaune: "#FFD400", rouge: "#E5202E", vert: "#17B857", bleu: "#1F4FE0", papier: "#FFFDF2", noir: "#111111" },
  outro: { noir: "#070605", or: "#FFD27A", creme: "#F4EBDD" },
};

// Typographie : DESIGN.md › 4. Typographie (aucune serif).
export const FONTS = {
  titre: '"Bricolage Grotesque"',
  mono: '"Geist Mono"',
  enfance: '"Caveat"',
  ado: '"Anton"',
  clown: '"Bangers"',
};

// Couleur dominante d'un univers (placeholder photo, tuiles de mosaïque…).
export const SECTION_TINT = {
  intro: PALETTE.neutre.encre,
  enfance: PALETTE.enfance.rose,
  ado: PALETTE.ado.magenta,
  clown: PALETTE.clown.jaune,
  outro: PALETTE.outro.or,
};

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const frac = (x) => x - Math.floor(x);

export const ease = {
  inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  outBack: (k) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
  },
  outElastic: (k) => {
    if (k <= 0) return 0;
    if (k >= 1) return 1;
    return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pseudo-aléatoire sans état : même entrée → même valeur (rendu identique à chaque passage).
export function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function timecode(t) {
  const frames = Math.max(0, Math.round(t * FPS));
  const ff = frames % FPS;
  const total = Math.floor(frames / FPS);
  const pad = (v) => String(v).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:${pad(ff)}`;
}

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (r > 0) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

export function starPath(ctx, cx, cy, outer, inner, points, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i / (points * 2)) * TAU;
    ctx[i === 0 ? "moveTo" : "lineTo"](cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

export function makeCanvas(width = W, height = H) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

// Impulsion sur le temps fort : 1 sur le temps, décroît jusqu'au suivant.
export function beatPulse(t, bpm, origin = 0) {
  const beat = ((t - origin) * bpm) / 60;
  return Math.pow(1 - frac(beat), 3);
}
