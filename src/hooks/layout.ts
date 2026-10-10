import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tab bar height: 62pt of content plus the bottom safe area (86 total on the reference device). */
export function useTabBarHeight() {
  const { bottom } = useSafeAreaInsets();
  return 62 + Math.max(bottom, 16);
}

/** Current time, refreshed every 20s (greeting, next reminder, date). */
export function useNow(intervalMs = 20_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);
  return now;
}
