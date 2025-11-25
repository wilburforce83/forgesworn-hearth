import { BIOME_BY_ID, type Biome } from './biomes';
import { generateBiomeForCoord } from './worldGenerator';
import { addHex, HEX_DIRECTIONS, type HexCoord } from './hexCoords';

export interface HexTile {
  coord: HexCoord;
  biome: Biome;
}

export function getTileAt(coord: HexCoord): HexTile {
  const biomeId = generateBiomeForCoord(coord);
  return {
    coord,
    biome: BIOME_BY_ID[biomeId],
  };
}

// Legacy helpers kept for compatibility with the earlier 7-hex prototype.
export function getTile(coord: HexCoord) {
  return { ...getTileAt(coord), discovered: true };
}

export function getVisibleRing(center: HexCoord) {
  const tiles = [getTile(center)];
  for (const dir of HEX_DIRECTIONS) {
    tiles.push(getTile(addHex(center, dir)));
  }
  return tiles;
}
