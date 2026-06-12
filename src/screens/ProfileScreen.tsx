import React, {useEffect, useRef, useState} from 'react';
import {
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, GroceryList} from '../types';
import {getLists} from '../storage';
import {colors, spacing, radius} from '../theme';
import {AppBar, Card, Row, SectionLabel, Divider} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {settings, setSetting, accent, onAccent, haptic} = useSettings();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setLists(await getLists());
    });
    return unsubscribe;
  }, [navigation]);

  const completed = lists.filter(l => l.completedAt);
  const totalSpent = completed.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);
  const totalItems = completed.reduce((sum, l) => sum + l.items.length, 0);

  const initials = settings.userName
    ? settings.userName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SC';

  const openNameModal = () => {
    setNameInput(settings.userName);
    setNameModalVisible(true);
  };

  const saveName = () => {
    setSetting('userName', nameInput.trim());
    setNameModalVisible(false);
    haptic();
  };

  const focusNameInput = () => {
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Profil" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* En-tête profil */}
        <Card style={styles.profileCard} onPress={openNameModal}>
          <View style={[styles.avatar, {backgroundColor: accent}]}>
            <Text style={[styles.avatarText, {color: onAccent}]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {settings.userName || 'Ajouter un prénom'}
            </Text>
            <Text style={styles.profileEmail}>Appuie pour modifier</Text>
          </View>
          <Icon name="pencil-outline" size={20} color={colors.text3} />
        </Card>

        {/* Statistiques */}
        <SectionLabel label="Statistiques" />
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{completed.length}</Text>
            <Text style={styles.statLabel}>
              Liste{completed.length > 1 ? 's' : ''} terminée{completed.length > 1 ? 's' : ''}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalSpent.toFixed(0)} €
            </Text>
            <Text style={styles.statLabel}>Total dépensé</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>
              Article{totalItems > 1 ? 's' : ''} acheté{totalItems > 1 ? 's' : ''}
            </Text>
          </Card>
        </View>

        {/* Raccourcis */}
        <SectionLabel label="Application" />
        <Card>
          <Row
            icon="cog"
            title="Paramètres"
            subtitle="Thème, haptique, données"
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <Row
            icon="history"
            title="Historique"
            subtitle="Courses terminées"
            onPress={() => navigation.navigate('History')}
          />
          <Divider />
          <Row
            icon="tune"
            title="Préférences"
            subtitle="Régime, budget"
            onPress={() => navigation.navigate('Preferences')}
          />
        </Card>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modal prénom */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onShow={focusNameInput}
        onRequestClose={() => setNameModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ton prénom</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.nameInput}
              placeholder="Prénom"
              placeholderTextColor={colors.text3}
              value={nameInput}
              onChangeText={setNameInput}
              onSubmitEditing={saveName}
              returnKeyType="done"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setNameModalVisible(false)}>
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, {backgroundColor: accent}]}
                onPress={saveName}>
                <Text style={[styles.modalBtnPrimaryText, {color: onAccent}]}>
                  Enregistrer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {paddingHorizontal: spacing.lg},
  profileCard: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 18, fontWeight: '800'},
  profileInfo: {flex: 1},
  profileName: {fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3},
  profileEmail: {fontSize: 13.5, color: colors.text2, fontWeight: '600', marginTop: 2},
  statsRow: {flexDirection: 'row', gap: 10},
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text2,
    textAlign: 'center',
  },
  bottomSpace: {height: 32},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  modalBox: {
    width: 320,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center'},
  nameInput: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {fontSize: 15, fontWeight: '700'},
});
