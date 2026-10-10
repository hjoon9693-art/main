import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AllDone } from '@/components/AllDone';
import { BottomFade } from '@/components/Decor';
import { DonePile } from '@/components/DonePile';
import { TodayHabitItem } from '@/components/HabitCards';
import { PlusIcon } from '@/components/icons';
import { Kicker, Txt } from '@/components/Txt';
import { useNow, useTabBarHeight } from '@/hooks/layout';
import { completeHabit } from '@/lib/complete';
import { dateLabel } from '@/lib/time';
import { useStore } from '@/state/store';
import { alpha, colors, ease, neutral, radius } from '@/theme/tokens';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const tabH = useTabBarHeight();
  const now = useNow();
  const habits = useStore((s) => s.habits);
  const doneN = useStore((s) => s.done.length);
  const openAdd = useStore((s) => s.openAdd);
  const total = habits.length + doneN;
  const pct = total ? Math.round((doneN / total) * 100) : 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.titleRow}>
          <Pressable
            onLongPress={__DEV__ ? () => useStore.getState().startNextDay() : undefined}
            delayLongPress={600}
            style={{ gap: 2 }}
          >
            <Kicker>{dateLabel(now)}</Kicker>
            <Txt size={32} weight="medium" tracking={-0.02} style={{ lineHeight: 35 }}>
              Today
            </Txt>
          </Pressable>
          <Pressable
            onPress={openAdd}
            accessibilityRole="button"
            accessibilityLabel="Add habit"
            style={({ pressed }) => [styles.add, pressed && { backgroundColor: alpha(colors.accent, 0.24) }]}
          >
            <PlusIcon size={20} color={colors.accent} />
          </Pressable>
        </View>
        <View style={{ gap: 7 }}>
          <View style={styles.meta}>
            <Txt size={12} color={colors.muted60}>
              {doneN} of {total} done
            </Txt>
            <Txt size={12} color={colors.muted60}>
              Tap to complete · hold to edit
            </Txt>
          </View>
          <ProgressLine pct={pct} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: tabH + 164 }}
        showsVerticalScrollIndicator={false}
      >
        {habits.map((h) => (
          <TodayHabitItem key={h.id} habit={h} onComplete={completeHabit} />
        ))}
        {habits.length === 0 && doneN > 0 && <AllDone />}
        {total === 0 && (
          <View style={styles.empty}>
            <Txt size={20} weight="medium">
              No habits yet
            </Txt>
            <Txt size={14} color={colors.muted60}>
              Tap + to add your first one.
            </Txt>
          </View>
        )}
      </ScrollView>

      <BottomFade height={260} />
      <View style={[styles.pile, { bottom: tabH + 12 }]}>
        <DonePile />
      </View>
    </View>
  );
}

function ProgressLine({ pct }: { pct: number }) {
  const w = useSharedValue(pct);
  useEffect(() => {
    w.set(withTiming(pct, { duration: 500, easing: ease.std }));
  }, [pct, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 22, paddingBottom: 14, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  add: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  // The glow is drawn by the fill's shadow, so the track must not clip it.
  track: { height: 2, borderRadius: 2, backgroundColor: neutral[800] },
  fill: { height: 2, borderRadius: 2, backgroundColor: colors.accent, boxShadow: `0px 0px 10px ${colors.accent}` },
  empty: { gap: 6, paddingTop: 48, paddingHorizontal: 8 },
  pile: { position: 'absolute', left: 16, right: 16, zIndex: 10 },
});
