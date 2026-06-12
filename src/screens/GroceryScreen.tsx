import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList} from '../types';
import {getLists, deleteList} from '../storage';
import {colors, spacing, radius} from '../theme';
import {AppBar, LargeHead, Progress, Fab} from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ACTION_WIDTH = 88;

interface SwipeableCardProps {
  list: GroceryList;
  onPress: () => void;
  onDelete: () => void;
}

function SwipeableCard({list, onPress, onDelete}: SwipeableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderMove: (_, gs) => {
        const base = isOpen.current ? -ACTION_WIDTH : 0;
        const next = Math.min(0, Math.max(-ACTION_WIDTH, base + gs.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        const openThreshold = isOpen.current ? -20 : -50;
        if (gs.dx < openThreshold) {
          isOpen.current = true;
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        } else {
          isOpen.current = false;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  const close = useCallback(() => {
    isOpen.current = false;
    Animated.spring(translateX, {toValue: 0, useNativeDriver: true}).start();
  }, [translateX]);

  const done = list.items.filter(i => i.checked).length;
  const total = list.items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <View style={styles.swipeWrapper}>
      {/* Action derrière la carte */}
      <View style={[styles.deleteAction, {width: ACTION_WIDTH}]}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            close();
            onDelete();
          }}>
          <Icon name="trash-can-outline" size={22} color={colors.text} />
          <Text style={styles.deleteBtnLabel}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      {/* Carte swipeable */}
      <Animated.View
        style={[styles.listCard, {transform: [{translateX}]}]}
        {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.listCardInner}
          onPress={() => {
            if (isOpen.current) {
              close();
            } else {
              onPress();
            }
          }}
          activeOpacity={0.7}>
          <View style={styles.listHeader}>
            <View style={styles.listInfo}>
              <Text style={styles.listName}>{list.name}</Text>
              <Text style={styles.listSub}>
                {list.store} · {list.updatedAt}
              </Text>
            </View>
            {pct > 0 && pct < 100 && (
              <Text style={styles.pctBadge}>{pct}%</Text>
            )}
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <Progress value={pct} />
            </View>
            <Text style={styles.progressCount}>{done}/{total}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

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

  const handleDelete = (l: GroceryList) => {
    Alert.alert(
      'Supprimer la liste',
      `Supprimer "${l.name}" ? Cette action est irréversible.`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteList(l.id);
            setLists(prev => prev.filter(item => item.id !== l.id));
          },
        },
      ],
    );
  };

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
          lists.map(l => (
            <SwipeableCard
              key={l.id}
              list={l}
              onPress={() => navigation.navigate('Shopping', {listId: l.id})}
              onDelete={() => handleDelete(l)}
            />
          ))
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
  swipeWrapper: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#CC2200',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  deleteBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
