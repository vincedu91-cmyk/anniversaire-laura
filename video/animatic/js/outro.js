// Outro : mosaïque de photos qui forme « 18 », puis message final.
import { W, H, TAU, PALETTE, FONTS, SECTION_TINT, clamp, lerp, ease, rgba, hash, makeCanvas } from "./util.js";
import { drawBackground, drawOverlay } from "./backgrounds.js";

const FOLDER_SECTION = {
  "photos/Naissance-Enfance": "enfance",
  "photos/Adolescence": "ado",
  "photos/Laura-le-petit-clown": "clown",
};

/** Cellules de la grille dont le centre tombe dans un « 18 » dessiné (équivalent de MASK_18.png). */
function maskCells(cols, rows, cell) {
  const mask = makeCanvas(W, H);
  const m = mask.getContext("2d", { willReadFrequently: true });
  m.fillStyle = "#FFFFFF";
  m.textAlign = "center";
  m.textBaseline = "middle";
  m.font = `800 1000px ${FONTS.titre}`;
  m.fillText("18", W / 2, H / 2 + 40);
  const data = m.getImageData(0, 0, W, H).data;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = Math.floor(c * cell + cell / 2);
      const y = Math.floor(r * cell + cell / 2);
      if (data[(y * W + x) * 4 + 3] > 128) cells.push({ c, r });
    }
  }
  return cells;
}

/**
 * À appeler une fois les polices chargées.
 * @param {object} assemblyClip clip OUT_MOSAIC_ASSEMBLY
 * @param {Record<string, boolean>} placeholders timeline.validation.placeholders (true = noms fictifs)
 */
export function buildMosaic(assemblyClip, placeholders) {
  const spec = assemblyClip.mosaic;
  const { cols, rows, cell_px: cell } = spec.grid;
  const cells = maskCells(cols, rows, cell);
  const order = cells.map((_, i) => i).sort((a, b) => hash(a + 7) - hash(b + 7));
  const pool = spec.pool;
  const tiles = cells.map((cellPos, i) => {
    const folder = pool[i % pool.length];
    const file = folder.files[Math.floor(i / pool.length) % folder.files.length];
    const edge = Math.floor(hash(i + 11) * 4);
    const along = hash(i + 23);
    const from = [
      [-200, along * H],
      [W + 200, along * H],
      [along * W, -200],
      [along * W, H + 200],
    ][edge];
    return {
      x: cellPos.c * cell + cell / 2,
      y: cellPos.r * cell + cell / 2,
      source: { folder: folder.folder, file, placeholder: Boolean(placeholders[FOLDER_SECTION[folder.folder]]) },
      tint: SECTION_TINT[FOLDER_SECTION[folder.folder]] ?? PALETTE.outro.or,
      fromX: from[0],
      fromY: from[1],
      spin: (hash(i + 31) - 0.5) * 2.5,
      rank: order.indexOf(i),
    };
  });
  const { duration_s: assemblyS, stagger_s: stagger } = spec.assembly;
  const flight = Math.max(1.2, assemblyS - (tiles.length - 1) * stagger);
  return { tiles, cell, stagger, flight, assemblyStart: assemblyClip.start };
}

function drawTile(ctx, tile, size, img, glow) {
  ctx.fillStyle = tile.tint;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.fillStyle = rgba(PALETTE.outro.or, 0.1 + glow); // teinte dorée (gold_tint_10pct)
  ctx.fillRect(-size / 2, -size / 2, size, size);
}

function drawMosaic(ctx, mosaic, t, env, { assemblyStart, camera, shimmer, alpha }) {
  const size = mosaic.cell - 4;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H / 2);
  ctx.scale(camera, camera);
  ctx.translate(-W / 2, -H / 2);
  mosaic.tiles.forEach((tile) => {
    const k = clamp((t - assemblyStart - tile.rank * mosaic.stagger) / mosaic.flight);
    if (k <= 0) return;
    const e = ease.outBack(k);
    const glow = shimmer ? 0.3 * Math.max(0, Math.sin((t * TAU) / 1.5 - (tile.x + tile.y) / 300)) : 0;
    ctx.save();
    ctx.translate(lerp(tile.fromX, tile.x, e), lerp(tile.fromY, tile.y, e));
    ctx.rotate(lerp(tile.spin, 0, e));
    drawTile(ctx, tile, size, env.photoFor(tile.source), glow);
    ctx.restore();
  });
  ctx.restore();
}

function drawFinalMessage(ctx, clip, local) {
  const k = ease.outCubic(clamp((local - 0.5) / 0.9));
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(W / 2, H / 2 + (1 - k) * 40);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const gold = ctx.createLinearGradient(-600, -100, 600, 100);
  gold.addColorStop(0, PALETTE.outro.creme);
  gold.addColorStop(0.5, PALETTE.outro.or);
  gold.addColorStop(1, PALETTE.outro.creme);
  ctx.shadowColor = rgba(PALETTE.outro.or, 0.6);
  ctx.shadowBlur = 40;
  ctx.fillStyle = gold;
  ctx.font = `700 110px ${FONTS.titre}`;
  ctx.fillText("Joyeux 18ème Anniversaire", 0, -80, W * 0.9);
  ctx.font = `800 190px ${FONTS.titre}`;
  ctx.fillText("Laura !", 0, 110);
  ctx.restore();
}

function fadeToBlack(ctx, clip, t) {
  const fade = (clip.effects || []).find((e) => e.type === "fade_to_black");
  if (!fade || t < fade.start) return;
  ctx.fillStyle = rgba(PALETTE.outro.noir, clamp((t - fade.start) / fade.duration_s));
  ctx.fillRect(0, 0, W, H);
}

export function drawOutroClip(ctx, clip, t, env) {
  const mosaic = env.mosaic;
  const { assemblyStart } = mosaic;
  (clip.layers || []).forEach((l) => {
    if (l.role === "background") drawBackground(ctx, l.asset, t, env.videoFor);
  });
  if (clip.type === "mosaic_assembly") {
    drawMosaic(ctx, mosaic, t, env, { assemblyStart, camera: 1, shimmer: false, alpha: 1 });
  } else if (clip.type === "mosaic_hold") {
    const k = ease.inOutSine(clamp((t - clip.start) / clip.duration));
    drawMosaic(ctx, mosaic, t, env, { assemblyStart, camera: lerp(1, 0.88, k), shimmer: true, alpha: 1 });
  } else if (clip.type === "final_message") {
    drawMosaic(ctx, mosaic, t, env, { assemblyStart, camera: 0.88, shimmer: true, alpha: 0.35 });
  }
  (clip.layers || []).forEach((l) => {
    if (l.role === "overlay") drawOverlay(ctx, l.asset, t, l.opacity, env);
  });
  if (clip.type === "final_message") drawFinalMessage(ctx, clip, t - clip.start);
  fadeToBlack(ctx, clip, t);
}
