// Bulles qui montent doucement. CSS pur (transform + opacity), coupé en mouvement réduit.
const BUBBLES = [
  { left: "8%", size: 26, dur: 17, delay: 0, drift: "3vw" },
  { left: "19%", size: 54, dur: 22, delay: 4, drift: "-2vw" },
  { left: "31%", size: 18, dur: 15, delay: 9, drift: "4vw" },
  { left: "47%", size: 38, dur: 20, delay: 2, drift: "-3vw" },
  { left: "58%", size: 22, dur: 16, delay: 11, drift: "2vw" },
  { left: "69%", size: 64, dur: 26, delay: 6, drift: "-4vw" },
  { left: "78%", size: 30, dur: 18, delay: 13, drift: "3vw" },
  { left: "90%", size: 44, dur: 23, delay: 1, drift: "-2vw" },
] as const;

/** Couche décorative collée au viewport tant que l'univers est à l'écran (wrapper sticky de hauteur 0). */
export function Bubbles() {
  return (
    <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 h-0">
      <div className="absolute left-0 top-0 h-dvh w-full overflow-hidden">
        {BUBBLES.map((bubble, i) => (
          <span
            key={i}
            className="bubble absolute bottom-0 block rounded-full border border-white/70 opacity-0 [background:radial-gradient(circle_at_32%_28%,rgb(255_255_255/0.85),rgb(182_210_232/0.28)_55%,transparent_70%)]"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              ["--dur" as string]: `${bubble.dur}s`,
              ["--delay" as string]: `${bubble.delay}s`,
              ["--drift" as string]: bubble.drift,
            }}
          />
        ))}
      </div>
    </div>
  );
}
