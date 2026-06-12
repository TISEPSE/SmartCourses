import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {PantryItem} from '../types';
import {getPantry, savePantry} from '../storage';
import {colors, spacing, radius} from '../theme';
import {AppBar, LargeHead, Card, Divider} from '../components';

export default function PantryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [adding, setAdding] = useState('');

  useEffect(() => {
    (async () => setItems(await getPantry()))();
  }, []);

  const add = async () => {
    const name = adding.trim();
    if (!name) return;
    const item: PantryItem = {
      id: `p_${Date.now()}`,
      name,
      qty: 'En stock',
      category: 'autre',
    };
    const next = [item, ...items];
    setItems(next);
    setAdding('');
    await savePantry(next);
  };

  const remove = async (id: string) => {
    const next = items.filter(i => i.id !== id);
    setItems(next);
    await savePantry(next);
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Garde-manger" onBack={() => navigation.goBack()} />
      <LargeHead
        title="Mon garde-manger"
        sub={`${items.length} article${items.length > 1 ? 's' : ''}`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}
        keyboardShouldPersistTaps="handled">
        {/* Add bar */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Ajouter un article…"
            placeholderTextColor={colors.text3}
            value={adding}
            onChangeText={setAdding}
            onSubmitEditing={add}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={add}>
            <Icon name="plus" size={22} color={colors.bg} />
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="fridge-outline" size={48} color={colors.text3} />
            <Text style={styles.emptyText}>Garde-manger vide</Text>
          </View>
        ) : (
          <Card style={{overflow: 'hidden'}}>
            {items.map((item, i) => (
              <React.Fragment key={item.id}>
                {i > 0 && <Divider />}
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQty}>{item.qty}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => remove(item.id)}>
                    <Icon name="close" size={20} color={colors.text3} />
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </Card>
        )}
        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {padding: spacing.lg},
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {fontSize: 15, fontWeight: '700', color: colors.text2},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  itemInfo: {flex: 1},
  itemName: {fontSize: 15, fontWeight: '700', color: colors.text},
  itemQty: {fontSize: 12.5, color: colors.text2, fontWeight: '600', marginTop: 2},
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
