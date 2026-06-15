import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import Navigation from './src/navigation';
import {SettingsProvider, useSettings} from './src/context/SettingsContext';
import {seedRecipesIfNeeded} from './src/storage';

function Root() {
  const {colors} = useSettings();
  const theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <NavigationContainer theme={theme}>
        <Navigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  useEffect(() => {
    seedRecipesIfNeeded();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SettingsProvider>
        <Root />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
