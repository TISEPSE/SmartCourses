import {Ingredient, Recipe} from '../types';

// Recettes d'exemple chargées au premier lancement (puis modifiables/persistées).
// Quantités exprimées pour `serves` personnes ; elles sont recalculées à la volée
// selon le nombre de personnes choisi sur la fiche recette.
// Les photos sont locales (cf. src/assets/recipes/) avec repli sur `emoji`.
export const EXAMPLE_RECIPES: Recipe[] = [
  {
    id: 'r_galette_complete',
    name: 'Galettes complètes',
    tag: 'Bretagne',
    time: 15,
    kcal: 420,
    serves: 4,
    fav: true,
    emoji: '🥞',
    ingredients: [
      {qty: 4, name: 'galettes de sarrasin (toutes prêtes)'},
      {qty: 4, name: 'œufs'},
      {qty: 4, unit: 'tranches', name: 'de jambon blanc'},
      {qty: 150, unit: 'g', name: "d'emmental râpé"},
      {qty: 40, unit: 'g', name: 'de beurre'},
      {name: 'Sel, poivre'},
    ],
    steps: [
      'Faire chauffer une galette de sarrasin à la poêle, à feu moyen, avec une noix de beurre.',
      'Casser un œuf au centre et répartir le jambon et l’emmental tout autour.',
      'Laisser fondre le fromage et prendre le blanc d’œuf pendant 2 à 3 min.',
      'Rabattre les quatre bords en carré, saler, poivrer et servir bien chaud.',
    ],
  },
  {
    id: 'r_poulet_curry',
    name: 'Poulet au curry coco',
    tag: 'Plat principal',
    time: 35,
    kcal: 540,
    serves: 4,
    fav: false,
    emoji: '🍛',
    ingredients: [
      {qty: 600, unit: 'g', name: 'de blancs de poulet'},
      {qty: 1, name: 'oignon'},
      {qty: 2, unit: 'gousses', name: "d'ail"},
      {qty: 40, unit: 'cl', name: 'de lait de coco'},
      {qty: 2, unit: 'c. à soupe', name: 'de pâte de curry'},
      {qty: 1, unit: 'c. à soupe', name: "d'huile d'olive"},
      {qty: 250, unit: 'g', name: 'de riz basmati'},
      {name: 'Sel, poivre, coriandre fraîche'},
    ],
    steps: [
      'Couper le poulet en morceaux, émincer l’oignon et l’ail.',
      'Faire revenir l’oignon et l’ail dans l’huile, ajouter le poulet et le faire dorer.',
      'Ajouter la pâte de curry puis le lait de coco, et laisser mijoter 15 min.',
      'Cuire le riz en parallèle. Servir le poulet sur le riz et parsemer de coriandre.',
    ],
  },
  {
    id: 'r_pates_carbonara',
    name: 'Pâtes à la carbonara',
    tag: 'Italie',
    time: 20,
    kcal: 650,
    serves: 2,
    fav: false,
    emoji: '🍝',
    ingredients: [
      {qty: 200, unit: 'g', name: 'de spaghettis'},
      {qty: 100, unit: 'g', name: 'de pancetta (ou lardons)'},
      {qty: 2, name: "jaunes d'œufs"},
      {qty: 50, unit: 'g', name: 'de parmesan râpé'},
      {name: 'Sel, poivre noir'},
    ],
    steps: [
      'Cuire les pâtes dans un grand volume d’eau bouillante salée.',
      'Faire dorer la pancetta à la poêle, sans matière grasse.',
      'Mélanger les jaunes d’œufs et le parmesan dans un bol.',
      'Égoutter les pâtes, les mélanger hors du feu avec la pancetta puis la crème d’œufs. Poivrer généreusement.',
    ],
  },
  {
    id: 'r_salade_cesar',
    name: 'Salade César',
    tag: 'Salade',
    time: 25,
    kcal: 380,
    serves: 2,
    fav: false,
    emoji: '🥗',
    ingredients: [
      {qty: 1, name: 'cœur de laitue romaine'},
      {qty: 2, name: 'blancs de poulet'},
      {qty: 50, unit: 'g', name: 'de parmesan'},
      {qty: 2, unit: 'tranches', name: 'de pain (croûtons)'},
      {qty: 1, name: "jaune d'œuf"},
      {qty: 1, unit: 'c. à café', name: 'de moutarde'},
      {qty: 2, unit: 'c. à soupe', name: "d'huile d'olive"},
      {name: 'Filet de jus de citron'},
    ],
    steps: [
      'Griller les blancs de poulet et les couper en lamelles. Toaster les croûtons.',
      'Préparer la sauce : jaune d’œuf, moutarde, citron, huile et parmesan.',
      'Laver et couper la salade romaine.',
      'Assembler salade, poulet, croûtons et sauce, puis ajouter des copeaux de parmesan.',
    ],
  },
  {
    id: 'r_soupe_legumes',
    name: 'Soupe de légumes',
    tag: 'Réconfortant',
    time: 40,
    kcal: 180,
    serves: 4,
    fav: false,
    emoji: '🍲',
    ingredients: [
      {qty: 3, name: 'carottes'},
      {qty: 2, name: 'pommes de terre'},
      {qty: 1, name: 'poireau'},
      {qty: 1, name: 'oignon'},
      {qty: 1, name: 'courgette'},
      {qty: 1, name: 'cube de bouillon de légumes'},
      {qty: 1, unit: 'litre', name: "d'eau"},
      {name: 'Sel, poivre'},
    ],
    steps: [
      'Éplucher et couper tous les légumes en morceaux.',
      'Faire revenir l’oignon, ajouter les légumes, l’eau et le cube de bouillon.',
      'Laisser cuire 30 min à feu moyen.',
      'Mixer jusqu’à obtenir une texture lisse et rectifier l’assaisonnement.',
    ],
  },
  {
    id: 'r_tarte_pommes',
    name: 'Tarte aux pommes',
    tag: 'Dessert',
    time: 50,
    kcal: 320,
    serves: 6,
    fav: false,
    emoji: '🥧',
    ingredients: [
      {qty: 1, name: 'pâte brisée (toute prête)'},
      {qty: 5, name: 'pommes'},
      {qty: 50, unit: 'g', name: 'de sucre'},
      {qty: 20, unit: 'g', name: 'de beurre'},
      {qty: 1, name: 'sachet de sucre vanillé'},
      {qty: 1, unit: 'c. à soupe', name: "de confiture d'abricot"},
    ],
    steps: [
      'Préchauffer le four à 180 °C et étaler la pâte brisée dans un moule.',
      'Éplucher et couper les pommes en fines lamelles.',
      'Disposer les pommes en rosace, saupoudrer de sucre et de sucre vanillé, parsemer de beurre.',
      'Cuire 35 min. À la sortie, napper de confiture d’abricot pour le brillant.',
    ],
  },
];

/** Arrondi lisible d'une quantité : au demi près sous 10, au plus proche de 5 au-delà. */
export function formatQty(n: number): string {
  const r = n < 10 ? Math.round(n * 2) / 2 : Math.round(n / 5) * 5;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
}

/**
 * Met en forme un ingrédient pour un facteur d'échelle donné
 * (= nombre de personnes choisi / nombre de personnes de référence).
 */
export function ingredientLine(ing: Ingredient, factor: number): string {
  if (ing.qty == null) {
    return ing.name; // non quantifiable (sel, poivre…)
  }
  const scaled = ing.qty * factor;
  // Pièces (sans unité) : on arrondit à l'entier le plus proche, au moins 1.
  const shown = ing.unit
    ? formatQty(scaled)
    : String(Math.max(1, Math.round(scaled)));
  return [shown, ing.unit, ing.name].filter(Boolean).join(' ');
}
