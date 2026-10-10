import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeRule, RadialGlow } from '@/components/Decor';
import { UpNextItem } from '@/components/HabitCards';
import { AlarmIcon, CaretRightIcon, CheckCircleIcon, FlameIcon } from '@/components/icons';
import { ProgressRing } from '@/components/ProgressRing';
import { Tree } from '@/components/tree/Tree';
import { Kicker, Txt } from '@/components/Txt';
import { useNow, useTabBarHeight } from '@/hooks/layout';
import { completeHabit } from '@/lib/complete';
import { dateLabel, fmtTime, greeting, minutesOf } from '@/lib/time';
import { bestStreak, useStore } from '@/state/store';
import { accent, alpha, colors } from '@/theme/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabH = useTabBarHeight();
  const now = useNow();
  const habits = useStore((s) => s.habits);
  const done = useStore((s) => s.done);
  const leavingN = useStore((s) => Object.keys(s.leaving).length);
  const fmt = useStore((s) => s.settings.timeFormat);
  const rustleTick = useStore((s) => s.ticks.rustle);
  const rustle = useStore((s) => s.rustle);

  const total = habits.length + done.length;
  const doneN = done.length;
  const pct = total ? Math.round((doneN / total) * 100) : 0;
  const left = habits.length - leavingN;
  const best = bestStreak({ habits, done });

  const n = minutesOf(now);
  const reminders = habits.filter((h) => h.rem).sort((a, b) => a.time - b.time);
  const next = reminders.find((h) => h.time >= n) ?? reminders[0];

  // Dev only: hold the date to preview the in-app reminder banner.
  const simulateReminder = () => {
    const h = next ?? habits[0];
    if (h) useStore.getState().showBanner({ id: h.id, name: h.name, time: h.rem ? h.time : null });
  };

  return (
    <View style={styles.screen}>
      <RadialGlow color={colors.sectionGlow} opacity={0.6} cx={0.5} cy={0.92} rx={0.9} ry={0.34} stop={0.75} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: tabH + 250 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onLongPress={__DEV__ ? simulateReminder : undefined} delayLongPress={600}>
            <Kicker>{dateLabel(now)}</Kicker>
          </Pressable>
          <Txt size={32} weight="medium" tracking={-0.02} style={{ lineHeight: 35 }}>
            {greeting(now)}
          </Txt>
        </View>

        <View style={styles.progress}>
          <ProgressRing pct={pct} />
          <View style={{ gap: 3, minWidth: 0 }}>
            <Txt size={25} weight="medium" tracking={-0.015} tabular style={{ lineHeight: 28 }}>
              {doneN}
              <Txt size={25} weight="medium" color={colors.muted45}>
                {` / ${total}`}
              </Txt>
            </Txt>
            <Txt size={13} color={colors.muted}>
              {habits.length ? `${habits.length} left today` : total ? 'All done' : 'No habits yet'}
            </Txt>
            <View style={styles.inline}>
              <FlameIcon size={13} color={accent[300]} />
              <Txt size={12} color={accent[300]}>
                Best streak {best} days
              </Txt>
            </View>
          </View>
        </View>

        <View style={[styles.inline, styles.nextReminder]}>
          <AlarmIcon size={16} color={colors.accent} />
          <Txt size={13} color={colors.muted}>
            Next reminder
          </Txt>
          <Txt size={13} numberOfLines={1} style={{ flexShrink: 1, marginLeft: 0 }}>
            {next ? `${fmtTime(next.time, fmt)} · ${next.name}` : 'None set'}
          </Txt>
        </View>

        <View style={styles.upNext}>
          <View style={styles.upNextHeader}>
            <Txt size={11} tracking={0.08} color={colors.muted60} style={{ textTransform: 'uppercase' }}>
              Up next
            </Txt>
            <Pressable
              onPress={() => router.navigate('/today')}
              style={({ pressed }) => [styles.allHabits, pressed && { backgroundColor: alpha(colors.accent, 0.1) }]}
            >
              <Txt size={13} weight="medium" color={colors.accent}>
                All habits
              </Txt>
              <CaretRightIcon size={13} color={colors.accent} />
            </Pressable>
          </View>
          {habits.slice(0, 3).map((h) => (
            <UpNextItem key={h.id} habit={h} onComplete={completeHabit} />
          ))}
          {total > 0 && left === 0 && (
            <View style={styles.allDone}>
              <CheckCircleIcon size={20} color={accent[300]} />
              <Txt size={14} color={accent[300]}>
                All done for today
              </Txt>
            </View>
          )}
        </View>
      </ScrollView>

      <FadeRule style={[styles.floor, { bottom: tabH + 18 }]} />
      <View style={[styles.tree, { bottom: tabH - 10 }]} pointerEvents="box-none">
        <Tree streak={best} rustleTick={rustleTick} onPress={rustle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 22, gap: 2 },
  progress: { paddingTop: 22, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 16 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nextReminder: { marginTop: 18, marginHorizontal: 22, gap: 8, minWidth: 0 },
  upNext: { paddingTop: 22, paddingHorizontal: 16 },
  upNextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  allHabits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginRight: -6,
    borderRadius: 6,
  },
  allDone: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingHorizontal: 6 },
  floor: { position: 'absolute', left: 16, right: 16 },
  tree: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 2 },
});
