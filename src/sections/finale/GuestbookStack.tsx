"use client";

import { useEffect, useState } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { audioUrl, fetchApprovedMessages, type GuestbookMessage } from "@/data/guestbook";
import { ScrollStory } from "@/components/motion/ScrollStory";

// Pseudo-hasard déterministe par message: la pile est identique à chaque visite.
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function fontSizeFor(length: number): string {
  if (length <= 120) return "clamp(1.9rem,4.2vw,2.8rem)";
  if (length <= 300) return "clamp(1.45rem,3vw,2rem)";
  if (length <= 600) return "clamp(1.2rem,2.2vw,1.55rem)";
  return "clamp(1rem,1.6vw,1.15rem)";
}

/** Contenu d'un papier: mot écrit à la main ou lecteur de message vocal. */
export function PaperBody({ message }: { message: GuestbookMessage }) {
  const src = message.audio_path ? audioUrl(message.audio_path) : null;
  return (
    <>
      {message.kind === "text" ? (
        <p className="font-hand leading-[1.15]" style={{ fontSize: fontSizeFor(message.body?.length ?? 0) }}>
          {message.body}
        </p>
      ) : (
        <div>
          <p className="mono">MESSAGE VOCAL{message.audio_seconds ? ` / ${message.audio_seconds} S` : ""}</p>
          {src && <audio controls preload="none" src={src} className="mt-4 w-full" aria-label={`Message vocal de ${message.author_name}`} />}
        </div>
      )}
      <p className="font-hand mt-5 text-right text-2xl">{message.author_name}</p>
    </>
  );
}

function Paper({ progress, message, index, count }: { progress: MotionValue<number>; message: GuestbookMessage; index: number; count: number }) {
  const slot = 0.88 / count;
  const start = 0.04 + index * slot;
  const land = start + Math.min(0.1, slot * 0.9);
  const fromLeft = index % 2 === 0;
  const rest = (seeded(index, 1) - 0.5) * 11;
  const offsetX = (seeded(index, 2) - 0.5) * 14;
  const offsetY = (seeded(index, 3) - 0.5) * 9;

  const y = useTransform(progress, [start, land], ["-125vh", `${offsetY}vh`]);
  const x = useTransform(progress, [start, land], [`${fromLeft ? -30 : 30}vw`, `${offsetX}vw`]);
  const rotate = useTransform(progress, [start, land], [fromLeft ? -28 : 28, rest]);
  const opacity = useTransform(progress, [start, start + 0.01], [0, 1]);

  return (
    <motion.li
      data-m
      className="absolute left-1/2 top-1/2 -ml-[min(43vw,15rem)] -mt-[min(34dvh,16rem)] w-[min(86vw,30rem)] list-none"
      style={{ x, y, rotate, opacity }}
    >
      <div className="relative max-h-[72dvh] overflow-hidden bg-finale-ink px-7 pb-7 pt-10 text-finale-background shadow-[0_18px_40px_rgb(0_0_0/0.55)]">
        <span aria-hidden="true" className="absolute -top-1 left-1/2 block h-7 w-24 -translate-x-1/2 -rotate-2 bg-finale-gold/85" />
        <PaperBody message={message} />
      </div>
    </motion.li>
  );
}

export function PaperStage({ progress, messages }: { progress: MotionValue<number>; messages: readonly GuestbookMessage[] }) {
  return (
    <>
      <ol aria-label="Messages des proches" className="rm-hide absolute inset-0">
        {messages.map((message, i) => (
          <Paper key={message.id} progress={progress} message={message} index={i} count={messages.length} />
        ))}
      </ol>
      <ul className="rm-only grid gap-8 px-6 py-24 md:grid-cols-2 md:pl-44">
        {messages.map((message) => (
          <li key={message.id} className="bg-finale-ink px-7 pb-7 pt-8 text-finale-background">
            <PaperBody message={message} />
          </li>
        ))}
      </ul>
    </>
  );
}

const PER_MESSAGE_DVH = 70;

/** Après le message final: les mots des proches tombent un à un et s'empilent. Rien si aucun message approuvé. */
export function GuestbookStack() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchApprovedMessages().then((result) => {
      if (!cancelled && result.ok) setMessages(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <ScrollStory
      height={`calc(100dvh + ${messages.length * PER_MESSAGE_DVH}dvh)`}
      scene="finale"
      universe="finale"
      label="Messages des proches"
      stageClassName="bg-finale-background text-finale-ink"
    >
      {(progress) => <PaperStage progress={progress} messages={messages} />}
    </ScrollStory>
  );
}
