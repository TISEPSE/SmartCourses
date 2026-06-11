import AsyncStorage from '@react-native-async-storage/async-storage';
import {GroceryList, Recipe, PantryItem} from '../types';

const KEYS = {
  lists: '@sc_lists',
  recipes: '@sc_recipes',
  pantry: '@sc_pantry',
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

export async function getPantry(): Promise<PantryItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.pantry);
  return raw ? JSON.parse(raw) : [];
}

export async function savePantry(items: PantryItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.pantry, JSON.stringify(items));
}
