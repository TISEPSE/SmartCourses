import AsyncStorage from '@react-native-async-storage/async-storage';
import {GroceryList, Recipe} from '../types';

const KEYS = {
  lists: '@sc_lists',
  recipes: '@sc_recipes',
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
}
