import { Tabs } from 'expo-router/js-tabs';
import { Animated, Easing } from 'react-native';

import { TabBar } from '@/components/TabBar';

/** Screens cross-fade and slide 28px when switching tabs. */
const sceneStyleInterpolator = ({ current }: { current: { progress: Animated.Value } }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
    transform: [{ translateX: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-28, 0, 28] }) }],
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        sceneStyleInterpolator,
        transitionSpec: { animation: 'timing', config: { duration: 300, easing: Easing.bezier(0.2, 0.8, 0.2, 1) } },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
    </Tabs>
  );
}
