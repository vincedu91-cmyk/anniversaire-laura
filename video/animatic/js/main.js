// Lecteur de l'animatique : charge timeline.json, rend la vidéo (6 min) en temps réel sur canvas 2D.
import { W, H, FPS, clamp, makeCanvas, timecode } from "./util.js";
import { drawClip } from "./scene.js";
import { composite } from "./transitions.js";
import { buildMosaic } from "./outro.js";
import { createAudio } from "./audio.js";
import { drawScreenText } from "./effects.js";

const PROJECT_ROOT = "../../";
const TIMELINE_URL = `${PROJECT_ROOT}timeline.json`;
const FONT_SPECS = [
  '800 100px "Bricolage Grotesque"',
  '700 100px "Bricolage Grotesque"',
  '400 40px "Geist Mono"',
  '600 40px "Geist Mono"',
  '100px "Anton"',
  '100px "Bangers"',
  '700 100px "Caveat"',
];
const VIDEO_RESYNC_S = 0.3;
const HUD_EVERY_FRAMES = 3;

const $ = (id) => document.getElementById(id);
const screen = $("screen");
const ctx = screen.getContext("2d");
const bufA = makeCanvas(W, H);
const bufB = makeCanvas(W, H);

const state = { t: 0, prevT: 0, playing: false, speed: 1, last: null, frameCount: 0 };
let total = 360; // remplacé par timeline.project.duration_s au chargement
let timeline = null;
let clips = [];
let env = null;
let audio = null;

const audioState = () => ({ playing: state.playing, speed: state.speed, enabled: $("opt-sound").checked });

// ------------------------------------------------------------ médias
const videos = new Map();
const photos = new Map();

function videoFor(id) {
  const asset = timeline.assets[id];
  if (!asset || asset.type !== "video") return null;
  if (!videos.has(id)) {
    const el = document.createElement("video");
    const entry = { el, ready: false, usedAt: -1 };
    Object.assign(el, { muted: true, loop: true, playsInline: true, preload: "auto" });
    el.addEventListener("loadeddata", () => (entry.ready = true));
    el.addEventListener("error", () => (entry.ready = false));
    el.src = PROJECT_ROOT + asset.path;
    videos.set(id, entry);
  }
  const entry = videos.get(id);
  if (!entry.ready) return null;
  entry.usedAt = state.frameCount;
  syncVideo(entry.el);
  return entry.el;
}

function syncVideo(el) {
  const expected = state.t % el.duration; // les fonds bouclent : temps global modulo durée
  if (!state.playing || Math.abs(el.currentTime - expected) > VIDEO_RESYNC_S) el.currentTime = expected;
  el.playbackRate = state.speed;
  if (state.playing && el.paused) el.play().catch(() => {});
  if (!state.playing && !el.paused) el.pause();
}

function pauseUnusedVideos() {
  videos.forEach((entry) => {
    if (entry.usedAt !== state.frameCount && !entry.el.paused) entry.el.pause();
  });
}

function photoFor(source) {
  if (!source || source.placeholder || source.is_video) return null;
  const key = `${source.folder}/${source.file}`;
  if (!photos.has(key)) {
    const entry = { img: new Image(), ok: false };
    entry.img.addEventListener("load", () => (entry.ok = true));
    entry.img.src = `${PROJECT_ROOT}${source.folder}/${encodeURIComponent(source.file)}`;
    photos.set(key, entry);
  }
  const entry = photos.get(key);
  return entry.ok ? entry.img : null;
}

