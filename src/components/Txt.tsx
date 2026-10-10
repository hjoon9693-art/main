import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

type Weight = 'regular' | 'medium' | 'semibold';

type Props = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  /** Letter spacing in em, like the CSS spec. */
  tracking?: number;
  tabular?: boolean;
};

/** Inter text. React Native needs a font family per weight, so weight picks the family. */
export function Txt({ size = 14, weight = 'regular', color = colors.text, tracking, tabular, style, ...rest }: Props) {
  const s: TextStyle = {
    fontFamily: fonts[weight],
    fontSize: size,
    color,
    letterSpacing: tracking ? tracking * size : undefined,
    fontVariant: tabular ? ['tabular-nums'] : undefined,
  };
  return <Text {...rest} style={[s, style]} />;
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <Txt size={10} tracking={0.1} color={colors.accent} style={{ textTransform: 'uppercase' }}>
      {children}
    </Txt>
  );
}
