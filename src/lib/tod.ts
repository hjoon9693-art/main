import type { Icon } from 'phosphor-react-native';

import { ClockIcon, MoonStarsIcon, SunHorizonIcon, SunIcon } from '@/components/icons';
import type { TimeOfDay } from '@/lib/types';

export const TOD: Record<TimeOfDay, { label: string; Icon: Icon }> = {
  morning: { label: 'Morning', Icon: SunHorizonIcon },
  afternoon: { label: 'Afternoon', Icon: SunIcon },
  evening: { label: 'Evening', Icon: MoonStarsIcon },
  anytime: { label: 'Anytime', Icon: ClockIcon },
};

export const TOD_KEYS = Object.keys(TOD) as TimeOfDay[];
