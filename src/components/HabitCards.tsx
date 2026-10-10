import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BellIcon, CheckIcon, FlameIcon } from '@/components/icons';
import { Txt } from '@/components/Txt';
import { registerTarget } from '@/lib/targets';
import { flipDuration, fmtTime } from '@/lib/time';
import { TOD } from '@/lib/tod';
import type { Habit } from '@/lib/types';
import { useStore } from '@/state/store';
import { accent, alpha, colors, ease, elevation, neutral, radius } from '@/theme/tokens';

/* ───────────────────────── Faces (pure visuals, reused by the flip ghost) ───────────────────────── */

export function TodayCardFace({ habit, pressed }: { habit: Habit; pressed?: boolean }) {
  const fmt = useStore((s) => s.settings.timeFormat);
  const tod = TOD[habit.tod];
  return (
    <View style={[styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.circle, { width: 24, height: 24 }]} />
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Txt size={16} weight="medium" numberOfLines={1} style={{ lineHeight: 19 }}>
          {habit.name}
        </Txt>
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: neutral[800] }]}>
            <tod.Icon size={12} color={neutral[200]} />
            <Txt size={11} color={neutral[200]}>
              {tod.label}
            </Txt>
          </View>
          {habit.rem && (
            <View style={[styles.tag, { backgroundColor: accent[800] }]}>
              <BellIcon size={12} color={accent[100]} />
              <Txt size={11} color={accent[100]} tabular>
                {fmtTime(habit.time, fmt)}
              </Txt>
            </View>
          )}
        </View>
      </View>
      {habit.streak > 0 && (
        <View style={styles.streak}>
          <FlameIcon size={14} color={accent[300]} />
          <Txt size={13} color={accent[300]} tabular>
            {habit.streak}
          </Txt>
        </View>
      )}
    </View>
  );
}

export function UpNextFace({ habit, pressed }: { habit: Habit; pressed?: boolean }) {
  const fmt = useStore((s) => s.settings.timeFormat);
  return (
    <View style={[styles.row, pressed && { backgroundColor: accent[900] }]}>
      <View style={[styles.circle, { width: 20, height: 20 }]} />
      <Txt size={14} weight="medium" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
        {habit.name}
      </Txt>
      <Txt size={11} color={colors.muted50} tabular>
        {habit.rem ? fmtTime(habit.time, fmt) : TOD[habit.tod].label}
      </Txt>
    </View>
  );
}

/** Back face of the flip — looks like the top of the done pile. */
export function DoneFace({ name }: { name: string }) {
  return (
    <View style={styles.doneFace}>
      <View style={styles.check}>
        <CheckIcon size={14} color={accent[200]} weight="bold" />
      </View>
      <Txt size={14} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
        {name}
      </Txt>
    </View>
  );
}

/* ───────────────────────── Leaving / restored wrapper ───────────────────────── */

const restoreIn = new Keyframe({
  0: { opacity: 0, transform: [{ perspective: 800 }, { translateY: 30 }, { rotateX: '70deg' }] },
  100: {
    opacity: 1,
    transform: [{ perspective: 800 }, { translateY: 0 }, { rotateX: '0deg' }],
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  },
}).duration(420);

/**
 * Wraps a list row. While the habit is "leaving" the row hides at once (the ghost
 * covers it) and its height collapses to 0 over 0.42×D after a 0.3×D delay.
 */
function LeavingRow({ id, gap, children }: { id: string; gap: number; children: ReactNode }) {
  const leaving = useStore((s) => !!s.leaving[id]);
  const D = useStore((s) => flipDuration(s.settings.animSpeed));
  // Restored-by-Undo rows play the re-entry animation when they mount.
  const [restored] = useState(() => {
    const r = useStore.getState().restored;
    return !!r && r.id === id && Date.now() - r.key < 1000;
  });
  const measured = useRef(0);
  const h = useSharedValue(-1);

  useEffect(() => {
    if (leaving && measured.current) {
      h.set(measured.current);
      h.set(withDelay(D * 0.3, withTiming(0, { duration: D * 0.42, easing: ease.std })));
    }
  }, [leaving, D, h]);

  const style = useAnimatedStyle(() => (h.value < 0 ? {} : { height: h.value }));

  return (
    <Animated.View
      entering={restored ? restoreIn : undefined}
      style={[{ overflow: 'hidden' }, style]}
      onLayout={(e) => {
        if (!leaving) measured.current = e.nativeEvent.layout.height;
      }}
    >
      <View style={{ paddingBottom: gap, opacity: leaving ? 0 : 1 }} pointerEvents={leaving ? 'none' : 'auto'}>
        {children}
      </View>
    </Animated.View>
  );
}

/* ───────────────────────── Interactive rows ───────────────────────── */

const LONG_PRESS_MS = 480;

/** Today card: tap to complete, hold 480ms to edit. */
export function TodayHabitItem({ habit, onComplete }: { habit: Habit; onComplete: (id: string) => void }) {
  const openEdit = useStore((s) => s.openEdit);
  const scale = useSharedValue(1);
  const fired = useRef(false);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <LeavingRow id={habit.id} gap={8}>
      <Pressable
        delayLongPress={LONG_PRESS_MS}
        onPressIn={() => {
          fired.current = false;
          scale.set(withTiming(0.965, { duration: LONG_PRESS_MS, easing: Easing.out(Easing.quad) }));
        }}
        onPressOut={() => {
          if (!fired.current) scale.set(withTiming(1, { duration: 120 }));
        }}
        onLongPress={() => {
          fired.current = true;
          scale.set(withSequence(withTiming(1.02, { duration: 130 }), withTiming(1, { duration: 130 })));
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          openEdit(habit);
        }}
        onPress={() => onComplete(habit.id)}
        accessibilityRole="button"
        accessibilityLabel={habit.name}
        accessibilityHint="Tap to complete, hold to edit"
      >
        <Animated.View ref={registerTarget(`today:card:${habit.id}`)} collapsable={false} style={style}>
          <TodayCardFace habit={habit} />
        </Animated.View>
      </Pressable>
    </LeavingRow>
  );
}

/** Home "Up next" row: tap to complete. */
export function UpNextItem({ habit, onComplete }: { habit: Habit; onComplete: (id: string) => void }) {
  return (
    <LeavingRow id={habit.id} gap={6}>
      <Pressable
        onPress={() => onComplete(habit.id)}
        accessibilityRole="button"
        accessibilityLabel={`Complete ${habit.name}`}
      >
        {({ pressed }) => (
          <View ref={registerTarget(`home:card:${habit.id}`)} collapsable={false}>
            <UpNextFace habit={habit} pressed={pressed} />
          </View>
        )}
      </Pressable>
    </LeavingRow>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  cardPressed: { borderColor: neutral[700] },
  circle: { borderRadius: 999, borderWidth: 1.5, borderColor: neutral[600] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...elevation.sm,
  },
  doneFace: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    boxShadow: `0px 0px 30px ${alpha(colors.accent, 0.45)}`,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: accent[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
