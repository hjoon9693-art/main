import { useEffect } from 'react';
import { AppState } from 'react-native';

import { reminderSignature, syncReminders } from '@/lib/notifications';
import { useStore } from '@/state/store';

/** Runs the new-day logic at local midnight and whenever the app returns to the foreground. */
export function useDayRollover(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const check = () => useStore.getState().rollover();
    check();
    let timer: ReturnType<typeof setTimeout>;
    const armMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        check();
        armMidnight();
      }, next.getTime() - now.getTime());
    };
    armMidnight();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [enabled]);
}

/** Reschedules the daily OS reminders whenever a habit's reminder, time or name changes. */
export function useReminderSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const all = () => {
      const s = useStore.getState();
      return [...s.habits, ...s.done.map((d) => d.habit)];
    };
    let sig = reminderSignature(all());
    syncReminders(all());
    return useStore.subscribe(() => {
      const next = reminderSignature(all());
      if (next === sig) return;
      sig = next;
      syncReminders(all());
    });
  }, [enabled]);
}
