import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
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

import {RootStackParamList, GroceryList} from '../types';
import {getLists, saveLists} from '../storage';
import {Palette, spacing, radius} from '../theme';
import {AppBar} from '../components';
import {useSettings} from '../context/SettingsContext';
import {
  AiError,
  chatStream,
  extractGroceryList,
  GeneratedList,
  ChatMessage,
} from '../services/ai';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Bubble {
  role: 'user' | 'assistant';
  text?: string;
  list?: GeneratedList;
}

const SUGGESTIONS = [
  'Repas équilibrés pour 4 personnes, 3 jours',
  'Une liste pour un barbecue à 6',
  'Idée de dîner rapide avec du poulet ?',
];

export default function AiScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {settings, colors, accent, onAccent, accentSoft, haptic} = useSettings();
  const styles = makeStyles(colors);

  const [input, setInput] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const configured = settings.aiBaseUrl.trim().length > 0;

  const scrollToEnd = (animated = true) => {
    scrollRef.current?.scrollToEnd({animated});
  };

  const setLastBubble = (b: Bubble) => {
    setBubbles(prev => {
      const next = [...prev];
      next[next.length - 1] = b;
      return next;
    });
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    haptic();
    setInput('');

    // Historique conversationnel (on ignore les bulles "liste")
    const history: ChatMessage[] = bubbles
      .filter(b => b.text)
      .map(b => ({role: b.role, content: b.text as string}));

    setBubbles(prev => [
      ...prev,
      {role: 'user', text: prompt},
      {role: 'assistant'}, // bulle vide → spinner pendant la réponse
    ]);
    setLoading(true);
    setTimeout(() => scrollToEnd(), 60);

    try {
      const {promise} = chatStream(
        settings,
        [...history, {role: 'user', content: prompt}],
        fullText => {
          // Si la réponse commence par du JSON, c'est une liste : on garde le
          // spinner (pas de JSON brut à l'écran), la carte s'affiche à la fin.
          const t = fullText.trimStart();
          if (t.startsWith('{') || t.startsWith('```')) return;
          setLastBubble({role: 'assistant', text: fullText});
          scrollToEnd(false);
        },
      );
      const full = await promise;
      const list = extractGroceryList(full);
      if (list) {
        setLastBubble({role: 'assistant', list});
      } else {
        setLastBubble({
          role: 'assistant',
          text: full.trim() || 'Désolé, peux-tu reformuler ?',
        });
      }
    } catch (e) {
      const msg = e instanceof AiError ? e.message : 'Une erreur est survenue.';
      setLastBubble({role: 'assistant', text: `⚠️ ${msg}`});
    } finally {
      setLoading(false);
      setTimeout(() => scrollToEnd(), 60);
    }
  };

  const createList = async (gen: GeneratedList) => {
    haptic();
    const list: GroceryList = {
      id: `l_${Date.now()}`,
      name: gen.name,
      updatedAt: new Date().toLocaleDateString('fr-FR'),
      items: gen.items.map((name, idx) => ({
        id: `i_${Date.now()}_${idx}`,
        name,
        category: 'autre',
        checked: false,
      })),
    };
    const existing = await getLists();
    await saveLists([list, ...existing]);
    navigation.navigate('Shopping', {listId: list.id});
  };

  if (!configured) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <AppBar title="IA" />
        <View style={styles.empty}>
          <Icon name="robot-outline" size={48} color={colors.text3} />
          <Text style={styles.emptyTitle}>Assistant non configuré</Text>
          <Text style={styles.emptySub}>
            Connecte ton serveur IA pour générer des listes et discuter cuisine.
          </Text>
          <TouchableOpacity
            style={[styles.cfgBtn, {backgroundColor: accent}]}
            onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={18} color={onAccent} />
            <Text style={[styles.cfgBtnText, {color: onAccent}]}>
              Configurer dans les Paramètres
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, {paddingTop: insets.top}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AppBar title="Assistant IA" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {bubbles.length === 0 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestTitle}>
              Demande une liste ou pose une question
            </Text>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestChip}
                onPress={() => setInput(s)}>
                <Icon name="lightbulb-outline" size={16} color={colors.text2} />
                <Text style={styles.suggestChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {bubbles.map((b, i) => {
          if (b.list) {
            return (
              <View key={i} style={styles.listCard}>
                <Text style={styles.listCardTitle}>{b.list.name}</Text>
                {b.list.items.map((it, j) => (
                  <View key={j} style={styles.listItemRow}>
                    <Icon name="circle-small" size={20} color={accent} />
                    <Text style={styles.listItemText}>{it}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.createBtn, {backgroundColor: accent}]}
                  onPress={() => createList(b.list as GeneratedList)}>
                  <Icon name="cart-plus" size={18} color={onAccent} />
                  <Text style={[styles.createBtnText, {color: onAccent}]}>
                    Créer la liste
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }
          const isUser = b.role === 'user';
          return (
            <View
              key={i}
              style={[
                styles.bubble,
                isUser
                  ? [styles.bubbleUser, {backgroundColor: accentSoft}]
                  : styles.bubbleAi,
              ]}>
              {!isUser && !b.text ? (
                <ActivityIndicator size="small" color={colors.text2} />
              ) : (
                <Text style={styles.bubbleText}>{b.text}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Saisie — sans cadre, juste le texte */}
      <View style={[styles.inputBar, {paddingBottom: insets.bottom + 8}]}>
        <TextInput
          style={styles.input}
          placeholder="Demande ce que tu veux…"
          placeholderTextColor={colors.text3}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
          editable={!loading}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {backgroundColor: input.trim() && !loading ? accent : colors.card},
          ]}
          onPress={send}
          disabled={!input.trim() || loading}>
          <Icon
            name="arrow-up"
            size={22}
            color={input.trim() && !loading ? onAccent : colors.text3}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center'},
  emptySub: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  cfgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginTop: spacing.sm,
  },
  cfgBtnText: {fontSize: 15, fontWeight: '800'},
  scroll: {flex: 1},
  scrollContent: {padding: spacing.lg, gap: spacing.md},
  suggestions: {gap: spacing.sm, paddingTop: spacing.md},
  suggestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text2,
    marginBottom: spacing.xs,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  suggestChipText: {fontSize: 14, fontWeight: '600', color: colors.text, flex: 1},
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  bubbleUser: {alignSelf: 'flex-end'},
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 21},
  listCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignSelf: 'stretch',
  },
  listCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  listItemRow: {flexDirection: 'row', alignItems: 'center', gap: 2},
  listItemText: {fontSize: 15, fontWeight: '600', color: colors.text, flex: 1},
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 13,
    marginTop: spacing.md,
  },
  createBtnText: {fontSize: 15, fontWeight: '800'},
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
