import type { ReactNode } from "react";

type Tone = "magenta" | "cyan" | "fluo" | "red" | "blue" | "green" | "paper" | "ink";

// Classes complètes pour Tailwind.
const TONE: Record<Tone, string> = {
  magenta: "bg-adolescence-primary text-adolescence-background",
  cyan: "bg-adolescence-secondary text-adolescence-background",
  fluo: "bg-adolescence-fluo text-adolescence-background",
  red: "bg-mischief-secondary text-mischief-paper",
  blue: "bg-mischief-blue text-mischief-paper",
  green: "bg-mischief-green text-mischief-ink",
  paper: "bg-mischief-paper text-mischief-ink",
  ink: "bg-mischief-ink text-mischief-paper",
};

interface StickerProps {
  children: ReactNode;
  tone?: Tone;
  rotate?: number;
  /** Surgit seulement quand le parent `group/photo` est survolé ou focalisé. */
  popOnHover?: boolean;
  className?: string;
  /** Police d'accent: street (Anton) ou comic (Bangers). */
  font?: "street" | "comic";
}

/** Autocollant: aplat, bord net, ombre dure. Surgit élastiquement au survol de sa photo. */
export function Sticker({ children, tone = "fluo", rotate = -6, popOnHover = false, className = "", font = "street" }: StickerProps) {
  const pop = popOnHover
    ? "scale-0 opacity-0 transition-[transform,opacity] duration-(--motion-medium) ease-(--ease-elastic) group-hover/photo:scale-100 group-hover/photo:opacity-100 group-focus-within/photo:scale-100 group-focus-within/photo:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100"
    : "";
  return (
    <span
      className={`pointer-events-none absolute z-10 inline-block px-3 py-1 text-xl leading-none shadow-[4px_4px_0_0_rgb(0_0_0/0.9)] ${font === "street" ? "font-street uppercase tracking-wide" : "font-comic tracking-wider"} ${TONE[tone]} ${pop} ${className}`}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}
