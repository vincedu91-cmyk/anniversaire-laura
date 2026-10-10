// Dessin d'un plan (clip de timeline.json) à un instant donné.
import { W, H, PALETTE, FONTS, SECTION_TINT, clamp, lerp, ease, rgba, beatPulse, roundRectPath } from "./util.js";
import { drawBackground, drawOverlay, drawTape } from "./backgrounds.js";
import { drawSticker, drawComicBubble, drawStreetText, drawStrobe, drawNeonFrame } from "./effects.js";
import { drawOutroClip } from "./outro.js";

const LOOK_SECTION = { pastel_soft: "enfance", neon_cyberpunk: "ado", cartoon_pop: "clown" };
// Fond opaque du cadre « [PHOTO À AJOUTER] » par univers (couleur claire ou sombre de la palette).
const PLACEHOLDER_BASE = {
  [SECTION_TINT.enfance]: PALETTE.enfance.blanc,
  [SECTION_TINT.ado]: PALETTE.ado.nuit,
  [SECTION_TINT.clown]: PALETTE.clown.papier,
};
const PHOTO_RATIO = 3 / 2; // ratio supposé tant que la vraie photo n'est pas chargée

function layersOf(clip, role) {
  return (clip.layers || []).filter((l) => l.role === role);
}

function effectOf(clip, type) {
  return (clip.effects || []).find((e) => e.type === type);
}

function drawBackgroundLayers(ctx, clip, t, env) {
  layersOf(clip, "background").forEach((l) => drawBackground(ctx, l.asset, t, env.videoFor));
}

function drawOverlayLayers(ctx, clip, t, env) {
  layersOf(clip, "overlay").forEach((l) => drawOverlay(ctx, l.asset, t, l.opacity, env));
}

