import React, {useState} from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList} from '../types';
import {clearHistory, resetAllData} from '../storage';
import {AI_PROVIDERS, getProvider} from '../config/providers';
import {ProviderBadge} from '../assets/logos';
import {Palette, PALETTES, ThemeName, spacing, radius, withAlpha} from '../theme';
import {
  AppBar,
  AppSwitch,
  Card,
  Divider,
  SectionLabel,
  Row,
  Select,
  SelectOption,
  Touchable,
  Field,
} from '../components';
import {useSettings} from '../context/SettingsContext';

const THEME_OPTIONS: SelectOption[] = (Object.keys(PALETTES) as ThemeName[]).map(
  name => ({label: PALETTES[name].label, value: name}),
);

const CUSTOM_MODEL = '__custom__';

interface FieldRowProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'url';
}

function FieldRow({label, value, onChange, secure, keyboardType}: FieldRowProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.fieldRow}>
      <Field
        label={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType === 'url' ? 'url' : 'default'}
      />
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
  const {settings, setSetting, colors, accent, haptic} = useSettings();
  const styles = makeStyles(colors);

  const provider = getProvider(settings.aiProvider);
  const isCloud = !!provider && provider.id !== 'custom';
  const [modelCustom, setModelCustom] = useState(false);
  const showCustomModel =
    modelCustom ||
    (!!provider &&
      provider.models.length > 0 &&
      !!settings.aiModel &&
      !provider.models.includes(settings.aiModel));
  const modelOptions: SelectOption[] = provider
    ? [
        ...provider.models.map(m => ({label: m, value: m})),
        {label: 'Personnalisé…', value: CUSTOM_MODEL},
      ]
    : [];

  const changeProvider = (v: string) => {
    haptic();
    setModelCustom(false);
    setSetting('aiProvider', v);
    const p = getProvider(v);
    if (!p) {
      setSetting('aiApiKey', '');
      setSetting('aiModel', '');
      setSetting('aiBaseUrl', '');
    } else if (p.id !== 'custom') {
      setSetting('aiModel', p.defaultModel);
      setSetting('aiBaseUrl', '');
    }
  };

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
        <Card>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Thème</Text>
            <Select
              value={settings.theme}
              options={THEME_OPTIONS}
              onChange={v => {
                haptic();
                setSetting('theme', v as ThemeName);
              }}
            />
          </View>
        </Card>

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
        {AI_PROVIDERS.map(p => {
          const on = settings.aiProvider === p.id;
          return (
            <Touchable
              key={p.id}
              scaleTo={0.98}
              rippleColor={withAlpha(accent, 0.16)}
              style={[styles.choice, on && styles.choiceOn]}
              onPress={() => changeProvider(p.id)}>
              <ProviderBadge
                id={p.id}
                fallbackIcon={p.icon}
                fallbackColor={p.color}
              />
              <View style={styles.choiceMain}>
                <Text style={styles.choiceTitle}>{p.label}</Text>
                <Text style={styles.choiceSub}>{p.blurb}</Text>
              </View>
              <Icon
                name={on ? 'check-circle' : 'circle-outline'}
                size={22}
                color={on ? accent : colors.text3}
              />
            </Touchable>
          );
        })}
        <Touchable
          scaleTo={0.98}
          rippleColor={withAlpha(accent, 0.16)}
          style={[styles.choice, settings.aiProvider === '' && styles.choiceOn]}
          onPress={() => changeProvider('')}>
          <View style={[styles.logo, {backgroundColor: colors.cardHi}]}>
            <Icon name="cancel" size={20} color={colors.text3} />
          </View>
          <View style={styles.choiceMain}>
            <Text style={styles.choiceTitle}>Sans IA</Text>
            <Text style={styles.choiceSub}>Désactiver l’assistant</Text>
          </View>
          <Icon
            name={settings.aiProvider === '' ? 'check-circle' : 'circle-outline'}
            size={22}
            color={settings.aiProvider === '' ? accent : colors.text3}
          />
        </Touchable>

        {(isCloud || provider?.id === 'custom') && (
          <Card style={styles.aiFieldsCard}>
            {isCloud && provider && (
              <>
              <FieldRow
                label={`Clé API ${provider.label}`}
                value={settings.aiApiKey}
                placeholder="Colle ta clé ici…"
                onChange={v => setSetting('aiApiKey', v)}
                secure
              />
              {!!provider.keyUrl && (
                <TouchableOpacity
                  style={styles.keyLink}
                  onPress={() => Linking.openURL(provider.keyUrl)}>
                  <Icon name="open-in-new" size={14} color={colors.text3} />
                  <Text style={styles.keyLinkText}>
                    Obtenir une clé ({provider.keyHost})
                  </Text>
                </TouchableOpacity>
              )}
              <Divider />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Modèle</Text>
                <Select
                  value={showCustomModel ? CUSTOM_MODEL : settings.aiModel}
                  options={modelOptions}
                  onChange={v => {
                    if (v === CUSTOM_MODEL) {
                      setModelCustom(true);
                    } else {
                      setModelCustom(false);
                      setSetting('aiModel', v);
                    }
                  }}
                />
                {showCustomModel && (
                  <Field
                    label="Nom du modèle"
                    value={settings.aiModel}
                    onChangeText={v => setSetting('aiModel', v)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    containerStyle={styles.modelFieldSpace}
                  />
                )}
              </View>
            </>
          )}

            {provider?.id === 'custom' && (
            <>
              <FieldRow
                label="URL du serveur"
                value={settings.aiBaseUrl}
                placeholder="http://mon-serveur:11434"
                onChange={v => setSetting('aiBaseUrl', v)}
                keyboardType="url"
              />
              <Divider />
              <FieldRow
                label="Modèle"
                value={settings.aiModel}
                placeholder="ex : llama3.2:3b"
                onChange={v => setSetting('aiModel', v)}
              />
              <Divider />
              <FieldRow
                label="Clé API (optionnel)"
                value={settings.aiApiKey}
                placeholder="laisser vide si aucune"
                onChange={v => setSetting('aiApiKey', v)}
                secure
              />
            </>
            )}
          </Card>
        )}
        <Text style={styles.aiHint}>
          {provider
            ? provider.id === 'custom'
              ? 'Serveur compatible API OpenAI (Ollama, vLLM, LM Studio…). Le téléphone doit pouvoir joindre cette adresse.'
              : 'Ta clé reste stockée sur ton téléphone et n’est envoyée qu’à ' +
                provider.label +
                '. Tu es facturé selon ton usage chez le fournisseur.'
            : 'Aucune IA active. Choisis un fournisseur pour générer des listes et discuter.'}
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
          <Row
            icon="shield-lock-outline"
            title="Confidentialité"
            subtitle="Vos données restent sur l'appareil"
            onPress={() => navigation.navigate('Privacy')}
          />
          <Divider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.4.0</Text>
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
  keyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    marginTop: -4,
  },
  keyLinkText: {fontSize: 13, fontWeight: '700', color: colors.text3},
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  choiceOn: {borderColor: colors.accent},
  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceMain: {flex: 1},
  choiceTitle: {fontSize: 15.5, fontWeight: '800', color: colors.text},
  choiceSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text2,
    marginTop: 2,
    lineHeight: 17,
  },
  aiFieldsCard: {marginTop: spacing.xs},
  modelFieldSpace: {marginTop: 10},
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
