import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList} from '../types';
import {getLists} from '../storage';
import {Palette, spacing} from '../theme';
import {AppBar, Card, Row, SectionLabel, Divider} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const euro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface MonthStat {
  key: string;
  label: string;
  total: number;
  count: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {settings, colors, accent, onAccent} = useSettings();
  const styles = makeStyles(colors);
  const [lists, setLists] = useState<GroceryList[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setLists(await getLists());
    });
    return unsubscribe;
  }, [navigation]);

  const {months, total, avg, count, currentMonth, maxMonth} = useMemo(() => {
    const completed = lists.filter(l => l.completedAt && l.totalCost != null);
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
      count: completed.length,
      maxMonth: monthsArr.reduce((m, x) => Math.max(m, x.total), 0) || 1,
      currentMonth: map.get(curKey) ?? {
        key: curKey,
        label: now.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
        total: 0,
        count: 0,
      },
    };
  }, [lists]);

  const initials = settings.userName
    ? settings.userName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SC';

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Profil" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* En-tête profil */}
        <Card
          style={styles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}>
          <View style={[styles.avatar, {backgroundColor: accent}]}>
            <Text style={[styles.avatarText, {color: onAccent}]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {settings.userName || 'Ajouter un prénom'}
            </Text>
            <Text style={styles.profileEmail}>Appuie pour modifier</Text>
          </View>
          <Icon name="pencil-outline" size={20} color={colors.text3} />
        </Card>

        {/* Budget mensuel */}
        <SectionLabel label="Budget" />
        <Card style={[styles.hero, {backgroundColor: accent}]}>
          <View style={styles.heroTop}>
            <Text style={[styles.heroLabel, {color: onAccent}]}>
              {capitalize(currentMonth.label)}
            </Text>
            <Icon
              name="wallet-outline"
              size={22}
              color={onAccent}
              style={{opacity: 0.85}}
            />
          </View>
          <Text style={[styles.heroValue, {color: onAccent}]}>
            {euro(currentMonth.total)}
          </Text>
          <Text style={[styles.heroSub, {color: onAccent}]}>
            {currentMonth.count} course{currentMonth.count > 1 ? 's' : ''} ce mois-ci
          </Text>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={[styles.statValue, {color: accent}]}>{count}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statCol}>
            <Text style={[styles.statValue, {color: accent}]}>{euro(total)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statCol}>
            <Text style={[styles.statValue, {color: accent}]}>{euro(avg)}</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>
        </Card>

        {months.length > 0 && (
          <>
            <SectionLabel label="Par mois" />
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
                      {
                        width: `${(m.total / maxMonth) * 100}%`,
                        backgroundColor: accent,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.monthCount}>
                  {m.count} course{m.count > 1 ? 's' : ''}
                </Text>
              </Card>
            ))}
          </>
        )}

        {/* Raccourcis */}
        <SectionLabel label="Application" />
        <Card>
          <Row
            icon="cog"
            title="Paramètres"
            subtitle="Thème, haptique, données"
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <Row
            icon="history"
            title="Historique"
            subtitle="Courses terminées"
            onPress={() => navigation.navigate('History')}
          />
        </Card>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    scroll: {flex: 1},
    content: {paddingHorizontal: spacing.lg},
    profileCard: {
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {fontSize: 18, fontWeight: '800'},
    profileInfo: {flex: 1},
    profileName: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    profileEmail: {
      fontSize: 13.5,
      color: colors.text2,
      fontWeight: '600',
      marginTop: 2,
    },
    hero: {
      padding: spacing.lg,
      borderWidth: 0,
      marginBottom: spacing.md,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      opacity: 0.85,
    },
    heroValue: {
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: -1,
      marginTop: 6,
    },
    heroSub: {fontSize: 13.5, fontWeight: '700', marginTop: 2, opacity: 0.85},
    statsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      marginBottom: spacing.md,
    },
    statCol: {flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4},
    statSep: {width: 1, height: 34, backgroundColor: colors.borderSoft},
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text2,
      textAlign: 'center',
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
