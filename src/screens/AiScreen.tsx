import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors, spacing} from '../theme';
import {AppBar, LargeHead} from '../components';

export default function AiScreen() {
  return (
    <View style={styles.container}>
      <AppBar title="IA" />
      <LargeHead title="Cuisine intelligente" sub="Bientôt disponible" />
      <View style={styles.body}>
        <Icon name="auto-fix" size={48} color={colors.text3} />
        <Text style={styles.title}>Fonctionnalités IA</Text>
        <Text style={styles.sub}>
          Génération de listes, recettes et planning hebdomadaire à venir dans
          une prochaine version.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});
