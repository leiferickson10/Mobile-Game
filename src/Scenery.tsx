// Draws a level's world in the style of its picture. Colors come from the level's theme.
// Everything is drawn in meters inside a scale() transform, so sizes match the physics.
import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { COIN_RADIUS, HAY_BALE, type Game } from './game';
import type { Scenery, Theme } from './levels/types';

export const OUTLINE = '#2b2b2b';

export type Camera = { camX: number; camY: number; scale: number; width: number; height: number };

const sx = (c: Camera, x: number) => (x - c.camX) * c.scale;
const sy = (c: Camera, y: number) => (c.camY - y) * c.scale;
/** Group whose children are drawn in meters, with (0,0) at world (x, y) and y pointing up as negative */
const at = (c: Camera, x: number, y: number) => `translate(${sx(c, x)} ${sy(c, y)}) scale(${c.scale})`;
const rightEdge = (c: Camera) => c.camX + c.width / c.scale;

// ---------- Backdrop: hills and clouds, moving slower than the road (parallax) ----------
const CLOUDS = [
  { x: 3, y: 0.1 }, { x: 15, y: 0.17 }, { x: 27, y: 0.08 }, { x: 39, y: 0.14 }, { x: 51, y: 0.11 }, { x: 63, y: 0.15 },
];

function hillPath(cam: Camera, f: number, height: (x: number) => number) {
  const pts: string[] = [];
  for (let px = -20; px <= cam.width + 20; px += 16) {
    const x = cam.camX * f + px / cam.scale;
    pts.push(`${pts.length ? 'L' : 'M'}${px} ${(cam.camY * f - height(x)) * cam.scale}`);
  }
  return `${pts.join(' ')} L${cam.width + 20} ${cam.height} L-20 ${cam.height} Z`;
}

export function Backdrop({ cam, theme }: { cam: Camera; theme: Theme }) {
  const a = theme.hillHeight;
  return (
    <G>
      {CLOUDS.map((cloud, i) => {
        const x = (cloud.x - cam.camX * 0.2) * cam.scale;
        if (x < -4 * cam.scale || x > cam.width + 4 * cam.scale) return null;
        return (
          <G key={i} transform={`translate(${x} ${cloud.y * cam.height}) scale(${cam.scale})`}>
            <Rect x={-2.2} y={-0.2} width={4.4} height={0.8} rx={0.4} fill={theme.cloud} />
            <Circle cx={-0.9} cy={-0.2} r={0.75} fill={theme.cloud} />
            <Circle cx={0.2} cy={-0.6} r={1} fill={theme.cloud} />
            <Circle cx={1.2} cy={-0.15} r={0.65} fill={theme.cloud} />
          </G>
        );
      })}
      {/* far hills at 0.35 speed, nearer hills at 0.55 */}
      <Path d={hillPath(cam, 0.35, (x) => -1 + a * Math.sin(x * 0.05) + a * 0.5 * Math.sin(x * 0.13 + 1))} fill={theme.farHills} />
      {theme.nearHills && (
        <Path d={hillPath(cam, 0.55, (x) => -2.5 + a * 0.45 * Math.sin(x * 0.07 + 2) + 0.6 * Math.sin(x * 0.19))} fill={theme.nearHills} />
      )}
    </G>
  );
}