/** Rectangle de la photo centré, au ratio de l'image réelle si elle est chargée. */
function photoRect(img, scale, cx = W / 2, cy = H / 2) {
  const maxW = W * scale;
  const maxH = H * scale;
  const ratio = img ? img.naturalWidth / img.naturalHeight : PHOTO_RATIO;
  const w = Math.min(maxW, maxH * ratio);
  const h = w / ratio;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Contenu de la photo (vraie image ou cadre « [PHOTO À AJOUTER] »), zoomé à l'intérieur du cadre. */
function drawPhotoContent(ctx, rect, img, source, label, tint, zoom = { scale: 1, panX: 0 }) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(rect.x + rect.w / 2 + zoom.panX * rect.w, rect.y + rect.h / 2);
  ctx.scale(zoom.scale, zoom.scale);
  if (img) {
    ctx.drawImage(img, -rect.w / 2, -rect.h / 2, rect.w, rect.h);
  } else {
    const base = PLACEHOLDER_BASE[tint] ?? PALETTE.neutre.fond;
    ctx.fillStyle = base;
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.fillStyle = rgba(tint, 0.35);
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.strokeStyle = rgba(tint, 0.55);
    ctx.lineWidth = 18;
    for (let x = -rect.w; x < rect.w; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, -rect.h / 2);
      ctx.lineTo(x + rect.h, rect.h / 2);
      ctx.stroke();
    }
    ctx.fillStyle = base === PALETTE.ado.nuit ? PALETTE.ado.blanc : PALETTE.neutre.encre;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(rect.h * 0.07)}px ${FONTS.mono}`;
    ctx.fillText("[PHOTO À AJOUTER]", 0, -rect.h * 0.06, rect.w * 0.9);
    ctx.font = `${Math.round(rect.h * 0.045)}px ${FONTS.mono}`;
    ctx.fillText(`${label} · ${source?.file ?? ""}`, 0, rect.h * 0.06, rect.w * 0.9);
  }
  ctx.restore();
}

function kenBurns(effect, p) {
  if (!effect) return { scale: 1, panX: 0 };
  const k = ease.inOutSine(clamp(p));
  const panDir = effect.pan === "left_to_right" ? 1 : effect.pan === "right_to_left" ? -1 : 0;
  const scale = lerp(effect.from_scale, effect.to_scale, k);
  return { scale, panX: panDir * (k - 0.5) * (scale - 1) * 0.9 };
}

// Ralenti comique : punch-in lent puis arrêt sur image qui tremble.
function comicSlowmo(effect, local, duration) {
  if (!effect) return { scale: 1, dx: 0, dy: 0 };
  const start = duration - effect.hold_s - 1.2;
  if (local < start) return { scale: 1, dx: 0, dy: 0 };
  const k = ease.outCubic(clamp((local - start) / 1.2));
  const frozen = local > start + 1.2;
  return {
    scale: 1 + 0.18 * k,
    dx: frozen ? 6 * Math.sin(local * 90) : 0,
    dy: frozen ? 4 * Math.cos(local * 77) : 0,
  };
}

function drawEnfancePhoto(ctx, clip, t, env, local, p) {
  const layer = layersOf(clip, "photo")[0];
  const img = env.photoFor(clip.source);
  const rect = photoRect(img, layer.scale);
  ctx.save();
  ctx.shadowColor = rgba(PALETTE.enfance.prune, 0.28);
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = PALETTE.enfance.blanc;
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, layer.corner_radius_px);
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, layer.corner_radius_px);
  ctx.clip();
  drawPhotoContent(ctx, rect, img, clip.source, clip.id, SECTION_TINT.enfance, kenBurns(effectOf(clip, "ken_burns"), p));
  ctx.restore();
}

function drawAdoPhoto(ctx, clip, t, env) {
  const layer = layersOf(clip, "photo")[0];
  const img = env.photoFor(clip.source);
  const punch = effectOf(clip, "zoom_punch");
  const s = punch ? 1 + (punch.to_scale - 1) * beatPulse(t, env.bpm.ado, env.sectionStart.ado) : 1;
  const rect = photoRect(img, layer.scale);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(s, s);
  ctx.translate(-W / 2, -H / 2);
  drawPhotoContent(ctx, rect, img, clip.source, clip.id, SECTION_TINT.ado);
  const neon = effectOf(clip, "neon_frame");
  if (neon) drawNeonFrame(ctx, rect, neon.color, neon.glow_px);
  ctx.restore();
}

function drawClownPhoto(ctx, clip, t, env, local) {
  const layer = layersOf(clip, "photo")[0];
  const img = env.photoFor(clip.source);
  const outline = effectOf(clip, "cartoon_outline");
  const slow = comicSlowmo(effectOf(clip, "ralenti_comique"), local, clip.duration);
  const rect = photoRect(img, layer.scale);
  ctx.save();
  ctx.translate(W / 2 + slow.dx, H / 2 + slow.dy);
  ctx.rotate(((outline?.rotation_deg ?? 0) * Math.PI) / 180);
  ctx.scale(slow.scale, slow.scale);
  ctx.translate(-W / 2, -H / 2);
  ctx.fillStyle = PALETTE.clown.noir; // ombre dure (DESIGN.md › Bêtises)
  ctx.fillRect(rect.x + 18, rect.y + 18, rect.w, rect.h);
  drawPhotoContent(ctx, rect, img, clip.source, clip.id, SECTION_TINT.clown);
  if (outline) {
    ctx.lineWidth = outline.width_px;
    ctx.strokeStyle = outline.color;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
  (clip.effects || []).forEach((e) => {
    if (e.type === "sticker_visage") drawSticker(ctx, e, rect, local);
    if (e.type === "bulle_bd_popup") drawComicBubble(ctx, e, rect, local);
  });
  ctx.restore();
}

function drawCollage(ctx, clip, t, env, local) {
  const group = layersOf(clip, "photo_group")[0];
  const centers = [[0.27, 0.48], [0.5, 0.53], [0.73, 0.46]];
  clip.sources.forEach((source, i) => {
    const k = clamp((local - i * group.stagger_s) / 0.45);
    if (k <= 0) return;
    const img = env.photoFor(source);
    const [fx, fy] = centers[i];
    const rect = photoRect(img, group.scale, 0, 0);
    ctx.save();
    ctx.translate(W * fx, H * fy);
    ctx.rotate((group.rotations_deg[i] * Math.PI) / 180);
    const s = lerp(1.5, 1, ease.outBack(k));
    ctx.scale(s, s);
    ctx.globalAlpha = clamp(k * 2);
    ctx.fillStyle = PALETTE.ado.blanc;
    ctx.fillRect(rect.x - 14, rect.y - 14, rect.w + 28, rect.h + 28);
    drawPhotoContent(ctx, rect, img, source, `${clip.id}.${i + 1}`, SECTION_TINT.ado);
    drawTape(ctx, 0, rect.y - 6, rect.w * 0.35, 0.08 * (i - 1), PALETTE.ado.jaune);
    ctx.restore();
  });
}

function drawTeaser(ctx, clip, t, env, local, p) {
  const section = LOOK_SECTION[clip.look] ?? "intro";
  const img = env.photoFor(clip.source);
  const s = lerp(1, 1.12, ease.outCubic(p));
  ctx.fillStyle = PALETTE.neutre.encre;
  ctx.fillRect(0, 0, W, H);
  drawPhotoContent(ctx, { x: 0, y: 0, w: W, h: H }, img, clip.source, clip.id, SECTION_TINT[section], { scale: s, panX: 0 });
}

function drawExtrudedText(ctx, text, x, y, depth) {
  const layers = [PALETTE.enfance.rose, PALETTE.ado.magenta, PALETTE.clown.jaune];
  for (let i = depth; i > 0; i--) {
    ctx.fillStyle = layers[Math.floor(((i - 1) / depth) * layers.length)];
    ctx.fillText(text, x + i * 1.6, y + i * 1.6);
  }
  ctx.fillStyle = PALETTE.neutre.encre;
  ctx.fillText(text, x, y);
}

function drawTitle(ctx, clip, t, env, local) {
  drawBackgroundLayers(ctx, clip, t, env);
  const lock = clip.type === "title_lock";
  const pulse = lock ? 1 + 0.04 * beatPulse(t, env.bpm.intro) : 1;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(pulse, pulse);
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 330px ${FONTS.titre}`;
  const word = "LAURA";
  const total = ctx.measureText(word).width;
  let x = -total / 2;
  [...word].forEach((letter, i) => {
    const k = lock ? 1 : clamp((local - 0.2 - i * 0.09) / 0.35);
    const w = ctx.measureText(letter).width;
    if (k > 0) {
      ctx.save();
      ctx.translate(x + w / 2, 40);
      const s = lerp(2.4, 1, ease.outBack(k));
      ctx.scale(s, s);
      ctx.globalAlpha = clamp(k * 2);
      ctx.textAlign = "center";
      drawExtrudedText(ctx, letter, 0, 0, 18);
      ctx.restore();
    }
    x += w;
  });
  const sub = lock ? 1 : ease.outCubic(clamp((local - 1.3) / 0.6));
  ctx.globalAlpha = sub;
  ctx.textAlign = "center";
  ctx.font = `700 96px ${FONTS.titre}`;
  drawExtrudedText(ctx, "18 ANS DE SOUVENIRS", 0, 200 + (1 - sub) * 60, 8);
  ctx.restore();
  drawOverlayLayers(ctx, clip, t, env);
}

