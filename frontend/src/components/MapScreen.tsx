import { useMemo, useState } from 'react';
import { HexMap } from './HexMap';
import { addHex, HEX_DIRECTIONS, type HexCoord } from '../game/hexCoords';
import { getTile } from '../game/worldTiles';

const DIRS = {
  E: HEX_DIRECTIONS[0],
  NE: HEX_DIRECTIONS[1],
  NW: HEX_DIRECTIONS[2],
  W: HEX_DIRECTIONS[3],
  SW: HEX_DIRECTIONS[4],
  SE: HEX_DIRECTIONS[5],
};

export function MapScreen() {
  const [center, setCenter] = useState<HexCoord>({ q: 0, r: 0 });
  const centerTile = useMemo(() => getTile(center), [center]);

  const move = (delta: HexCoord) => setCenter((prev) => addHex(prev, delta));
  const reset = () => setCenter({ q: 0, r: 0 });

  return (
    <div className="map-screen">
      <h1>Hex World</h1>
      <p className="muted">
        Center: ({center.q}, {center.r}) – {centerTile.biome.label}
      </p>

      <HexMap center={center} onHexClick={setCenter} />

      <div className="nav-grid">
        <button type="button" className="nav-btn nav-ne" onClick={() => move(DIRS.NE)}>
          NE
        </button>
        <button type="button" className="nav-btn nav-nw" onClick={() => move(DIRS.NW)}>
          NW
        </button>
        <button type="button" className="nav-btn nav-w" onClick={() => move(DIRS.W)}>
          W
        </button>
        <button type="button" className="nav-btn nav-reset secondary" onClick={reset}>
          Reset
        </button>
        <button type="button" className="nav-btn nav-e" onClick={() => move(DIRS.E)}>
          E
        </button>
        <button type="button" className="nav-btn nav-sw" onClick={() => move(DIRS.SW)}>
          SW
        </button>
        <button type="button" className="nav-btn nav-se" onClick={() => move(DIRS.SE)}>
          SE
        </button>
      </div>

      <p className="muted">Click any hex to recenter on that coordinate.</p>
    </div>
  );
}
