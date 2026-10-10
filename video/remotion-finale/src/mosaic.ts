import { random } from "remotion";

// Grille de la mosaïque (timeline.json › OUT_MOSAIC_ASSEMBLY : 32 × 18 cellules de 60 px).
export const COLS = 32;
export const ROWS = 18;
export const CELL = 60;

const ring = (c: number, r: number, cx: number, cy: number, rx: number, ry: number, thickness: number) => {
  const x = c + 0.5;
  const y = r + 0.5;
  const outer = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
  const inner = ((x - cx) / (rx - thickness)) ** 2 + ((y - cy) / (ry - thickness)) ** 2;
  return outer <= 1 && inner >= 1;
};

// Chiffre « 1 » : fût, drapeau, socle.
const one = (c: number, r: number) =>
  (c >= 9 && c <= 11 && r >= 2 && r <= 15) ||
  (r >= 14 && r <= 15 && c >= 6 && c <= 14) ||
  (r === 3 && c >= 7 && c <= 8) ||
  (r === 4 && c >= 6 && c <= 7);

// Chiffre « 8 » : deux anneaux superposés.
const eight = (c: number, r: number) => ring(c, r, 21, 5.6, 4.6, 3.7, 2.3) || ring(c, r, 21, 12.4, 5.4, 4.0, 2.4);

export type Univers = "enfance" | "ado" | "betises";

export type Tile = {
  col: number;
  row: number;
  univers: Univers;
  shade: number; // 0..1, variation de teinte pour les emplacements vides
  order: number; // rang d'arrivée (aléatoire, à graine fixe)
  fromX: number; // départ hors champ (px, relatif à la position finale)
  fromY: number;
  fromRotation: number;
};

const UNIVERS: Univers[] = ["enfance", "ado", "betises"];
const FLIGHT_DISTANCE = 1500;

// Calcul pur, déterministe : mêmes tuiles à chaque rendu.
export const buildTiles = (): Tile[] => {
  const cells: Array<{ col: number; row: number }> = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (one(col, row) || eight(col, row)) cells.push({ col, row });
    }
  }
  const ranks = cells
    .map((_, i) => ({ i, key: random(`order-${i}`) }))
    .sort((a, b) => a.key - b.key)
    .reduce<number[]>((acc, { i }, rank) => {
      acc[i] = rank;
      return acc;
    }, []);

  return cells.map(({ col, row }, i) => {
    const angle = random(`angle-${i}`) * Math.PI * 2;
    return {
      col,
      row,
      univers: UNIVERS[i % UNIVERS.length],
      shade: random(`shade-${i}`),
      order: ranks[i],
      fromX: Math.cos(angle) * FLIGHT_DISTANCE,
      fromY: Math.sin(angle) * FLIGHT_DISTANCE * 0.7,
      fromRotation: (random(`rot-${i}`) - 0.5) * 180,
    };
  });
};