// ---------- Scenery beside the road ----------
function SceneryItem({ item, theme, game }: { item: Scenery; theme: Theme; game: Game }) {
  const o = OUTLINE;
  const sw = 0.07; // outline width, meters
  switch (item.kind) {
    case 'building': {
      const rows = Math.floor((item.h - 2) / 2.2);
      const colW = item.w / item.windowCols;
      return (
        <G>
          <Rect x={0} y={-item.h} width={item.w} height={item.h} fill="#c7c1bd" />
          <Rect x={-0.3} y={-item.h - 0.7} width={item.w + 0.6} height={0.7} fill="#8c8785" />
          {Array.from({ length: rows * item.windowCols }, (_, i) => (
            <Rect
              key={i}
              x={(i % item.windowCols) * colW + colW / 2 - 0.65}
              y={-item.h + 1.2 + Math.floor(i / item.windowCols) * 2.2}
              width={1.3} height={1.4} fill="#f6e08a"
            />
          ))}
        </G>
      );
    }
    case 'house':
      return (
        <G>
          <Rect x={0.4} y={-item.h * 0.62} width={item.w - 0.8} height={item.h * 0.62} fill="#f2e3cc" />
          <Path d={`M0 ${-item.h * 0.6} L${item.w / 2} ${-item.h} L${item.w} ${-item.h * 0.6} Z`} fill="#c9a28f" />
          <Rect x={item.w * 0.2} y={-item.h * 0.45} width={1.4} height={1.3} fill="#f6e08a" />
          <Rect x={item.w * 0.6} y={-item.h * 0.45} width={1.4} height={1.3} fill="#f6e08a" />
        </G>
      );
    case 'tree':
      return (
        <G>
          <Rect x={-0.3} y={-item.h * 0.55} width={0.6} height={item.h * 0.55} fill="#8a6a4a" />
          <Circle cx={0} cy={-item.h * 0.62} r={item.h * 0.36} fill={item.color ?? theme.tree} />
        </G>
      );
    case 'postOffice': {
      const { w, h } = item;
      return (
        <G>
          <Rect x={0.6} y={-h * 0.84} width={w - 1.2} height={h * 0.84} fill="#f2cf78" stroke={o} strokeWidth={sw} />
          <Rect x={0} y={-h} width={w} height={h * 0.16} fill="#c99a55" stroke={o} strokeWidth={sw} />
          <Rect x={w * 0.14} y={-h * 0.76} width={w * 0.72} height={h * 0.18} fill="#ffffff" stroke={o} strokeWidth={sw} />
          <SvgText x={w / 2} y={-h * 0.62} fontSize={h * 0.12} fontWeight="bold" fill="#1d3a6e" textAnchor="middle">
            POST OFFICE
          </SvgText>
          <Rect x={w * 0.1} y={-h * 0.46} width={w * 0.18} height={h * 0.2} fill="#bfe3f5" stroke={o} strokeWidth={sw} />
          <Rect x={w * 0.72} y={-h * 0.46} width={w * 0.18} height={h * 0.2} fill="#bfe3f5" stroke={o} strokeWidth={sw} />
          <Rect x={w * 0.4} y={-h * 0.5} width={w * 0.2} height={h * 0.5} fill="#a8743c" stroke={o} strokeWidth={sw} />
        </G>
      );
    }
    case 'mailbox':
      return (
        <G>
          <Rect x={-0.07} y={-1.2} width={0.14} height={1.2} fill="#6d737b" />
          <Rect x={-0.45} y={-1.65} width={0.9} height={0.5} rx={0.22} fill="#b8bec5" stroke={o} strokeWidth={0.05} />
          <Rect x={0.3} y={-1.95} width={0.07} height={0.45} fill="#6d737b" />
          <Rect x={0.3} y={-1.95} width={0.25} height={0.16} fill="#e53935" />
        </G>
      );
    case 'barn': {
      const { w, h } = item;
      const wall = h * 0.62;
      return (
        <G>
          <Rect x={0.05 * w} y={-wall} width={0.9 * w} height={wall} fill="#c9705f" />
          {/* gambrel roof */}
          <Path d={`M0 ${-wall} L${0.18 * w} ${-h * 0.86} L${0.5 * w} ${-h} L${0.82 * w} ${-h * 0.86} L${w} ${-wall} Z`} fill="#8d6158" />
          <Rect x={0.44 * w} y={-h * 0.8} width={0.12 * w} height={0.12 * h} fill="#f0e2d0" />
          {/* big doors with the white X */}
          <Rect x={0.3 * w} y={-wall * 0.62} width={0.4 * w} height={wall * 0.62} fill="#f0e2d0" />
          <Path d={`M${0.3 * w} ${-wall * 0.62} L${0.7 * w} 0 M${0.7 * w} ${-wall * 0.62} L${0.3 * w} 0`} stroke="#c9705f" strokeWidth={0.25} />
        </G>
      );
    }
    case 'silo':
      return (
        <G>
          <Rect x={0} y={-item.h + item.w / 2} width={item.w} height={item.h - item.w / 2} fill="#b8bec2" />
          <Circle cx={item.w / 2} cy={-item.h + item.w / 2} r={item.w / 2} fill="#9aa1a6" />
        </G>
      );
    case 'windmill': {
      const h = item.h;
      const spin = (game.getTime() * 70) % 360; // degrees: blades turn slowly
      const blades = Array.from({ length: 8 }, (_, i) => (
        <Path key={i} d={`M0 0 L${h * 0.05} ${-h * 0.32} L${-h * 0.05} ${-h * 0.32} Z`} fill="#d6d6d6" transform={`rotate(${i * 45})`} />
      ));
      return (
        <G>
          <Path d={`M${-h * 0.08} 0 L${-h * 0.025} ${-h} L${h * 0.025} ${-h} L${h * 0.08} 0 Z`} fill="#a8a19a" />
          <G transform={`translate(0 ${-h}) rotate(${spin})`}>{blades}</G>
          <Circle cx={0} cy={-h} r={h * 0.04} fill="#6d6d6d" />
        </G>
      );
    }
    case 'waterTower': {
      const { w, h } = item;
      const tankH = h * 0.28;
      return (
        <G>
          <Path d={`M${w * 0.2} 0 L${w * 0.32} ${-h + tankH} M${w * 0.8} 0 L${w * 0.68} ${-h + tankH} M${w * 0.24} ${-h * 0.25} L${w * 0.74} ${-h * 0.55}`} stroke="#9c9690" strokeWidth={0.3} />
          <Rect x={w * 0.08} y={-h + h * 0.08} width={w * 0.84} height={tankH} fill="#b9c6c9" />
          <Path d={`M0 ${-h + h * 0.09} L${w / 2} ${-h} L${w} ${-h + h * 0.09} Z`} fill="#93a0a3" />
        </G>
      );
    }
    case 'fence':
      return null; // drawn by FenceLayer, which follows the road
  }
}

