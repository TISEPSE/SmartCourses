import AsyncStorage from '@react-native-async-storage/async-storage';
import {GroceryList, Recipe} from '../types';
import {EXAMPLE_RECIPES} from '../data/recipes';

const KEYS = {
  lists: '@sc_lists',
  recipes: '@sc_recipes',
  recipesSeeded: '@sc_recipes_seeded',
};

export async function getLists(): Promise<GroceryList[]> {
  const raw = await AsyncStorage.getItem(KEYS.lists);
  return raw ? JSON.parse(raw) : [];
}

export async function saveLists(lists: GroceryList[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.lists, JSON.stringify(lists));
}

export async function getRecipes(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(KEYS.recipes);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.recipes, JSON.stringify(recipes));
}

/**
 * Charge les recettes d'exemple au tout premier lancement (une seule fois).
 * Ne réécrit jamais par-dessus des recettes existantes.
 */
export async function seedRecipesIfNeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(KEYS.recipesSeeded);
  if (seeded) return;
  const existing = await getRecipes();
  if (existing.length === 0) {
    await saveRecipes(EXAMPLE_RECIPES);
  }
  await AsyncStorage.setItem(KEYS.recipesSeeded, '1');
}

export const deleteList = async (id: string): Promise<void> => {
  const lists = await getLists();
  await saveLists(lists.filter(l => l.id !== id));
};

/** Supprime toutes les listes terminées. */
export async function clearHistory(): Promise<void> {
  const lists = await getLists();
  await saveLists(lists.filter(l => !l.completedAt));
}

/** Efface toutes les données de l'app (listes, recettes). */
export async function resetAllData(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.lists);
  await AsyncStorage.removeItem(KEYS.recipes);
  // Réautorise le rechargement des recettes d'exemple au prochain démarrage.
  await AsyncStorage.removeItem(KEYS.recipesSeeded);
}
