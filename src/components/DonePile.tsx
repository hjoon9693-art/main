import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { CheckIcon, FlameIcon, StackIcon } from '@/components/icons';
import { Txt } from '@/components/Txt';
import { registerTarget } from '@/lib/targets';
import { useStore } from '@/state/store';
import { accent, alpha, colors, ease, elevation, neutral, radius } from '@/theme/tokens';

export const PILE_H = 62;

/** The stack of completed habits at the bottom of Today. Also the flip's landing target. */
export function DonePile() {
  const done = useStore((s) => s.done);
  const depth = useStore((s) => Math.max(1, Math.min(5, s.settings.pileDepth)));
  const tick = useStore((s) => s.ticks.pile);

  const bump = useSharedValue(0);
  useEffect(() => {
    if (!tick) return;
    bump.set(
      withSequence(
        withTiming(1, { duration: 120, easing: ease.out }),
        withTiming(0, { duration: 180, easing: ease.out }),
      ),
    );
  }, [tick, bump]);
  const bumpStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 5 * bump.value }, { scale: 1 - 0.015 * bump.value }],
  }));

  const top = done[done.length - 1];
  const layers = [];
  for (let i = 1; i < Math.min(done.length, depth); i++) layers.push(i);

  return (
    <View style={{ height: PILE_H }}>
      <View ref={registerTarget('pile')} collapsable={false} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <Animated.View style={[StyleSheet.absoluteFill, bumpStyle]}>
        {layers.map((i) => (
          <View
            key={i}
            style={[
              styles.layer,
              {
                left: i * 10,
                right: i * 10,
                opacity: Math.max(0.15, 1 - i * 0.3),
                zIndex: 10 - i,
                transform: [{ translateY: -i * 7 }],
              },
            ]}
          />
        ))}
        {top ? (
          <View style={styles.top}>
            <View style={styles.check}>
              <CheckIcon size={14} color={accent[200]} weight="bold" />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <Txt size={14} numberOfLines={1} color={alpha(colors.text, 0.75)}>
                {top.habit.name}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <FlameIcon size={12} color={accent[300]} />
                <Txt size={11} color={accent[300]}>
                  {top.habit.streak + 1} day streak
                </Txt>
              </View>
            </View>
            <View style={styles.count}>
              <Txt size={11} color={accent[100]}>
                {done.length} done
              </Txt>
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <StackIcon size={16} color={colors.muted50} />
            <Txt size={13} color={colors.muted50}>
              Done habits stack here
            </Txt>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    bottom: 0,
    height: PILE_H,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: accent[700],
    boxShadow: `0px 0px 26px ${alpha(colors.accent, 0.22)}`,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: accent[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6, backgroundColor: accent[800] },
  empty: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: neutral[700],
  },
});
