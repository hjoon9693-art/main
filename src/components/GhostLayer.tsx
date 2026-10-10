import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { DoneFace, TodayCardFace, UpNextFace } from '@/components/HabitCards';
import { registerTarget } from '@/lib/targets';
import { type Ghost, useStore } from '@/state/store';
import { ease } from '@/theme/tokens';

/** Overlay that draws the flipping "ghost" cards of the completion animation. */
export function GhostLayer() {
  const ghosts = useStore((s) => s.ghosts);
  return (
    <View ref={registerTarget('ghost-layer')} collapsable={false} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ghosts.map((g) => (
        <GhostCard key={g.key} ghost={g} />
      ))}
    </View>
  );
}

const STOPS = [0, 0.18, 0.55, 0.88, 1];

function GhostCard({ ghost }: { ghost: Ghost }) {
  const { from, to, toTab, duration, habit, variant } = ghost;
  const removeGhost = useStore((s) => s.removeGhost);
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(
      withTiming(1, { duration, easing: ease.flip }, (finished) => {
        if (finished) scheduleOnRN(removeGhost, ghost.key);
      }),
    );
  }, [p, duration, removeGhost, ghost.key]);

  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);
  const sx = toTab ? 0.12 : to.width / from.width;
  const sy = toTab ? 0.3 : to.height / from.height;

  const card = useAnimatedStyle(() => {
    const v = p.value;
    return {
      opacity: toTab ? interpolate(v, [0, 0.88, 1], [1, 1, 0]) : 1,
      transform: [
        { perspective: 800 },
        { translateX: interpolate(v, STOPS, [0, 0, dx * 0.5, dx, dx]) },
        { translateY: interpolate(v, STOPS, [0, -12, dy * 0.42 - 36, dy + 7, dy]) },
        { rotateX: `${interpolate(v, STOPS, [0, -22, -115, -180, -180])}deg` },
        { scaleX: interpolate(v, STOPS, [1, 1.04, (1 + sx) / 2, sx, sx]) },
        { scaleY: interpolate(v, STOPS, [1, 1.04, (1 + sy) / 2, sy, sy]) },
      ],
    };
  });
  // Faces swap when the card passes edge-on (rotateX crosses −90°).
  const flipAt = 0.18 + ((90 - 22) / (115 - 22)) * (0.55 - 0.18);
  const front = useAnimatedStyle(() => ({ opacity: p.value < flipAt ? 1 : 0 }));
  const back = useAnimatedStyle(() => ({ opacity: p.value < flipAt ? 0 : 1 }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: from.x, top: from.y, width: from.width, height: from.height }, card]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, front]}>
        {variant === 'today' ? <TodayCardFace habit={habit} /> : <UpNextFace habit={habit} />}
      </Animated.View>
      {/* Mirrored so it reads upright once the card has turned over. */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: -1 }] }, back]}>
        <DoneFace name={habit.name} />
      </Animated.View>
    </Animated.View>
  );
}
