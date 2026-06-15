import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, Recipe} from '../types';
import {getRecipes} from '../storage';
import {Palette, spacing, radius} from '../theme';
import {AppBar, FoodImage, LargeHead} from '../components';
import {useSettings} from '../context/SettingsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setRecipes(await getRecipes());
    });
    return unsubscribe;
  }, [navigation]);

  const favs = recipes.filter(r => r.fav).length;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Recettes" />
      <LargeHead
        title="Recettes"
        sub={`${recipes.length} sauvegardées · ${favs} favoris`}
      />
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
        ) : (
          <View style={styles.grid}>
            {recipes.map(r => (
              <TouchableOpacity
                key={r.id}
                style={styles.recipeCard}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('RecipeDetail', {recipeId: r.id})
                }>
                <FoodImage
                  uri={r.image}
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
              </TouchableOpacity>
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
