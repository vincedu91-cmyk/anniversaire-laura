"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Microphone, Stop, ArrowCounterClockwise } from "@phosphor-icons/react";
import { MAX_VOICE_SECONDS } from "@/data/guestbook";

export interface Recording {
  blob: Blob;
  seconds: number;
}

interface VoiceRecorderProps {
  onChange: (recording: Recording | null) => void;
}

type Phase = "idle" | "recording" | "recorded" | "denied" | "unsupported";

const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"] as const;
const TICK_MS = 250;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Enregistre un message vocal dans le navigateur (60 s max) et permet de le réécouter avant l'envoi. */
export function VoiceRecorder({ onChange }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<number | null>(null);

  const release = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  useEffect(() => release, [release]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices) {
      setPhase("unsupported");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      rec.ondataavailable = (event) => event.data.size > 0 && chunks.current.push(event.data);
      rec.onstop = () => {
        const seconds = Math.max(1, (performance.now() - startedAt.current) / 1000);
        const blob = new Blob(chunks.current, { type: rec.mimeType || mimeType || "audio/webm" });
        release();
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("recorded");
        onChange({ blob, seconds });
      };
      recorder.current = rec;
      startedAt.current = performance.now();
      setElapsed(0);
      rec.start();
      setPhase("recording");
      timer.current = window.setInterval(() => {
        const seconds = (performance.now() - startedAt.current) / 1000;
        setElapsed(seconds);
        if (seconds >= MAX_VOICE_SECONDS) stop();
      }, TICK_MS);
    } catch {
      release();
      setPhase("denied");
    }
  }, [onChange, release, stop]);

  const reset = () => {
    setPreviewUrl(null);
    setElapsed(0);
    setPhase("idle");
    onChange(null);
  };

  if (phase === "unsupported") {
    return <p role="alert" className="border-2 border-current p-4">Ton navigateur ne permet pas l&apos;enregistrement vocal. Utilise l&apos;onglet « Écrire ».</p>;
  }

  return (
    <div className="border-2 border-current p-4">
      {phase === "denied" && (
        <p role="alert" className="mb-3 font-semibold">
          Le micro est bloqué. Autorise-le dans ton navigateur puis réessaie, ou utilise l&apos;onglet « Écrire ».
        </p>
      )}
      {(phase === "idle" || phase === "denied") && (
        <button type="button" onClick={start} className="flex items-center gap-3 bg-childhood-ink px-5 py-3 font-semibold text-childhood-background transition-transform duration-(--motion-fast) active:scale-[0.97]">
          <Microphone size={22} weight="fill" aria-hidden="true" />
          Enregistrer ma voix
        </button>
      )}
      {phase === "recording" && (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={stop} className="flex items-center gap-3 bg-mischief-secondary px-5 py-3 font-semibold text-mischief-paper transition-transform duration-(--motion-fast) active:scale-[0.97]">
            <Stop size={22} weight="fill" aria-hidden="true" />
            Terminer
          </button>
          <p className="mono" role="timer" aria-live="off">
            {clock(elapsed)} / {clock(MAX_VOICE_SECONDS)}
          </p>
        </div>
      )}
      {phase === "recorded" && previewUrl && (
        <div className="flex flex-col gap-3">
          <audio controls src={previewUrl} className="w-full" aria-label="Réécouter ton message" />
          <button type="button" onClick={reset} className="flex w-fit items-center gap-2 border-b-2 border-current py-1 font-semibold">
            <ArrowCounterClockwise size={18} aria-hidden="true" />
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}
