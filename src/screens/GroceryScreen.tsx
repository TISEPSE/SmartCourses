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
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, GroceryList} from '../types';
import {getLists} from '../storage';
import {colors, spacing, radius} from '../theme';
import {AppBar, LargeHead, Card, Progress, Fab, Chip} from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [lists, setLists] = useState<GroceryList[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setLists(await getLists());
    });
    return unsubscribe;
  }, [navigation]);

  const inProgress = lists.filter(l => l.items.some(i => !i.checked)).length;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Courses" />
      <LargeHead
        title="Mes listes"
        sub={`${lists.length} liste${lists.length > 1 ? 's' : ''} · ${inProgress} en cours`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {lists.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune liste pour l'instant</Text>
            <Text style={styles.emptyHint}>
              Appuie sur + pour créer ta première liste
            </Text>
          </View>
        ) : (
          lists.map(l => {
            const done = l.items.filter(i => i.checked).length;
            const total = l.items.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <Card
                key={l.id}
                style={styles.listCard}
                onPress={() =>
                  navigation.navigate('Shopping', {listId: l.id})
                }>
                <View style={styles.listHeader}>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{l.name}</Text>
                    <Text style={styles.listSub}>
                      {l.store} · {l.updatedAt}
                    </Text>
                  </View>
                  {pct > 0 && pct < 100 && <Text style={styles.pctBadge}>{pct}%</Text>}
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressBar}>
                    <Progress value={pct} />
                  </View>
                  <Text style={styles.progressCount}>
                    {done}/{total}
                  </Text>
                </View>
              </Card>
            );
          })
        )}
        <View style={{height: 80}} />
      </ScrollView>
      <Fab icon="plus" label="Nouvelle liste" onPress={() => navigation.navigate('CreateList')} />
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
  listCard: {padding: spacing.lg, marginBottom: spacing.md},
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  listInfo: {flex: 1, minWidth: 0},
  listName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  listSub: {
    fontSize: 13,
    color: colors.text2,
    fontWeight: '600',
    marginTop: 2,
  },
  pctBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text2,
    backgroundColor: colors.cardHi,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  progressBar: {flex: 1},
  progressCount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text2,
    flexShrink: 0,
  },
});
