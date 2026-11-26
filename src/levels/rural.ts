// Chapters 1-3: the rural route, from morning to dusk.
// Road, coins, mail bag, hay bales, mud, bridge and cattle guard come from art/rural-level-*.json
// (via the generated rural-*.heights.ts). Scenery positions were read off the pictures by pixel.
import * as L1 from './rural-1.heights';
import * as L2 from './rural-2.heights';
import * as L3 from './rural-3.heights';
import { pictureUnits, type Level, type Picture, type Scenery } from './types';

const WALL_X = -5.5; // the post office's front wall (scripts/build-assets.py puts it here)
const SCENERY_M_PER_PX = 0.045; // the pictures are zoomed far out; this keeps barns van-friendly

type Generated = { PICTURE: Picture; HEIGHTS: number[]; FEATURES: typeof L1.FEATURES };

/** Everything that comes from the level's picture and JSON: the road and what's on it */
function ruralLevel({ PICTURE, HEIGHTS, FEATURES }: Generated) {
  const { px, size } = pictureUnits(PICTURE, SCENERY_M_PER_PX);
  const postOfficeW = size(182);
  return {
    px, size,
    road: {
      heights: HEIGHTS,
      startX: -30,
      endX: Math.round(px(PICTURE.width)) + 20,
      finishX: FEATURES.finishX,
      wallX: WALL_X,
      truckStartX: -3,
      coins: FEATURES.coins,
      mailBagX: FEATURES.mailBagX,
      hayBales: FEATURES.hayBales,
      mud: FEATURES.mud,
      bridges: FEATURES.bridges.map((b) => ({ ...b, planks: b.planks as [number, number][] })),
      cattleGuards: FEATURES.cattleGuards,
      picture: PICTURE,
    },
    postOffice: { kind: 'postOffice', x: WALL_X - postOfficeW, w: postOfficeW, h: size(120) } as Scenery,
  };
}

const fence = (px: (x: number) => number, a: number, b: number): Scenery => ({ kind: 'fence', x: px(a), x2: px(b) });

// ---------------------------------------------------------------- Chapter 1: morning
const r1 = ruralLevel(L1);
export const RURAL_1: Level = {
  id: 'rural-1',
  chapter: 1,
  title: 'Rural Route',
  timeOfDay: 'Morning',
  story: [
    'First day on the job. The little country post office is counting on you.',
    'Ease through the mud, cross the old covered bridge, and keep every parcel on the roof.',
  ],
  theme: {
    sky: '#bfe8ff', cloud: '#f2f9fd', farHills: '#c3ddb8', nearHills: '#d6e8b6', hillHeight: 2.5,
    dirt: '#7a5636', dirtSpeck: '#66472c', roadEdge: '#1f2530', road: '#c29a6b', roadDash: '#dcbf95', tree: '#8fbb7c',
  },
  ...r1.road,
  scenery: [
    { kind: 'barn', x: r1.px(918), w: r1.size(158), h: r1.size(140) },
    { kind: 'silo', x: r1.px(1099), w: r1.size(46), h: r1.size(170) },
    { kind: 'windmill', x: r1.px(2115), h: r1.size(140) },
    { kind: 'tree', x: r1.px(689), h: r1.size(120) },
    { kind: 'tree', x: r1.px(1686), h: r1.size(120) },
    { kind: 'tree', x: r1.px(2600), h: r1.size(125) },
    { kind: 'tree', x: r1.px(2693), h: r1.size(115) },
    fence(r1.px, 700, 1015), fence(r1.px, 1445, 1721), fence(r1.px, 2259, 2405), fence(r1.px, 2740, 3051),
    r1.postOffice,
    { kind: 'mailbox', x: r1.px(269) },
    { kind: 'mailbox', x: r1.px(2864) },
  ],
};

// ---------------------------------------------------------------- Chapter 2: afternoon
const r2 = ruralLevel(L2);
export const RURAL_2: Level = {
  id: 'rural-2',
  chapter: 2,
  title: 'Harvest Roads',
  timeOfDay: 'Afternoon',
  story: [
    'Word is getting around the county: the new carrier actually delivers.',
    'It\'s harvest season. Watch for hay on the road, and grab the extra mail bag if you dare.',
  ],
  theme: {
    sky: '#ffd9a0', cloud: '#fff6e8', farHills: '#e3b98f', nearHills: '#e5cb8c', hillHeight: 4,
    dirt: '#7d5030', dirtSpeck: '#6a4227', roadEdge: '#1f2530', road: '#b98a5c', roadDash: '#d3aa80', tree: '#c9924f',
  },
  ...r2.road,
  scenery: [
    { kind: 'windmill', x: r2.px(417), h: r2.size(140) },
    { kind: 'barn', x: r2.px(732), w: r2.size(171), h: r2.size(150) },
    { kind: 'silo', x: r2.px(908), w: r2.size(47), h: r2.size(200) },
    { kind: 'waterTower', x: r2.px(2809), w: r2.size(100), h: r2.size(190) },
    { kind: 'tree', x: r2.px(2269), h: r2.size(125) },
    { kind: 'tree', x: r2.px(3356), h: r2.size(125) },
    fence(r2.px, 278, 361), fence(r2.px, 714, 871), fence(r2.px, 1381, 1483), fence(r2.px, 2058, 2299),
    fence(r2.px, 2744, 2874), fence(r2.px, 3421, 3662),
    r2.postOffice,
    { kind: 'mailbox', x: r2.px(269) },
    { kind: 'mailbox', x: r2.px(3498) },
  ],
};

// ---------------------------------------------------------------- Chapter 3: dusk
const r3 = ruralLevel(L3);
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
  scenery: [
    { kind: 'waterTower', x: r3.px(1696), w: r3.size(100), h: r3.size(190) },
    { kind: 'barn', x: r3.px(2789), w: r3.size(161), h: r3.size(150) },
    { kind: 'silo', x: r3.px(2958), w: r3.size(50), h: r3.size(200) },
    { kind: 'windmill', x: r3.px(4250), h: r3.size(140) },
    { kind: 'tree', x: r3.px(533), h: r3.size(120) },
    { kind: 'tree', x: r3.px(3372), h: r3.size(120) },
    fence(r3.px, 702, 1029), fence(r3.px, 1426, 1711), fence(r3.px, 2058, 2393), fence(r3.px, 3422, 3694),
    fence(r3.px, 4096, 4438),
    r3.postOffice,
    { kind: 'mailbox', x: r3.px(270) },
    { kind: 'mailbox', x: r3.px(4749) },
  ],
};
