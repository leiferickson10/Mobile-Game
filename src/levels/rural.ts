// Chapters 1-3: the rural route, from morning to dusk.
// Roads traced from art/rural-level-*.png. Coins, the gas can (now the mail bag) and hay bales
// were found by color in those pictures; scenery positions were read off them by pixel.
import * as L1 from './rural-1.heights';
import * as L2 from './rural-2.heights';
import * as L3 from './rural-3.heights';
import { pictureUnits, type Level, type Picture, type Scenery } from './types';

const WALL_X = -5.5; // the post office's front wall (scripts/build-assets.py puts it here)
const SCENERY_M_PER_PX = 0.045; // the pictures are zoomed far out; this keeps barns van-friendly

/** Things all three rural pictures share: post office at the start, road out of town */
function ruralLevel(picture: Picture, heights: number[], finishPx: number) {
  const { px, size } = pictureUnits(picture, SCENERY_M_PER_PX);
  const postOfficeW = size(182);
  return {
    px, size,
    road: {
      heights,
      startX: -30,
      endX: Math.round(px(picture.width)) + 20,
      finishX: Math.round(px(finishPx)),
      wallX: WALL_X,
      truckStartX: -3,
    },
    postOffice: { kind: 'postOffice', x: WALL_X - postOfficeW, w: postOfficeW, h: size(120) } as Scenery,
  };
}

const fence = (px: (x: number) => number, a: number, b: number): Scenery => ({ kind: 'fence', x: px(a), x2: px(b) });

// ---------------------------------------------------------------- Chapter 1: morning
const r1 = ruralLevel(L1.PICTURE, L1.HEIGHTS, 2163);
export const RURAL_1: Level = {
  id: 'rural-1',
  chapter: 1,
  title: 'Rural Route',
  timeOfDay: 'Morning',
  story: [
    'First day on the job. The little country post office is counting on you.',
    'Keep the parcels on the roof. Every box that falls off is somebody\'s mail.',
  ],
  theme: {
    sky: '#bfe8ff', cloud: '#f2f9fd', farHills: '#c3ddb8', nearHills: '#d6e8b6', hillHeight: 2.5,
    dirt: '#7a5636', dirtSpeck: '#66472c', roadEdge: '#1f2530', road: '#c29a6b', roadDash: '#dcbf95', tree: '#8fbb7c',
  },
  ...r1.road,
  coins: [440, 497, 532, 567, 625, 949, 1019, 1088, 1482, 1563, 1621, 1690, 1829].map(r1.px),
  mailBagX: r1.px(1273),
  hayBales: [r1.px(1412)],
  scenery: [
    { kind: 'barn', x: r1.px(655), w: r1.size(174), h: r1.size(146) },
    { kind: 'silo', x: r1.px(838), w: r1.size(47), h: r1.size(180) },
    { kind: 'windmill', x: r1.px(1320), h: r1.size(140) },
    { kind: 'tree', x: r1.px(429), h: r1.size(120) },
    { kind: 'tree', x: r1.px(1042), h: r1.size(120) },
    { kind: 'tree', x: r1.px(1807), h: r1.size(125) },
    { kind: 'tree', x: r1.px(1899), h: r1.size(115) },
    fence(r1.px, 260, 362), fence(r1.px, 701, 1043), fence(r1.px, 1382, 1721), fence(r1.px, 2061, 2232),
    r1.postOffice,
    { kind: 'mailbox', x: r1.px(270) },
    { kind: 'mailbox', x: r1.px(2073) },
  ],
  picture: L1.PICTURE,
};

// ---------------------------------------------------------------- Chapter 2: afternoon
const r2 = ruralLevel(L2.PICTURE, L2.HEIGHTS, 2797);
export const RURAL_2: Level = {
  id: 'rural-2',
  chapter: 2,
  title: 'Harvest Roads',
  timeOfDay: 'Afternoon',
  story: [
    'Word is getting around the county: the new carrier actually delivers.',
    'It\'s harvest season. Watch for hay bales on the road, and grab the extra mail bag if you dare.',
  ],
  theme: {
    sky: '#ffd9a0', cloud: '#fff6e8', farHills: '#e3b98f', nearHills: '#e5cb8c', hillHeight: 4,
    dirt: '#7d5030', dirtSpeck: '#6a4227', roadEdge: '#1f2530', road: '#b98a5c', roadDash: '#d3aa80', tree: '#c9924f',
  },
  ...r2.road,
  coins: [432, 527, 623, 718, 1084, 1211, 1338, 1592, 1703, 1799, 1918, 2053, 2402].map(r2.px),
  mailBagX: r2.px(1520),
  hayBales: [r2.px(948), r2.px(2247)],
  scenery: [
    { kind: 'windmill', x: r2.px(417), h: r2.size(140) },
    { kind: 'barn', x: r2.px(728), w: r2.size(172), h: r2.size(150) },
    { kind: 'silo', x: r2.px(908), w: r2.size(49), h: r2.size(210) },
    { kind: 'waterTower', x: r2.px(2163), w: r2.size(100), h: r2.size(190) },
    { kind: 'tree', x: r2.px(1624), h: r2.size(125) },
    { kind: 'tree', x: r2.px(2561), h: r2.size(125) },
    fence(r2.px, 277, 364), fence(r2.px, 699, 1042), fence(r2.px, 1377, 1719), fence(r2.px, 2062, 2397), fence(r2.px, 2742, 2877),
    r2.postOffice,
    { kind: 'mailbox', x: r2.px(270) },
    { kind: 'mailbox', x: r2.px(2705) },
  ],
  picture: L2.PICTURE,
};

// ---------------------------------------------------------------- Chapter 3: dusk
const r3 = ruralLevel(L3.PICTURE, L3.HEIGHTS, 4048);
export const RURAL_3: Level = {
  id: 'rural-3',
  chapter: 3,
  title: 'Last Run Before Dark',
  timeOfDay: 'Dusk',
  story: [
    'The longest route in the county, and the sun is going down.',
    'Finish this one with the mail in one piece and the town post office might just notice you.',
  ],
  theme: {
    sky: '#8e9bc4', cloud: '#eef3f8', farHills: '#7f8f99', nearHills: '#8c9c7e', hillHeight: 4.5,
    dirt: '#533c2c', dirtSpeck: '#463224', roadEdge: '#1f2530', road: '#9c7a58', roadDash: '#b39270', tree: '#62805a',
  },
  ...r3.road,
  coins: [509, 740, 948, 1485, 1716, 1924, 2046, 2290, 2802, 2973, 3131, 3241, 3351, 3534].map(r3.px),
  mailBagX: r3.px(2546),
  hayBales: [r3.px(1204)],
  scenery: [
    { kind: 'waterTower', x: r3.px(1437), w: r3.size(100), h: r3.size(190) },
    { kind: 'barn', x: r3.px(2130), w: r3.size(171), h: r3.size(150) },
    { kind: 'silo', x: r3.px(2307), w: r3.size(53), h: r3.size(200) },
    { kind: 'windmill', x: r3.px(3603), h: r3.size(140) },
    { kind: 'tree', x: r3.px(533), h: r3.size(120) },
    { kind: 'tree', x: r3.px(2728), h: r3.size(120) },
    fence(r3.px, 271, 364), fence(r3.px, 698, 1041), fence(r3.px, 1374, 1728), fence(r3.px, 2062, 2395), fence(r3.px, 3415, 3759), fence(r3.px, 4092, 4134),
    r3.postOffice,
    { kind: 'mailbox', x: r3.px(269) },
    { kind: 'mailbox', x: r3.px(3955) },
  ],
  picture: L3.PICTURE,
};
