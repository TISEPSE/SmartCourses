import React, {useEffect, useState} from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, GroceryList} from '../types';
import {getLists, deleteList} from '../storage';
import {colors, spacing, radius} from '../theme';
import {AppBar, LargeHead, Progress, Fab, SwipeRow} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SwipeableCardProps {
  list: GroceryList;
  onPress: () => void;
  onDelete: () => void;
  deletable: boolean;
}

function SwipeableCard({list, onPress, onDelete, deletable}: SwipeableCardProps) {
  const done = list.items.filter(i => i.checked).length;
  const total = list.items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isCompleted = !!list.completedAt;
  const completedSub = isCompleted
    ? `Terminée le ${new Date(list.completedAt!).toLocaleDateString('fr-FR')}` +
      (list.totalCost != null
        ? ` · ${list.totalCost.toFixed(2).replace('.', ',')} €`
        : '')
    : null;

  return (
    <SwipeRow
      style={styles.swipeWrapper}
      cardStyle={styles.listCard}
      enabled={deletable}
      onPress={onPress}
      actions={[
        {
          icon: 'trash-can-outline',
          label: 'Supprimer',
          color: '#CC2200',
          onPress: onDelete,
        },
      ]}>
      <View style={styles.listCardInner}>
        <View style={styles.listHeader}>
          <View style={styles.listInfo}>
            <Text style={styles.listName}>{list.name}</Text>
            <Text style={styles.listSub}>
              {isCompleted ? completedSub : list.updatedAt}
            </Text>
          </View>
          {!isCompleted && pct > 0 && pct < 100 && (
            <Text style={styles.pctBadge}>{pct}%</Text>
          )}
        </View>
        {!isCompleted && (
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <Progress value={pct} />
            </View>
            <Text style={styles.progressCount}>{done}/{total}</Text>
          </View>
        )}
      </View>
    </SwipeRow>
  );
}

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {settings, haptic} = useSettings();
  const [lists, setLists] = useState<GroceryList[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setLists(await getLists());
    });
    return unsubscribe;
  }, [navigation]);

  const activeLists = lists.filter(l => !l.completedAt);
  const completedLists = lists.filter(l => !!l.completedAt);

  const handleDelete = (l: GroceryList) => {
    const doDelete = async () => {
      haptic();
      await deleteList(l.id);
      setLists(prev => prev.filter(item => item.id !== l.id));
    };
    if (!settings.confirmDelete) {
      doDelete();
      return;
    }
    Alert.alert(
      'Supprimer la liste',
      `Supprimer "${l.name}" ? Cette action est irréversible.`,
      [
        {text: 'Annuler', style: 'cancel'},
        {text: 'Supprimer', style: 'destructive', onPress: doDelete},
      ],
    );
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Courses" />
      <LargeHead
        title="Mes listes"
        sub={`${activeLists.length} en cours · ${completedLists.length} terminée${completedLists.length > 1 ? 's' : ''}`}
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
          <>
            {activeLists.map(l => (
              <SwipeableCard
                key={l.id}
                list={l}
                deletable={false}
                onPress={() => navigation.navigate('Shopping', {listId: l.id})}
                onDelete={() => handleDelete(l)}
              />
            ))}

            {completedLists.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Terminées</Text>
                {completedLists.map(l => (
                  <SwipeableCard
                    key={l.id}
                    list={l}
                    deletable
                    onPress={() => navigation.navigate('Shopping', {listId: l.id})}
                    onDelete={() => handleDelete(l)}
                  />
                ))}
              </>
            )}
          </>
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
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  swipeWrapper: {
    marginBottom: spacing.md,
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listCardInner: {
    padding: spacing.lg,
  },
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
