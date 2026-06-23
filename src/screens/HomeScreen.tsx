import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, TabParamList} from '../types';
import {getLists} from '../storage';
import {GroceryList} from '../types';
import {Palette, spacing, radius} from '../theme';
import {Card, Progress, PillTag, SectionLabel, Btn, Touchable} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type QuickAction = {
  icon: string;
  label: string;
  screen?: keyof RootStackParamList;
  tab?: keyof TabParamList;
  params?: {favorites?: boolean};
};

const QUICK_ACTIONS: QuickAction[] = [
  {icon: 'heart', label: 'Favoris', tab: 'Recipes', params: {favorites: true}},
  {icon: 'book-open-variant', label: 'Recettes', tab: 'Recipes'},
  {icon: 'history', label: 'Historique', screen: 'History'},
];

export default function HomeScreen() {
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

  const active = lists.find(l => l.items.some(i => !i.checked));
  const done = active ? active.items.filter(i => i.checked).length : 0;
  const total = active ? active.items.length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.appbarRow}>
        <View style={{width: 8}} />
        <Text style={styles.appTitle}>Smart Courses</Text>
        <Touchable
          style={styles.iconBtn}
          borderless
          scaleTo={1}
          onPress={() => navigation.navigate('History')}>
          <Icon name="history" size={23} color={colors.text} />
        </Touchable>
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
          <Text style={styles.greetName}>
            {settings.userName ? `Bonjour ${settings.userName} !` : 'Bonjour !'}
          </Text>
        </View>

        {/* Active list card */}
        {active ? (
          <Card
            style={styles.activeCard}
            onPress={() =>
              navigation.navigate('Shopping', {listId: active.id})
            }>
            <View style={styles.activeCardHeader}>
              <View style={[styles.activeIconBox, {backgroundColor: accent}]}>
                <Icon name="cart" size={24} color={onAccent} />
              </View>
              <View style={styles.activeCardInfo}>
                <Text style={styles.activeCardName}>{active.name}</Text>
                <Text style={styles.activeCardSub}>
                  {total} article{total > 1 ? 's' : ''}
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
            <Icon name="cart-plus" size={32} color={colors.text} />
            <Text style={styles.emptyCardText}>Créer une liste de courses</Text>
          </Card>
        )}

        {/* Quick actions */}
        <SectionLabel label="Actions rapides" />
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(q => (
            <Touchable
              key={q.label}
              style={styles.qaItem}
              onPress={() => {
                if (q.screen) {
                  navigation.navigate(q.screen as any);
                } else if (q.tab) {
                  // L'onglet appartient au Tab.Navigator parent : navigate
                  // remonte jusqu'à lui pour changer d'onglet (avec params
                  // éventuels, ex. filtre favoris)
                  navigation.navigate(q.tab as any, q.params);
                }
              }}>
              <View style={styles.qaIcon}>
                <Icon name={q.icon} size={23} color={colors.text} />
              </View>
              <Text style={styles.qaLabel}>{q.label}</Text>
            </Touchable>
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
                    <Touchable
                      style={styles.listRow}
                      scaleTo={1}
                      onPress={() =>
                        navigation.navigate('Shopping', {listId: l.id})
                      }>
                      <View style={styles.listRowInfo}>
                        <Text style={styles.listRowName}>{l.name}</Text>
                        <Text style={styles.listRowSub}>
                          {t} article{t > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Text style={styles.listRowPct}>{p}%</Text>
                    </Touchable>
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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
    padding: 12,
    alignItems: 'center',
    gap: 8,
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
