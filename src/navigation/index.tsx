import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, TabParamList} from '../types';
import {colors} from '../theme';

import HomeScreen from '../screens/HomeScreen';
import GroceryScreen from '../screens/GroceryScreen';
import AiScreen from '../screens/AiScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import CreateListScreen from '../screens/CreateListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import PantryScreen from '../screens/PantryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PreferencesScreen from '../screens/PreferencesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text3,
        tabBarLabelStyle: {fontSize: 11, fontWeight: '700'},
        tabBarIcon: ({color, size}) => {
          const icons: Record<string, string> = {
            Home: 'home',
            Grocery: 'cart',
            AI: 'auto-fix',
            Recipes: 'book-open-variant',
            Profile: 'account',
          };
          return (
            <Icon name={icons[route.name] ?? 'circle'} size={size} color={color} />
          );
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{tabBarLabel: 'Accueil'}} />
      <Tab.Screen name="Grocery" component={GroceryScreen} options={{tabBarLabel: 'Courses'}} />
      <Tab.Screen name="AI" component={AiScreen} options={{tabBarLabel: 'IA'}} />
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{tabBarLabel: 'Recettes'}} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{tabBarLabel: 'Profil'}} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Shopping" component={ShoppingScreen} />
      <Stack.Screen name="CreateList" component={CreateListScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="Pantry" component={PantryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
    </Stack.Navigator>
  );
}
