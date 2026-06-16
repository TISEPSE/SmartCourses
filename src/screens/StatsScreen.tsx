import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList} from '../types';
import {getLists} from '../storage';
import {Palette, spacing, radius} from '../theme';
import {AppBar, Card, LargeHead} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const euro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

interface MonthStat {
  key: string;
  label: string;
  total: number;
  count: number;
}

export default function StatsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {colors, accent, accentSoft} = useSettings();
  const styles = makeStyles(colors);
  const [completed, setCompleted] = useState<GroceryList[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const lists = await getLists();
      setCompleted(lists.filter(l => l.completedAt && l.totalCost != null));
    });
    return unsubscribe;
  }, [navigation]);

  const {months, total, avg, currentMonth} = useMemo(() => {
    const map = new Map<string, MonthStat>();
    for (const l of completed) {
      const d = new Date(l.completedAt as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'});
      const m = map.get(key) ?? {key, label, total: 0, count: 0};
      m.total += l.totalCost ?? 0;
      m.count += 1;
      map.set(key, m);
    }
    const monthsArr = [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
    const totalSpent = completed.reduce((s, l) => s + (l.totalCost ?? 0), 0);
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      months: monthsArr,
      total: totalSpent,
      avg: completed.length ? totalSpent / completed.length : 0,
      currentMonth: map.get(curKey) ?? {
        key: curKey,
        label: now.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
        total: 0,
        count: 0,
      },
    };
  }, [completed]);

  const maxMonth = months.reduce((m, x) => Math.max(m, x.total), 0) || 1;

  if (completed.length === 0) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <AppBar title="Statistiques" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Icon name="chart-box-outline" size={48} color={colors.text3} />
          <Text style={styles.emptyText}>Aucune donnée pour l'instant</Text>
          <Text style={styles.emptyHint}>
            Termine des listes avec un montant pour suivre ton budget ici.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Statistiques" onBack={() => navigation.goBack()} />
      <LargeHead title="Budget" sub="Suivi de tes dépenses de courses" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Mois en cours, mis en avant */}
        <Card style={[styles.hero, {backgroundColor: accentSoft}]}>
          <Text style={[styles.heroLabel, {color: accent}]}>
            {capitalize(currentMonth.label)}
          </Text>
          <Text style={[styles.heroValue, {color: accent}]}>
            {euro(currentMonth.total)}
          </Text>
          <Text style={[styles.heroSub, {color: accent}]}>
            {currentMonth.count} course{currentMonth.count > 1 ? 's' : ''} ce mois-ci
          </Text>
        </Card>

        {/* Indicateurs globaux */}
        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{euro(total)}</Text>
            <Text style={styles.statLabel}>Total dépensé</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{euro(avg)}</Text>
            <Text style={styles.statLabel}>Moyenne / course</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Par mois</Text>
        {months.map(m => (
          <Card key={m.key} style={styles.monthCard}>
            <View style={styles.monthHead}>
              <Text style={styles.monthLabel}>{capitalize(m.label)}</Text>
              <Text style={[styles.monthTotal, {color: accent}]}>
                {euro(m.total)}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {width: `${(m.total / maxMonth) * 100}%`, backgroundColor: accent},
                ]}
              />
            </View>
            <Text style={styles.monthCount}>
              {m.count} course{m.count > 1 ? 's' : ''}
            </Text>
          </Card>
        ))}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    scroll: {flex: 1},
    content: {paddingHorizontal: spacing.lg},
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    emptyText: {fontSize: 16, fontWeight: '700', color: colors.text},
    emptyHint: {
      fontSize: 14,
      color: colors.text2,
      fontWeight: '600',
      textAlign: 'center',
    },
    hero: {
      padding: spacing.lg,
      borderWidth: 0,
      marginBottom: spacing.md,
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      opacity: 0.9,
    },
    heroValue: {
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: -1,
      marginTop: 4,
    },
    heroSub: {fontSize: 13.5, fontWeight: '700', marginTop: 2, opacity: 0.9},
    statRow: {flexDirection: 'row', gap: spacing.md},
    statCard: {flex: 1, padding: spacing.lg},
    statValue: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    statLabel: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text2,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    monthCard: {padding: spacing.lg, marginBottom: spacing.sm},
    monthHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    monthLabel: {fontSize: 15, fontWeight: '700', color: colors.text},
    monthTotal: {fontSize: 16, fontWeight: '800'},
    barTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.cardHi,
      overflow: 'hidden',
      marginTop: 10,
    },
    barFill: {height: 6, borderRadius: 3},
    monthCount: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text2,
      marginTop: 8,
    },
    bottomSpace: {height: 32},
  });
