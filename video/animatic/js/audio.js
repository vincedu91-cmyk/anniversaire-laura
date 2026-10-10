// Son de l'animatique : musiques (éléments <audio> recalés sur l'horloge) et SFX (Web Audio,
// déclenchés à l'instant exact où la tête de lecture franchit leur repère).
import { clamp } from "./util.js";

const RESYNC_S = 0.25; // écart toléré avant de recaler un morceau sur l'horloge
const dbToGain = (db) => Math.pow(10, db / 20);

// L'élément <audio> n'est créé qu'au premier besoin : pas de téléchargement des MP3 à l'ouverture.
function makeMusicTrack(cue, src) {
  return {
    src,
    el: null,
    start: cue.start,
    end: cue.end,
    mediaStart: cue.media_start_s ?? 0,
    gain: dbToGain(cue.gain_db ?? 0),
    fadeIn: cue.fade_in_s ?? 0,
    fadeOut: cue.fade_out_s ?? 0,
  };
}

function fadeAt(track, t) {
  const fin = track.fadeIn > 0 ? clamp((t - track.start) / track.fadeIn) : 1;
  const fout = track.fadeOut > 0 ? clamp((track.end - t) / track.fadeOut) : 1;
  return Math.min(fin, fout);
}

/** Tous les repères SFX : ceux des plans (transitions, bulles…) et les globaux. */
function collectSfxCues(timeline) {
  const fromClips = timeline.sections.flatMap((s) => s.clips.flatMap((c) => c.sfx || []));
  return [...fromClips, ...timeline.audio.sfx_global].sort((a, b) => a.at - b.at);
}

/**
 * @param {object} timeline contenu de timeline.json
 * @param {string} root préfixe des chemins d'assets (racine du projet)
 */
export function createAudio(timeline, root) {
  const assets = timeline.assets;
  const music = timeline.audio.music
    .filter((c) => assets[c.asset]?.source === "fichier fourni")
    .map((c) => ({ ...makeMusicTrack(c, root + assets[c.asset].path), kind: "music" }));
  const voices = (timeline.audio.voice_over || []).filter((c) => assets[c.asset]?.status === "ok" && c.duration);
  const voiceTracks = voices.map((c) => ({
    ...makeMusicTrack({ ...c, end: c.start + c.duration }, root + assets[c.asset].path),
    kind: "voice",
  }));
  const duck = dbToGain(timeline.audio.ducking?.reduction_db ?? -10);
  const voiceActive = (t) => voices.some((c) => t >= c.start && t < c.start + c.duration);
  const sfxCues = collectSfxCues(timeline).filter((c) => assets[c.asset]?.status === "ok");

  let ctx = null; // AudioContext créé au premier clic (politique d'autoplay des navigateurs)
  const buffers = new Map();
  const live = new Set();

  async function loadBuffer(id) {
    if (buffers.has(id)) return;
    buffers.set(id, null);
    try {
      const res = await fetch(root + assets[id].path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buffers.set(id, await ctx.decodeAudioData(await res.arrayBuffer()));
    } catch {
      buffers.delete(id); // nouvel essai au prochain déclenchement
    }
  }

  function ensureContext() {
    if (ctx) return;
    ctx = new AudioContext();
    new Set(sfxCues.map((c) => c.asset)).forEach(loadBuffer);
  }

  function fire(cue, offset) {
    const buffer = buffers.get(cue.asset);
    if (!buffer || offset >= buffer.duration) return;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.value = dbToGain(cue.gain_db ?? 0);
    src.connect(gain).connect(ctx.destination);
    src.addEventListener("ended", () => live.delete(src));
    live.add(src);
    src.start(0, offset);
  }

  function stopSfx() {
    live.forEach((src) => src.stop());
    live.clear();
  }

  return {
    sfxCount: sfxCues.length,

    /**
     * À appeler à chaque image. Le son n'est joué qu'en lecture à 1×.
     * @param {number} prevT position à l'image précédente (pour les SFX franchis entre deux images)
     */
    update(t, prevT, { playing, speed, enabled }) {
      const on = enabled && playing && speed === 1;
      if (on) {
        ensureContext();
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
      } else {
        stopSfx();
      }
      const ducked = voiceActive(t); // la musique baisse pendant la voix off
      [...music, ...voiceTracks].forEach((tr) => {
        if (!on || t < tr.start || t >= tr.end) {
          if (tr.el && !tr.el.paused) tr.el.pause();
          return;
        }
        if (!tr.el) {
          tr.el = new Audio(tr.src);
          tr.el.preload = "auto";
        }
        const expected = tr.mediaStart + (t - tr.start);
        if (tr.el.paused || Math.abs(tr.el.currentTime - expected) > RESYNC_S) tr.el.currentTime = expected;
        tr.el.volume = clamp(tr.gain * fadeAt(tr, t) * (tr.kind === "music" && ducked ? duck : 1));
        if (tr.el.paused) tr.el.play().catch(() => {});
      });
      if (!on || t <= prevT) return;
      sfxCues.filter((c) => c.at > prevT && c.at <= t).forEach((c) => fire(c, t - c.at));
    },
  };
}
