import type { Icon } from 'phosphor-react-native';

// Per-icon requires keep the full Phosphor set out of the bundle (Metro does not
// tree-shake the barrel). They are typed here instead of importing the icon
// sources, whose .tsx would otherwise be type-checked as part of the app.
/* eslint-disable @typescript-eslint/no-require-imports */
const icon = (m: Record<string, Icon>, name: string): Icon => m[`${name}Icon`];

export const AlarmIcon = icon(require('phosphor-react-native/src/icons/Alarm'), 'Alarm');
export const ArrowCounterClockwiseIcon = icon(
  require('phosphor-react-native/src/icons/ArrowCounterClockwise'),
  'ArrowCounterClockwise',
);
export const BellIcon = icon(require('phosphor-react-native/src/icons/Bell'), 'Bell');
export const CaretRightIcon = icon(require('phosphor-react-native/src/icons/CaretRight'), 'CaretRight');
export const CheckIcon = icon(require('phosphor-react-native/src/icons/Check'), 'Check');
export const CheckCircleIcon = icon(require('phosphor-react-native/src/icons/CheckCircle'), 'CheckCircle');
export const ClockIcon = icon(require('phosphor-react-native/src/icons/Clock'), 'Clock');
export const FlameIcon = icon(require('phosphor-react-native/src/icons/Flame'), 'Flame');
export const HouseSimpleIcon = icon(require('phosphor-react-native/src/icons/HouseSimple'), 'HouseSimple');
export const ListChecksIcon = icon(require('phosphor-react-native/src/icons/ListChecks'), 'ListChecks');
export const MinusIcon = icon(require('phosphor-react-native/src/icons/Minus'), 'Minus');
export const MoonStarsIcon = icon(require('phosphor-react-native/src/icons/MoonStars'), 'MoonStars');
export const PlusIcon = icon(require('phosphor-react-native/src/icons/Plus'), 'Plus');
export const StackIcon = icon(require('phosphor-react-native/src/icons/Stack'), 'Stack');
export const SunIcon = icon(require('phosphor-react-native/src/icons/Sun'), 'Sun');
export const SunHorizonIcon = icon(require('phosphor-react-native/src/icons/SunHorizon'), 'SunHorizon');
export const TrashIcon = icon(require('phosphor-react-native/src/icons/Trash'), 'Trash');
export const XIcon = icon(require('phosphor-react-native/src/icons/X'), 'X');
