import React, {useState} from 'react';
import {
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
import {AI_PROVIDERS, getProvider} from '../config/providers';
import {ProviderBadge} from '../assets/logos';
import {Palette, spacing, radius, withAlpha} from '../theme';
import {
  AppBar,
  Card,
  Divider,
  SectionLabel,
  Select,
  SelectOption,
  Touchable,
  Field,
} from '../components';
import {useSettings} from '../context/SettingsContext';

const CUSTOM_MODEL = '__custom__';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Page dédiée à la configuration de l'assistant IA. Sortie des Paramètres
 * généraux pour ne pas les surcharger : choix du fournisseur, clé API et
 * modèle sont regroupés ici dans des sections claires.
 */
export default function AiSettingsScreen() {
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

  const statusLabel = provider
    ? provider.id === 'custom'
      ? 'Serveur personnalisé'
      : provider.label
    : 'Désactivé';

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Assistant IA" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Bandeau d'état */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              {backgroundColor: provider ? withAlpha(accent, 0.16) : colors.cardHi},
            ]}>
            <Icon
              name={provider ? 'auto-fix' : 'robot-off-outline'}
              size={22}
              color={provider ? accent : colors.text3}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{statusLabel}</Text>
            <Text style={styles.statusSub}>
              {provider
                ? 'Assistant IA actif'
                : 'Choisis un fournisseur ci-dessous'}
            </Text>
          </View>
        </View>

        {/* Choix du fournisseur */}
        <SectionLabel label="Fournisseur" />
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

        {/* Configuration du fournisseur sélectionné */}
        {(isCloud || provider?.id === 'custom') && (
          <>
            <SectionLabel label="Configuration" />
            <Card style={styles.aiFieldsCard}>
              {isCloud && provider && (
                <>
                  <View style={styles.fieldRow}>
                    <Field
                      label={`Clé API ${provider.label}`}
                      value={settings.aiApiKey}
                      onChangeText={v => setSetting('aiApiKey', v)}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
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
                  <View style={styles.fieldRow}>
                    <Field
                      label="URL du serveur"
                      value={settings.aiBaseUrl}
                      onChangeText={v => setSetting('aiBaseUrl', v)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>
                  <Divider />
                  <View style={styles.fieldRow}>
                    <Field
                      label="Modèle"
                      value={settings.aiModel}
                      onChangeText={v => setSetting('aiModel', v)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <Divider />
                  <View style={styles.fieldRow}>
                    <Field
                      label="Clé API (optionnel)"
                      value={settings.aiApiKey}
                      onChangeText={v => setSetting('aiApiKey', v)}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </>
              )}
            </Card>
            <Text style={styles.keyLinkText}>
              Ta clé est stockée de façon chiffrée sur cet appareil (trousseau du
              système), jamais en clair.
            </Text>
          </>
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
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    statusIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusInfo: {flex: 1},
    statusTitle: {fontSize: 16, fontWeight: '800', color: colors.text},
    statusSub: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text2,
      marginTop: 2,
    },
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
    fieldRow: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text2,
      marginBottom: 6,
    },
    modelFieldSpace: {marginTop: 10},
    keyLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.lg,
      paddingBottom: 12,
      marginTop: -4,
    },
    keyLinkText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text3,
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.xs,
    },
    aiHint: {
      fontSize: 12.5,
      color: colors.text3,
      fontWeight: '600',
      lineHeight: 18,
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.sm,
    },
    bottomSpace: {height: 32},
  });
