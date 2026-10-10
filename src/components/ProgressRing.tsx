import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Txt } from '@/components/Txt';
import { colors, ease, neutral } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 76;
const R = 32;
const CIRC = 2 * Math.PI * R;

/** 76px progress ring; the arc animates over 600ms. */
export function ProgressRing({ pct }: { pct: number }) {
  const p = useSharedValue(pct);
  useEffect(() => {
    p.set(withTiming(pct, { duration: 600, easing: ease.std }));
  }, [pct, p]);
  const arc = useAnimatedProps(() => {
    const len = (CIRC * p.value) / 100;
    // A zero-length round-capped dash still draws a dot, as in the design.
    return { strokeDasharray: [len, CIRC] };
  });
  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={38} cy={38} r={R} fill="none" stroke={neutral[800]} strokeWidth={5} />
        {/* Soft glow under the arc stands in for the 4px drop-shadow. */}
        <AnimatedCircle
          cx={38}
          cy={38}
          r={R}
          fill="none"
          stroke={colors.accent}
          strokeOpacity={0.22}
          strokeWidth={10}
          strokeLinecap="round"
          animatedProps={arc}
        />
        <AnimatedCircle
          cx={38}
          cy={38}
          r={R}
          fill="none"
          stroke={colors.accent}
          strokeWidth={5}
          strokeLinecap="round"
          animatedProps={arc}
        />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={15} weight="medium">
          {pct}%
        </Txt>
      </View>
    </View>
  );
}
