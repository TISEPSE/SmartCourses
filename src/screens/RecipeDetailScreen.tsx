import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RootStackParamList, Recipe} from '../types';
import {getRecipes, saveRecipes} from '../storage';
import {colors, spacing} from '../theme';
import {AppBar, PillTag, Divider} from '../components';

type Route = RouteProp<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const {recipeId} = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    (async () => {
      const rs = await getRecipes();
      setAllRecipes(rs);
      setRecipe(rs.find(r => r.id === recipeId) ?? null);
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

  if (!recipe) {
    return (
      <View style={styles.container}>
        <AppBar title="Recette" onBack={() => navigation.goBack()} />
        <Text style={styles.notFound}>Recette introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Icon name="food" size={48} color={colors.text3} />
        </View>

        {/* Back & fav */}
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={23} color={colors.text} />
          </TouchableOpacity>
          <View style={{flex: 1}} />
          <TouchableOpacity style={styles.heroBtn} onPress={toggleFav}>
            <Icon
              name={recipe.fav ? 'heart' : 'heart-outline'}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.tag}>{recipe.tag}</Text>
          <Text style={styles.name}>{recipe.name}</Text>

          <View style={styles.pills}>
            <PillTag icon="clock-outline">{`${recipe.time} min`}</PillTag>
            <PillTag icon="fire">{`${recipe.kcal} kcal`}</PillTag>
            <PillTag icon="account-group">{`${recipe.serves} pers.`}</PillTag>
          </View>

          <Text style={styles.sectionTitle}>Ingrédients</Text>
          <View style={styles.card}>
            {recipe.ingredients.map((ing, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider />}
                <View style={styles.ingRow}>
                  <Icon name="circle-medium" size={18} color={colors.text3} />
                  <Text style={styles.ingText}>{ing}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {recipe.steps.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Étapes</Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </>
          )}

          <View style={{height: 32}} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  notFound: {color: colors.text2, textAlign: 'center', marginTop: 80, fontSize: 16},
  hero: {
    height: 220,
    backgroundColor: colors.cardHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {padding: spacing.lg},
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
  ingText: {fontSize: 15, fontWeight: '600', color: colors.text},
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
