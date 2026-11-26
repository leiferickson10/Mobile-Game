// What a level (story chapter) is made of. Levels are plain data, so new chapters,
// and later player-built regions, are just more of these.
// No images in here, so levels also load in the Node physics test.

export type Scenery =
  | { kind: 'postOffice'; x: number; w: number; h: number }
  | { kind: 'house'; x: number; w: number; h: number }
  | { kind: 'tree'; x: number; h: number; color?: string }
  | { kind: 'mailbox'; x: number }
  | { kind: 'building'; x: number; w: number; h: number; windowCols: number }
  | { kind: 'barn'; x: number; w: number; h: number }
  | { kind: 'silo'; x: number; w: number; h: number }
  | { kind: 'windmill'; x: number; h: number }
  | { kind: 'waterTower'; x: number; w: number; h: number }
  | { kind: 'fence'; x: number; x2: number };

export type Theme = {
  sky: string;
  cloud: string;
  farHills: string;
  nearHills?: string; // second, closer hill layer (rural levels)
  hillHeight: number; // how tall the far hills get, meters
  dirt: string;
  dirtSpeck: string;
  roadEdge: string;
  road: string;
  roadDash?: string; // dashed center line (dirt roads)
  tree: string;
};

/** The picture a level was traced from (written by scripts/build-assets.py) */
export type Picture = { xMPerPx: number; yMPerPx: number; startPx: number; width: number; height: number };

export type Level = {
  id: string;
  chapter: number;
  title: string;
  timeOfDay: string;
  story: string[]; // shown on the card before the level
  theme: Theme;

  heights: number[]; // road height every 1 m from startX
  startX: number;
  endX: number; // road keeps going (flat) to here
  finishX: number;
  wallX: number; // can't reverse past this (the post office)
  truckStartX: number;

  coins: number[]; // world x of each coin
  mailBagX?: number; // pick up for 3 more parcels
  hayBales: number[]; // world x of each hay bale obstacle

  scenery: Scenery[]; // drawn back to front
  picture: Picture; // for the HUD minimap (its image is in src/levels/images.ts)
};

/** Helpers for placing things by reading pixel positions off the level picture */
export function pictureUnits(picture: Picture, sceneryMPerPx: number) {
  return {
    /** Picture x (pixels) -> world x (meters) */
    px: (x: number) => (x - picture.startPx) * picture.xMPerPx,
    /** Picture size (pixels) -> scenery size (meters) */
    size: (pixels: number) => pixels * sceneryMPerPx,
  };
}
