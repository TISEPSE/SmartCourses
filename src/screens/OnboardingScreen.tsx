import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
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

import {RootStackParamList} from '../types';
import {Palette, radius, spacing} from '../theme';
import {ThemePicker} from '../components';
import {useSettings} from '../context/SettingsContext';
import {AI_DEFAULTS} from '../config/defaults';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const STEPS = 3;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {settings, setSetting, colors, accent, onAccent, haptic} = useSettings();
  const styles = makeStyles(colors);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // 1 = avance, -1 = recule
  const anim = useRef(new Animated.Value(1)).current;

  // À chaque changement d'étape : le contenu repart de 0 (décalé + transparent)
  // puis glisse/apparaît en douceur.
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, anim]);

  const [firstName, setFirstName] = useState(settings.firstName);
  const [lastName, setLastName] = useState(settings.lastName);
  const [aiMode, setAiMode] = useState<'default' | 'custom'>('default');
  const [url, setUrl] = useState(
    settings.aiBaseUrl === AI_DEFAULTS.baseUrl ? '' : settings.aiBaseUrl,
  );
  const [model, setModel] = useState(
    settings.aiModel === AI_DEFAULTS.model ? '' : settings.aiModel,
  );
  const [apiKey, setApiKey] = useState(
    settings.aiApiKey === AI_DEFAULTS.apiKey ? '' : settings.aiApiKey,
  );

  const next = () => {
    haptic();
    if (step < STEPS - 1) {
      setDir(1);
      setStep(s => s + 1);
    } else {
      finish();
    }
  };
  const back = () => {
    haptic();
    setDir(-1);
    setStep(s => Math.max(0, s - 1));
  };

  const finish = () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    setSetting('firstName', fn);
    setSetting('lastName', ln);
    setSetting('userName', `${fn} ${ln}`.trim());

    if (aiMode === 'default') {
      setSetting('aiBaseUrl', AI_DEFAULTS.baseUrl);
      setSetting('aiModel', AI_DEFAULTS.model);
      setSetting('aiApiKey', AI_DEFAULTS.apiKey);
    } else {
      setSetting('aiBaseUrl', url.trim());
      setSetting('aiModel', model.trim() || AI_DEFAULTS.model);
      setSetting('aiApiKey', apiKey.trim());
    }

    setSetting('onboarded', true);
    navigation.reset({index: 0, routes: [{name: 'Tabs'}]});
  };

  const canContinue =
    step !== 0
      ? step !== 1
        ? true
        : aiMode === 'default' || url.trim().length > 0
      : firstName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, {paddingTop: insets.top + spacing.lg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Progression */}
      <View style={styles.dots}>
        {Array.from({length: STEPS}).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {backgroundColor: i <= step ? accent : colors.cardHi},
              i === step && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: anim,
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [dir * 48, 0],
                }),
              },
            ],
          }}>
        {step === 0 && (
          <View>
            <Text style={styles.title}>Bienvenue 👋</Text>
            <Text style={styles.sub}>Comment t'appelles-tu ?</Text>

            <Text style={styles.fieldLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton prénom"
              placeholderTextColor={colors.text3}
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
              returnKeyType="next"
            />
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton nom"
              placeholderTextColor={colors.text3}
              value={lastName}
              onChangeText={setLastName}
              returnKeyType="done"
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.title}>Assistant IA</Text>
            <Text style={styles.sub}>
              Choisis l'IA que l'app utilisera pour générer tes listes et discuter.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.choice, aiMode === 'default' && styles.choiceOn]}
              onPress={() => {
                haptic();
                setAiMode('default');
              }}>
              <Icon
                name={
                  aiMode === 'default'
                    ? 'check-circle'
                    : 'circle-outline'
                }
                size={22}
                color={aiMode === 'default' ? accent : colors.text3}
              />
              <View style={styles.choiceMain}>
                <Text style={styles.choiceTitle}>IA intégrée</Text>
                <Text style={styles.choiceSub}>
                  Prête à l'emploi, rien à configurer. Recommandé.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.choice, aiMode === 'custom' && styles.choiceOn]}
              onPress={() => {
                haptic();
                setAiMode('custom');
              }}>
              <Icon
                name={
                  aiMode === 'custom' ? 'check-circle' : 'circle-outline'
                }
                size={22}
                color={aiMode === 'custom' ? accent : colors.text3}
              />
              <View style={styles.choiceMain}>
                <Text style={styles.choiceTitle}>Une autre IA</Text>
                <Text style={styles.choiceSub}>
                  Connecte ton propre serveur (compatible OpenAI).
                </Text>
              </View>
            </TouchableOpacity>

            {aiMode === 'custom' && (
              <View style={styles.customBox}>
                <Text style={styles.fieldLabel}>URL du serveur</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://mon-serveur.com"
                  placeholderTextColor={colors.text3}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <Text style={styles.fieldLabel}>Modèle</Text>
                <TextInput
                  style={styles.input}
                  placeholder={AI_DEFAULTS.model}
                  placeholderTextColor={colors.text3}
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.fieldLabel}>Clé API (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bearer token…"
                  placeholderTextColor={colors.text3}
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Choisis ton thème</Text>
            <Text style={styles.sub}>
              Il s'applique à toute l'application. Tu pourras le changer plus tard.
            </Text>

            <ThemePicker />
          </View>
        )}
        </Animated.View>
      </ScrollView>

      {/* Boutons */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + spacing.md}]}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={back}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            step === 0 && styles.nextBtnFull,
            {backgroundColor: canContinue ? accent : colors.cardHi},
          ]}
          onPress={next}
          disabled={!canContinue}>
          <Text
            style={[
              styles.nextBtnText,
              {color: canContinue ? onAccent : colors.text3},
            ]}>
            {step === STEPS - 1 ? 'Commencer' : 'Continuer'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    dots: {
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    dot: {width: 8, height: 8, borderRadius: 4},
    dotActive: {width: 22},
    scroll: {flex: 1},
    scrollContent: {padding: spacing.xl, gap: spacing.sm},
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    sub: {
      fontSize: 15,
      color: colors.text2,
      fontWeight: '600',
      lineHeight: 22,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text2,
      marginBottom: 6,
      marginTop: spacing.md,
    },
    input: {
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
    choice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    choiceOn: {borderColor: colors.accent},
    choiceMain: {flex: 1},
    choiceTitle: {fontSize: 16, fontWeight: '800', color: colors.text},
    choiceSub: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text2,
      marginTop: 2,
      lineHeight: 18,
    },
    customBox: {marginTop: spacing.sm},
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
    },
    backBtn: {
      flex: 1,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backBtnText: {fontSize: 16, fontWeight: '700', color: colors.text},
    nextBtn: {
      flex: 2,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
    },
    nextBtnFull: {flex: 1, height: 54},
    nextBtnText: {fontSize: 16, fontWeight: '800'},
  });
