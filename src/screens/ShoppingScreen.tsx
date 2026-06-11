import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList, GroceryItem} from '../types';
import {getLists, saveLists} from '../storage';
import {colors, spacing, radius} from '../theme';
import {Progress} from '../components';

type Route = RouteProp<RootStackParamList, 'Shopping'>;

export default function ShoppingScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const {listId} = route.params;

  const [list, setList] = useState<GroceryList | null>(null);
  const [allLists, setAllLists] = useState<GroceryList[]>([]);
  const [hidePicked, setHidePicked] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    (async () => {
      const ls = await getLists();
      setAllLists(ls);
      setList(ls.find(l => l.id === listId) ?? null);
    })();
  }, [listId]);

  const persist = async (updated: GroceryList) => {
    const next = allLists.map(l => (l.id === updated.id ? updated : l));
    setAllLists(next);
    setList(updated);
    await saveLists(next);
  };

  const toggle = async (itemId: string) => {
    if (!list) return;
    const updated = {
      ...list,
      items: list.items.map(i =>
        i.id === itemId ? {...i, checked: !i.checked} : i,
      ),
    };
    await persist(updated);
  };

  const addItem = async () => {
    const name = newItem.trim();
    if (!name || !list) return;
    const item: GroceryItem = {
      id: `i_${Date.now()}`,
      name,
      category: 'autre',
      checked: false,
    };
    await persist({...list, items: [item, ...list.items]});
    setNewItem('');
  };

  if (!list) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Liste introuvable</Text>
      </View>
    );
  }

  const done = list.items.filter(i => i.checked).length;
  const total = list.items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const visible = hidePicked ? list.items.filter(i => !i.checked) : list.items;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.appbar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.listName} numberOfLines={1}>
              {list.name}
            </Text>
            <Text style={styles.listSub}>
              {list.store} · {total} articles
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setHidePicked(h => !h)}>
            <Icon
              name={hidePicked ? 'eye-off' : 'eye'}
              size={22}
              color={hidePicked ? colors.text : colors.text3}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <Text style={styles.progressCount}>
              {done}
              <Text style={styles.progressTotal}> / {total}</Text>
            </Text>
            <Text style={styles.progressPct}>{pct}% récupérés</Text>
          </View>
          <Progress value={pct} />
        </View>
      </View>

      {/* Items */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Inline add */}
        <View style={styles.addRow}>
          <Icon name="plus" size={24} color={colors.text3} />
          <TextInput
            style={styles.addInput}
            placeholder="Ajouter un article…"
            placeholderTextColor={colors.text3}
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          {newItem.trim().length > 0 && (
            <TouchableOpacity style={styles.addBtn} onPress={addItem}>
              <Text style={styles.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          )}
        </View>

        {visible.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemRow, item.checked && styles.itemRowDone]}
            activeOpacity={0.7}
            onPress={() => toggle(item.id)}>
            <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>
              {item.checked && (
                <Icon name="check" size={18} color={colors.bg} />
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemName,
                  item.checked && styles.itemNameDone,
                ]}>
                {item.name}
              </Text>
              {item.note && (
                <Text style={styles.itemNote}>{item.note}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  notFound: {
    color: colors.text2,
    textAlign: 'center',
    marginTop: 80,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {flex: 1, marginHorizontal: spacing.sm},
  listName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  listSub: {fontSize: 12.5, color: colors.text2, fontWeight: '600'},
  progressBlock: {paddingHorizontal: spacing.sm, paddingTop: spacing.sm},
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressCount: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 38,
  },
  progressTotal: {fontSize: 18, color: colors.text3, fontWeight: '700'},
  progressPct: {fontSize: 13, fontWeight: '800', color: colors.text2},
  scroll: {flex: 1},
  scrollContent: {padding: spacing.md},
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  addInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  addBtnText: {fontSize: 14, fontWeight: '700', color: colors.bg},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  itemRowDone: {
    backgroundColor: colors.surface,
    borderColor: 'transparent',
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  itemInfo: {flex: 1},
  itemName: {fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3},
  itemNameDone: {
    textDecorationLine: 'line-through',
    color: colors.text3,
  },
  itemNote: {fontSize: 12.5, color: colors.text3, fontWeight: '600', marginTop: 2},
});
