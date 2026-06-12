import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList} from '../types';
import {getLists} from '../storage';
import {GroceryList} from '../types';
import {colors, spacing, radius} from '../theme';
import {AppBar, Card, Progress, PillTag, SectionLabel, Btn, Chip} from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const QUICK_ACTIONS = [
  {icon: 'plus-circle', label: 'Nouvelle liste', screen: 'CreateList' as const},
  {icon: 'book-open-variant', label: 'Recettes', tab: 'Recipes'},
  {icon: 'fridge', label: 'Garde-manger', screen: 'Pantry' as const},
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [lists, setLists] = useState<GroceryList[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setLists(await getLists());
    });
    return unsubscribe;
  }, [navigation]);

  const active = lists.find(l => l.items.some(i => !i.checked));
  const done = active ? active.items.filter(i => i.checked).length : 0;
  const total = active ? active.items.length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.appbarRow}>
        <View style={{width: 8}} />
        <Text style={styles.appTitle}>Smart Courses</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="history" size={23} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <Text style={styles.greetDate}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          <Text style={styles.greetName}>Bonjour !</Text>
        </View>

        {/* Active list card */}
        {active ? (
          <Card
            style={styles.activeCard}
            onPress={() =>
              navigation.navigate('Shopping', {listId: active.id})
            }>
            <View style={styles.activeCardHeader}>
              <View style={styles.activeIconBox}>
                <Icon name="cart" size={24} color={colors.bg} />
              </View>
              <View style={styles.activeCardInfo}>
                <Text style={styles.activeCardName}>{active.name}</Text>
                <Text style={styles.activeCardSub}>
                  {active.store} · {total} articles
                </Text>
              </View>
              <PillTag>En cours</PillTag>
            </View>
            <View style={styles.activeCardProgress}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                  {done} sur {total} récupérés
                </Text>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
              <Progress value={pct} />
            </View>
            <View style={styles.activeCardBtn}>
              <Btn
                icon="lightning-bolt"
                onPress={() =>
                  navigation.navigate('Shopping', {listId: active.id})
                }>
                Faire les courses
              </Btn>
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyCard} onPress={() => navigation.navigate('CreateList')}>
            <Icon name="cart-plus" size={32} color={colors.text3} />
            <Text style={styles.emptyCardText}>Créer une liste de courses</Text>
          </Card>
        )}

        {/* Quick actions */}
        <SectionLabel label="Actions rapides" />
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(q => (
            <TouchableOpacity
              key={q.label}
              style={styles.qaItem}
              activeOpacity={0.7}
              onPress={() => {
                if (q.screen) {
                  navigation.navigate(q.screen as any);
                }
              }}>
              <View style={styles.qaIcon}>
                <Icon name={q.icon} size={23} color={colors.text} />
              </View>
              <Text style={styles.qaLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent lists */}
        {lists.length > 0 && (
          <>
            <SectionLabel label="Listes récentes" />
            <Card>
              {lists.slice(0, 3).map((l, i) => {
                const d = l.items.filter(it => it.checked).length;
                const t = l.items.length;
                const p = t ? Math.round((d / t) * 100) : 0;
                return (
                  <React.Fragment key={l.id}>
                    {i > 0 && (
                      <View style={styles.divider} />
                    )}
                    <TouchableOpacity
                      style={styles.listRow}
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation.navigate('Shopping', {listId: l.id})
                      }>
                      <View style={styles.listRowInfo}>
                        <Text style={styles.listRowName}>{l.name}</Text>
                        <Text style={styles.listRowSub}>
                          {l.store} · {t} articles
                        </Text>
                      </View>
                      <Text style={styles.listRowPct}>{p}%</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </Card>
          </>
        )}

        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  appbarRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  appTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: spacing.lg, paddingTop: 4},
  greeting: {paddingVertical: spacing.sm},
  greetDate: {fontSize: 14, color: colors.text2, fontWeight: '600'},
  greetName: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.7,
    marginTop: 2,
  },
  activeCard: {padding: spacing.lg, marginTop: spacing.md},
  activeCardHeader: {flexDirection: 'row', alignItems: 'center', gap: 12},
  activeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCardInfo: {flex: 1, minWidth: 0},
  activeCardName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  activeCardSub: {
    fontSize: 13,
    color: colors.text2,
    fontWeight: '600',
    marginTop: 1,
  },
  activeCardProgress: {marginTop: 16},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {fontSize: 12.5, fontWeight: '700', color: colors.text2},
  progressPct: {fontSize: 12.5, fontWeight: '800', color: colors.text},
  activeCardBtn: {marginTop: 16},
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  emptyCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  qaItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  qaIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.cardHi,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  divider: {height: 1, backgroundColor: colors.borderSoft, marginHorizontal: spacing.lg},
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  listRowInfo: {flex: 1},
  listRowName: {fontSize: 15, fontWeight: '700', color: colors.text},
  listRowSub: {fontSize: 12.5, color: colors.text2, fontWeight: '600', marginTop: 2},
  listRowPct: {fontSize: 13, fontWeight: '800', color: colors.text2},
});
