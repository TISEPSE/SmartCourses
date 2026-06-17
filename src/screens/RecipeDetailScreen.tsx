import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, Recipe} from '../types';
import {getRecipes, saveRecipes} from '../storage';
import {ingredientLine} from '../data/recipes';
import {recipeImage} from '../assets/recipes';
import {Palette, radius, spacing} from '../theme';
import {AppBar, FoodImage, PillTag, Divider, Touchable} from '../components';
import {useSettings} from '../context/SettingsContext';

type Route = RouteProp<RootStackParamList, 'RecipeDetail'>;

const MIN_SERVES = 1;
const MAX_SERVES = 20;

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const {colors, accent, accentSoft, haptic} = useSettings();
  const styles = makeStyles(colors);
  const {recipeId} = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [serves, setServes] = useState(MIN_SERVES);

  useEffect(() => {
    (async () => {
      const rs = await getRecipes();
      setAllRecipes(rs);
      const found = rs.find(r => r.id === recipeId) ?? null;
      setRecipe(found);
      if (found) {
        setServes(found.serves);
      }
    })();
  }, [recipeId]);

  const toggleFav = async () => {
    if (!recipe) return;
    const updated = {...recipe, fav: !recipe.fav};
    const next = allRecipes.map(r => (r.id === updated.id ? updated : r));
    setAllRecipes(next);
    setRecipe(updated);
    await saveRecipes(next);
  };

  const changeServes = (delta: number) => {
    haptic();
    setServes(s => Math.min(MAX_SERVES, Math.max(MIN_SERVES, s + delta)));
  };

  if (!recipe) {
    return (
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <AppBar title="Recette" onBack={() => navigation.goBack()} />
        <Text style={styles.notFound}>Recette introuvable</Text>
      </View>
    );
  }

  const factor = serves / recipe.serves;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar
        title={recipe.name}
        onBack={() => navigation.goBack()}
        actions={[
          {icon: recipe.fav ? 'heart' : 'heart-outline', onPress: toggleFav},
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <FoodImage
          source={recipeImage(recipe.id)}
          emoji={recipe.emoji}
          emojiSize={64}
          style={styles.banner}
        />
        <Text style={styles.tag}>{recipe.tag}</Text>
        <Text style={styles.name}>{recipe.name}</Text>

        <View style={styles.pills}>
          <PillTag icon="clock-outline">{`${recipe.time} min`}</PillTag>
          <PillTag icon="fire">{`${recipe.kcal} kcal`}</PillTag>
        </View>

        <View style={styles.servesRow}>
          <View style={styles.servesInfo}>
            <Icon name="account-group" size={20} color={colors.text2} />
            <Text style={styles.servesLabel}>Nombre de personnes</Text>
          </View>
          <View style={styles.stepper}>
            <Touchable
              style={[styles.stepBtn, serves <= MIN_SERVES && styles.stepBtnOff]}
              borderless
              scaleTo={0.9}
              disabled={serves <= MIN_SERVES}
              onPress={() => changeServes(-1)}>
              <Icon
                name="minus"
                size={20}
                color={serves <= MIN_SERVES ? colors.text3 : accent}
              />
            </Touchable>
            <Text style={styles.stepVal}>{serves}</Text>
            <Touchable
              style={[styles.stepBtn, serves >= MAX_SERVES && styles.stepBtnOff]}
              borderless
              scaleTo={0.9}
              disabled={serves >= MAX_SERVES}
              onPress={() => changeServes(1)}>
              <Icon
                name="plus"
                size={20}
                color={serves >= MAX_SERVES ? colors.text3 : accent}
              />
            </Touchable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingrédients</Text>
        <View style={styles.card}>
          {recipe.ingredients.map((ing, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Divider />}
              <View style={styles.ingRow}>
                <Icon name="circle-medium" size={18} color={colors.text3} />
                <Text style={styles.ingText}>{ingredientLine(ing, factor)}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {recipe.steps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Étapes</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, {backgroundColor: accentSoft}]}>
                  <Text style={[styles.stepNumText, {color: accent}]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    notFound: {
      color: colors.text2,
      textAlign: 'center',
      marginTop: 80,
      fontSize: 16,
    },
    content: {paddingHorizontal: spacing.lg, paddingBottom: spacing.lg},
    banner: {
      width: '100%',
      height: 190,
      borderRadius: radius.lg,
      marginBottom: spacing.lg,
    },
    tag: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text2,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.xs,
    },
    name: {
      fontSize: 25,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.6,
      lineHeight: 30,
    },
    pills: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    servesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    servesInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 1,
    },
    servesLabel: {fontSize: 14.5, fontWeight: '700', color: colors.text},
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    stepBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnOff: {opacity: 0.5},
    stepVal: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      minWidth: 24,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    ingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      gap: spacing.sm,
    },
    ingText: {fontSize: 15, fontWeight: '600', color: colors.text, flex: 1},
    stepRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'flex-start',
    },
    stepNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    stepNumText: {fontSize: 13, fontWeight: '800', color: colors.text},
    stepText: {
      flex: 1,
      fontSize: 15,
      color: colors.text2,
      fontWeight: '600',
      lineHeight: 22,
    },
  });
