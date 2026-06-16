import React from 'react';
import {Dimensions, Easing, View} from 'react-native';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList, TabParamList} from '../types';
import {useSettings} from '../context/SettingsContext';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import GroceryScreen from '../screens/GroceryScreen';
import AiScreen from '../screens/AiScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import CreateListScreen from '../screens/CreateListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const SCREEN_WIDTH = Dimensions.get('window').width;

// Timing unique pour toutes les transitions de l'app (tabs + stack)
const TRANSITION_DURATION = 200;
const TRANSITION_EASING = Easing.out(Easing.cubic);

const slideTimingSpec = {
  animation: 'timing' as const,
  config: {duration: TRANSITION_DURATION, easing: TRANSITION_EASING},
};

function Tabs() {
  const insets = useSafeAreaInsets();
  const {accent, colors} = useSettings();
  // Barre légèrement remontée : on relève le contenu (icônes + libellés)
  // au-dessus du bord bas via un padding inférieur un peu plus généreux.
  const tabBarHeight = 70 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: {duration: TRANSITION_DURATION, easing: TRANSITION_EASING},
        },
        sceneStyleInterpolator: ({current}) => ({
          sceneStyle: {
            backgroundColor: colors.bg,
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                }),
              },
            ],
          },
        }),
        sceneStyle: {backgroundColor: colors.bg},
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 14,
          paddingTop: 8,
        },
        tabBarActiveTintColor: accent,
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
  const {colors, settings, hydrated} = useSettings();

  // Évite le flash : on n'affiche rien tant que les réglages ne sont pas chargés
  // (sinon on monterait Tabs avant de savoir s'il faut l'onboarding).
  if (!hydrated) {
    return <View style={{flex: 1, backgroundColor: colors.bg}} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={settings.onboarded ? 'Tabs' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyle: {backgroundColor: colors.bg},
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        transitionSpec: {
          open: slideTimingSpec,
          close: slideTimingSpec,
        },
      }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Shopping" component={ShoppingScreen} />
      <Stack.Screen name="CreateList" component={CreateListScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
