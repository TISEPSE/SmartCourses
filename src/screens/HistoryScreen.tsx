import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList} from '../types';
import {getLists} from '../storage';
import {colors, spacing} from '../theme';
import {AppBar, Card, LargeHead} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {accent} = useSettings();
  const [completed, setCompleted] = useState<GroceryList[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const lists = await getLists();
      setCompleted(
        lists
          .filter(l => l.completedAt)
          .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
      );
    });
    return unsubscribe;
  }, [navigation]);

  const totalSpent = completed.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Historique" onBack={() => navigation.goBack()} />
      <LargeHead
        title="Courses terminées"
        sub={`${completed.length} liste${completed.length > 1 ? 's' : ''} · ${totalSpent
          .toFixed(2)
          .replace('.', ',')} € au total`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {completed.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="history" size={48} color={colors.text3} />
            <Text style={styles.emptyText}>Aucune course terminée</Text>
            <Text style={styles.emptyHint}>
              Termine une liste pour la retrouver ici
            </Text>
          </View>
        ) : (
          completed.map(l => (
            <Card key={l.id} style={styles.histCard}>
              <TouchableOpacity
                style={styles.histInner}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Shopping', {listId: l.id})}>
                <View style={styles.histInfo}>
                  <Text style={styles.histName}>{l.name}</Text>
                  <Text style={styles.histSub}>
                    {l.completedAt
                      ? new Date(l.completedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : ''}{' '}
                    · {l.items.length} article{l.items.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={[styles.histCost, {color: accent}]}>
                  {l.totalCost != null
                    ? `${l.totalCost.toFixed(2).replace('.', ',')} €`
                    : '—'}
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {paddingHorizontal: spacing.lg},
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyText: {fontSize: 16, fontWeight: '700', color: colors.text},
  emptyHint: {fontSize: 14, color: colors.text2, fontWeight: '600'},
  histCard: {marginBottom: spacing.sm},
  histInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  histInfo: {flex: 1, minWidth: 0},
  histName: {fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.3},
  histSub: {fontSize: 12.5, color: colors.text2, fontWeight: '600', marginTop: 2},
  histCost: {fontSize: 17, fontWeight: '800', color: colors.text},
  bottomSpace: {height: 32},
});