/** Where along the road each kind of object stands, and how deep it sinks behind the road */
function baseOf(item: Scenery, groundHeight: (x: number) => number): { x: number; y: number } {
  const w = 'w' in item ? item.w : 0;
  const ground = groundHeight(item.x + w / 2);
  if (item.kind === 'building') return { x: item.x, y: ground - 4 };
  if (['house', 'tree', 'barn', 'silo', 'windmill', 'waterTower'].includes(item.kind)) return { x: item.x, y: ground - 0.6 };
  return { x: item.x, y: ground };
}

export function SceneryLayer({ cam, game }: { cam: Camera; game: Game }) {
  const left = cam.camX - 15;
  const right = rightEdge(cam) + 2;
  return (
    <G>
      {game.level.scenery.map((item, i) => {
        if (item.kind === 'fence' || item.x < left || item.x > right) return null;
        const base = baseOf(item, game.groundHeight);
        return (
          <G key={i} transform={at(cam, base.x, base.y)}>
            <SceneryItem item={item} theme={game.level.theme} game={game} />
          </G>
        );
      })}
    </G>
  );
}

/** Wooden fences beside the road: posts every 1.6 m, two rails that follow the ground */
export function FenceLayer({ cam, game }: { cam: Camera; game: Game }) {
  const left = cam.camX - 2;
  const right = rightEdge(cam) + 2;
  const color = '#c7a27c';
  const parts = [];
  for (const [i, f] of game.level.scenery.entries()) {
    if (f.kind !== 'fence' || f.x2 < left || f.x > right) continue;
    const a = Math.max(f.x, left);
    const b = Math.min(f.x2, right);
    for (const rail of [0.55, 0.95]) {
      const pts = [];
      for (let x = a; x <= b; x += 0.5) pts.push(`${pts.length ? 'L' : 'M'}${sx(cam, x)} ${sy(cam, game.groundHeight(x) + rail)}`);
      parts.push(<Path key={`${i}-${rail}`} d={pts.join(' ')} fill="none" stroke={color} strokeWidth={0.12 * cam.scale} />);
    }
    for (let x = f.x; x <= f.x2; x += 1.6) {
      if (x < a || x > b) continue;
      const g = game.groundHeight(x);
      parts.push(<Rect key={`${i}-p${x}`} x={sx(cam, x) - 0.07 * cam.scale} y={sy(cam, g + 1.15)} width={0.14 * cam.scale} height={1.15 * cam.scale} fill={color} />);
    }
  }
  return <G>{parts}</G>;
}

