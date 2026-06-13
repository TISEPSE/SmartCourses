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

export interface Recipe {
  id: string;
  name: string;
  tag: string;
  time: number;
  kcal: number;
  serves: number;
  fav: boolean;
  ingredients: string[];
  steps: string[];
}

// Navigation param list
export type RootStackParamList = {
  Tabs: undefined;
  Shopping: { listId: string };
  CreateList: undefined;
  RecipeDetail: { recipeId: string };
  Settings: undefined;
  Preferences: undefined;
  History: undefined;
  EditProfile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Grocery: undefined;
  AI: undefined;
  Recipes: undefined;
  Profile: undefined;
};
