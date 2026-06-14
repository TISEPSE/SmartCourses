import {DEFAULT_AI_API_KEY} from './secrets';

/**
 * Valeurs IA pré-configurées : l'app est fonctionnelle dès l'installation, sans
 * que l'utilisateur ait à saisir quoi que ce soit. Tout reste modifiable dans
 * Paramètres → Assistant IA (les valeurs saisies par l'utilisateur priment).
 */
export const AI_DEFAULTS = {
  baseUrl: 'https://example.com',
  model: 'qwen2.5:3b',
  apiKey: DEFAULT_AI_API_KEY,
};