// ---------- Ground and road ----------
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

export function Ground({ cam, game }: { cam: Camera; game: Game }) {
  const theme = game.level.theme;
  const left = cam.camX - 1;
  const right = rightEdge(cam) + 1;
  const visible = game.terrain.filter((p) => p.x > left && p.x < right);
  if (visible.length < 2) return null;

  const line = (dy: number) => visible.map((p, i) => `${i ? 'L' : 'M'}${sx(cam, p.x)} ${sy(cam, p.y + dy)}`).join(' ');
  const dirt = `${line(0)} L${sx(cam, visible[visible.length - 1].x)} ${cam.height} L${sx(cam, visible[0].x)} ${cam.height} Z`;

  // Dirt specks: fixed pseudo-random spots so they don't flicker
  const specks = [];
  for (let x = Math.floor(left); x < right; x++) {
    for (let k = 0; k < 2; k++) {
      const sxm = x + hash(x * 3 + k);
      const depth = 0.8 + hash(x * 7 + k) * 6;
      specks.push(
        <Circle key={`${x}-${k}`} cx={sx(cam, sxm)} cy={sy(cam, game.groundHeight(sxm) - depth)} r={0.07 * cam.scale} fill={theme.dirtSpeck} />,
      );
    }
  }

  // The road band sits just under the surface: dark edges, colored middle, optional center dashes
  const road = line(-0.22);
  return (
    <G>
      <Path d={dirt} fill={theme.dirt} />
      {specks}
      <Path d={road} fill="none" stroke={theme.roadEdge} strokeWidth={0.46 * cam.scale} strokeLinejoin="round" />
      <Path d={road} fill="none" stroke={theme.road} strokeWidth={0.3 * cam.scale} strokeLinejoin="round" />
      {theme.roadDash && (
        <Path
          d={road} fill="none" stroke={theme.roadDash} strokeWidth={0.06 * cam.scale}
          strokeDasharray={`${0.6 * cam.scale} ${0.5 * cam.scale}`}
        />
      )}
    </G>
  );
}

