import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Palette, spacing} from '../theme';
import {AppBar} from '../components';
import {useSettings} from '../context/SettingsContext';

export default function PreferencesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {colors} = useSettings();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Préférences" onBack={() => navigation.goBack()} />
      <View style={styles.center}>
        <Text style={styles.text}>Bientôt disponible</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  text: {fontSize: 16, fontWeight: '600', color: colors.text2, paddingHorizontal: spacing.lg},
});
