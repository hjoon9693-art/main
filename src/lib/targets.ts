import type { View } from 'react-native';

import type { Rect } from '@/state/store';

/**
 * Registry of on-screen views the completion flip measures: habit cards
 * (`today:card:<id>`, `home:card:<id>`), the done pile, the Today tab icon and
 * the overlay layer the ghost is drawn in.
 */
const views = new Map<string, View>();

export function registerTarget(key: string) {
  return (v: View | null) => {
    if (v) views.set(key, v);
    else views.delete(key);
  };
}

export function measureTarget(key: string): Promise<Rect | null> {
  const v = views.get(key);
  if (!v) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      v.measureInWindow((x, y, width, height) => resolve(width || height ? { x, y, width, height } : null));
    } catch {
      resolve(null);
    }
  });
}
