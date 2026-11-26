// All physics and game rules. No React in here, so it can be tested on its own.
// Units are meters, and y points up.
import { Box, Chain, Circle, Vec2, WheelJoint, World, type Body } from 'planck';
import type { Level } from './levels/types';

// ---- Change these to tune how the game feels ----
export const TUNING = {
  gravity: 10,
  motorSpeed: 35, // top wheel spin (radians/sec). Higher = faster truck
  throttleRamp: 1.5, // seconds to reach full power. Higher = gentler starts
  motorTorque: 14, // engine strength. Higher = quicker starts and better climbing
  brakeTorque: 30,
  reverseSpeed: 11,
  suspensionHz: 4, // higher = stiffer suspension
  suspensionDamping: 0.8, // higher = less bouncing
  wheelGrip: 1.4,
  rollingResistance: 0.6, // slows the wheels when no pedal is pressed
  airControl: 14, // how fast gas/brake tilt the truck in the air
  cargoFriction: 0.8, // higher = boxes slide less
  cargoDensity: 0.35,
  hayDensity: 0.5, // higher = hay bales are harder to push
  hayBurstSpeed: 1.5, // hit a hay bale faster than this (m/s) and it bursts. Slower just pushes it
};

export const WHEEL_RADIUS = 0.4;
export const BOX_SIZE = 0.6;
export const STEP = 1 / 60;
export const COIN_RADIUS = 0.45;
export const COIN_HEIGHT = 1.3; // coin center, meters above the road
export const MAIL_BAG_RADIUS = 0.55; // pickup size, roughly the bag's half width
export const HAY_BALE = { w: 1.5, h: 1.1 }; // lying on its side

// ---- Mail Truck 1 ----
// Measured from the "Mail Truck 1" picture: 1 picture pixel = TRUCK_PX meters.
// Truck-local meters: x forward, y up, wheel centers at y = -0.55.
const TRUCK_PX = WHEEL_RADIUS / 75; // the tires are 75 px in radius
const tx = (pictureX: number) => (pictureX - 688) * TRUCK_PX; // 688 = halfway between the wheels
const ty = (pictureY: number) => -0.55 + (640 - pictureY) * TRUCK_PX; // 640 = wheel centers

/** Rectangle from picture pixels: left, top, right, bottom */
const part = (l: number, t: number, r: number, b: number, density: number) => ({
  cx: tx((l + r) / 2), cy: ty((t + b) / 2),
  hw: ((r - l) / 2) * TRUCK_PX, hh: ((b - t) / 2) * TRUCK_PX,
  density,
});

export const ROOF_Y = ty(242); // top of the cargo box
export const RAIL_HEIGHT = 0.7; // roof rack rails. Higher = parcels fall off less
/** Parcel starting spots on the roof: [truck-local x, row]. Row 1 = stacked on row 0 */
const PARCEL_SLOTS: [number, number][] = [[-1.62, 0], [-1.0, 0], [-0.38, 0]];
/** Where the mail bag's extra parcels land: stacked on top of the first row */
const MAIL_BAG_SLOTS: [number, number][] = [[-1.62, 1], [-1.0, 1], [-0.38, 1]];
export const TRUCK_PARTS = {
  floor: part(320, 590, 1050, 622, 3), // heavy floor keeps the van from tipping
  cargoBox: part(310, 242, 715, 590, 0.12),
  cab: part(715, 282, 900, 590, 0.12),
  hood: part(900, 440, 1062, 590, 0.12),
  // Roof rack rails that keep the parcels on the roof
  rearRail: { cx: tx(312), cy: ROOF_Y + RAIL_HEIGHT / 2, hw: 0.05, hh: RAIL_HEIGHT / 2, density: 0.12 },
  frontRail: { cx: tx(705), cy: ROOF_Y + RAIL_HEIGHT / 2, hw: 0.05, hh: RAIL_HEIGHT / 2, density: 0.12 },
};

/** Where to draw assets/mail-truck-1.png, in truck-local meters (crop: 290,235 to 1080,720) */
export const TRUCK_SPRITE = {
  x: tx(290), top: ty(235),
  width: (1080 - 290) * TRUCK_PX, height: (720 - 235) * TRUCK_PX,
};
/** Wheel sprite radius: tire plus its outline (76 px in the picture) */
export const WHEEL_SPRITE_RADIUS = 76 * TRUCK_PX;

// ---- The road ----
/** The road for a level: its height at any x, and the points the physics ground is built from */
export function makeRoad(level: Level) {
  const { heights, startX } = level;
  const groundHeight = (x: number): number => {
    const i = x - startX; // heights are 1 m apart
    if (i <= 0) return heights[0];
    if (i >= heights.length - 1) return heights[heights.length - 1];
    const i0 = Math.floor(i);
    return heights[i0] + (heights[i0 + 1] - heights[i0]) * (i - i0);
  };
  const terrain: { x: number; y: number }[] = [];
  for (let x = startX; x <= level.endX; x += 0.5) terrain.push({ x, y: groundHeight(x) });
  return { groundHeight, terrain };
}

