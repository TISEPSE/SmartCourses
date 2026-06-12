import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors, spacing} from '../theme';
import {AppBar} from '../components';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Historique" onBack={() => navigation.goBack()} />
      <View style={styles.center}>
        <Text style={styles.text}>Bientôt disponible</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  text: {fontSize: 16, fontWeight: '600', color: colors.text2, paddingHorizontal: spacing.lg},
});
