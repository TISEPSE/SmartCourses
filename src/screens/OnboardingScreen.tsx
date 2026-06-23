import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList} from '../types';
import {Palette, radius, spacing, withAlpha} from '../theme';
import {ThemePicker, Touchable, Field} from '../components';
import {ProviderBadge} from '../assets/logos';
import {useSettings} from '../context/SettingsContext';
import {AI_PROVIDERS, getProvider} from '../config/providers';

const NO_AI = 'none';

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
  // '' = rien choisi ; NO_AI = sans IA ; sinon un id de fournisseur.
  const [provider, setProvider] = useState<string>('');
  const [url, setUrl] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');

  const selected = getProvider(provider);
  const isCloud = !!selected && selected.id !== 'custom';

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
    setSetting('firstName', fn);
    setSetting('lastName', '');
    setSetting('userName', fn);

    if (provider === NO_AI || provider === '') {
      setSetting('aiProvider', '');
      setSetting('aiBaseUrl', '');
      setSetting('aiModel', '');
      setSetting('aiApiKey', '');
    } else if (provider === 'custom') {
      setSetting('aiProvider', 'custom');
      setSetting('aiBaseUrl', url.trim());
      setSetting('aiModel', model.trim());
      setSetting('aiApiKey', apiKey.trim());
    } else {
      setSetting('aiProvider', provider);
      setSetting('aiBaseUrl', '');
      setSetting('aiModel', selected?.defaultModel ?? '');
      setSetting('aiApiKey', apiKey.trim());
    }

    setSetting('onboarded', true);
    navigation.reset({index: 0, routes: [{name: 'Tabs'}]});
  };

  const step1Ok =
    provider === NO_AI ||
    (provider === 'custom' && url.trim().length > 0) ||
    (isCloud && apiKey.trim().length > 0);
  // Le prénom est facultatif : on peut continuer (ou passer) sans le saisir.
  const skipName = () => {
    setFirstName('');
    next();
  };
  const canContinue = step === 1 ? step1Ok : true;

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
            <Text style={styles.sub}>
              Indique ton prénom pour personnaliser l'app, ou passe cette étape.
            </Text>

            <Field
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={next}
              containerStyle={styles.fieldSpace}
            />

            <Touchable style={styles.skipBtn} scaleTo={1} onPress={skipName}>
              <Text style={styles.skipBtnText}>Passer cette étape</Text>
            </Touchable>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.title}>Assistant IA</Text>
            <Text style={styles.sub}>
              Choisis une IA et renseigne ta clé, ou continue sans IA.
            </Text>

            {AI_PROVIDERS.map(p => {
              const on = provider === p.id;
              return (
                <Touchable
                  key={p.id}
                  scaleTo={0.98}
                  rippleColor={withAlpha(accent, 0.16)}
                  style={[styles.choice, on && styles.choiceOn]}
                  onPress={() => {
                    haptic();
                    setProvider(p.id);
                  }}>
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
              style={[styles.choice, provider === NO_AI && styles.choiceOn]}
              onPress={() => {
                haptic();
                setProvider(NO_AI);
              }}>
              <View style={[styles.logo, {backgroundColor: colors.cardHi}]}>
                <Icon name="cancel" size={20} color={colors.text3} />
              </View>
              <View style={styles.choiceMain}>
                <Text style={styles.choiceTitle}>Sans IA</Text>
                <Text style={styles.choiceSub}>
                  Tu pourras l'activer plus tard dans les Paramètres.
                </Text>
              </View>
              <Icon
                name={provider === NO_AI ? 'check-circle' : 'circle-outline'}
                size={22}
                color={provider === NO_AI ? accent : colors.text3}
              />
            </Touchable>

            {isCloud && (
              <View style={styles.customBox}>
                <Field
                  label={`Clé API ${selected?.label ?? ''}`}
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  containerStyle={styles.fieldSpace}
                />
                {!!selected?.keyUrl && (
                  <TouchableOpacity
                    style={styles.keyLink}
                    onPress={() => Linking.openURL(selected.keyUrl)}>
                    <Icon name="open-in-new" size={14} color={colors.text3} />
                    <Text style={styles.keyLinkText}>
                      Où trouver ma clé ? ({selected.keyHost})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {provider === 'custom' && (
              <View style={styles.customBox}>
                <Field
                  label="URL du serveur"
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  containerStyle={styles.fieldSpace}
                />
                <Field
                  label="Modèle"
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.fieldSpace}
                />
                <Field
                  label="Clé API (optionnel)"
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  containerStyle={styles.fieldSpace}
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
          <Touchable style={styles.backBtn} onPress={back} scaleTo={1}>
            <Text style={styles.backBtnText}>Retour</Text>
          </Touchable>
        )}
        <Touchable
          style={[
            styles.nextBtn,
            step === 0 && styles.nextBtnFull,
            {backgroundColor: canContinue ? accent : colors.cardHi},
          ]}
          onPress={next}
          disabled={!canContinue}
          rippleColor={withAlpha(onAccent, 0.2)}>
          <Text
            style={[
              styles.nextBtnText,
              {color: canContinue ? onAccent : colors.text3},
            ]}>
            {step === STEPS - 1 ? 'Commencer' : 'Continuer'}
          </Text>
        </Touchable>
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
    fieldSpace: {marginTop: spacing.md},
    skipBtn: {
      alignSelf: 'flex-start',
      marginTop: spacing.lg,
      paddingVertical: spacing.xs,
    },
    skipBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text3,
      textDecorationLine: 'underline',
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
    logo: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 10,
      paddingVertical: 2,
    },
    keyLinkText: {fontSize: 13, fontWeight: '700', color: colors.text3},
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