/**
 * Dessine un clip complet sur ctx (fond, photo, surimpressions, effets plein cadre).
 * @param {object} env { videoFor, photoFor, mosaic }
 */
export function drawClip(ctx, clip, t, env) {
  const local = t - clip.start;
  const p = clamp(local / clip.duration);
  if (clip.type === "title" || clip.type === "title_lock") return drawTitle(ctx, clip, t, env, local);
  if (clip.type === "teaser_flash") return drawTeaser(ctx, clip, t, env, local, p);
  if (clip.section === "outro") return drawOutroClip(ctx, clip, t, env);

  drawBackgroundLayers(ctx, clip, t, env);
  if (clip.type === "collage") drawCollage(ctx, clip, t, env, local);
  else if (clip.section === "enfance") drawEnfancePhoto(ctx, clip, t, env, local, p);
  else if (clip.section === "ado") drawAdoPhoto(ctx, clip, t, env);
  else if (clip.section === "clown") drawClownPhoto(ctx, clip, t, env, local);
  drawOverlayLayers(ctx, clip, t, env);

  (clip.effects || []).forEach((e) => {
    if (e.type === "stroboscope_leger") drawStrobe(ctx, e, local);
    if (e.type === "texte_street_art") drawStreetText(ctx, e, local);
  });
}
