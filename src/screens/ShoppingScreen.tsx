import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList, GroceryItem} from '../types';
import {getLists, saveLists} from '../storage';
import {colors, spacing, radius} from '../theme';
import {Progress} from '../components';

type Route = RouteProp<RootStackParamList, 'Shopping'>;

export default function ShoppingScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const {listId} = route.params;

  const [list, setList] = useState<GroceryList | null>(null);
  const [allLists, setAllLists] = useState<GroceryList[]>([]);
  const [hidePicked, setHidePicked] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [costInput, setCostInput] = useState('');

  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const ls = await getLists();
      setAllLists(ls);
      setList(ls.find(l => l.id === listId) ?? null);
    })();
  }, [listId]);

  useEffect(() => {
    Animated.spring(btnScale, {
      toValue: newItem.trim().length > 0 ? 1.08 : 1,
      useNativeDriver: true,
    }).start();
  }, [newItem]);

  const persist = async (updated: GroceryList) => {
    const next = allLists.map(l => (l.id === updated.id ? updated : l));
    setAllLists(next);
    setList(updated);
    await saveLists(next);
  };

  const toggle = async (itemId: string) => {
    if (!list) return;
    await persist({
      ...list,
      items: list.items.map(i =>
        i.id === itemId ? {...i, checked: !i.checked} : i,
      ),
    });
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

  const finishShopping = async () => {
    if (!list) return;
    const cost = parseFloat(costInput.replace(',', '.'));
    const updated: GroceryList = {
      ...list,
      completedAt: new Date().toISOString(),
      totalCost: isNaN(cost) ? undefined : cost,
    };
    await persist(updated);
    setCostModalVisible(false);
    navigation.goBack();
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
  const hasChecked = done > 0;
  const hasText = newItem.trim().length > 0;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
            <Text style={styles.listSub}>{list.store} · {total} articles</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setHidePicked(h => !h)}>
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
              {done}<Text style={styles.progressTotal}> / {total}</Text>
            </Text>
            <Text style={styles.progressPct}>{pct}% récupérés</Text>
          </View>
          <Progress value={pct} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: 80 + insets.bottom},
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {visible.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, item.checked && styles.itemRowDone]}
              activeOpacity={0.7}
              onPress={() => toggle(item.id)}>
              <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>
                {item.checked && <Icon name="check" size={18} color={colors.bg} />}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.checked && styles.itemNameDone]}>
                  {item.name}
                </Text>
                {item.note && <Text style={styles.itemNote}>{item.note}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {hasChecked && (
          <TouchableOpacity
            style={[styles.finishBtn, {bottom: 72 + insets.bottom}]}
            activeOpacity={0.85}
            onPress={() => setCostModalVisible(true)}>
            <Icon name="check-circle-outline" size={20} color={colors.bg} />
            <Text style={styles.finishBtnText}>Terminer les courses</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.addBar, {paddingBottom: insets.bottom + 8}]}>
          <TextInput
            style={styles.addInput}
            placeholder="Ajouter un article…"
            placeholderTextColor={colors.text3}
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <Animated.View style={{transform: [{scale: btnScale}]}}>
            <TouchableOpacity
              style={[styles.addBtn, hasText && styles.addBtnActive]}
              onPress={addItem}
              activeOpacity={0.8}>
              <Icon name="plus" size={22} color={hasText ? colors.bg : colors.text3} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={costModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCostModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Courses terminées !</Text>
            <Text style={styles.modalSub}>Combien avez-vous dépensé ?</Text>
            <View style={styles.costRow}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.costInput}
                placeholder="0.00"
                placeholderTextColor={colors.text3}
                value={costInput}
                onChangeText={setCostInput}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setCostModalVisible(false)}>
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={finishShopping}>
                <Text style={styles.modalBtnPrimaryText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  notFound: {color: colors.text2, textAlign: 'center', marginTop: 80, fontSize: 16},
  header: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appbar: {height: 52, flexDirection: 'row', alignItems: 'center'},
  iconBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  titleBlock: {flex: 1, marginHorizontal: spacing.sm},
  listName: {fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3},
  listSub: {fontSize: 12.5, color: colors.text2, fontWeight: '600'},
  progressBlock: {paddingHorizontal: spacing.sm, paddingTop: spacing.sm},
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressCount: {fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -1, lineHeight: 38},
  progressTotal: {fontSize: 18, color: colors.text3, fontWeight: '700'},
  progressPct: {fontSize: 13, fontWeight: '800', color: colors.text2},
  kav: {flex: 1},
  scroll: {flex: 1},
  scrollContent: {padding: spacing.md},
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
  itemRowDone: {backgroundColor: colors.surface, borderColor: 'transparent'},
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {backgroundColor: colors.text, borderColor: colors.text},
  itemInfo: {flex: 1},
  itemName: {fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3},
  itemNameDone: {textDecorationLine: 'line-through', color: colors.text3},
  itemNote: {fontSize: 12.5, color: colors.text3, fontWeight: '600', marginTop: 2},
  finishBtn: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 4,
  },
  finishBtnText: {fontSize: 15, fontWeight: '800', color: colors.text},
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnActive: {backgroundColor: colors.text, borderColor: colors.text},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: 300,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center'},
  modalSub: {fontSize: 14, color: colors.text2, fontWeight: '600', textAlign: 'center', marginTop: 6, marginBottom: 20},
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  currencySymbol: {fontSize: 22, fontWeight: '800', color: colors.text2, marginRight: 8},
  costInput: {flex: 1, fontSize: 28, fontWeight: '800', color: colors.text, paddingVertical: 12},
  modalBtns: {flexDirection: 'row', gap: 10},
  modalBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: {fontSize: 15, fontWeight: '700', color: colors.text2},
  modalBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {fontSize: 15, fontWeight: '700', color: colors.bg},
});
