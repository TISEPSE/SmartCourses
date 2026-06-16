import {ImageSourcePropType} from 'react-native';

// Photos locales des recettes — 100% hors-ligne.
//
// COMMENT AJOUTER TES PHOTOS :
//   1. Dépose tes fichiers .jpg / .png dans ce dossier (src/assets/recipes/).
//   2. Décommente la ligne correspondante ci-dessous (ou ajoute-en une) en
//      reliant l'identifiant de la recette à `require('./mon-fichier.jpg')`.
//
// Tant qu'une recette n'a pas de photo ici, l'application affiche son emoji
// de repli (cf. champ `emoji` dans src/data/recipes.ts). Aucune connexion
// internet n'est jamais utilisée.
export const RECIPE_IMAGES: Record<string, ImageSourcePropType> = {
  r_galette_complete: require('./galette-complete.jpg'),
  r_poulet_curry: require('./poulet-curry.jpg'),
  r_pates_carbonara: require('./pates-carbonara.jpg'),
  r_salade_cesar: require('./salade-cesar.jpg'),
  // Ajoute les photos manquantes puis décommente :
  // r_soupe_legumes: require('./soupe-legumes.jpg'),
  // r_tarte_pommes: require('./tarte-pommes.jpg'),
};

/** Renvoie la photo locale d'une recette, ou `undefined` (repli emoji). */
export function recipeImage(id: string): ImageSourcePropType | undefined {
  return RECIPE_IMAGES[id];
}
