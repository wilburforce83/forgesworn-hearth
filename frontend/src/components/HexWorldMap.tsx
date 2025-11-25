import { useMemo, useRef, type CSSProperties } from 'react';
import { BIOME_BY_ID } from '../game/biomes';
import { hexKey, hexToPixel, HEX_HEIGHT, HEX_WIDTH, type HexCoord } from '../game/hexCoords';
import type { TileState } from './HexWorldScreen';
import '../styles/hexWorld.css';

const VIEWPORT_WIDTH = 900;
const VIEWPORT_HEIGHT = 520;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

interface HexWorldMapProps {
  center: HexCoord;
  tiles: TileState[];
  zoom: number;
  onZoomChange: (z: number) => void;
  offset: { x: number; y: number };
  onOffsetChange: (offset: { x: number; y: number }) => void;
  onDiscover: (coord: HexCoord) => void;
}

export function HexWorldMap({
  center,
  tiles,
  zoom,
  onZoomChange,
  offset,
  onOffsetChange,
  onDiscover,
}: HexWorldMapProps) {
  const dragState = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    dragging: boolean;
  }>({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0, dragging: false });

  const centerPx = useMemo(() => hexToPixel(center), [center]);
  const baseOffset = useMemo(
    () => ({
      x: VIEWPORT_WIDTH / 2 - centerPx.x,
      y: VIEWPORT_HEIGHT / 2 - centerPx.y,
    }),
    [centerPx.x, centerPx.y]
  );

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    onZoomChange(clamped);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      dragging: true,
    };
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragState.current.dragging) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    onOffsetChange({ x: dragState.current.startOffsetX + dx, y: dragState.current.startOffsetY + dy });
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = () => {
    dragState.current.dragging = false;
  };

  return (
    <div
      className="hex-world-viewport"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="presentation"
      style={{
        ['--hex-width' as any]: `${HEX_WIDTH}px`,
        ['--hex-height' as any]: `${HEX_HEIGHT}px`,
      }}
    >
      <div
        className="hex-world-inner"
        style={{
          transform: `translate(${baseOffset.x + offset.x}px, ${baseOffset.y + offset.y}px) scale(${zoom})`,
        }}
      >
        {tiles.map((tile) => {
          const pos = hexToPixel(tile.coord);
          const biome = BIOME_BY_ID[tile.biomeId];
          const commonStyle = {
            left: `${pos.x - HEX_WIDTH / 2}px`,
            top: `${pos.y - HEX_HEIGHT / 2}px`,
          } as const;

          const style: CSSProperties = tile.discovered
            ? {
                ...commonStyle,
                ['--hex-image' as any]: `url(${biome.tilePath})`,
                ['--hex-fill' as any]: 'transparent',
                ['--hex-filter' as any]: 'saturate(0.75) brightness(0.9)',
              }
            : {
                ...commonStyle,
                ['--hex-image' as any]: 'url(/tiles/blank.png)',
                ['--hex-fill' as any]: 'transparent',
                ['--hex-filter' as any]: 'none',
              };
          return (
            <div
              key={hexKey(tile.coord)}
              className={`hex-tile ${tile.discovered ? '' : 'hex-tile-undiscovered'}`}
              style={style}
              onClick={() => onDiscover(tile.coord)}
              title={`${tile.coord.q},${tile.coord.r}`}
              role="button"
            />
          );
        })}
      </div>
    </div>
  );
}
