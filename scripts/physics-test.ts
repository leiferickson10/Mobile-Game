// Drive every level with simple bots and print how each run ends.
//   npm run test:physics
import { createGame, STEP, type Input } from '../src/game';
import { LEVELS } from '../src/levels';

type Game = ReturnType<typeof createGame>;
function run(level: (typeof LEVELS)[number], name: string, drive: (g: Game) => Input, secs = 150) {
  const g = createGame(level);
  let maxV = 0;
  for (let i = 0; i < secs / STEP && g.getStatus() === 'driving'; i++) {
    g.step(drive(g));
    maxV = Math.max(maxV, g.chassis.getLinearVelocity().x);
  }
  const bales = g.hayBales.map((b) => (b.burst ? `burst@${b.burstX.toFixed(0)}` : `intact@${b.body.getPosition().x.toFixed(0)}`)).join(',');
  console.log(
    '  ' + name.padEnd(9), g.getStatus().padEnd(8), 't', g.getTime().toFixed(1).padStart(5),
    'x', g.chassis.getPosition().x.toFixed(0).padStart(4), '/', level.finishX,
    ' parcels', `${g.cargoCount()}/${g.parcelTotal()}`, ' coins', `${g.coinCount()}/${g.coins.length}`,
    ' topV', maxV.toFixed(1), bales ? ` hay ${bales}` : '',
  );
}

const cap = (c: number) => (g: Game) => {
  const v = g.chassis.getLinearVelocity().x;
  return { gas: v < c, brake: v > c + 1.5 };
};

for (const level of LEVELS) {
  console.log(`Chapter ${level.chapter}: ${level.title} (${level.timeOfDay})`);
  run(level, 'idle', () => ({ gas: false, brake: false }), 6);
  run(level, 'full gas', () => ({ gas: true, brake: false }));
  for (const c of [3, 6, 8, 12]) run(level, 'cap ' + c, cap(c));
}
