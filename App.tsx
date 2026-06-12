import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import Navigation from './src/navigation';
import {SettingsProvider} from './src/context/SettingsContext';
import {colors} from './src/theme';

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SettingsProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <NavigationContainer theme={AppTheme}>
            <Navigation />
          </NavigationContainer>
        </SafeAreaProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
