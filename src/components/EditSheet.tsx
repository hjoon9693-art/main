import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlarmIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from '@/components/icons';
import { Txt } from '@/components/Txt';
import { DAY_MIN, fmtTime } from '@/lib/time';
import { TOD, TOD_KEYS } from '@/lib/tod';
import { useStore } from '@/state/store';
import { accent, alpha, colors, ease, elevation, fonts, neutral, radius } from '@/theme/tokens';

const PRESETS = [420, 750, 1080, 1260];
const OFFSCREEN = 900;

/** Bottom sheet for adding / editing a habit. Mounted while `editing` is set. */
export function EditSheet() {
  const draft = useStore((s) => s.editing);
  if (!draft) return null;
  return <Sheet key={draft.id} />;
}

function Sheet() {
  const draft = useStore((s) => s.editing)!;
  const fmt = useStore((s) => s.settings.timeFormat);
  const { setDraft, saveDraft, deleteDraft, closeEditor } = useStore.getState();
  const insets = useSafeAreaInsets();
  const [err, setErr] = useState(false);
  const closing = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const y = useSharedValue(OFFSCREEN);
  const backdrop = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    y.set(withTiming(0, { duration: 340, easing: ease.out }));
    backdrop.set(withTiming(1, { duration: 240 }));
    if (draft.isNew) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = (after?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    inputRef.current?.blur();
    const done = () => {
      closeEditor();
      after?.();
    };
    backdrop.set(withTiming(0, { duration: 220 }));
    y.set(
      withTiming(OFFSCREEN, { duration: 240, easing: ease.in }, (finished) => {
        if (finished) scheduleOnRN(done);
      }),
    );
  };

  const save = () => {
    if (!saveDraft()) {
      setErr(true);
      shake.set(
        withSequence(
          withTiming(-6, { duration: 60 }),
          withTiming(6, { duration: 75 }),
          withTiming(-3, { duration: 75 }),
          withTiming(0, { duration: 90 }),
        ),
      );
      return;
    }
    close();
  };

  // Deleting waits for the sheet to close so the toast reads after it.
  const remove = () => close(deleteDraft);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { paddingBottom: Math.max(36, insets.bottom + 16) }, sheetStyle]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Txt size={20} weight="medium">
              {draft.isNew ? 'New habit' : 'Edit habit'}
            </Txt>
            <Pressable
              onPress={() => close()}
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.close, pressed && styles.ghostPressed]}
            >
              <XIcon size={18} color={colors.muted60} />
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <Txt size={12} color={alpha(colors.text, 0.7)}>
              Name
            </Txt>
            <Animated.View style={shakeStyle}>
              <TextInput
                ref={inputRef}
                value={draft.name}
                onChangeText={(name) => {
                  setDraft({ name });
                  if (err) setErr(false);
                }}
                onSubmitEditing={save}
                returnKeyType="done"
                placeholder="e.g. Drink water"
                placeholderTextColor={alpha(colors.text, 0.35)}
                selectionColor={colors.accent}
                cursorColor={colors.accent}
                keyboardAppearance="dark"
                style={[styles.input, { borderColor: err ? accent[300] : colors.divider }]}
              />
            </Animated.View>
            {err && (
              <Txt size={12} color={accent[300]}>
                Give the habit a name first.
              </Txt>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Txt size={12} color={alpha(colors.text, 0.7)}>
              Time of day
            </Txt>
            <View style={styles.grid}>
              {TOD_KEYS.map((key) => {
                const on = draft.tod === key;
                const { Icon, label } = TOD[key];
                const col = on ? accent[300] : colors.text;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setDraft({ tod: key })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    style={[styles.todTile, on && styles.todTileOn]}
                  >
                    <Icon size={17} color={col} />
                    <Txt size={11} weight="medium" color={col}>
                      {label}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.reminder}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AlarmIcon size={20} color={colors.accent} />
              <Txt size={15} style={{ flex: 1 }}>
                Reminder
              </Txt>
              <Switch on={draft.rem} onToggle={() => setDraft({ rem: !draft.rem })} />
            </View>
            {draft.rem && (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Pressable
                    onPress={() => setDraft({ time: (draft.time - 15 + DAY_MIN) % DAY_MIN })}
                    accessibilityLabel="15 minutes earlier"
                    style={({ pressed }) => [styles.stepper, pressed && styles.ghostPressed]}
                  >
                    <MinusIcon size={18} color={colors.text} />
                  </Pressable>
                  <Txt size={36} weight="medium" tracking={-0.02} tabular>
                    {fmtTime(draft.time, fmt)}
                  </Txt>
                  <Pressable
                    onPress={() => setDraft({ time: (draft.time + 15) % DAY_MIN })}
                    accessibilityLabel="15 minutes later"
                    style={({ pressed }) => [styles.stepper, pressed && styles.ghostPressed]}
                  >
                    <PlusIcon size={18} color={colors.text} />
                  </Pressable>
                </View>
                <View style={styles.grid}>
                  {PRESETS.map((t) => {
                    const on = draft.time === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setDraft({ time: t })}
                        style={[styles.preset, on && { borderColor: colors.accent }]}
                      >
                        <Txt size={12} weight="medium" tabular color={on ? accent[300] : colors.text}>
                          {fmtTime(t, fmt)}
                        </Txt>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!draft.isNew && (
              <Pressable onPress={remove} style={({ pressed }) => [styles.delete, pressed && styles.ghostPressed]}>
                <TrashIcon size={16} color={neutral[300]} />
                <Txt size={15} weight="medium" color={neutral[300]}>
                  Delete
                </Txt>
              </Pressable>
            )}
            <Pressable
              onPress={save}
              style={({ pressed }) => [styles.save, pressed && { backgroundColor: alpha(colors.accent, 0.24) }]}
            >
              <Txt size={15} weight="medium" color={colors.accent}>
                {draft.isNew ? 'Add habit' : 'Save'}
              </Txt>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const x = useSharedValue(on ? 20 : 0);
  useEffect(() => {
    x.set(withTiming(on ? 20 : 0, { duration: 200, easing: ease.std }));
  }, [on, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Reminder"
      style={[
        styles.switch,
        { borderColor: on ? colors.accent : neutral[700], backgroundColor: on ? accent[800] : neutral[900] },
      ]}
    >
      <Animated.View style={[styles.knob, { backgroundColor: on ? accent[300] : neutral[500] }, knob]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: alpha(neutral[900], 0.65) },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
    ...elevation.lg,
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 18,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: neutral[700], alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: {
    width: 44,
    height: 44,
    marginRight: -10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostPressed: { backgroundColor: alpha(colors.text, 0.07) },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderRadius: radius.input,
  },
  grid: { flexDirection: 'row', gap: 6 },
  todTile: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  todTileOn: { borderColor: colors.accent, backgroundColor: alpha(colors.accent, 0.12) },
  reminder: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.bg },
  switch: { width: 48, height: 28, borderRadius: 14, borderWidth: 1, padding: 0 },
  knob: { position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: 10 },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preset: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delete: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  save: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
