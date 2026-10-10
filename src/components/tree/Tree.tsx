import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G as SvgG, Path, RadialGradient, Stop } from 'react-native-svg';

import { accent, ease, neutral } from '@/theme/tokens';

import {
  canopyBase,
  type Clump,
  type Falling,
  type Firefly,
  G,
  type Glow,
  type LeafSpec,
  leafPaths,
  plantArt,
  stageFor,
  trunkPaths,
  VB,
  X,
} from './art';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const C = {
  d: accent[800],
  m: accent[700],
  l: accent[600],
  hl: accent[300],
  tD: neutral[800],
  tM: neutral[600],
  tL: neutral[400],
  gD: neutral[900],
  gM: neutral[800],
};

type Clock = { t: SharedValue<number>; on: SharedValue<number> };

/** Smooth back-and-forth between -1 and 1, like an `ease-in-out alternate` CSS loop. */
function osc(t: number, period: number, delay = 0) {
  'worklet';
  return -Math.cos((Math.PI * (t - delay)) / period);
}

type Props = {
  /** Best current streak; drives the growth stage. */
  streak: number;
  /** Increments to play a rustle + sparkles. */
  rustleTick: number;
  onPress?: () => void;
};

export const Tree = memo(function Tree({ streak, rustleTick, onPress }: Props) {
  const dormant = streak === 0;
  const stage = stageFor(streak);
  const art = useMemo(() => plantArt(stage, dormant), [stage, dormant]);
  const reduced = useReducedMotion();

  // One clock drives every idle loop.
  const t = useSharedValue(0);
  const on = useSharedValue(reduced ? 0 : 1);
  const clock = useMemo(() => ({ t, on }), [t, on]);
  const frame = useFrameCallback((f) => {
    t.set(f.timeSinceFirstFrame / 1000);
  }, false);
  useEffect(() => {
    on.set(reduced ? 0 : 1);
    frame.setActive(!reduced);
  }, [reduced, frame, on]);

  // Stage change: scale .82 → 1.04 → 1 over 900ms.
  const pop = useSharedValue(1);
  const popOpacity = useSharedValue(1);
  const stageKey = dormant ? 0 : stage;
  const prevStage = useRef(stageKey);
  useEffect(() => {
    if (stageKey === prevStage.current) return;
    prevStage.current = stageKey;
    if (reduced) {
      popOpacity.set(withSequence(withTiming(0.4, { duration: 0 }), withTiming(1, { duration: 400 })));
      return;
    }
    pop.set(
      withSequence(
        withTiming(0.82, { duration: 0 }),
        withTiming(1.04, { duration: 540, easing: ease.out }),
        withTiming(1, { duration: 360, easing: ease.out }),
      ),
    );
    popOpacity.set(withSequence(withTiming(0.4, { duration: 0 }), withTiming(1, { duration: 540 })));
  }, [stageKey, reduced, pop, popOpacity]);
  const popStyle = useAnimatedStyle(() => ({ opacity: popOpacity.value, transform: [{ scale: pop.value }] }));

  // Rustle: rotate −3.5 → 2.5 → −1.2 → 0 over 850ms.
  const rustle = useSharedValue(0);
  // Ticks from before this tree mounted don't replay.
  const [mountTick] = useState(rustleTick);
  const rustling = rustleTick !== mountTick;
  useEffect(() => {
    if (!rustling || reduced) return;
    const step = { duration: 850 / 4, easing: Easing.out(Easing.quad) };
    rustle.set(
      withSequence(withTiming(-3.5, step), withTiming(2.5, step), withTiming(-1.2, step), withTiming(0, step)),
    );
  }, [rustleTick, rustling, reduced, rustle]);

  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${1.6 * osc(t.value, 5.5) * on.value + rustle.value}deg` }],
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="image" accessibilityLabel="Your habit tree">
      <Animated.View style={[styles.box, { transformOrigin: '50% 88%' }, popStyle]}>
        <Ground />
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: `${X}px ${G}px` }, swayStyle]}>
          <Svg width={VB} height={VB} viewBox={`0 0 ${VB} ${VB}`} style={styles.svg}>
            {art.seed && <Seed clock={clock} />}
            {art.stems.map((s, i) => (
              <SvgG key={i}>
                <Path d={s.d} fill="none" stroke={C.gD} strokeWidth={s.w + 1.6} strokeLinecap="round" />
                <Path d={s.d} fill="none" stroke={C.l} strokeWidth={s.w} strokeLinecap="round" />
              </SvgG>
            ))}
            {art.branches.map((d, i) => (
              <SvgG key={i}>
                <Path d={d} fill="none" stroke={C.tD} strokeWidth={4.2} strokeLinecap="round" />
                <Path d={d} fill="none" stroke={C.tM} strokeWidth={2} strokeLinecap="round" />
              </SvgG>
            ))}
            {art.trunk && <Trunk {...art.trunk} />}
          </Svg>
          {art.canopy.length > 0 && <Canopy clumps={art.canopy} clock={clock} />}
          <Svg width={VB} height={VB} viewBox={`0 0 ${VB} ${VB}`} style={[StyleSheet.absoluteFill, styles.svg]}>
            {art.leaves.map((l, i) => (
              <Leaf key={i} spec={l} clock={clock} />
            ))}
            {art.glows.map((g, i) => (
              <Bud key={i} glow={g} clock={clock} />
            ))}
            {art.falling.map((f, i) => (
              <FallingLeaf key={i} spec={f} clock={clock} />
            ))}
          </Svg>
        </Animated.View>
        {art.fireflies.length > 0 && (
          <Svg width={VB} height={VB} viewBox={`0 0 ${VB} ${VB}`} style={[StyleSheet.absoluteFill, styles.svg]}>
            {art.fireflies.map((f, i) => (
              <FireflyDot key={i} spec={f} clock={clock} />
            ))}
          </Svg>
        )}
        {rustling && <Sparkles key={rustleTick} stage={stage} dormant={dormant} />}
      </Animated.View>
    </Pressable>
  );
});

function Ground() {
  return (
    <Svg width={VB} height={VB} viewBox={`0 0 ${VB} ${VB}`} style={[StyleSheet.absoluteFill, styles.svg]}>
      <Ellipse cx={X} cy={G + 3} rx={84} ry={5} fill="rgba(0,0,0,0.4)" />
      <Path
        d={`M ${X - 78} ${G + 2} Q ${X - 40} ${G - 14} ${X} ${G - 13} Q ${X + 42} ${G - 14} ${X + 78} ${G + 2} Z`}
        fill={C.gD}
      />
      <Path
        d={`M ${X - 60} ${G - 4} Q ${X - 30} ${G - 13} ${X + 6} ${G - 12} Q ${X - 24} ${G - 8} ${X - 60} ${G - 4} Z`}
        fill={C.gM}
      />
    </Svg>
  );
}

function Seed({ clock }: { clock: Clock }) {
  // The prototype pulses a drop-shadow glow (4s); a soft halo stands in for it.
  const halo = useAnimatedProps(() => ({
    opacity: clock.on.value ? 0.35 + 0.5 * (0.5 + 0.5 * osc(clock.t.value * 2, 4)) : 0.6,
  }));
  return (
    <SvgG>
      <Defs>
        <RadialGradient id="seedGlow" cx={X} cy={G - 15} r={16} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor={accent[500]} stopOpacity={0.9} />
          <Stop offset={1} stopColor={accent[500]} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <AnimatedCircle cx={X} cy={G - 15} r={16} fill="url(#seedGlow)" animatedProps={halo} />
      <Ellipse cx={X} cy={G - 15} rx={8.5} ry={7} fill={C.tM} />
      <Path d={`M ${X - 8.5} ${G - 16} Q ${X} ${G - 27} ${X + 8.5} ${G - 16} Z`} fill={C.tD} />
      <Path
        d={`M ${X - 4} ${G - 12} Q ${X - 2} ${G - 9} ${X + 1} ${G - 10}`}
        fill="none"
        stroke={C.tL}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </SvgG>
  );
}

function Trunk({ topY, bw, lean }: { topY: number; bw: number; lean: number }) {
  const p = trunkPaths(topY, bw, lean);
  return (
    <SvgG>
      <Path d={p.body} fill={C.tD} />
      <Path d={p.lit} fill={C.tM} />
      <Path
        d={p.highlight}
        fill="none"
        stroke={C.tL}
        strokeWidth={p.highlightWidth}
        strokeLinecap="round"
        opacity={0.8}
      />
    </SvgG>
  );
}

const BUMPS = [40, 90, 140, 200, 340].map((a) => (a * Math.PI) / 180);

function Canopy({ clumps, clock }: { clumps: Clump[]; clock: Clock }) {
  const base = canopyBase(clumps);
  const breathe = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.0075 * (1 + osc(clock.t.value * 2, 5)) * clock.on.value }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: `${X}px ${base}px` }, breathe]}>
      <Svg width={VB} height={VB} viewBox={`0 0 ${VB} ${VB}`} style={styles.svg}>
        {clumps.map(([cx, cy, r], i) => (
          <SvgG key={`d${i}`}>
            <Circle cx={cx} cy={cy} r={r} fill={C.d} />
            {BUMPS.map((t, j) => (
              <Circle
                key={j}
                cx={cx + Math.cos(t) * r * 0.82}
                cy={cy + Math.sin(t) * r * 0.78}
                r={r * 0.4}
                fill={C.d}
              />
            ))}
          </SvgG>
        ))}
        {clumps.map(([cx, cy, r], i) => (
          <Circle key={`m${i}`} cx={cx - r * 0.1} cy={cy - r * 0.16} r={r * 0.8} fill={C.m} />
        ))}
        {clumps.map(([cx, cy, r], i) => {
          const lr = r * 0.46;
          return <Ellipse key={`l${i}`} cx={cx - r * 0.28} cy={cy - r * 0.36} rx={lr} ry={lr * 0.78} fill={C.l} />;
        })}
        {clumps.map(([cx, cy, r], i) => {
          const lx = cx - r * 0.28;
          const ly = cy - r * 0.36;
          const lr = r * 0.46;
          return (
            <Path
              key={`h${i}`}
              d={`M ${lx - lr * 0.7} ${ly - lr * 0.1} Q ${lx - lr * 0.45} ${ly - lr * 0.95} ${lx + lr * 0.35} ${ly - lr * 0.95}`}
              fill="none"
              stroke={C.hl}
              strokeWidth={Math.max(1.6, r * 0.06)}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
}

function Leaf({ spec, clock }: { spec: LeafSpec; clock: Clock }) {
  const { x, y, len, ang, wide, dur, del } = spec;
  const deg = () => {
    'worklet';
    return ang + 6 * osc(clock.t.value, dur, del) * clock.on.value;
  };
  const base = useAnimatedProps(() => ({ d: leafPaths(x, y, len, wide, deg()).base }));
  const lit = useAnimatedProps(() => ({ d: leafPaths(x, y, len, wide, deg()).lit }));
  const vein = useAnimatedProps(() => ({ d: leafPaths(x, y, len, wide, deg()).vein }));
  const still = leafPaths(x, y, len, wide, ang);
  return (
    <SvgG>
      <AnimatedPath d={still.base} fill={C.m} animatedProps={base} />
      <AnimatedPath d={still.lit} fill={C.l} animatedProps={lit} />
      <AnimatedPath
        d={still.vein}
        fill="none"
        stroke={C.hl}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.8}
        animatedProps={vein}
      />
    </SvgG>
  );
}

function Bud({ glow, clock }: { glow: Glow; clock: Clock }) {
  const props = useAnimatedProps(() => ({
    opacity: clock.on.value ? 0.725 + 0.275 * osc(clock.t.value * 2, 3.4, glow.delay * 2) : 0.8,
  }));
  return <AnimatedCircle cx={glow.x} cy={glow.y} r={glow.r} fill={accent[100]} animatedProps={props} />;
}

function FallingLeaf({ spec, clock }: { spec: Falling; clock: Clock }) {
  const props = useAnimatedProps(() => {
    if (!clock.on.value) return { cx: spec.x, cy: spec.y, opacity: 0 };
    const raw = (clock.t.value - spec.delay) / 7;
    const p = raw < 0 ? 0 : raw - Math.floor(raw);
    const e = p * p; // ease-in
    const opacity = raw < 0 ? 0 : p < 0.1 ? p / 0.1 : 1 - (p - 0.1) / 0.9;
    return { cx: spec.x + 26 * e, cy: spec.y + 92 * e, opacity };
  });
  return <AnimatedEllipse cx={spec.x} cy={spec.y} rx={3.2} ry={1.8} fill={C.l} opacity={0} animatedProps={props} />;
}

function fireflyAt(p: number) {
  'worklet';
  // 0%: (0,0) op 0 · 20%: op 1 · 50%: (8,-14) · 80%: op .9 · 100%: (-6,-26) op 0
  const dx = p < 0.5 ? 8 * (p / 0.5) : 8 + (-14 * (p - 0.5)) / 0.5;
  const dy = p < 0.5 ? -14 * (p / 0.5) : -14 + (-12 * (p - 0.5)) / 0.5;
  const op = p < 0.2 ? p / 0.2 : p < 0.8 ? 1 - (0.1 * (p - 0.2)) / 0.6 : 0.9 * (1 - (p - 0.8) / 0.2);
  return { dx, dy, op };
}

function FireflyDot({ spec, clock }: { spec: Firefly; clock: Clock }) {
  const pos = () => {
    'worklet';
    const raw = (clock.t.value - spec.delay) / 6;
    if (raw < 0 || !clock.on.value) return { dx: 0, dy: 0, op: clock.on.value ? 0 : 0.7 };
    return fireflyAt(raw - Math.floor(raw));
  };
  const dot = useAnimatedProps(() => {
    const f = pos();
    return { cx: spec.x + f.dx, cy: spec.y + f.dy, opacity: f.op };
  });
  const halo = useAnimatedProps(() => {
    const f = pos();
    return { cx: spec.x + f.dx, cy: spec.y + f.dy, opacity: f.op * 0.3 };
  });
  return (
    <SvgG>
      <AnimatedCircle cx={spec.x} cy={spec.y} r={4.5} fill={accent[300]} opacity={0} animatedProps={halo} />
      <AnimatedCircle cx={spec.x} cy={spec.y} r={1.8} fill={accent[200]} opacity={0} animatedProps={dot} />
    </SvgG>
  );
}

const SPARKLE_TOP = [0, 176, 150, 100, 84, 50];

function Sparkles({ stage, dormant }: { stage: number; dormant: boolean }) {
  // Random once per batch (the batch remounts on every rustle).
  const [seeds] = useState(() => {
    const y0 = dormant ? 196 : SPARKLE_TOP[stage];
    const spread = stage >= 4 ? 90 : 30;
    return Array.from({ length: 4 }, (_, i) => ({
      left: 117 + (Math.random() - 0.5) * spread,
      top: y0 + Math.random() * 20,
      dx: (Math.random() - 0.5) * 20,
      dy: -40 - Math.random() * 30,
      duration: 1200 + Math.random() * 400,
      delay: i * 90,
    }));
  });
  return (
    <>
      {seeds.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}
    </>
  );
}

function Sparkle({
  left,
  top,
  dx,
  dy,
  duration,
  delay,
}: {
  left: number;
  top: number;
  dx: number;
  dy: number;
  duration: number;
  delay: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.2, 0.7, 0.3, 1) })));
  }, [p, delay, duration]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value < 0.25 ? p.value / 0.25 : 1 - (p.value - 0.25) / 0.75,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value }, { scale: 0.4 + 0.6 * p.value }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.sparkle, { left, top }, style]} />;
}

const styles = StyleSheet.create({
  box: { width: VB, height: VB },
  svg: { overflow: 'visible' },
  sparkle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: accent[200],
    boxShadow: `0px 0px 8px ${accent[300]}`,
    opacity: 0,
  },
});
