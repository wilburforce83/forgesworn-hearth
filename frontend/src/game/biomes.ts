export type BiomeId =
  | 'badlands'
  | 'barrens'
  | 'bog'
  | 'cliffs'
  | 'coast'
  | 'deep_forest'
  | 'desert'
  | 'fen'
  | 'forest'
  | 'grassland'
  | 'heathland'
  | 'highlands'
  | 'hills'
  | 'lake'
  | 'marsh'
  | 'mountains'
  | 'plains'
  | 'river'
  | 'scrubland'
  | 'sea'
  | 'snowfields'
  | 'swamp'
  | 'taiga'
  | 'tundra'
  | 'volcanic'
  | 'wetlands';

export interface Biome {
  id: BiomeId;
  label: string;
  tilePath: string;
}

export const BIOMES: Biome[] = [
  { id: 'badlands', label: 'Badlands', tilePath: '/tiles/badlands.png' },
  { id: 'barrens', label: 'Barrens', tilePath: '/tiles/barrens.png' },
  { id: 'bog', label: 'Bog', tilePath: '/tiles/bog.png' },
  { id: 'cliffs', label: 'Cliffs', tilePath: '/tiles/cliffs.png' },
  { id: 'coast', label: 'Coast', tilePath: '/tiles/coast.png' },
  { id: 'deep_forest', label: 'Deep Forest', tilePath: '/tiles/deep_forest.png' },
  { id: 'desert', label: 'Desert', tilePath: '/tiles/desert.png' },
  { id: 'fen', label: 'Fen', tilePath: '/tiles/fen.png' },
  { id: 'forest', label: 'Forest', tilePath: '/tiles/forest.png' },
  { id: 'grassland', label: 'Grassland', tilePath: '/tiles/grassland.png' },
  { id: 'heathland', label: 'Heathland', tilePath: '/tiles/heathland.png' },
  { id: 'highlands', label: 'Highlands', tilePath: '/tiles/highlands.png' },
  { id: 'hills', label: 'Hills', tilePath: '/tiles/hills.png' },
  { id: 'lake', label: 'Lake', tilePath: '/tiles/lake.png' },
  { id: 'marsh', label: 'Marsh', tilePath: '/tiles/marsh.png' },
  { id: 'mountains', label: 'Mountains', tilePath: '/tiles/mountains.png' },
  { id: 'plains', label: 'Plains', tilePath: '/tiles/plains.png' },
  { id: 'river', label: 'River', tilePath: '/tiles/river.png' },
  { id: 'scrubland', label: 'Scrubland', tilePath: '/tiles/scrubland.png' },
  { id: 'sea', label: 'Sea', tilePath: '/tiles/sea.png' },
  { id: 'snowfields', label: 'Snowfields', tilePath: '/tiles/snowfields.png' },
  { id: 'swamp', label: 'Swamp', tilePath: '/tiles/swamp.png' },
  { id: 'taiga', label: 'Taiga', tilePath: '/tiles/taiga.png' },
  { id: 'tundra', label: 'Tundra', tilePath: '/tiles/tundra.png' },
  { id: 'volcanic', label: 'Volcanic', tilePath: '/tiles/volcanic.png' },
  { id: 'wetlands', label: 'Wetlands', tilePath: '/tiles/wetlands.png' },
];

export const BIOME_BY_ID: Record<BiomeId, Biome> = BIOMES.reduce(
  (map, biome) => ({ ...map, [biome.id]: biome }),
  {} as Record<BiomeId, Biome>
);

export const BIOME_GROUPS: Record<string, BiomeId[]> = {
  sea: ['sea', 'coast', 'river', 'lake', 'wetlands'],
  forest: ['forest', 'deep_forest', 'taiga', 'swamp', 'marsh'],
  grass: ['plains', 'grassland', 'heathland', 'hills', 'scrubland'],
  mountain: ['mountains', 'highlands', 'cliffs', 'snowfields', 'volcanic'],
  arid: ['desert', 'badlands', 'barrens'],
};

export function getSimilarBiomes(id: BiomeId): BiomeId[] {
  for (const group of Object.values(BIOME_GROUPS)) {
    if (group.includes(id)) return group;
  }
  return [id];
}

// Returns candidates that are similar to the given biome, excluding itself.
export function getSimilarBiomeOptions(id: BiomeId): BiomeId[] {
  const group = getSimilarBiomes(id);
  return group.filter((b) => b !== id);
}
