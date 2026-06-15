import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Keyboard,
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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList, GroceryItem} from '../types';
import {getLists, saveLists} from '../storage';
import {Palette, spacing, radius} from '../theme';
import {Progress, SwipeRow, SwipeRowHandle} from '../components';
import {useSettings} from '../context/SettingsContext';

type Route = RouteProp<RootStackParamList, 'Shopping'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ShoppingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const {listId} = route.params;
  const {settings, colors, accent, onAccent, accentSoft, haptic} = useSettings();
  const styles = makeStyles(colors);

  const [list, setList] = useState<GroceryList | null>(null);
  const [allLists, setAllLists] = useState<GroceryList[]>([]);
  const [hidePicked, setHidePicked] = useState(settings.autoHideChecked);
  const [newItem, setNewItem] = useState('');
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [costInput, setCostInput] = useState('');
  const [kbVisible, setKbVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<GroceryItem | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [finishMounted, setFinishMounted] = useState(false);

  const btnScale = useRef(new Animated.Value(1)).current;
  const finishAnim = useRef(new Animated.Value(0)).current;
  const costInputRef = useRef<TextInput>(null);
  const renameInputRef = useRef<TextInput>(null);
  const swipeRefs = useRef<Record<string, SwipeRowHandle | null>>({});

  useEffect(() => {
    (async () => {
      const ls = await getLists();
      setAllLists(ls);
      setList(ls.find(l => l.id === listId) ?? null);
    })();
  }, [listId]);

  const isCompleted = !!list?.completedAt;
  const allDone =
    !!list &&
    !isCompleted &&
    list.items.length > 0 &&
    list.items.every(i => i.checked);

  useEffect(() => {
    if (allDone) {
      // Monte d'abord, puis repart toujours de 0 → le slide-up est garanti
      // même après plusieurs cycles coche/décoche
      setFinishMounted(true);
      finishAnim.setValue(0);
      Animated.spring(finishAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 7,
        speed: 14,
      }).start();
    } else {
      Animated.timing(finishAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setFinishMounted(false);
        }
      });
    }
  }, [allDone, finishAnim]);

  // Focus appelé depuis onShow du Modal : autoFocus et les effets sur
  // visible se déclenchent avant que la fenêtre du modal soit prête sur
  // Android, et le clavier ne s'ouvre pas
  const focusCostInput = () => {
    setTimeout(() => costInputRef.current?.focus(), 100);
  };
  const focusRenameInput = () => {
    setTimeout(() => renameInputRef.current?.focus(), 100);
  };

  useEffect(() => {
    Animated.spring(btnScale, {
      toValue: newItem.trim().length > 0 ? 1.08 : 1,
      useNativeDriver: true,
    }).start();
  }, [btnScale, newItem]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKbVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const persist = async (updated: GroceryList) => {
    const next = allLists.map(l => (l.id === updated.id ? updated : l));
    setAllLists(next);
    setList(updated);
    await saveLists(next);
  };

  const toggle = async (itemId: string) => {
    if (!list) return;
    haptic();
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

  const removeItem = (item: GroceryItem) => {
    if (!list) return;
    const doRemove = () => {
      haptic();
      persist({...list, items: list.items.filter(i => i.id !== item.id)});
    };
    if (!settings.confirmDelete) {
      doRemove();
      return;
    }
    Alert.alert('Supprimer l’article', `Retirer « ${item.name} » de la liste ?`, [
      {text: 'Annuler', style: 'cancel'},
      {text: 'Supprimer', style: 'destructive', onPress: doRemove},
    ]);
  };

  const openRename = (item: GroceryItem) => {
    setRenameInput(item.name);
    setRenameTarget(item);
  };

  const saveRename = async () => {
    const name = renameInput.trim();
    if (!name || !list || !renameTarget) return;
    await persist({
      ...list,
      items: list.items.map(i =>
        i.id === renameTarget.id ? {...i, name} : i,
      ),
    });
    swipeRefs.current[renameTarget.id]?.close();
    setRenameTarget(null);
  };

  const redoList = async () => {
    if (!list) return;
    const copy: GroceryList = {
      id: `l_${Date.now()}`,
      name: list.name,
      updatedAt: new Date().toLocaleDateString('fr-FR'),
      items: list.items.map((i, idx) => ({
        ...i,
        id: `i_${Date.now()}_${idx}`,
        checked: false,
      })),
    };
    const ls = await getLists();
    await saveLists([copy, ...ls]);
    navigation.replace('Shopping', {listId: copy.id});
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
    haptic();
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
  const ordered = settings.sortCheckedBottom
    ? [...list.items.filter(i => !i.checked), ...list.items.filter(i => i.checked)]
    : list.items;
  const visible = hidePicked ? ordered.filter(i => !i.checked) : ordered;
  const hasText = newItem.trim().length > 0;
  const completedDate = list.completedAt
    ? new Date(list.completedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, {paddingTop: insets.top}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
            <Text style={styles.listSub}>
              {isCompleted
                ? `Terminée le ${completedDate}`
                : `${total} article${total > 1 ? 's' : ''}`}
            </Text>
          </View>
          {!isCompleted && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => setHidePicked(h => !h)}>
              <Icon
                name={hidePicked ? 'eye-off' : 'eye'}
                size={22}
                color={hidePicked ? colors.text : colors.text3}
              />
            </TouchableOpacity>
          )}
        </View>
        {isCompleted ? (
          <View style={styles.recapBlock}>
            <View style={styles.recapInfo}>
              <Text style={styles.recapLabel}>Total dépensé</Text>
              <Text style={[styles.recapCost, {color: accent}]}>
                {list.totalCost != null
                  ? `${list.totalCost.toFixed(2).replace('.', ',')} €`
                  : '—'}
              </Text>
            </View>
            <View style={[styles.recapBadge, {backgroundColor: accentSoft, borderColor: 'transparent'}]}>
              <Icon name="check-circle" size={18} color={accent} />
              <Text style={[styles.recapBadgeText, {color: accent}]}>Terminée</Text>
            </View>
          </View>
        ) : (
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressCount}>
                {done}<Text style={styles.progressTotal}> / {total}</Text>
              </Text>
              <Text style={styles.progressPct}>{pct}% récupérés</Text>
            </View>
            <Progress value={pct} />
          </View>
        )}
      </View>

      {/* Liste des articles — View simple, adjustResize gère le clavier */}
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {visible.map(item => (
            <SwipeRow
              key={item.id}
              ref={r => {
                swipeRefs.current[item.id] = r;
              }}
              style={styles.itemSwipe}
              enabled={!isCompleted}
              onPress={isCompleted ? undefined : () => toggle(item.id)}
              actions={[
                {
                  icon: 'pencil-outline',
                  label: 'Renommer',
                  color: colors.cardHi,
                  onPress: () => openRename(item),
                },
                {
                  icon: 'trash-can-outline',
                  label: 'Supprimer',
                  color: '#CC2200',
                  onPress: () => removeItem(item),
                },
              ]}>
              <View style={[styles.itemRow, item.checked && styles.itemRowDone]}>
                <View
                  style={[
                    styles.checkbox,
                    item.checked && {backgroundColor: accent, borderColor: accent},
                  ]}>
                  {item.checked && <Icon name="check" size={18} color={onAccent} />}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.checked && styles.itemNameDone]}>
                    {item.name}
                  </Text>
                  {item.note && <Text style={styles.itemNote}>{item.note}</Text>}
                </View>
              </View>
            </SwipeRow>
          ))}
        </ScrollView>
      </View>

      {/* Barre Terminer animée (apparaît quand toute la liste est cochée) */}
      {finishMounted && (
        <Animated.View
          style={[
            styles.finishBar,
            {
              opacity: finishAnim,
              transform: [
                {
                  translateY: finishAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [70, 0],
                  }),
                },
              ],
            },
          ]}>
          <TouchableOpacity
            style={[styles.finishBtn, {backgroundColor: accent}]}
            activeOpacity={0.85}
            onPress={() => {
              haptic();
              setCostModalVisible(true);
            }}>
            <Icon name="check" size={20} color={onAccent} />
            <Text style={[styles.finishBtnText, {color: onAccent}]}>Terminer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bas d'écran : refaire (terminée) ou barre d'ajout (en cours) */}
      {isCompleted ? (
        <View style={[styles.redoWrap, {paddingBottom: insets.bottom + 12}]}>
          <TouchableOpacity
            style={[styles.redoBtn, {backgroundColor: accent}]}
            activeOpacity={0.85}
            onPress={redoList}>
            <Icon name="refresh" size={20} color={onAccent} />
            <Text style={[styles.redoBtnText, {color: onAccent}]}>
              Refaire cette liste
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.addBar, {paddingBottom: kbVisible ? 4 : insets.bottom + 8}]}>
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
              style={[
                styles.addBtn,
                hasText && {backgroundColor: accent, borderColor: accent},
              ]}
              onPress={addItem}
              activeOpacity={0.8}>
              <Icon name="plus" size={22} color={hasText ? onAccent : colors.text3} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Modal saisie coût */}
      <Modal
        visible={costModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onShow={focusCostInput}
        onRequestClose={() => { setCostModalVisible(false); setCostInput(''); }}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Courses terminées !</Text>
            <Text style={styles.modalSub}>Combien avez-vous dépensé ?</Text>
            <View style={styles.costRow}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                ref={costInputRef}
                style={styles.costInput}
                placeholder="0.00"
                placeholderTextColor={colors.text3}
                value={costInput}
                onChangeText={setCostInput}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => { setCostModalVisible(false); setCostInput(''); }}>
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={finishShopping}>
                <Text style={styles.modalBtnPrimaryText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal renommage d'article */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onShow={focusRenameInput}
        onRequestClose={() => setRenameTarget(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Renommer l’article</Text>
            <TextInput
              ref={renameInputRef}
              style={styles.renameInput}
              placeholder="Nom de l’article"
              placeholderTextColor={colors.text3}
              value={renameInput}
              onChangeText={setRenameInput}
              onSubmitEditing={saveRename}
              returnKeyType="done"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setRenameTarget(null)}>
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={saveRename}>
                <Text style={styles.modalBtnPrimaryText}>Renommer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
  recapBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  recapInfo: {flex: 1},
  recapLabel: {fontSize: 12.5, fontWeight: '700', color: colors.text2},
  recapCost: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 40,
  },
  recapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardHi,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recapBadgeText: {fontSize: 13, fontWeight: '800', color: colors.text},
  redoWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  redoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 14,
    paddingVertical: 15,
  },
  redoBtnText: {fontSize: 15, fontWeight: '800', color: colors.bg},
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressCount: {fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -1, lineHeight: 38},
  progressTotal: {fontSize: 18, color: colors.text3, fontWeight: '700'},
  progressPct: {fontSize: 13, fontWeight: '800', color: colors.text2},
  body: {flex: 1},
  scroll: {flex: 1},
  scrollContent: {padding: spacing.md, paddingBottom: 16},
  itemSwipe: {marginBottom: spacing.sm},
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
  },
  itemRowDone: {backgroundColor: colors.surface, borderColor: colors.surface},
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
  finishBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 14,
    paddingVertical: 16,
  },
  finishBtnText: {fontSize: 16, fontWeight: '800', color: colors.bg},
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 13,
    fontSize: 16,
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
    // Centré verticalement : le KeyboardAvoidingView réduit la hauteur quand le
    // clavier s'ouvre, donc la fenêtre remonte au-dessus du clavier et revient
    // au centre dès qu'il se ferme.
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center'},
  modalSub: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
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
  renameInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 20,
  },
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