// ---------- Pickups, obstacles and the finish flag ----------
const STAR = (() => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.11 : 0.26;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r).toFixed(3)}`);
  }
  return `${pts.join(' ')} Z`;
})();

export function Coins({ cam, game }: { cam: Camera; game: Game }) {
  const spin = Math.abs(Math.cos(game.getTime() * 3)) * 0.8 + 0.2; // fake 3D spin
  return (
    <G>
      {game.coins.map((coin, i) => {
        if (coin.taken || coin.x < cam.camX - 1 || coin.x > rightEdge(cam) + 1) return null;
        return (
          <G key={i} transform={`${at(cam, coin.x, coin.y)} scale(${spin} 1)`}>
            <Circle r={COIN_RADIUS} fill="#f5b800" stroke="#b87b00" strokeWidth={0.06} />
            <Circle r={COIN_RADIUS * 0.72} fill="none" stroke="#d99a00" strokeWidth={0.04} />
            <Path d={STAR} fill="#d99a00" />
          </G>
        );
      })}
    </G>
  );
}

/** Hay bales: a golden rounded block with straps. Bursting ones throw straw for half a second */
export function HayBales({ cam, game }: { cam: Camera; game: Game }) {
  const { w, h } = HAY_BALE;
  const now = game.getTime();
  return (
    <G>
      {game.hayBales.map((bale, i) => {
        if (bale.burst) {
          const t = now - bale.burstAt;
          if (t > 0.6) return null;
          const spread = 0.5 + t * 6;
          return (
            <G key={i} transform={at(cam, bale.burstX, bale.burstY)} opacity={1 - t / 0.6}>
              {Array.from({ length: 14 }, (_, k) => {
                const a = (k / 14) * Math.PI * 2 + hash(k + i) * 0.5;
                const r = spread * (0.6 + hash(k * 3 + i) * 0.6);
                const x = Math.cos(a) * r;
                const y = -Math.abs(Math.sin(a)) * r;
                return <Path key={k} d={`M${x} ${y} l${0.35 * Math.cos(a + 1)} ${0.35 * Math.sin(a + 1)}`} stroke="#e8bd4a" strokeWidth={0.1} />;
              })}
            </G>
          );
        }
        const p = bale.body.getPosition();
        if (p.x < cam.camX - 2 || p.x > rightEdge(cam) + 2) return null;
        return (
          <G key={i} transform={`${at(cam, p.x, p.y)} rotate(${(-bale.body.getAngle() * 180) / Math.PI})`}>
            <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.25} fill="#e8bd4a" stroke={OUTLINE} strokeWidth={0.06} />
            <Rect x={-w * 0.28} y={-h / 2} width={0.12} height={h} fill="#c99a2e" />
            <Rect x={w * 0.2} y={-h / 2} width={0.12} height={h} fill="#c99a2e" />
          </G>
        );
      })}
    </G>
  );
}

/** The mail bag pickup: a canvas sack with the red envelope from the truck. Bobs until picked up */
export function MailBag({ cam, game }: { cam: Camera; game: Game }) {
  const bag = game.mailBag;
  if (!bag.exists || bag.taken || bag.x < cam.camX - 2 || bag.x > rightEdge(cam) + 2) return null;
  const bob = Math.sin(game.getTime() * 4) * 0.08;
  return (
    <G transform={at(cam, bag.x, game.groundHeight(bag.x) + bob)}>
      <Path
        d="M-0.6 -0.05 Q-0.7 -0.6 -0.38 -0.95 L-0.2 -1.05 L0.2 -1.05 L0.38 -0.95 Q0.7 -0.6 0.6 -0.05 Q0 0.05 -0.6 -0.05 Z"
        fill="#2f5d9e" stroke={OUTLINE} strokeWidth={0.06}
      />
      <Rect x={-0.24} y={-1.12} width={0.48} height={0.12} rx={0.05} fill="#c8924f" stroke={OUTLINE} strokeWidth={0.04} />
      <Path d="M-0.2 -1.08 Q0 -1.55 0.2 -1.08" fill="none" stroke="#c8924f" strokeWidth={0.08} />
      <Rect x={-0.28} y={-0.62} width={0.56} height={0.38} fill="#e0322b" stroke={OUTLINE} strokeWidth={0.04} />
      <Path d="M-0.26 -0.6 L0 -0.4 L0.26 -0.6" fill="none" stroke="#ffffff" strokeWidth={0.06} />
    </G>
  );
}

export function FinishFlag({ cam, game }: { cam: Camera; game: Game }) {
  const cell = 0.4;
  const x = game.level.finishX;
  return (
    <G transform={at(cam, x, game.groundHeight(x))}>
      <Rect x={-0.07} y={-4.6} width={0.14} height={4.6} fill={OUTLINE} />
      {Array.from({ length: 12 }, (_, i) => {
        const c = i % 4;
        const r = Math.floor(i / 4);
        return (
          <Rect key={i} x={0.07 + c * cell} y={-4.5 + r * cell} width={cell} height={cell} fill={(c + r) % 2 ? '#111' : '#fff'} />
        );
      })}
      <Rect x={0.07} y={-4.5} width={cell * 4} height={cell * 3} fill="none" stroke={OUTLINE} strokeWidth={0.05} />
    </G>
  );
}
