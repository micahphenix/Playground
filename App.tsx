import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React from 'react';
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
  );
}