// ------------------------------------------------------------ résolution du plan à l'instant t
function clipIndexAt(t) {
  let lo = 0;
  let hi = clips.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (clips[mid].start <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Plan unique, ou paire de plans quand t tombe dans une transition centrée sur la coupe. */
function resolve(t) {
  const i = clipIndexAt(t);
  const clip = clips[i];
  const dIn = clip.transition_in?.duration ?? 0;
  if (i > 0 && dIn > 0 && t < clip.start + dIn / 2) {
    return { a: clips[i - 1], b: clip, style: clip.transition_in.style, k: (t - (clip.start - dIn / 2)) / dIn };
  }
  const next = clips[i + 1];
  const dNext = next?.transition_in?.duration ?? 0;
  if (next && dNext > 0 && t >= next.start - dNext / 2) {
    return { a: clip, b: next, style: next.transition_in.style, k: (t - (next.start - dNext / 2)) / dNext };
  }
  return { clip };
}

function resetContext(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  Object.assign(c, { globalAlpha: 1, globalCompositeOperation: "source-over", filter: "none", shadowBlur: 0 });
}

function render(t) {
  state.frameCount += 1;
  const frame = resolve(t);
  resetContext(ctx);
  if (frame.clip) {
    drawClip(ctx, frame.clip, t, env);
    const fadeIn = frame.clip.transition_in?.style === "fade_from_black" ? frame.clip.transition_in.duration : 0;
    if (fadeIn > 0 && t < fadeIn) {
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - t / fadeIn})`;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    [[bufA, frame.a], [bufB, frame.b]].forEach(([buf, clip]) => {
      const c = buf.getContext("2d");
      resetContext(c);
      drawClip(c, clip, t, env);
    });
    composite(ctx, bufA, bufB, frame.style, clamp(frame.k), Math.round(t * FPS));
  }
  (timeline.audio.screen_texts || []).forEach((item) => drawScreenText(ctx, item, t));
  pauseUnusedVideos();
  if (state.frameCount % HUD_EVERY_FRAMES === 0 || !state.playing) updateOverlays(t, frame);
}

// ------------------------------------------------------------ HUD
function hudLines(t, frame) {
  const clip = frame.clip ?? (frame.k < 0.5 ? frame.a : frame.b);
  const section = timeline.sections.find((s) => s.id === clip.section);
  const music = timeline.audio.music.find((m) => t >= m.start && t < m.end);
  const voice = (timeline.audio.voice_over || []).find((v) => v.duration && t >= v.start && t < v.start + v.duration);
  const sfx = [...clips.flatMap((c) => c.sfx || []), ...timeline.audio.sfx_global]
    .filter((s) => t >= s.at && t < s.at + 0.8)
    .map((s) => s.asset);
  return [
    section?.label ?? "",
    `Plan ${clip.id}${clip.type ? ` · ${clip.type}` : ""}`,
    clip.source ? `Photo : ${clip.source.folder}/${clip.source.file}` : "",
    frame.clip ? "" : `Transition : ${frame.style} (${Math.round(clamp(frame.k) * 100)} %)`,
    (clip.effects || []).length ? `Effets : ${clip.effects.map((e) => e.type).join(", ")}` : "",
    music ? `Musique : ${timeline.assets[music.asset]?.title ?? music.asset}` : "",
    voice ? `Voix : ${voice.asset} — ${voice.text}` : "",
    sfx.length ? `♪ ${[...new Set(sfx)].join(" · ")}` : "",
  ].filter(Boolean);
}

function updateOverlays(t, frame) {
  $("time").textContent = `${timecode(t)} / ${timecode(total)}`;
  $("scrub").value = String(t);
  const hud = $("hud");
  hud.hidden = !$("opt-hud").checked;
  if (hud.hidden) return;
  hud.replaceChildren(
    ...hudLines(t, frame).map((line, i) => {
      const div = document.createElement("div");
      div.textContent = line;
      if (i === 0) div.className = "hud-title";
      return div;
    }),
  );
}

// ------------------------------------------------------------ lecture
function loop(ts) {
  if (state.playing) {
    const dt = state.last === null ? 0 : Math.min(0.25, (ts - state.last) / 1000) * state.speed;
    state.prevT = state.t;
    state.t = Math.min(total, state.t + dt);
    if (state.t >= total) setPlaying(false);
    render(state.t);
    audio.update(state.t, state.prevT, audioState());
  }
  state.last = ts;
  requestAnimationFrame(loop);
}

function setPlaying(playing) {
  state.playing = playing;
  $("play").textContent = playing ? "❚❚ Pause" : "▶ Lecture";
  if (!playing) render(state.t);
  audio.update(state.t, state.t, audioState());
}

function seek(t) {
  state.t = clamp(t, 0, total);
  state.prevT = state.t;
  render(state.t);
  audio.update(state.t, state.t, audioState()); // un saut ne déclenche pas les SFX franchis
}

function setupUI() {
  $("play").addEventListener("click", () => setPlaying(!state.playing));
  $("scrub").addEventListener("input", (e) => seek(Number(e.target.value)));
  $("speed").addEventListener("change", (e) => (state.speed = Number(e.target.value)));
  $("opt-sound").addEventListener("change", () => audio.update(state.t, state.t, audioState()));
  $("opt-hud").addEventListener("change", () => render(state.t));
  $("fullscreen").addEventListener("click", () => $("stage").requestFullscreen?.());

  timeline.sections.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${i + 1}. ${s.label.split(" — ")[0]}`;
    btn.title = s.label;
    btn.addEventListener("click", () => seek(s.start));
    $("sections").append(btn);
    const tick = document.createElement("span");
    tick.style.left = `${(s.start / total) * 100}%`;
    $("marks").append(tick);
  });

  window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
    const step = e.shiftKey ? 10 : 1;
    const actions = {
      " ": () => setPlaying(!state.playing),
      ArrowLeft: () => seek(state.t - step),
      ArrowRight: () => seek(state.t + step),
      ",": () => seek(state.t - 1 / FPS),
      ".": () => seek(state.t + 1 / FPS),
      Home: () => seek(0),
      h: () => $("opt-hud").click(),
      m: () => $("opt-sound").click(),
      f: () => $("fullscreen").click(),
    };
    const sectionKey = Number(e.key);
    if (sectionKey >= 1 && sectionKey <= timeline.sections.length) seek(timeline.sections[sectionKey - 1].start);
    else if (actions[e.key]) actions[e.key]();
    else return;
    e.preventDefault();
  });
}

