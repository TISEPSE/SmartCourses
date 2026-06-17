export interface GroceryItem {
  id: string;
  name: string;
  note?: string;
  category: string;
  checked: boolean;
}

export interface GroceryList {
  id: string;
  name: string;
  store?: string;
  updatedAt: string;
  items: GroceryItem[];
  totalCost?: number;
  completedAt?: string;
}

export interface Ingredient {
  /** Quantité pour `serves` personnes. Absente = non quantifiable (sel, poivre…). */
  qty?: number;
  /** Unité affichée après la quantité ('g', 'cl', 'c. à soupe'…). Vide pour les pièces. */
  unit?: string;
  /** Nom de l'ingrédient ('farine de sarrasin', 'œufs'…). */
  name: string;
}

export interface Recipe {
  id: string;
  name: string;
  tag: string;
  time: number;
  kcal: number;
  /** Nombre de personnes de référence pour les quantités d'ingrédients. */
  serves: number;
  fav: boolean;
  ingredients: Ingredient[];
  steps: string[];
  /** Emoji de repli affiché si aucune photo locale n'est fournie. */
  emoji?: string;
}

// Navigation param list
export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  Shopping: { listId: string };
  CreateList: undefined;
  RecipeDetail: { recipeId: string };
  Settings: undefined;
  Preferences: undefined;
  History: undefined;
  EditProfile: undefined;
  Privacy: undefined;
};

export type TabParamList = {
  Home: undefined;
  Grocery: undefined;
  AI: undefined;
  Recipes: undefined;
  Profile: undefined;
};
