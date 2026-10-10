import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { measureTarget } from '@/lib/targets';
import { useStore } from '@/state/store';

/**
 * Completes a habit with the signature flip: the card is measured, a ghost copy
 * flips onto the done pile (Today) or into the Today tab icon (Home), and the
 * original row collapses. The habit moves to `done` when the flip lands.
 */
export async function completeHabit(id: string) {
  const s = useStore.getState();
  if (s.leaving[id]) return;
  const habit = s.habits.find((h) => h.id === id);
  if (!habit) return;
  const onHome = s.tab === 'home';
  const [card, target, layer] = await Promise.all([
    measureTarget(`${s.tab}:card:${id}`),
    measureTarget(onHome ? 'tab:today' : 'pile'),
    measureTarget('ghost-layer'),
  ]);
  const duration = useStore.getState().complete(id);
  if (!duration) return;
  if (card && target) {
    const ox = layer?.x ?? 0;
    const oy = layer?.y ?? 0;
    useStore.getState().addGhost({
      habit,
      variant: s.tab,
      from: { ...card, x: card.x - ox, y: card.y - oy },
      to: { ...target, x: target.x - ox, y: target.y - oy },
      toTab: onHome,
      duration,
    });
  }
  setTimeout(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, duration);
}
