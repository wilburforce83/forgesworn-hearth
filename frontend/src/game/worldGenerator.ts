import { BIOMES, type BiomeId, getSimilarBiomes, getSimilarBiomeOptions } from './biomes';
import type { HexCoord } from './hexCoords';
import { HEX_DIRECTIONS, addHex } from './hexCoords';

const REGION_SIZE = 8; // larger scale for value-noise sampling

function deriveSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] || 0x1f2e3d4c;
  }
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export const WORLD_SEED = deriveSeed();

export function hashInt(a: number, b: number, seed: number): number {
  let h = seed;
  h ^= a * 374761393;
  h = (h << 13) | (h >>> 19);
  h = Math.imul(h, 1274126177);

  h ^= b * 668265263;
  h = (h << 15) | (h >>> 17);
  h = Math.imul(h, 2246822519);

  return h >>> 0;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function valueAt(ix: number, iy: number, seed: number): number {
  return hashInt(ix, iy, seed) / 0xffffffff;
}

function valueNoise(q: number, r: number, scale: number, seed: number): number {
  // Simple 2D value noise with bilinear interpolation; good enough to avoid strong grids.
  const x = q / scale;
  const y = r / scale;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = x - x0;
  const sy = y - y0;

  const n00 = valueAt(x0, y0, seed);
  const n10 = valueAt(x1, y0, seed);
  const n01 = valueAt(x0, y1, seed);
  const n11 = valueAt(x1, y1, seed);

  const nx0 = lerp(n00, n10, sx);
  const nx1 = lerp(n01, n11, sx);
  return lerp(nx0, nx1, sy);
}

function baseBiomeFromNoise(coord: HexCoord): BiomeId {
  const n1 = valueNoise(coord.q, coord.r, REGION_SIZE, WORLD_SEED ^ 0x9e37);
  const n2 = valueNoise(coord.q, coord.r, REGION_SIZE * 2, WORLD_SEED ^ 0x7f4a);
  // Blend two octaves to soften repetition.
  const n = (n1 * 0.65 + n2 * 0.35) % 1;
  const idx = Math.floor(n * BIOMES.length) % BIOMES.length;
  return BIOMES[idx].id;
}

function neighborsBaseBiome(coord: HexCoord, target: BiomeId): boolean {
  return HEX_DIRECTIONS.some((dir) => {
    const neighbor = addHex(coord, dir);
    return baseBiomeFromNoise(neighbor) === target;
  });
}

function rawCandidate(coord: HexCoord): BiomeId {
  const regionBiome = baseBiomeFromNoise(coord);
  const similar = getSimilarBiomeOptions(regionBiome);
  const h = hashInt(coord.q, coord.r, WORLD_SEED ^ 0xabcdef01);
  const roll = h % 100;

  // Weighting at this stage:
  // 65%: stick with the noise-derived biome
  // 20%: pick a similar biome (if any)
  // 15%: wild card across all biomes
  if (roll < 70) return regionBiome;
  if (roll < 85 && similar.length > 0) {
    const idx = (h >>> 8) % similar.length;
    return similar[idx];
  }
  return BIOMES[(h >>> 16) % BIOMES.length].id;
}

export function generateBiomeForCoord(coord: HexCoord): BiomeId {
  const self = rawCandidate(coord);
  const neighborCandidates = HEX_DIRECTIONS.map((dir) => rawCandidate(addHex(coord, dir)));

  const weights = new Map<BiomeId, number>();
  const addWeight = (id: BiomeId, w: number) => weights.set(id, (weights.get(id) ?? 0) + w);

  // Final voting weights:
  // - Self candidate: 4
  // - Each neighbor candidate: 3
  // - Each similar biome to self: 1
  addWeight(self, 4);
  neighborCandidates.forEach((id) => addWeight(id, 3));

  const similar = getSimilarBiomes(self);
  similar.forEach((id) => addWeight(id, 1));

  // Rivers: encourage continuation, but cap to two contributing sides.
  const riverNeighbors = neighborCandidates.filter((id) => id === 'river').length;
  if (riverNeighbors > 0) {
    addWeight('river', Math.min(2, riverNeighbors) * 60);
  }

  // Seas: strongly cluster; reward sea neighbors and self.
  const seaNeighbors = neighborCandidates.filter((id) => id === 'sea').length;
  if (seaNeighbors > 0 || self === 'sea') {
    addWeight('sea', seaNeighbors * 35 + (self === 'sea' ? 4 : 0));
  }

  const entries = Array.from(weights.entries());
  const total = entries.reduce((sum, [, w]) => sum + w, 0) || 1;
  const pickVal = hashInt(coord.q, coord.r, WORLD_SEED ^ 0x55aa55aa) % total;

  let cumulative = 0;
  let chosen: BiomeId = self;
  for (const [id, w] of entries) {
    cumulative += w;
    if (pickVal < cumulative) {
      chosen = id;
      break;
    }
  }

  // Lakes: make them rare and never adjacent to another lake. If the roll picked lake
  // but a neighbor also wants lake, or the rarity gate fails, fall back to a non-lake.
  if (chosen === 'lake') {
    const rareEnough = (hashInt(coord.q, coord.r, WORLD_SEED ^ 0xfeedface) % 100) < 2; // ~2% gate
    const neighborLake = neighborCandidates.includes('lake');
    if (!rareEnough || neighborLake) {
      const fallbackList: BiomeId[] = [self, ...neighborCandidates, baseBiomeFromNoise(coord)];
      const replacement = fallbackList.find((id) => id !== 'lake') ?? 'plains';
      chosen = replacement;
    }
  }

  if (chosen === 'volcanic') {
    const nearBadlands =
      self === 'badlands' ||
      neighborCandidates.includes('badlands') ||
      neighborsBaseBiome(coord, 'badlands');
    if (!nearBadlands) {
      return self;
    }
  }

  return chosen;
}
