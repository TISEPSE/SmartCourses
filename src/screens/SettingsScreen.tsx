import React, {useState} from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList} from '../types';
import {clearHistory, resetAllData} from '../storage';
import {AI_DEFAULTS} from '../config/defaults';
import {Palette, spacing, radius} from '../theme';
import {
  AppBar,
  AppSwitch,
  Card,
  Divider,
  SectionLabel,
  Row,
  Select,
  SelectOption,
  ThemePicker,
} from '../components';
import {useSettings} from '../context/SettingsContext';

// Modèles proposés dans le menu déroulant. Adaptés à un petit VPS sans GPU.
// L'option « Personnalisé » permet de saisir n'importe quel nom de modèle.
const CUSTOM_MODEL = '__custom__';
const MODEL_OPTIONS: SelectOption[] = [
  {label: 'gemma3:4b', value: 'gemma3:4b', sub: 'Recommandé · équilibré'},
  {label: 'gemma3:1b', value: 'gemma3:1b', sub: 'Plus léger et rapide'},
  {label: 'qwen2.5:3b', value: 'qwen2.5:3b', sub: 'Bon en discussion'},
  {label: 'llama3.2:3b', value: 'llama3.2:3b', sub: 'Polyvalent'},
  {label: 'phi3:mini', value: 'phi3:mini', sub: 'Compact'},
  {label: 'mistral:7b', value: 'mistral:7b', sub: 'Plus lourd, plus précis'},
  {label: 'Personnalisé…', value: CUSTOM_MODEL, sub: 'Saisir un autre modèle'},
];

interface FieldRowProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'url';
  onReset?: () => void;
}

function FieldRow({label, value, placeholder, onChange, secure, keyboardType, onReset}: FieldRowProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputRow}>
        <TextInput
          style={[styles.fieldInput, onReset && {flex: 1}]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          onChangeText={onChange}
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType === 'url' ? 'url' : 'default'}
        />
        {onReset && (
          <TouchableOpacity style={styles.resetBtn} onPress={onReset} activeOpacity={0.7}>
            <Icon name="restore" size={20} color={colors.text2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ToggleRowProps {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({label, sub, value, onChange}: ToggleRowProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub && <Text style={styles.toggleSub}>{sub}</Text>}
      </View>
      <AppSwitch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {settings, setSetting, colors, haptic} = useSettings();
  const styles = makeStyles(colors);

  // Mode « modèle personnalisé » : actif si le modèle courant n'est pas dans la
  // liste, ou si l'utilisateur choisit explicitement « Personnalisé… ».
  const isKnownModel = MODEL_OPTIONS.some(
    o => o.value !== CUSTOM_MODEL && o.value === settings.aiModel,
  );
  const [customModel, setCustomModel] = useState(!isKnownModel);

  const confirmClearHistory = () => {
    Alert.alert(
      'Effacer l’historique',
      'Toutes les listes terminées seront supprimées. Cette action est irréversible.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            haptic();
          },
        },
      ],
    );
  };

  const confirmReset = () => {
    Alert.alert(
      'Tout réinitialiser',
      'Toutes les données de l’application seront effacées (listes, historique). Cette action est irréversible.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            haptic();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Paramètres" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        <SectionLabel label="Thème de couleur" />
        <ThemePicker />

        <SectionLabel label="Application" />
        <Card>
          <ToggleRow
            label="Retour haptique"
            sub="Vibration légère sur les actions"
            value={settings.haptics}
            onChange={v => setSetting('haptics', v)}
          />
          <Divider />
          <ToggleRow
            label="Rappels de courses"
            sub="Notifications (bientôt disponible)"
            value={settings.notifications}
            onChange={v => setSetting('notifications', v)}
          />
        </Card>

        <SectionLabel label="Listes de courses" />
        <Card>
          <ToggleRow
            label="Masquer les articles cochés"
            sub="Cache automatiquement les articles récupérés"
            value={settings.autoHideChecked}
            onChange={v => setSetting('autoHideChecked', v)}
          />
          <Divider />
          <ToggleRow
            label="Cochés en bas de liste"
            sub="Déplace les articles récupérés en bas"
            value={settings.sortCheckedBottom}
            onChange={v => setSetting('sortCheckedBottom', v)}
          />
          <Divider />
          <ToggleRow
            label="Confirmer les suppressions"
            sub="Demande confirmation avant de supprimer"
            value={settings.confirmDelete}
            onChange={v => setSetting('confirmDelete', v)}
          />
        </Card>

        <SectionLabel label="Assistant IA" />
        <Card>
          <FieldRow
            label="URL du serveur"
            value={settings.aiBaseUrl}
            placeholder="http://mon-vps:11434"
            onChange={v => setSetting('aiBaseUrl', v)}
            keyboardType="url"
            onReset={
              settings.aiBaseUrl !== AI_DEFAULTS.baseUrl
                ? () => {
                    haptic();
                    setSetting('aiBaseUrl', AI_DEFAULTS.baseUrl);
                  }
                : undefined
            }
          />
          <Divider />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Modèle</Text>
            <Select
              value={customModel ? CUSTOM_MODEL : settings.aiModel}
              options={MODEL_OPTIONS}
              onChange={v => {
                if (v === CUSTOM_MODEL) {
                  setCustomModel(true);
                } else {
                  setCustomModel(false);
                  setSetting('aiModel', v);
                }
              }}
            />
            {customModel && (
              <TextInput
                style={[styles.fieldInput, {marginTop: 10}]}
                value={settings.aiModel}
                placeholder="ex : gemma3:4b"
                placeholderTextColor={colors.text3}
                onChangeText={v => setSetting('aiModel', v)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          </View>
          <Divider />
          <FieldRow
            label="Clé API (optionnel)"
            value={settings.aiApiKey}
            placeholder="laisser vide si aucune"
            onChange={v => setSetting('aiApiKey', v)}
            secure
          />
        </Card>
        <Text style={styles.aiHint}>
          Compatible Ollama, llama.cpp, vLLM, LM Studio… (API OpenAI sur /v1).
          Le téléphone doit pouvoir joindre cette adresse.
        </Text>

        <SectionLabel label="Navigation" />
        <Card>
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

        <SectionLabel label="Données" />
        <Card>
          <Row
            icon="broom"
            title="Effacer l'historique"
            subtitle="Supprime les listes terminées"
            onPress={confirmClearHistory}
          />
          <Divider />
          <Row
            icon="delete-forever"
            title="Tout réinitialiser"
            subtitle="Efface toutes les données"
            onPress={confirmReset}
          />
        </Card>

        <SectionLabel label="À propos" />
        <Card>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </Card>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {paddingHorizontal: spacing.lg},
  themeCard: {padding: spacing.lg},
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeItem: {alignItems: 'center', gap: 8},
  themeDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDotSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  themeLabel: {fontSize: 12, fontWeight: '700', color: colors.text3},
  themeLabelSelected: {color: colors.text},
  fieldRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  fieldLabel: {fontSize: 13, fontWeight: '700', color: colors.text2, marginBottom: 6},
  fieldInputRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  resetBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  aiHint: {
    fontSize: 12.5,
    color: colors.text3,
    fontWeight: '600',
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    gap: spacing.md,
  },
  toggleInfo: {flex: 1},
  toggleLabel: {fontSize: 15, fontWeight: '700', color: colors.text},
  toggleSub: {fontSize: 12.5, fontWeight: '600', color: colors.text2, marginTop: 2},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  infoLabel: {fontSize: 15, fontWeight: '700', color: colors.text},
  infoValue: {fontSize: 14, fontWeight: '600', color: colors.text2},
  bottomSpace: {height: 32},
});
