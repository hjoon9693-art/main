import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { dayKey, daysBetween, flipDuration } from '@/lib/time';
import type { DoneEntry, Draft, Habit, Settings } from '@/lib/types';

export type Tab = 'home' | 'today';
export type Toast = { key: number; text: string; undo: boolean };
export type Banner = { id: string; name: string; time: number | null };
export type Rect = { x: number; y: number; width: number; height: number };
export type Ghost = {
  key: number;
  habit: Habit;
  /** Which card face to draw on the front of the flip. */
  variant: Tab;
  from: Rect;
  to: Rect;
  /** Flying into the Today tab icon (shrinks + fades) rather than onto the pile. */
  toTab: boolean;
  duration: number;
};

const SEED: Habit[] = (
  [
    { id: 'h1', name: 'Drink a glass of water', tod: 'morning', rem: true, time: 450, streak: 12 },
    { id: 'h2', name: 'Stretch for 10 minutes', tod: 'morning', rem: false, time: 480, streak: 5 },
    { id: 'h3', name: 'Walk outside', tod: 'afternoon', rem: true, time: 750, streak: 3 },
    { id: 'h4', name: 'Read 20 pages', tod: 'evening', rem: true, time: 1260, streak: 23 },
    { id: 'h5', name: 'Journal three lines', tod: 'evening', rem: true, time: 1335, streak: 1 },
    { id: 'h6', name: 'No screens after 23:00', tod: 'evening', rem: false, time: 1380, streak: 8 },
  ] as const
).map((h, i) => ({ ...h, ord: i }));

type Persisted = {
  habits: Habit[];
  done: DoneEntry[];
  /** Local day the `done` list belongs to. */
  day: string;
  settings: Settings;
};

type Transient = {
  hydrated: boolean;
  tab: Tab;
  leaving: Record<string, true>;
  editing: Draft | null;
  toast: Toast | null;
  banner: Banner | null;
  /** Habit just put back by Undo — its card plays the re-entry animation. */
  restored: { id: string; key: number } | null;
  ghosts: Ghost[];
  /** Bumped to trigger one-shot animations elsewhere in the tree. */
  ticks: { pile: number; tabPop: number; rustle: number };
  /** When the last habit of the day was completed (drives the Today celebration). */
  allDoneAt: number;
};

