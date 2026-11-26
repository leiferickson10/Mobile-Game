import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Image as SvgImage, Line, Rect } from 'react-native-svg';
import {
  BOX_SIZE, createGame, STEP, TRUCK_PARTS, TRUCK_SPRITE, WHEEL_SPRITE_RADIUS,
  type Game, type Input,
} from './src/game';
import { LEVELS, type Level } from './src/levels';
import { LEVEL_IMAGES } from './src/levels/images';
import {
  Backdrop, Coins, FenceLayer, FinishFlag, Ground, HayBales, MailBag, OUTLINE, SceneryLayer, type Camera,
} from './src/Scenery';

const PAY_PER_BOX = 100;
const PAY_PER_COIN = 10;

const TRUCK_IMAGE = require('./assets/mail-truck-1.png');
const WHEEL_IMAGE = require('./assets/mail-truck-1-wheel.png');
const CARRIER_IMAGE = require('./assets/mail-carrier.png');

const INK = '#17313f'; // HUD and button color
const MAIL_RED = '#d8352b';

type Screen = { name: 'chapters' } | { name: 'story'; index: number } | { name: 'play'; index: number; attempt: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'chapters' });
  return (
    <SafeAreaProvider>
      {screen.name === 'chapters' && <ChapterSelect onPick={(index) => setScreen({ name: 'story', index })} />}
      {screen.name === 'story' && (
        <StoryCard
          level={LEVELS[screen.index]}
          onStart={() => setScreen({ name: 'play', index: screen.index, attempt: 0 })}
          onBack={() => setScreen({ name: 'chapters' })}
        />
      )}
      {screen.name === 'play' && (
        <DeliveryRun
          key={`${screen.index}-${screen.attempt}`} // new key = fresh game
          level={LEVELS[screen.index]}
          onRetry={() => setScreen({ ...screen, attempt: screen.attempt + 1 })}
          onChapters={() => setScreen({ name: 'chapters' })}
          onNext={screen.index + 1 < LEVELS.length ? () => setScreen({ name: 'story', index: screen.index + 1 }) : undefined}
        />
      )}
      <StatusBar hidden />
    </SafeAreaProvider>
  );
}

