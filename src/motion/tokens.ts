// Tokens de mouvement centralisés. Miroir TypeScript de tokens.css.
// Aucune durée / easing / spring ne doit être écrit en dur dans un composant.

export const duration = {
  fast: 0.18,
  medium: 0.52,
  slow: 1.2,
  cinematic: 1.8,
} as const;

export const ease = {
  cinematic: [0.76, 0, 0.24, 1],
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  spring: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const spring = {
  soft: { type: "spring", stiffness: 90, damping: 18, mass: 0.8 },
  snappy: { type: "spring", stiffness: 260, damping: 24 },
  bouncy: { type: "spring", stiffness: 420, damping: 14 },
  magnetic: { type: "spring", stiffness: 180, damping: 14, mass: 0.4 },
  cursor: { stiffness: 420, damping: 38, mass: 0.35 },
  tilt: { stiffness: 220, damping: 20, mass: 0.5 },
  smoothScroll: { stiffness: 120, damping: 30, mass: 0.4 },
} as const;

export const viewport = {
  once: { once: true, amount: 0.3 },
  early: { once: true, amount: 0.12 },
  late: { once: true, amount: 0.6 },
} as const;

export const stagger = {
  tight: 0.04,
  base: 0.08,
  loose: 0.16,
} as const;

// Seuils de scroll (en fraction de progression de scène) partagés par les scènes cinématiques
export const beat = {
  appear: 0.06,
  hold: 0.12,
} as const;
