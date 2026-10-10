import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon } from '@/components/icons';
import { Txt } from '@/components/Txt';
import { useStore } from '@/state/store';
import { accent, alpha, colors, ease, neutral } from '@/theme/tokens';

const RING = 84;

/** "Every habit done" state on Today, with the ring pop, halo and particle burst. */
export function AllDone() {
  const doneN = useStore((s) => s.done.length);
  const reduced = useReducedMotion();
  // Mounted by the completion that finished the day (not by revisiting the tab later)?
  const [celebrate] = useState(() => {
    const s = useStore.getState();
    return s.tab === 'today' && Date.now() - s.allDoneAt < 1500;
  });

  const ring = useSharedValue(1);
  const ringOpacity = useSharedValue(1);
  useEffect(() => {
    if (!celebrate) return;
    if (reduced) {
      ringOpacity.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 300 })));
      return;
    }
    ring.set(
      withSequence(
        withTiming(0.4, { duration: 0 }),
        withTiming(1.12, { duration: 390, easing: ease.out }),
        withTiming(1, { duration: 260, easing: ease.out }),
      ),
    );
    ringOpacity.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 390 })));
  }, [celebrate, reduced, ring, ringOpacity]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value, transform: [{ scale: ring.value }] }));

  return (
    <View style={styles.wrap}>
      <View style={{ width: RING, height: RING }}>
        {celebrate && !reduced && <Burst />}
        <Animated.View style={[styles.ring, ringStyle]}>
          <CheckIcon size={36} color={colors.accent} />
        </Animated.View>
      </View>
      <Txt size={25} weight="medium" tracking={-0.015}>
        Every habit done
      </Txt>
      <Txt size={14} color={alpha(colors.text, 0.65)} style={{ maxWidth: 260 }}>
        {`${doneN} ${doneN === 1 ? 'streak' : 'streaks'} extended tonight. See you tomorrow.`}
      </Txt>
    </View>
  );
}

const PARTICLE_COLORS = [accent[300], accent[400], colors.accent, neutral[200]];

function Burst() {
  const halo = useSharedValue(0);
  useEffect(() => {
    halo.set(withTiming(1, { duration: 1100, easing: Easing.bezier(0.1, 0.7, 0.3, 1) }));
  }, [halo]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.8 * (1 - halo.value),
    transform: [{ scale: 1 + 2.2 * halo.value }],
  }));
  const [particles] = useState(() =>
    Array.from({ length: 34 }, (_, i) => {
      const ang = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 130;
      return {
        size: 3 + Math.random() * 5,
        dx: Math.cos(ang) * r,
        dy: Math.sin(ang) * r + 30,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        duration: 900 + Math.random() * 600,
        delay: 120 + Math.random() * 120,
      };
    }),
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.halo, haloStyle]} />
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
    </View>
  );
}

function Particle({
  size,
  dx,
  dy,
  color,
  duration,
  delay,
}: {
  size: number;
  dx: number;
  dy: number;
  color: string;
  duration: number;
  delay: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.1, 0.8, 0.3, 1) })));
  }, [p, delay, duration]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value === 0 ? 0 : 1 - p.value,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value }, { scale: 1 - 0.8 * p.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: RING / 2 - size / 2,
          top: RING / 2 - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          boxShadow: `0px 0px 8px ${color}`,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start', gap: 14, paddingTop: 48, paddingHorizontal: 8 },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 0px 36px ${alpha(colors.accent, 0.45)}, inset 0px 0px 22px ${alpha(colors.accent, 0.25)}`,
  },
  halo: {
    position: 'absolute',
    inset: 0,
    borderRadius: RING / 2,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
});
