import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {RootStackParamList, GroceryList} from '../types';
import {getLists, saveLists} from '../storage';
import {colors, spacing, radius} from '../theme';
import {AppBar, Btn, Chip} from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STORES = ['Auchan', 'Carrefour', 'Lidl', 'Intermarché', 'Tout magasin'];

export default function CreateListScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [store, setStore] = useState('Tout magasin');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Donne un nom à ta liste.');
      return;
    }
    setLoading(true);
    const list: GroceryList = {
      id: `l_${Date.now()}`,
      name: name.trim(),
      store,
      updatedAt: new Date().toLocaleDateString('fr-FR'),
      items: [],
    };
    const existing = await getLists();
    await saveLists([list, ...existing]);
    setLoading(false);
    navigation.replace('Shopping', {listId: list.id});
  };

  return (
    <View style={styles.container}>
      <AppBar title="Nouvelle liste" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nom de la liste</Text>
        <TextInput
          style={styles.field}
          placeholder="Ex : Courses de la semaine"
          placeholderTextColor={colors.text3}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
        />

        <Text style={styles.label2}>Magasin</Text>
        <View style={styles.chips}>
          {STORES.map(s => (
            <Chip
              key={s}
              on={store === s}
              icon={store === s ? 'check' : 'storefront'}
              onPress={() => setStore(s)}>
              {s}
            </Chip>
          ))}
        </View>

        <View style={styles.btnWrap}>
          <Btn icon="check" onPress={create} loading={loading}>
            Créer la liste
          </Btn>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {padding: spacing.lg, paddingTop: spacing.md},
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 10,
  },
  label2: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginTop: 22,
    marginBottom: 12,
  },
  field: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  btnWrap: {marginTop: 32},
});
