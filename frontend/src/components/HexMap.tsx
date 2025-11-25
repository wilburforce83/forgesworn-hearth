import { getVisibleRing } from '../game/worldTiles';
import { hexKey, type HexCoord } from '../game/hexCoords';
import '../styles/hexMap.css';

interface HexMapProps {
  center: HexCoord;
  onHexClick?: (coord: HexCoord) => void;
}

const AREA_ORDER = ['center', 'e', 'ne', 'nw', 'w', 'sw', 'se'] as const;

export function HexMap({ center, onHexClick }: HexMapProps) {
  const tiles = getVisibleRing(center);

  return (
    <div className="hex-map">
      {tiles.map((tile, index) => {
        const area = AREA_ORDER[index] ?? 'center';
        const handleClick = () => onHexClick?.(tile.coord);
        return (
          <button
            key={hexKey(tile.coord)}
            className={`hex-tile ${area === 'center' ? 'is-center' : ''}`}
            style={{ backgroundImage: `url(${tile.biome.tilePath})`, gridArea: area }}
            onClick={handleClick}
            title={`${tile.biome.label} (${tile.coord.q}, ${tile.coord.r})`}
          >
            <span className="hex-label">
              {tile.biome.label}
              <br />
              {tile.coord.q},{tile.coord.r}
            </span>
          </button>
        );
      })}
    </div>
  );
}
