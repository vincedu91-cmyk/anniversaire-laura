"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  CornersIn,
  CornersOut,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
  Subtitles,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import type { FilmTrack } from "@/data/film";
import { duration, ease } from "@/motion/tokens";
import { audio } from "@/lib/audio";
import { MagneticWrap } from "../motion/MagneticWrap";

interface FilmPlayerProps {
  title: string;
  src: string | null;
  poster: string | null;
  tracks: readonly FilmTrack[];
  directory: string;
}

const SEEK_STEP_S = 5;
const VOLUME_STEP = 0.1;
const HIDE_CONTROLS_MS = 2600;

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "00:00";
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** Lecteur plein écran personnalisé: lecture, curseur de temps, volume, plein écran, sous-titres, raccourcis clavier. */
export function FilmPlayer({ title, src, poster, tracks, directory }: FilmPlayerProps) {
  const shell = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [captions, setCaptions] = useState(tracks.length > 0);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Le film a sa propre bande son: l'ambiance du site se coupe pendant la lecture.
  useEffect(() => {
    if (playing && audio.isEnabled()) audio.disable();
  }, [playing]);

  const wake = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), HIDE_CONTROLS_MS);
  }, []);

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === shell.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    for (const track of Array.from(element.textTracks)) track.mode = captions ? "showing" : "hidden";
  }, [captions, tracks]);

  const toggle = useCallback(() => {
    const element = video.current;
    if (!element) return;
    if (element.paused) void element.play();
    else element.pause();
  }, []);

  const seek = useCallback((to: number) => {
    const element = video.current;
    if (!element) return;
    element.currentTime = Math.min(Math.max(0, to), element.duration || 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.current?.requestFullscreen();
  }, []);

  const changeVolume = useCallback((next: number) => {
    const element = video.current;
    if (!element) return;
    const clamped = Math.min(1, Math.max(0, next));
    element.volume = clamped;
    element.muted = clamped === 0;
    setVolume(clamped);
    setMuted(clamped === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const element = video.current;
    if (!element) return;
    element.muted = !element.muted;
    setMuted(element.muted);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).tagName === "INPUT") return;
    const element = video.current;
    const handled: Record<string, () => void> = {
      " ": toggle,
      k: toggle,
      f: toggleFullscreen,
      m: toggleMute,
      c: () => setCaptions((value) => !value),
      ArrowRight: () => element && seek(element.currentTime + SEEK_STEP_S),
      ArrowLeft: () => element && seek(element.currentTime - SEEK_STEP_S),
      ArrowUp: () => changeVolume(volume + VOLUME_STEP),
      ArrowDown: () => changeVolume(volume - VOLUME_STEP),
    };
    const action = handled[event.key];
    if (!action) return;
    event.preventDefault();
    action();
    wake();
  };

  if (!src) {
    return (
      <div className="relative grid aspect-video w-full place-items-center border border-finale-gold/60 bg-[color-mix(in_srgb,var(--color-finale-gold)_10%,var(--color-finale-background))] p-6 text-center text-finale-ink">
        <div>
          <p className="mono text-finale-gold">[FILM À AJOUTER]</p>
          <p className="mt-4 max-w-[44ch] text-lg">
            Déposer la vidéo dans <code className="mono">{directory}laura-18-ans.mp4</code>
            , l&apos;affiche dans <code className="mono">poster.jpg</code> et les sous-titres dans <code className="mono">sous-titres-fr.vtt</code>.
          </p>
        </div>
      </div>
    );
  }

  const showControls = controlsVisible || !playing;
  return (
    <div
      ref={shell}
      role="region"
      aria-label={`Lecteur vidéo : ${title}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={wake}
      className={`group relative w-full overflow-hidden bg-finale-background text-finale-ink ${fullscreen ? "h-dvh" : "aspect-video"} ${showControls ? "" : "cursor-none"}`}
    >
      <video
        ref={video}
        className="h-full w-full object-contain"
        poster={poster ?? undefined}
        preload="metadata"
        playsInline
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setLength(event.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      >
        <source src={src} type="video/mp4" />
        {tracks.map((track) => (
          <track key={track.src} kind="subtitles" src={track.src} srcLang={track.lang} label={track.label} default={captions} />
        ))}
      </video>

      <AnimatePresence>
        {!playing && (
          <motion.div
            className="pointer-events-none absolute inset-0 grid place-items-center bg-finale-background/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.medium, ease: ease.out }}
          >
            <div className="pointer-events-auto">
              <MagneticWrap strength={0.4}>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Lancer le film"
                  className="flex items-center gap-3 bg-finale-gold px-7 py-5 text-finale-background transition-transform duration-(--motion-fast) active:scale-[0.97]"
                >
                  <Play size={28} weight="fill" aria-hidden="true" />
                  <span className="mono text-sm font-semibold">LANCER LE FILM</span>
                </button>
              </MagneticWrap>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-finale-background/90 to-transparent p-4 pt-12 transition-opacity duration-(--motion-medium) md:p-6 ${showControls ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <input
          type="range"
          className="range w-full"
          min={0}
          max={length || 0}
          step={0.1}
          value={time}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Position dans le film"
          aria-valuetext={`${clock(time)} sur ${clock(length)}`}
        />
        <div className="flex items-center gap-3 md:gap-5">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Lecture"} className="p-1">
            {playing ? <Pause size={26} weight="fill" aria-hidden="true" /> : <Play size={26} weight="fill" aria-hidden="true" />}
          </button>
          <p className="mono tabular-nums">
            {clock(time)} / {clock(length)}
          </p>
          <span className="flex-1" />
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleMute} aria-label={muted ? "Activer le son" : "Couper le son"} className="p-1">
              {muted ? <SpeakerSlash size={24} aria-hidden="true" /> : <SpeakerHigh size={24} aria-hidden="true" />}
            </button>
            <input
              type="range"
              className="range w-20 max-md:hidden"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Volume"
            />
          </div>
          {tracks.length > 0 && (
            <button type="button" onClick={() => setCaptions((value) => !value)} aria-pressed={captions} aria-label="Sous-titres" className={`p-1 ${captions ? "text-finale-gold" : ""}`}>
              <Subtitles size={24} weight={captions ? "fill" : "regular"} aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Quitter le plein écran" : "Plein écran"} className="p-1">
            {fullscreen ? <CornersIn size={24} aria-hidden="true" /> : <CornersOut size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}