type Actions = {
  setTab: (tab: Tab) => void;
  /** Starts the completion; the habit moves to `done` after the flip finishes. */
  complete: (id: string) => number;
  undo: () => void;
  addGhost: (g: Omit<Ghost, 'key'>) => void;
  removeGhost: (key: number) => void;
  openEdit: (h: Habit) => void;
  openAdd: () => void;
  setDraft: (patch: Partial<Draft>) => void;
  closeEditor: () => void;
  /** Saves the open draft. Returns false if it has no name. */
  saveDraft: () => boolean;
  deleteDraft: () => void;
  showToast: (text: string, undo?: boolean) => void;
  hideToast: () => void;
  showBanner: (b: Banner) => void;
  hideBanner: () => void;
  rustle: () => void;
  /** Applies streaks and clears the done pile if the calendar day changed. */
  rollover: (today?: string) => void;
  /** Dev helper: runs the new-day logic now without changing the stored date. */
  startNextDay: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

export type State = Persisted & Transient & Actions;

/** State for a new day: done habits extend their streak, missed ones (or any gap of 2+ days) reset. */
function freshDay(s: Persisted, gap: number) {
  const doneIds = new Set(s.done.map((d) => d.habit.id));
  const habits = [...s.habits, ...s.done.map((d) => d.habit)]
    .sort((a, b) => a.ord - b.ord)
    .map((h) => ({ ...h, streak: gap === 1 && doneIds.has(h.id) ? h.streak + 1 : 0 }));
  return { habits, done: [], leaving: {}, toast: null, banner: null, editing: null, ghosts: [] };
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
const TOAST_MS = 4200;

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const armToast = () => {
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => set({ toast: null }), TOAST_MS);
      };
      const showToast = (text: string, undo = false) => {
        set({ toast: { key: Date.now(), text, undo } });
        armToast();
      };
      const bump = (k: keyof Transient['ticks']) => set((s) => ({ ticks: { ...s.ticks, [k]: s.ticks[k] + 1 } }));

      return {
        habits: SEED,
        done: [],
        day: dayKey(),
        settings: { animSpeed: 'Normal', pileDepth: 3, timeFormat: '24h' },

        hydrated: false,
        tab: 'home',
        leaving: {},
        editing: null,
        toast: null,
        banner: null,
        restored: null,
        ghosts: [],
        ticks: { pile: 0, tabPop: 0, rustle: 0 },
        allDoneAt: 0,

        setTab: (tab) => {
          if (get().tab !== tab) set({ tab });
        },

        complete: (id) => {
          const s = get();
          const D = flipDuration(s.settings.animSpeed);
          if (s.leaving[id] || !s.habits.some((h) => h.id === id)) return 0;
          const onHome = s.tab === 'home';
          set({ leaving: { ...s.leaving, [id]: true }, banner: s.banner?.id === id ? null : s.banner });
          setTimeout(() => {
            const cur = get();
            const index = cur.habits.findIndex((h) => h.id === id);
            const leaving = { ...cur.leaving };
            delete leaving[id];
            if (index < 0) return set({ leaving });
            const habit = cur.habits[index];
            const habits = cur.habits.filter((h) => h.id !== id);
            set({ habits, done: [...cur.done, { habit, index, at: Date.now() }], leaving });
            if (onHome) {
              bump('tabPop');
              bump('rustle');
            } else bump('pile');
            if (habits.length === 0) set({ allDoneAt: Date.now() });
            showToast(`${habit.name} — done`, true);
          }, D);
          return D;
        },

        undo: () => {
          clearTimeout(toastTimer);
          const s = get();
          const last = s.done[s.done.length - 1];
          if (!last) return set({ toast: null });
          const habits = [...s.habits];
          habits.splice(Math.min(last.index, habits.length), 0, last.habit);
          set({
            habits,
            done: s.done.slice(0, -1),
            toast: null,
            restored: { id: last.habit.id, key: Date.now() },
          });
        },

        addGhost: (g) => set((s) => ({ ghosts: [...s.ghosts, { ...g, key: Date.now() + Math.random() }] })),
        removeGhost: (key) => set((s) => ({ ghosts: s.ghosts.filter((g) => g.key !== key) })),

        openEdit: (h) => set({ editing: { ...h, isNew: false }, banner: null }),
        openAdd: () => {
          const s = get();
          const ord = Math.max(0, ...s.habits.map((h) => h.ord), ...s.done.map((d) => d.habit.ord)) + 1;
          set({
            editing: {
              id: `h${Date.now()}`,
              name: '',
              tod: 'anytime',
              rem: false,
              time: 540,
              streak: 0,
              ord,
              isNew: true,
            },
            banner: null,
          });
        },
        setDraft: (patch) => set((s) => (s.editing ? { editing: { ...s.editing, ...patch } } : {})),
        closeEditor: () => set({ editing: null }),
        saveDraft: () => {
          const e = get().editing;
          if (!e) return false;
          const name = e.name.trim();
          if (!name) return false;
          const { isNew, ...rest } = e;
          const h: Habit = { ...rest, name };
          set((s) => ({ habits: isNew ? [...s.habits, h] : s.habits.map((x) => (x.id === h.id ? h : x)) }));
          return true;
        },
        deleteDraft: () => {
          const id = get().editing?.id;
          if (!id) return;
          set((s) => ({ habits: s.habits.filter((x) => x.id !== id) }));
          showToast('Habit deleted');
        },

        showToast,
        hideToast: () => {
          clearTimeout(toastTimer);
          set({ toast: null });
        },
        showBanner: (banner) => set({ banner }),
        hideBanner: () => set({ banner: null }),
        rustle: () => bump('rustle'),

        rollover: (today = dayKey()) => {
          const s = get();
          const gap = daysBetween(s.day, today);
          if (gap <= 0) return;
          clearTimeout(toastTimer);
          set({ ...freshDay(s, gap), day: today });
        },
        startNextDay: () => {
          clearTimeout(toastTimer);
          set(freshDay(get(), 1));
        },

        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      };
    },
    {
      name: 'dusk-habits',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Persisted => ({ habits: s.habits, done: s.done, day: s.day, settings: s.settings }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('[dusk] could not restore saved data', error);
        useStore.setState({ hydrated: true });
        try {
          useStore.getState().rollover();
        } catch (e) {
          console.warn('[dusk] new-day check failed', e);
        }
      },
    },
  ),
);

/** Best current streak across habits, counting today when a habit is already done. */
export function bestStreak(s: Pick<State, 'habits' | 'done'>) {
  return Math.max(0, ...s.habits.map((h) => h.streak), ...s.done.map((d) => d.habit.streak + 1));
}
