import React, {useEffect} from 'react';
import {LogBox, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import Navigation from './src/navigation';
import {SettingsProvider, useSettings} from './src/context/SettingsContext';
import {SnackbarProvider} from './src/context/SnackbarContext';
import {seedRecipesIfNeeded} from './src/storage';

// Avertissements de dépréciation internes aux librairies (react-navigation…),
// sans impact sur l'app : on les masque pour ne pas polluer l'écran en dev.
LogBox.ignoreLogs(['InteractionManager has been deprecated']);

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
      <StatusBar
        barStyle={colors.mode === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.bg}
      />
      <SnackbarProvider>
        <NavigationContainer theme={theme}>
          <Navigation />
        </NavigationContainer>
      </SnackbarProvider>
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