function showError(detail) {
  const box = $("error");
  const lines = [
    `Impossible de charger timeline.json (${detail}).`,
    "Ouvrez cette page via un serveur local lancé à la racine du projet :",
    "python -m http.server 3200  →  http://localhost:3200/video/animatic/",
  ];
  box.replaceChildren(...lines.map((line) => Object.assign(document.createElement("p"), { textContent: line })));
  box.hidden = false;
}

async function init() {
  try {
    const res = await fetch(TIMELINE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    timeline = await res.json();
  } catch (err) {
    showError(err instanceof Error ? err.message : String(err));
    return;
  }
  await Promise.all(FONT_SPECS.map((spec) => document.fonts.load(spec).catch(() => null)));
  total = timeline.project.duration_s;
  clips = timeline.sections.flatMap((s) => s.clips.map((c) => ({ ...c, section: s.id })));
  const assembly = clips.find((c) => c.type === "mosaic_assembly");
  const startOf = (id) => timeline.sections.find((s) => s.id === id)?.start ?? 0;
  const bpmOf = (id, fallback) => timeline.assets[id]?.bpm ?? fallback;
  env = {
    videoFor,
    photoFor,
    mosaic: buildMosaic(assembly, timeline.validation.placeholders),
    bpm: { intro: bpmOf("MUS_INTRO", 120), ado: bpmOf("MUS_ADO", 128) },
    sectionStart: { ado: startOf("ado") },
  };
  audio = createAudio(timeline, PROJECT_ROOT);
  $("scrub").max = String(total);
  $("scrub").step = String(1 / FPS);
  $("tiles").textContent = `${env.mosaic.tiles.length} tuiles dans le « 18 » · ${audio.sfxCount} SFX`;
  setupUI();
  // Lien partageable vers un instant précis : ?t=212.5 (secondes) ; &hud=0 masque le HUD.
  const params = new URLSearchParams(location.search);
  if (params.get("hud") === "0") $("opt-hud").checked = false;
  seek(Number(params.get("t")) || 0);
  requestAnimationFrame(loop);
}

init();
