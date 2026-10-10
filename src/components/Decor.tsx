import { useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme/tokens';

let gid = 0;
const useId = (p: string) => useState(() => `${p}${gid++}`)[0];

/** A 1px rule that fades to transparent over 48px at each end. */
export function FadeRule({ style, color = colors.divider }: { style?: StyleProp<ViewStyle>; color?: string }) {
  const id = useId('rule');
  const [w, setW] = useState(0);
  const f = w > 96 ? 48 / w : 0.5;
  return (
    <View style={[{ height: 1 }, style]} pointerEvents="none" onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={1}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <Stop offset={0} stopColor={color} stopOpacity={0} />
              <Stop offset={f} stopColor={color} />
              <Stop offset={1 - f} stopColor={color} />
              <Stop offset={1} stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={w} height={1} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
}

type GlowProps = {
  color: string;
  opacity: number;
  /** Center and radii as fractions of the box, like CSS `radial-gradient(rx ry at cx cy)`. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Where the gradient reaches transparent, 0–1. */
  stop: number;
  style?: StyleProp<ViewStyle>;
};

/** Elliptical radial glow filling its parent (absolute). */
export function RadialGlow({ color, opacity, cx, cy, rx, ry, stop, style }: GlowProps) {
  const id = useId('glow');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;
  const px = cx * w;
  const py = cy * h;
  const r = rx * w;
  const sy = r ? (ry * h) / r : 1;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {w > 0 && (
        <Svg width={w} height={h}>
          <Defs>
            <RadialGradient
              id={id}
              cx={px}
              cy={py}
              r={r}
              fx={px}
              fy={py}
              gradientUnits="userSpaceOnUse"
              gradientTransform={`translate(${px} ${py}) scale(1 ${sy}) translate(${-px} ${-py})`}
            >
              <Stop offset={0} stopColor={color} stopOpacity={opacity} />
              <Stop offset={stop} stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={w} height={h} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
}

/** Vertical fade from `color` (bottom) to transparent (top); solid below `solidFrom`. */
export function BottomFade({
  height,
  color = colors.bg,
  solidFrom = 0.62,
  style,
}: {
  height: number;
  color?: string;
  solidFrom?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const id = useId('fade');
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height }, style]}>
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="1" x2="0" y2="0">
            <Stop offset={0} stopColor={color} />
            <Stop offset={solidFrom} stopColor={color} />
            <Stop offset={1} stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
