"use client";

import { createElement, type CSSProperties } from "react";
import { motion, type Variants } from "motion/react";
import { textSplit } from "@/motion/presets";
import { stagger, viewport } from "@/motion/tokens";

interface KineticTitleProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: CSSProperties;
  /** "view": à l'entrée dans le viewport; "load": dès le montage. */
  trigger?: "view" | "load";
  by?: "char" | "word";
  delay?: number;
  /** Avec trigger="load": attend ce signal (ex. fin du loader) avant de jouer. */
  play?: boolean;
}

/** Titre cinétique: lettres (ou mots) qui montent d'un masque. Lu comme un seul texte par les lecteurs d'écran. */
export function KineticTitle({ text, as = "h2", className = "", style, trigger = "view", by = "char", delay = 0, play = true }: KineticTitleProps) {
  const pieces = by === "char" ? Array.from(text) : text.split(" ");
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger.tight, delayChildren: 0.05 + delay } },
  };
  const motionProps =
    trigger === "load"
      ? { initial: "hidden", animate: play ? "visible" : "hidden" }
      : { initial: "hidden", whileInView: "visible", viewport: viewport.early };

  return createElement(
    as,
    { className, style, "aria-label": text },
    <motion.span
      aria-hidden="true"
      className="inline"
      variants={container}
      {...motionProps}
    >
      {pieces.map((piece, i) => (
        <span key={`${piece}-${i}`} className="inline-block overflow-hidden py-[0.06em] align-bottom">
          <motion.span data-m className="inline-block" variants={textSplit.item}>
            {piece === " " ? " " : piece}
            {by === "word" && i < pieces.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>,
  );
}
