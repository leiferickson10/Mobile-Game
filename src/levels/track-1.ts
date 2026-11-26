// Chapter 4: Into Town. From the post office, over the rolling hills and the big hill, to the city.
// Road traced from art/track-1.webp; everything else placed by reading pixel positions off it.
import { HEIGHTS, PICTURE } from './track-1.heights';
import { pictureUnits, type Level, type Scenery } from './types';

const { px, size } = pictureUnits(PICTURE, 0.08);
const WALL_X = -5.5;
const POST_OFFICE_W = size(140);

export const TRACK_1: Level = {
  id: 'track-1',
  chapter: 4,
  title: 'Into Town',
  timeOfDay: 'Midday',
  story: [
    'Promotion! The town post office wants you on its busiest route.',
    'Bigger hills, more mail, and the city skyline at the end of the road.',
  ],
  theme: {
    sky: '#9fe4fa',
    cloud: '#ffffff',
    farHills: '#bedcc4',
    hillHeight: 2.2,
    dirt: '#755a38',
    dirtSpeck: '#5f4629',
    roadEdge: '#1f262d',
    road: '#59616a',
    tree: '#a6d39c',
  },

  heights: HEIGHTS,
  startX: -30,
  endX: Math.round(px(1568)) + 20,
  finishX: Math.round(px(1478)),
  wallX: WALL_X,
  truckStartX: -3,

  coins: [267, 304, 340, 432, 468, 505, 599, 663, 727, 840, 876, 912, 1070, 1120, 1168, 1217].map((x) => ({ x: px(x) })),
  mailBagX: px(777),
  hayBales: [],

  scenery: [
    { kind: 'building', x: px(1058), w: size(70), h: size(300), windowCols: 2 },
    { kind: 'building', x: px(1135), w: size(63), h: size(195), windowCols: 2 },
    { kind: 'building', x: px(1208), w: size(80), h: size(145), windowCols: 3 },
    { kind: 'building', x: px(1293), w: size(67), h: size(85), windowCols: 2 },
    { kind: 'building', x: px(1367), w: size(81), h: size(145), windowCols: 3 },
    { kind: 'building', x: px(1455), w: size(75), h: size(115), windowCols: 3 },
    { kind: 'house', x: px(230), w: size(62), h: size(55) },
    { kind: 'house', x: px(412), w: size(60), h: size(58) },
    { kind: 'house', x: px(608), w: size(58), h: size(50) },
    { kind: 'tree', x: px(268), h: size(55) },
    { kind: 'tree', x: px(340), h: size(60) },
    { kind: 'tree', x: px(372), h: size(50) },
    { kind: 'tree', x: px(566), h: size(55) },
    { kind: 'tree', x: px(676), h: size(52) },
    { kind: 'tree', x: px(862), h: size(70) },
    { kind: 'postOffice', x: WALL_X - POST_OFFICE_W, w: POST_OFFICE_W, h: size(92) },
    { kind: 'mailbox', x: px(210) },
    { kind: 'mailbox', x: px(530) },
    { kind: 'mailbox', x: px(1363) },
  ] as Scenery[],
  picture: PICTURE,
};
