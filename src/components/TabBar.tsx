import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { FadeRule } from '@/components/Decor';
import { HouseSimpleIcon, ListChecksIcon } from '@/components/icons';
import { Txt } from '@/components/Txt';
import { useTabBarHeight } from '@/hooks/layout';
import { registerTarget } from '@/lib/targets';
import { type Tab, useStore } from '@/state/store';
import { accent, alpha, colors } from '@/theme/tokens';

const TABS: Record<string, { tab: Tab; label: string; Icon: typeof HouseSimpleIcon }> = {
  index: { tab: 'home', label: 'Home', Icon: HouseSimpleIcon },
  today: { tab: 'today', label: 'Today', Icon: ListChecksIcon },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const height = useTabBarHeight();
  const setTab = useStore((s) => s.setTab);
  const left = useStore((s) => s.habits.length - Object.keys(s.leaving).length);
  const active = state.routes[state.index]?.name;

  useEffect(() => {
    const t = TABS[active]?.tab;
    if (t) setTab(t);
  }, [active, setTab]);

  return (
    <View style={[styles.bar, { height, paddingBottom: height - 62 }]} accessibilityRole="tablist">
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.bg, 0.86) }]} />
      <FadeRule style={styles.rule} />
      {state.routes.map((route, i) => {
        const cfg = TABS[route.name];
        if (!cfg) return null;
        const focused = state.index === i;
        return (
          <TabButton
            key={route.key}
            label={cfg.label}
            Icon={cfg.Icon}
            focused={focused}
            badge={cfg.tab === 'today' && left > 0 ? left : 0}
            isToday={cfg.tab === 'today'}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
          />
        );
      })}
    </View>
  );
}

type ButtonProps = {
  label: string;
  Icon: typeof HouseSimpleIcon;
  focused: boolean;
  badge: number;
  isToday: boolean;
  onPress: () => void;
};

function TabButton({ label, Icon, focused, badge, isToday, onPress }: ButtonProps) {
  const color = focused ? colors.accent : alpha(colors.text, 0.55);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const line = useSharedValue(focused ? 1 : 0);
  const first = useRef(true);
  const popTick = useStore((s) => s.ticks.tabPop);

  // Icon bounces when its tab is selected: 1 → .86 → 1.08 → 1 over 360ms.
  useEffect(() => {
    line.set(withTiming(focused ? 1 : 0, { duration: 200 }));
    if (first.current) {
      first.current = false;
      return;
    }
    if (focused) {
      scale.set(
        withSequence(
          withTiming(0.86, { duration: 126 }),
          withTiming(1.08, { duration: 126 }),
          withTiming(1, { duration: 108 }),
        ),
      );
    }
  }, [focused, scale, line]);

  // The Today icon pops when a habit completed on Home lands in it.
  useEffect(() => {
    if (!isToday || !popTick) return;
    scale.set(
      withSequence(
        withTiming(0.9, { duration: 127 }),
        withTiming(1.1, { duration: 127 }),
        withTiming(1, { duration: 126 }),
      ),
    );
    lift.set(withSequence(withTiming(3, { duration: 127 }), withTiming(0, { duration: 127 })));
  }, [popTick, isToday, scale, lift]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }, { scale: scale.value }] }));
  const lineStyle = useAnimatedStyle(() => ({ opacity: line.value }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={badge ? `${label}, ${badge} left` : label}
      style={styles.tab}
    >
      <Animated.View style={[styles.indicator, lineStyle]} />
      <Animated.View
        ref={isToday ? registerTarget('tab:today') : undefined}
        collapsable={false}
        style={[styles.icon, iconStyle]}
      >
        <Icon size={23} color={color} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Txt size={10} weight="medium" color={accent[100]} style={{ lineHeight: 17, textAlign: 'center' }}>
              {badge}
            </Txt>
          </View>
        )}
      </Animated.View>
      <Txt size={11} weight="medium" color={color}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: 40,
    zIndex: 25,
  },
  rule: { position: 'absolute', top: 0, left: 0, right: 0 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: colors.accent,
    boxShadow: `0px 0px 10px ${colors.accent}`,
  },
  icon: { marginTop: 8 },
  badge: {
    position: 'absolute',
    top: -4,
    left: 16,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: accent[800],
  },
});
