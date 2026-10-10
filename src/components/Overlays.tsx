import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeOut, Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowCounterClockwiseIcon, CheckIcon, MoonStarsIcon } from '@/components/icons';
import { Txt } from '@/components/Txt';
import { useTabBarHeight } from '@/hooks/layout';
import { completeHabit } from '@/lib/complete';
import { scheduleSnooze } from '@/lib/notifications';
import { fmtTime } from '@/lib/time';
import { useStore } from '@/state/store';
import { alpha, colors, elevation, neutral, radius } from '@/theme/tokens';

import { PILE_H } from './DonePile';

const toastIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.97 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: Easing.bezier(0.2, 0.8, 0.2, 1) },
}).duration(260);

/** "<Habit> — done · Undo" and other short confirmations. Sits above the pile (Today) or the tab bar (Home). */
export function Toast() {
  const toast = useStore((s) => s.toast);
  const tab = useStore((s) => s.tab);
  const undo = useStore((s) => s.undo);
  const tabH = useTabBarHeight();
  if (!toast) return null;
  const bottom = tab === 'home' ? tabH + 12 : tabH + 12 + PILE_H + 14;
  return (
    <Animated.View
      key={toast.key}
      entering={toastIn}
      exiting={FadeOut.duration(180)}
      style={[styles.toast, { bottom }]}
    >
      <Txt size={14} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
        {toast.text}
      </Txt>
      {toast.undo && (
        <Pressable
          onPress={undo}
          style={({ pressed }) => [styles.undo, pressed && { backgroundColor: alpha(colors.accent, 0.12) }]}
        >
          <ArrowCounterClockwiseIcon size={16} color={colors.accent} />
          <Txt size={14} weight="medium" color={colors.accent}>
            Undo
          </Txt>
        </Pressable>
      )}
    </Animated.View>
  );
}

const bannerIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -200 }] },
  70: { opacity: 1, transform: [{ translateY: 6 }], easing: Easing.bezier(0.2, 0.8, 0.2, 1) },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
}).duration(520);

/** In-app reminder shown while Dusk is foregrounded. */
export function ReminderBanner() {
  const banner = useStore((s) => s.banner);
  const fmt = useStore((s) => s.settings.timeFormat);
  const insets = useSafeAreaInsets();
  if (!banner) return null;

  const snooze = () => {
    const s = useStore.getState();
    const h = s.habits.find((x) => x.id === banner.id);
    const label = h ? scheduleSnooze(h) : '';
    s.hideBanner();
    if (label) s.showToast(`Reminder snoozed until ${label}`);
  };
  const markDone = () => {
    useStore.getState().hideBanner();
    completeHabit(banner.id);
  };

  return (
    <Animated.View
      key={banner.id}
      entering={bannerIn}
      exiting={FadeOut.duration(200)}
      style={[styles.banner, { top: insets.top + 4 }]}
      accessibilityRole="alert"
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(neutral[900], 0.92) }]} />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={styles.bannerIcon}>
          <MoonStarsIcon size={19} color={colors.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt size={12} color={colors.muted60}>
              Dusk · Reminder
            </Txt>
            <Txt size={12} color={colors.muted60} tabular>
              {banner.time != null ? fmtTime(banner.time, fmt) : 'now'}
            </Txt>
          </View>
          <Txt size={15} weight="medium" numberOfLines={1}>
            {banner.name}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={snooze}
          style={({ pressed }) => [
            styles.btn,
            styles.btnSecondary,
            pressed && { backgroundColor: alpha(colors.text, 0.07) },
          ]}
        >
          <Txt size={14} weight="medium">
            Snooze 10 min
          </Txt>
        </Pressable>
        <Pressable
          onPress={markDone}
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            pressed && { backgroundColor: alpha(colors.accent, 0.12) },
          ]}
        >
          <CheckIcon size={16} color={colors.accent} />
          <Txt size={14} weight="medium" color={colors.accent}>
            Mark done
          </Txt>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 16,
    borderRadius: radius.lg,
    backgroundColor: neutral[900],
    ...elevation.md,
  },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  banner: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 60,
    padding: 14,
    gap: 12,
    borderRadius: radius.banner,
    overflow: 'hidden',
    ...elevation.lg,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnSecondary: { borderColor: colors.divider },
  btnPrimary: { borderColor: colors.accent },
});