// ---------------------------------------------------------------- chapter select
function ChapterSelect({ onPick }: { onPick: (index: number) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.menu, { paddingLeft: insets.left + 24, paddingRight: insets.right + 16 }]}>
      <View style={styles.menuTitleBlock}>
        <Image source={CARRIER_IMAGE} style={styles.menuPortrait} />
        <Text style={styles.menuTitle}>Delivery{'\n'}Run</Text>
        <Text style={styles.menuTagline}>A mail carrier's story</Text>
      </View>
      <ScrollView horizontal contentContainerStyle={styles.chapterRow} showsHorizontalScrollIndicator={false}>
        {LEVELS.map((level, i) => (
          <Pressable key={level.id} onPress={() => onPick(i)} style={({ pressed }) => [styles.chapterCard, pressed && styles.pressed]}>
            <Image source={LEVEL_IMAGES[level.id]} style={styles.chapterThumb} resizeMode="cover" />
            <View style={styles.chapterText}>
              <Text style={styles.chapterKicker}>Chapter {level.chapter} · {level.timeOfDay}</Text>
              <Text style={styles.chapterTitle}>{level.title}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------- story card
function StoryCard({ level, onStart, onBack }: { level: Level; onStart: () => void; onBack: () => void }) {
  return (
    <View style={[styles.storyScreen, { backgroundColor: level.theme.sky }]}>
      <View style={styles.storyCard}>
        <Image source={CARRIER_IMAGE} style={styles.storyPortrait} />
        <View style={styles.storyBody}>
          <Text style={styles.chapterKicker}>Chapter {level.chapter} · {level.timeOfDay}</Text>
          <Text style={styles.storyTitle}>{level.title}</Text>
          {level.story.map((line, i) => (
            <Text key={i} style={styles.storyLine}>{line}</Text>
          ))}
          <View style={styles.storyButtons}>
            <Pressable style={({ pressed }) => [styles.bigButton, pressed && styles.pressed]} onPress={onStart}>
              <Text style={styles.bigButtonText}>Start delivery</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]} onPress={onBack}>
              <Text style={styles.ghostButtonText}>Chapters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- the game
function DeliveryRun({ level, onRetry, onChapters, onNext }: {
  level: Level; onRetry: () => void; onChapters: () => void; onNext?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gameRef = useRef<Game | null>(null);
  gameRef.current ??= createGame(level);
  const input = useRef<Input>({ gas: false, brake: false });
  const [, setFrame] = useState(0);
  const [pressed, setPressed] = useState<Input>({ gas: false, brake: false });

  // Game loop: physics always advances in equal steps, whatever the screen's frame rate
  useEffect(() => {
    let id: number;
    let last: number | null = null;
    let owed = 0;
    const loop = (now: number) => {
      if (last !== null) owed += Math.min((now - last) / 1000, 0.1);
      last = now;
      while (owed >= STEP) {
        gameRef.current!.step(input.current);
        owed -= STEP;
      }
      setFrame((f) => f + 1);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const setPedal = (pedal: keyof Input, down: boolean) => {
    input.current = { ...input.current, [pedal]: down };
    setPressed(input.current);
  };

  const game = gameRef.current;
  const status = game.getStatus();
  const truck = game.chassis.getPosition();
  const cargo = game.cargoCount();
  const parcelTotal = game.parcelTotal();
  const coins = game.coinCount();
  const showBagMessage = game.mailBag.taken && game.getTime() - game.mailBag.takenAt < 2;

  // Camera: pixels per meter, with the truck a bit left of center
  const scale = Math.min(width / 17, height / 10);
  const cam: Camera = {
    camX: truck.x - (width * 0.32) / scale,
    camY: truck.y + (height * 0.55) / scale,
    scale, width, height,
  };
  const sx = (x: number) => (x - cam.camX) * scale;
  const sy = (y: number) => (cam.camY - y) * scale;
  const deg = (radians: number) => (-radians * 180) / Math.PI;

  // Minimap: the level's own picture, with a marker where the truck is
  const pic = level.picture;
  const mapW = Math.min(200, (44 * pic.width) / pic.height);
  const mapH = (mapW * pic.height) / pic.width;
  const truckPx = pic.startPx + truck.x / pic.xMPerPx;
  const mapFrac = Math.max(0, Math.min(1, truckPx / pic.width));
  const pay = cargo * PAY_PER_BOX + coins * PAY_PER_COIN;

  return (
    <View style={[styles.screen, { backgroundColor: level.theme.sky }]}>
      <Svg width={width} height={height}>
        <Backdrop cam={cam} theme={level.theme} />
        <SceneryLayer cam={cam} game={game} />
        <FenceLayer cam={cam} game={game} />
        <FinishFlag cam={cam} game={game} />
        <Ground cam={cam} game={game} />
        <Coins cam={cam} game={game} />
        <MailBag cam={cam} game={game} />
        <HayBales cam={cam} game={game} />

        {/* Parcels first, so the van's roof edge sits in front of their bottoms */}
        {game.boxes.map((box, i) => {
          const p = box.getPosition();
          return (
            <G key={i} transform={`translate(${sx(p.x)} ${sy(p.y)}) rotate(${deg(box.getAngle())}) scale(${scale})`}>
              <Rect x={-BOX_SIZE / 2} y={-BOX_SIZE / 2} width={BOX_SIZE} height={BOX_SIZE} fill="#c8924f" stroke="#6e4a1f" strokeWidth={0.05} />
              <Line x1={0} y1={-BOX_SIZE / 2} x2={0} y2={BOX_SIZE / 2} stroke="#eed9a8" strokeWidth={0.1} />
            </G>
          );
        })}

        {/* Mail Truck 1: the picture is moved and rotated with the physics body.
            Pictures get screen-pixel sizes and no scale(): on iOS, react-native-svg draws a
            bitmap at its pre-scale size and then stretches it, which makes it blurry. */}
        <G transform={`translate(${sx(truck.x)} ${sy(truck.y)}) rotate(${deg(game.chassis.getAngle())})`}>
          <SvgImage
            href={TRUCK_IMAGE}
            x={TRUCK_SPRITE.x * scale}
            y={-TRUCK_SPRITE.top * scale}
            width={TRUCK_SPRITE.width * scale}
            height={TRUCK_SPRITE.height * scale}
            preserveAspectRatio="none"
          />
          {/* Roof rack rails, drawn from the physics rails (vector shapes scale cleanly) */}
          <G transform={`scale(${scale})`}>
            {[TRUCK_PARTS.rearRail, TRUCK_PARTS.frontRail].map(({ cx, cy, hw, hh }, i) => (
              <Rect key={i} x={cx - hw} y={-cy - hh} width={hw * 2} height={hh * 2 + 0.04} fill={OUTLINE} />
            ))}
          </G>
        </G>

        {game.wheels.map((wheel, i) => {
          const p = wheel.getPosition();
          const r = WHEEL_SPRITE_RADIUS * scale;
          return (
            <G key={i} transform={`translate(${sx(p.x)} ${sy(p.y)}) rotate(${deg(wheel.getAngle())})`}>
              <SvgImage href={WHEEL_IMAGE} x={-r} y={-r} width={r * 2} height={r * 2} />
            </G>
          );
        })}
      </Svg>

      <View style={[styles.hud, { top: insets.top + 8, left: insets.left + 16, right: insets.right + 16 }]}>
        <View>
          <Text style={styles.hudText}>Parcels {cargo}/{parcelTotal}</Text>
          <Text style={styles.hudText}>Coins {coins}/{game.coins.length}</Text>
          <Text style={styles.hudSmall}>{game.getTime().toFixed(1)}s</Text>
        </View>
        <View style={styles.minimap}>
          <Image source={LEVEL_IMAGES[level.id]} style={{ width: mapW, height: mapH }} />
          <View style={[styles.minimapMarker, { left: mapFrac * mapW - 1.5 }]} />
        </View>
        <View style={styles.spacer} />
        <Pressable style={styles.smallButton} onPress={onChapters}>
          <Text style={styles.smallButtonText}>Chapters</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onRetry}>
          <Text style={styles.smallButtonText}>Restart</Text>
        </Pressable>
      </View>

      {showBagMessage && (
        <View pointerEvents="none" style={[styles.toast, { top: insets.top + 70 }]}>
          <Text style={styles.toastText}>Mail bag! +3 parcels</Text>
        </View>
      )}

      {/* Touch events (not Pressable) so both pedals can be held at once */}
      {(['brake', 'gas'] as const).map((pedal) => (
        <View
          key={pedal}
          onTouchStart={() => setPedal(pedal, true)}
          onTouchEnd={() => setPedal(pedal, false)}
          onTouchCancel={() => setPedal(pedal, false)}
          style={[
            styles.pedal,
            { bottom: insets.bottom + 16 },
            pedal === 'gas' ? { right: insets.right + 20 } : { left: insets.left + 20 },
            { backgroundColor: pedal === 'gas' ? '#2e7d32' : '#b23b2e' },
            pressed[pedal] && styles.pedalDown,
          ]}
        >
          <Text style={styles.pedalText}>{pedal.toUpperCase()}</Text>
        </View>
      ))}

      {status !== 'driving' && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.chapterKicker}>Chapter {level.chapter} · {level.title}</Text>
            <Text style={styles.title}>{status === 'finished' ? 'Delivered!' : 'Truck flipped'}</Text>
            <Text style={styles.cardText}>
              {status === 'finished'
                ? `${cargo} of ${parcelTotal} parcels, ${coins} coins in ${game.getTime().toFixed(1)}s\nPay: $${pay}`
                : 'No delivery, no pay.'}
            </Text>
            <View style={styles.storyButtons}>
              {status === 'finished' && onNext && (
                <Pressable style={styles.bigButton} onPress={onNext}>
                  <Text style={styles.bigButtonText}>Next chapter</Text>
                </Pressable>
              )}
              <Pressable style={status === 'finished' && onNext ? styles.ghostButton : styles.bigButton} onPress={onRetry}>
                <Text style={status === 'finished' && onNext ? styles.ghostButtonText : styles.bigButtonText}>Drive again</Text>
              </Pressable>
              <Pressable style={styles.ghostButton} onPress={onChapters}>
                <Text style={styles.ghostButtonText}>Chapters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // chapter select
  menu: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#bfe8ff', gap: 24 },
  menuTitleBlock: { width: 190 },
  menuPortrait: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: INK, marginBottom: 12 },
  menuTitle: { fontSize: 40, lineHeight: 42, fontWeight: '900', color: INK, letterSpacing: -1 },
  menuTagline: { marginTop: 8, fontSize: 15, fontWeight: '600', color: '#3f5d6d' },
  chapterRow: { gap: 14, paddingVertical: 16, paddingRight: 16, alignItems: 'center' },
  chapterCard: { width: 210, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: INK },
  chapterThumb: { width: '100%', height: 92 },
  chapterText: { padding: 12, gap: 4 },
  chapterKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: MAIL_RED },
  chapterTitle: { fontSize: 18, fontWeight: '800', color: INK },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },

  // story card
  storyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  storyCard: { flexDirection: 'row', gap: 20, maxWidth: 640, backgroundColor: '#fff', borderRadius: 18, padding: 22, borderWidth: 2, borderColor: INK },
  storyPortrait: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: INK },
  storyBody: { flex: 1, gap: 8 },
  storyTitle: { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  storyLine: { fontSize: 16, lineHeight: 22, color: '#2c4654' },
  storyButtons: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },

  // game
  screen: { flex: 1 },
  hud: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hudText: { fontSize: 17, fontWeight: '800', color: INK },
  hudSmall: { fontSize: 14, fontWeight: '600', color: INK },
  minimap: { borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: INK },
  minimapMarker: { position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: '#e53935' },
  spacer: { flex: 1 },
  smallButton: { backgroundColor: INK, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  smallButtonText: { color: '#fff', fontWeight: '700' },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: '#2f5d9e', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  toastText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  pedal: { position: 'absolute', width: 108, height: 88, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pedalDown: { opacity: 0.6, transform: [{ scale: 0.95 }] },
  pedalText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#0006', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, minWidth: 300 },
  title: { fontSize: 26, fontWeight: '800', color: INK },
  cardText: { fontSize: 18, textAlign: 'center', color: INK },

  // buttons
  bigButton: { backgroundColor: INK, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 22 },
  bigButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ghostButton: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 2, borderColor: INK },
  ghostButtonText: { color: INK, fontSize: 17, fontWeight: '800' },
});
