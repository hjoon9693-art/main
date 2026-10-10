export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type Habit = {
  id: string;
  name: string;
  tod: TimeOfDay;
  /** Reminder enabled. */
  rem: boolean;
  /** Reminder time, minutes from midnight. */
  time: number;
  /** Consecutive days completed, not counting today. */
  streak: number;
  /** Original creation order, restored at the start of each day. */
  ord: number;
};

export type DoneEntry = { habit: Habit; index: number; at: number };

export type AnimSpeed = 'Gentle' | 'Normal' | 'Snappy';
export type TimeFormat = '24h' | '12h';

export type Settings = {
  animSpeed: AnimSpeed;
  /** Number of visible layers in the done pile, 1–5. */
  pileDepth: number;
  timeFormat: TimeFormat;
};

export type Draft = Habit & { isNew: boolean };
