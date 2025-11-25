import { useEffect, useMemo, useState } from 'react';
import { HexWorldMap } from './HexWorldMap';
import { addHex, hexKey, HEX_DIRECTIONS, type HexCoord } from '../game/hexCoords';
import { generateBiomeForCoord } from '../game/worldGenerator';
import type { BiomeId } from '../game/biomes';
import '../styles/hexWorld.css';

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 100;

export interface TileState {
  coord: HexCoord;
  biomeId: BiomeId;
  discovered: boolean;
}

type TileMap = Map<string, TileState>;

function ensureTile(map: TileMap, coord: HexCoord): TileState {
  const key = hexKey(coord);
  const existing = map.get(key);
  if (existing) return existing;
  const biomeId = generateBiomeForCoord(coord);
  const tile: TileState = { coord, biomeId, discovered: false };
  map.set(key, tile);
  return tile;
}

export function HexWorldScreen() {
  const [center, setCenter] = useState<HexCoord>({ q: 0, r: 0 });
  const [tiles, setTiles] = useState<TileMap>(() => new Map());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const discoveredCount = useMemo(
    () => Array.from(tiles.values()).filter((t) => t.discovered).length,
    [tiles]
  );

  useEffect(() => {
    // Ensure the starting tile exists.
    setTiles((prev) => {
      const next = new Map(prev);
      ensureTile(next, center);
      return next;
    });
  }, [center]);

  const handleDiscover = (coord: HexCoord) => {
    setTiles((prev) => {
      const next = new Map(prev);
      const queue = [coord, ...HEX_DIRECTIONS.map((dir) => addHex(coord, dir))];

      for (const c of queue) {
        const key = hexKey(c);
        const tile = ensureTile(next, c);
        if (!tile.discovered) {
          tile.discovered = true;
          next.set(key, tile);
        }
      }
      return next;
    });
  };

  const visible = useMemo(() => {
    const halfCols = Math.floor(VIEW_WIDTH / 2);
    const halfRows = Math.floor(VIEW_HEIGHT / 2);

    const centerCol = center.q;
    const centerRow = center.r + (center.q - (center.q & 1)) / 2;

    const next = new Map(tiles);
    let mutated = false;
    const list: TileState[] = [];

    for (let col = centerCol - halfCols; col <= centerCol + halfCols; col++) {
      for (let row = centerRow - halfRows; row <= centerRow + halfRows; row++) {
        const q = col;
        const r = row - (col - (col & 1)) / 2;
        const tile = ensureTile(next, { q, r });
        list.push(tile);
        if (!tiles.has(hexKey(tile.coord))) mutated = true;
      }
    }

    return { list, mutated, next };
  }, [center, tiles]);

  useEffect(() => {
    if (visible.mutated) {
      setTiles(visible.next);
    }
  }, [visible]);

  const clampZoom = (value: number) => Math.min(2, Math.max(0.5, value));

  const changeZoom = (delta: number) => setZoom((z) => clampZoom(z + delta));

  return (
    <div className="map-screen">
      <h1>Hex World</h1>
      <p className="muted">
        Center ({center.q}, {center.r}) · Discovered {discoveredCount}
      </p>

      <div className="controls-row">
        <button type="button" onClick={() => changeZoom(-0.1)} className="secondary">
          -
        </button>
        <button type="button" onClick={() => setZoom(1)}>
          1x
        </button>
        <button type="button" onClick={() => changeZoom(0.1)} className="secondary">
          +
        </button>
        <button type="button" onClick={() => setCenter({ q: 0, r: 0 })} className="secondary">
          Reset center
        </button>
      </div>

      <div className="controls-row">
        <button type="button" onClick={() => setCenter((c) => addHex(c, HEX_DIRECTIONS[2]))}>
          NW
        </button>
        <button type="button" onClick={() => setCenter((c) => addHex(c, HEX_DIRECTIONS[1]))}>
          NE
        </button>
        <button type="button" onClick={() => setCenter((c) => addHex(c, HEX_DIRECTIONS[3]))}>
          W
        </button>
        <button type="button" onClick={() => setCenter((c) => addHex(c, HEX_DIRECTIONS[0]))}>
          E
        </button>
        <button type="button" onClick={() => setCenter((c) => addHex(c, HEX_DIRECTIONS[4]))}>
          SW
        </button>
        <button type="button" onClick={() => setCenter((c) => addHex(c, HEX_DIRECTIONS[5]))}>
          SE
        </button>
      </div>

      <HexWorldMap
        center={center}
        tiles={visible.list}
        zoom={zoom}
        onZoomChange={(z) => setZoom(clampZoom(z))}
        offset={offset}
        onOffsetChange={setOffset}
        onDiscover={handleDiscover}
      />

      <p className="muted">Drag to pan. Scroll or buttons to zoom. Click a tile to discover it.</p>
    </div>
  );
}
