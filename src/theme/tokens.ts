import { Easing as REasing } from 'react-native-reanimated';

/** Nocturne design tokens (see design handoff `nocturne-styles.css`). */
export const accent = {
  100: '#f5f4ff',
  200: '#e7e5fe',
  300: '#d2cefd',
  400: '#b5abfc',
  500: '#968ae0',
  600: '#796cbf',
  700: '#5d5294',
  800: '#423a6a',
  900: '#2b2741',
} as const;

export const neutral = {
  100: '#f3f5fe',
  200: '#e4e7f5',
  300: '#cfd3e5',
  400: '#b2b6ca',
  500: '#9397ab',
  600: '#75798c',
  700: '#595d6c',
  800: '#3f424d',
  900: '#292b31',
} as const;

/** Mixes `hex` with transparency, e.g. alpha('#9184d9', 0.12). */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export const colors = {
  bg: '#161826',
  surface: '#232532',
  text: '#e9e9ed',
  accent: '#9184d9',
  divider: alpha('#e9e9ed', 0.16),
  sectionGlow: '#353b80',
  muted: alpha('#e9e9ed', 0.62),
  muted60: alpha('#e9e9ed', 0.6),
  muted50: alpha('#e9e9ed', 0.5),
  muted45: alpha('#e9e9ed', 0.45),
} as const;

export const radius = { md: 8, lg: 14, input: 12, sheet: 28, banner: 24 } as const;

export const elevation = {
  sm: { borderWidth: 1, borderColor: neutral[800] },
  md: {
    borderWidth: 1,
    borderColor: neutral[700],
    boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.55)',
  },
  lg: {
    borderWidth: 1,
    borderColor: neutral[500],
    boxShadow: '0px 16px 40px rgba(0, 0, 0, 0.65)',
  },
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

/** Shared motion curves. */
export const ease = {
  /** cubic-bezier(.2,.8,.2,1) — entrances, screen + sheet slides */
  out: REasing.bezier(0.2, 0.8, 0.2, 1),
  /** cubic-bezier(.45,0,.25,1) — the completion flip */
  flip: REasing.bezier(0.45, 0, 0.25, 1),
  /** cubic-bezier(.4,0,.2,1) — progress, collapse */
  std: REasing.bezier(0.4, 0, 0.2, 1),
  /** cubic-bezier(.4,0,1,1) — sheet close */
  in: REasing.bezier(0.4, 0, 1, 1),
};
