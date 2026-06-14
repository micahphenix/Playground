import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts as useCrimson,
  CrimsonPro_400Regular,
  CrimsonPro_400Regular_Italic,
  CrimsonPro_500Medium,
  CrimsonPro_500Medium_Italic,
  CrimsonPro_600SemiBold,
} from '@expo-google-fonts/crimson-pro';
import {
  useFonts as useDM,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  useFonts as useMono,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { DataProvider } from './src/data/DataContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashView } from './src/screens/SplashView';
import { colors } from './src/theme';

const navTheme = {
  dark: false,
  colors: {
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.accent,
  },
};

export default function App() {
  const [serifReady] = useCrimson({
    CrimsonPro_400Regular,
    CrimsonPro_400Regular_Italic,
    CrimsonPro_500Medium,
    CrimsonPro_500Medium_Italic,
    CrimsonPro_600SemiBold,
  });
  const [sansReady] = useDM({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const [monoReady] = useMono({ JetBrainsMono_500Medium, JetBrainsMono_600SemiBold });
  const ready = serifReady && sansReady && monoReady;

  return (
    // Required root for react-native-gesture-handler — without it, gesture/
    // touch handling (including ScrollView) is dead app-wide on the New
    // Architecture. Must be the outermost view and fill the screen.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {ready ? (
          <DataProvider>
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
          </DataProvider>
        ) : (
          <SplashView />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// `package.json` points "main" directly at this file, so this file is the
// app entry — it must register the root component itself (there is no
// index.js / expo AppEntry shim). Without this the bundle loads but "main"
// is never registered → "App entry not found".
registerRootComponent(App);
