# Delivery Run

A mail carrier's story: start on a rural route and work your way into town, delivering
parcels on the roof of Mail Truck 1 over hilly roads. You're paid for every parcel still on
the roof at the finish, plus coins.

## Run it
    npm install
    npx expo start

Scan the QR code with your iPhone camera to open it in Expo Go, then turn the phone sideways.
On school or public Wi-Fi the phone usually can't reach your computer; use `npx expo start --tunnel`.
This project uses Expo SDK 58, so your Expo Go app must support SDK 58.

## Controls
- GAS: drive. Power builds while held. In the air, lifts the nose.
- BRAKE: stop, then reverse. In the air, drops the nose.

## The story
| Chapter | Level | Picture |
|---|---|---|
| 1 Morning | Rural Route | `art/rural-level-1.png` |
| 2 Afternoon | Harvest Roads | `art/rural-level-2.png` |
| 3 Dusk | Last Run Before Dark | `art/rural-level-3.png` |
| 4 Midday | Into Town | `art/track-1.webp` |

- **Mail bag:** drive into it for 3 more parcels, stacked on top. Double the pay, easier to lose.
- **Hay bales:** bump gently to push, hit hard to burst through (the jolt can shake parcels loose).
- **Coins:** $10 each.

Story text for each chapter is in `src/levels/rural.ts` and `src/levels/track-1.ts`.

## Where things live
- `src/game.ts`: physics and rules. Tuning knobs are in `TUNING` and `RAIL_HEIGHT` at the top.
- `src/levels/`: one definition per chapter (coins, mail bag, hay bales, scenery, colors).
- `src/Scenery.tsx`: draws the world. `App.tsx`: screens, HUD and controls.
- `art/`: source pictures. `scripts/build-assets.py` turns them into game files.

## Making a new level
1. Draw a level picture in the same style (road as a band with dark outlines).
2. Add it to `LEVELS` in `scripts/build-assets.py` with a target steepest slope.
3. Run `python scripts/build-assets.py`. It traces the road and writes `src/levels/<id>.heights.ts`.
4. Add a level file in `src/levels/` (coins, scenery, colors) and list it in `src/levels/index.ts`.

## Check the physics without a phone
    npm run test:physics

Drives every chapter with simple bots and prints parcels delivered, coins and time.
