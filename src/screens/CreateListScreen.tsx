import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, GroceryList} from '../types';
import {getLists, saveLists} from '../storage';
import {colors, spacing, radius} from '../theme';
import {AppBar, Btn} from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CreateListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
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
      updatedAt: new Date().toLocaleDateString('fr-FR'),
      items: [],
    };
    const existing = await getLists();
    await saveLists([list, ...existing]);
    setLoading(false);
    navigation.replace('Shopping', {listId: list.id});
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {paddingTop: insets.top}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <AppBar title="Nouvelle liste" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Nom de la liste</Text>
        <TextInput
          style={styles.field}
          placeholder="Ex : Courses de la semaine"
          placeholderTextColor={colors.text3}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={create}
        />

        <View style={styles.btnWrap}>
          <Btn icon="check" onPress={create} loading={loading}>
            Créer la liste
          </Btn>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {padding: spacing.lg, paddingTop: spacing.md},
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 10,
  },
  field: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  btnWrap: {marginTop: 36},
});
