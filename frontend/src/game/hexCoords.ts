export type HexCoord = { q: number; r: number };

// Size is distance from centre to any corner
export const HEX_SIZE = 20;

// Flat-top hex geometry
// width = 2 * size
// height = sqrt(3) * size
export const HEX_WIDTH = 2 * HEX_SIZE;
export const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

export function hexKey(c: HexCoord): string {
  return `${c.q},${c.r}`;
}

/**
 * Flat-top axial layout from Red Blob Games:
 *
 * x = size * 3/2 * q
 * y = size * sqrt(3) * (r + q/2)
 */
export function hexToPixel(c: HexCoord): { x: number; y: number } {
  const x = HEX_SIZE * 1.5 * c.q;
  const y = HEX_SIZE * Math.sqrt(3) * (c.r + c.q / 2);
  return { x, y };
}

// Axial neighbour directions for flat-top
export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },   // E
  { q: 0, r: -1 },  // NE
  { q: -1, r: -1 }, // NW
  { q: -1, r: 0 },  // W
  { q: 0, r: 1 },   // SW
  { q: 1, r: 1 },   // SE
];

export function addHex(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}
