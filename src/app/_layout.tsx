import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RadialGlow } from '@/components/Decor';
import { EditSheet } from '@/components/EditSheet';
import { GhostLayer } from '@/components/GhostLayer';
import { ReminderBanner, Toast } from '@/components/Overlays';
import { useDayRollover, useReminderSync } from '@/hooks/lifecycle';
import { setupNotifications } from '@/lib/notifications';
import { useStore } from '@/state/store';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: colors.bg,
    text: colors.text,
    primary: colors.accent,
    border: colors.divider,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const hydrated = useStore((s) => s.hydrated);
  const ready = fontsLoaded && hydrated;

  useEffect(() => setupNotifications(), []);
  useDayRollover(hydrated);
  useReminderSync(hydrated);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={styles.root} />;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          {/* Top-left accent glow behind both tabs. */}
          <RadialGlow color={colors.accent} opacity={0.13} cx={0} cy={0} rx={1.2} ry={0.45} stop={0.62} />
          <Slot />
          <Toast />
          <GhostLayer />
          <ReminderBanner />
          <EditSheet />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
