import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, TabParamList, Recipe} from '../types';
import {getRecipes} from '../storage';
import {recipeImage} from '../assets/recipes';
import {Palette, spacing, radius} from '../theme';
import {AppBar, Chip, FoodImage, LargeHead, Touchable} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<TabParamList, 'Recipes'>;

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favsOnly, setFavsOnly] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setRecipes(await getRecipes());
    });
    return unsubscribe;
  }, [navigation]);

  // Le raccourci « Favoris » de l'accueil ouvre cet onglet avec le filtre
  // pré-activé. On suit le param à chaque changement.
  useEffect(() => {
    setFavsOnly(!!route.params?.favorites);
  }, [route.params?.favorites]);

  const favs = recipes.filter(r => r.fav).length;
  const visible = favsOnly ? recipes.filter(r => r.fav) : recipes;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Recettes" />
      <LargeHead
        title="Recettes"
        sub={`${recipes.length} sauvegardées · ${favs} favoris`}
      />
      {recipes.length > 0 && (
        <View style={styles.filterRow}>
          <Chip on={!favsOnly} onPress={() => setFavsOnly(false)}>
            Toutes
          </Chip>
          <Chip on={favsOnly} icon="heart" onPress={() => setFavsOnly(true)}>
            Favoris
          </Chip>
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {recipes.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="book-open-variant" size={48} color={colors.text3} />
            <Text style={styles.emptyTitle}>Aucune recette</Text>
            <Text style={styles.emptyHint}>
              Ajoute ta première recette avec le bouton +
            </Text>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="heart-outline" size={48} color={colors.text3} />
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptyHint}>
              Ajoute des recettes à tes favoris pour les retrouver ici
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {visible.map(r => (
              <Touchable
                key={r.id}
                style={styles.recipeCard}
                onPress={() =>
                  navigation.navigate('RecipeDetail', {recipeId: r.id})
                }>
                <FoodImage
                  source={recipeImage(r.id)}
                  emoji={r.emoji}
                  emojiSize={40}
                  style={styles.recipeThumb}
                />
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={2}>
                    {r.name}
                  </Text>
                  <Text style={styles.recipeMeta}>
                    {r.kcal} kcal · {r.serves} pers.
                  </Text>
                </View>
                {r.fav && (
                  <Icon
                    name="heart"
                    size={16}
                    color={colors.text}
                    style={styles.favIcon}
                  />
                )}
              </Touchable>
            ))}
          </View>
        )}
        <View style={{height: 80}} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  scroll: {flex: 1},
  content: {paddingHorizontal: spacing.lg, flexGrow: 1},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {fontSize: 16, fontWeight: '700', color: colors.text},
  emptyHint: {fontSize: 14, color: colors.text2, fontWeight: '600', textAlign: 'center'},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  recipeThumb: {
    width: '100%',
    height: 110,
    backgroundColor: colors.cardHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {padding: 12},
  recipeName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  recipeMeta: {
    fontSize: 12,
    color: colors.text2,
    fontWeight: '600',
    marginTop: 4,
  },
  favIcon: {
    position: 'absolute',
    top: 9,
    right: 9,
  },
});