export type Status = 'driving' | 'finished' | 'flipped';
export type Input = { gas: boolean; brake: boolean };

export function createGame(level: Level) {
  const { groundHeight, terrain } = makeRoad(level);
  const world = new World({ gravity: new Vec2(0, -TUNING.gravity) });

  const ground = world.createBody();
  ground.createFixture(new Chain(terrain.map((p) => new Vec2(p.x, p.y)), false), { friction: 0.9 });
  // Wall so the truck can't reverse into the post office
  ground.createFixture(new Box(0.2, 5, new Vec2(level.wallX, 5)));

  const chassis = world.createDynamicBody({ position: new Vec2(level.truckStartX, groundHeight(level.truckStartX) + 1.05) });
  for (const { cx, cy, hw, hh, density } of Object.values(TRUCK_PARTS)) {
    chassis.createFixture(new Box(hw, hh, new Vec2(cx, cy)), {
      density,
      friction: TUNING.cargoFriction,
    });
  }

  const makeWheel = (localX: number) => {
    const p = chassis.getWorldPoint(new Vec2(localX, -0.55));
    const wheel = world.createDynamicBody({ position: p });
    wheel.createFixture(new Circle(WHEEL_RADIUS), { density: 1, friction: TUNING.wheelGrip });
    const joint = world.createJoint(
      new WheelJoint(
        {
          enableMotor: false,
          maxMotorTorque: TUNING.motorTorque,
          frequencyHz: TUNING.suspensionHz,
          dampingRatio: TUNING.suspensionDamping,
        },
        chassis, wheel, wheel.getPosition(), new Vec2(0, 1),
      ),
    )!;
    return { wheel, joint };
  };
  const rear = makeWheel(tx(474));
  const front = makeWheel(tx(902));

  /** Put a parcel on the roof, moving and tilted exactly like the roof under it */
  const loadParcel = ([x, row]: [number, number]) => {
    const local = new Vec2(x, ROOF_Y + BOX_SIZE / 2 + 0.01 + row * (BOX_SIZE + 0.03));
    const position = chassis.getWorldPoint(local);
    const body = world.createDynamicBody({ position, angle: chassis.getAngle(), bullet: true });
    body.createFixture(new Box(BOX_SIZE / 2, BOX_SIZE / 2), {
      density: TUNING.cargoDensity, friction: TUNING.cargoFriction,
    });
    body.setLinearVelocity(chassis.getLinearVelocityFromWorldPoint(position));
    body.setAngularVelocity(chassis.getAngularVelocity());
    return body;
  };
  // Parcels on the roof rack, side by side. The mail bag adds more to this list.
  const boxes: Body[] = PARCEL_SLOTS.map(loadParcel);

  // Hay bales lie on the road, tilted to match it. Bump one gently and you push it;
  // hit it harder and it bursts (the van still gets jolted by the hit)
  const hayBales = level.hayBales.map((x) => {
    const slope = Math.atan2(groundHeight(x + 0.5) - groundHeight(x - 0.5), 1);
    const body = world.createDynamicBody({ position: new Vec2(x, groundHeight(x) + HAY_BALE.h / 2 + 0.02), angle: slope });
    body.createFixture(new Box(HAY_BALE.w / 2, HAY_BALE.h / 2), { density: TUNING.hayDensity, friction: 0.9 });
    return { body, bursting: false, burst: false, burstAt: 0, burstX: 0, burstY: 0 };
  });
  const vanBodies = new Set<Body>([chassis, rear.wheel, front.wheel]);
  // Fires inside world.step(), before the bump is resolved, so speeds are the real impact speeds
  world.on('begin-contact', (contact) => {
    const a = contact.getFixtureA().getBody();
    const b = contact.getFixtureB().getBody();
    const bale = hayBales.find((h) => h.body === a || h.body === b);
    if (!bale || bale.burst || !(vanBodies.has(a) || vanBodies.has(b))) return;
    const impact = Math.abs(chassis.getLinearVelocity().x - bale.body.getLinearVelocity().x);
    if (impact > TUNING.hayBurstSpeed) bale.bursting = true; // removed after the step
  });

  const coins = level.coins.map((x) => ({ x, y: groundHeight(x) + COIN_HEIGHT, taken: false }));
  const mailBagX = level.mailBagX ?? Number.NaN;
  const mailBag = {
    exists: level.mailBagX !== undefined,
    x: mailBagX,
    y: groundHeight(mailBagX) + MAIL_BAG_RADIUS,
    taken: false,
    takenAt: 0, // game time of the pickup, for the "+3 parcels" message
  };

  let status: Status = 'driving';
  let time = 0;
  let flippedFor = 0;
  let throttle = 0; // 0 to 1, builds while gas is held

  const isOnBoard = (box: Body) => {
    const p = chassis.getLocalPoint(box.getPosition());
    return p.x > tx(312) - 0.1 && p.x < tx(705) + 0.1 && p.y > ROOF_Y - 0.1 && p.y < ROOF_Y + 2;
  };
  const cargoCount = () => boxes.filter(isOnBoard).length;
  const coinCount = () => coins.filter((c) => c.taken).length;

  /** Does a round pickup at (x, y) with radius r touch the van's outline? */
  const touchesVan = (x: number, y: number, r: number) => {
    if (Math.abs(x - chassis.getPosition().x) > 4) return false;
    const p = chassis.getLocalPoint(new Vec2(x, y));
    return p.x > tx(310) - r && p.x < tx(1062) + r && p.y > -1 - r && p.y < ROOF_Y + r;
  };

  // A coin is collected when it touches the van (or a parcel)
  const collectCoins = () => {
    for (const coin of coins) {
      if (coin.taken) continue;
      const hitsParcel = boxes.some((b) => Vec2.distance(b.getPosition(), new Vec2(coin.x, coin.y)) < BOX_SIZE / 2 + COIN_RADIUS);
      if (touchesVan(coin.x, coin.y, COIN_RADIUS) || hitsParcel) coin.taken = true;
    }
  };

  // Driving into the mail bag loads more parcels onto the roof
  const collectMailBag = () => {
    if (!mailBag.exists || mailBag.taken || !touchesVan(mailBag.x, mailBag.y, MAIL_BAG_RADIUS)) return;
    mailBag.taken = true;
    mailBag.takenAt = time;
    boxes.push(...MAIL_BAG_SLOTS.map(loadParcel));
  };

  const wheelOnGround = (wheel: Body) => {
    for (let c = wheel.getContactList(); c; c = c.next) {
      if (c.other === ground && c.contact.isTouching()) return true;
    }
    return false;
  };

  function step(input: Input) {
    if (status !== 'driving') return;
    time += STEP;

    throttle = input.gas && !input.brake ? Math.min(1, throttle + STEP / TUNING.throttleRamp) : 0;

    const forwardSpeed = chassis.getLinearVelocity().x;
    let speed = 0;
    let torque = TUNING.rollingResistance; // coasting: motor at speed 0 with a weak grip
    let motorOn = true;
    if (input.brake) {
      motorOn = true;
      // Stop first. Once nearly stopped, the same button reverses
      const reversing = forwardSpeed < 0.5;
      speed = reversing ? TUNING.reverseSpeed : 0;
      torque = reversing ? TUNING.motorTorque * 0.6 : TUNING.brakeTorque;
    } else if (input.gas) {
      motorOn = true;
      speed = -TUNING.motorSpeed; // negative spin drives to the right
      torque = TUNING.motorTorque * (0.25 + 0.75 * throttle);
    }
    for (const { joint } of [rear, front]) {
      joint.enableMotor(motorOn);
      joint.setMotorSpeed(speed);
      joint.setMaxMotorTorque(torque);
    }

    // In the air: gas lifts the nose, brake drops it
    if (!wheelOnGround(rear.wheel) && !wheelOnGround(front.wheel)) {
      const tilt = (input.gas ? 1 : 0) - (input.brake ? 1 : 0);
      if (tilt) chassis.applyTorque(tilt * TUNING.airControl, true);
    }

    world.step(STEP, 8, 4);
    for (const bale of hayBales) {
      if (!bale.bursting) continue;
      const p = bale.body.getPosition();
      Object.assign(bale, { bursting: false, burst: true, burstAt: time, burstX: p.x, burstY: p.y });
      world.destroyBody(bale.body); // safe here: the step is over
    }
    collectCoins();
    collectMailBag();

    const upsideDown = Math.cos(chassis.getAngle()) < 0;
    flippedFor = upsideDown ? flippedFor + STEP : 0;
    if (flippedFor > 1.5) status = 'flipped';
    else if (chassis.getPosition().x >= level.finishX) status = 'finished';
  }

  return {
    level, groundHeight, terrain,
    step, chassis, boxes, hayBales, coins, mailBag, cargoCount, coinCount,
    parcelTotal: () => boxes.length,
    wheels: [rear.wheel, front.wheel],
    getStatus: () => status,
    getTime: () => time,
  };
}

export type Game = ReturnType<typeof createGame>;
