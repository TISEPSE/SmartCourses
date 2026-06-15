/**
 * Catalogue des fournisseurs d'IA proposés dans l'app. L'utilisateur fournit sa
 * propre clé API ; rien n'est pré-configuré côté serveur.
 *
 * Deux formats d'API sont gérés (voir src/services/ai.ts) :
 *  - 'anthropic'  → API Messages de Claude (/v1/messages, en-tête x-api-key)
 *  - 'openai'     → API compatible OpenAI (/chat/completions, Bearer token)
 *    OpenAI, Gemini (endpoint compatible OpenAI de Google) et Mistral entrent
 *    tous dans ce format, ainsi qu'un serveur personnalisé (Ollama, vLLM…).
 */
export type AiFormat = 'anthropic' | 'openai';

export interface AiProvider {
  id: string;
  label: string;
  format: AiFormat;
  /** Base de l'URL d'API (sans slash final). Vide pour « custom » (saisie). */
  apiBase: string;
  /** Chemin du endpoint de complétion, accolé à apiBase. */
  apiPath: string;
  defaultModel: string;
  /** Modèles suggérés dans le menu déroulant. */
  models: string[];
  /** Page où récupérer sa clé API ('' si sans objet). */
  keyUrl: string;
  /** Domaine affiché à côté du lien « où trouver ma clé ». */
  keyHost: string;
  /** Glyphe MaterialCommunityIcons utilisé comme logo stylisé. */
  icon: string;
  /** Couleur de marque du badge. */
  color: string;
  blurb: string;
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'claude',
    label: 'Claude',
    format: 'anthropic',
    apiBase: 'https://api.anthropic.com',
    apiPath: '/v1/messages',
    defaultModel: 'claude-opus-4-8',
    models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHost: 'console.anthropic.com',
    icon: 'star-four-points',
    color: '#D97757',
    blurb: 'Anthropic · le plus soigné',
  },
  {
    id: 'openai',
    label: 'ChatGPT (OpenAI)',
    format: 'openai',
    apiBase: 'https://api.openai.com/v1',
    apiPath: '/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHost: 'platform.openai.com',
    icon: 'robot-outline',
    color: '#10A37F',
    blurb: 'OpenAI',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    format: 'openai',
    apiBase: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiPath: '/chat/completions',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    keyUrl: 'https://aistudio.google.com/apikey',
    keyHost: 'aistudio.google.com',
    icon: 'google',
    color: '#1A73E8',
    blurb: 'Google',
  },
  {
    id: 'mistral',
    label: 'Mistral',
    format: 'openai',
    apiBase: 'https://api.mistral.ai/v1',
    apiPath: '/chat/completions',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-small-latest', 'mistral-large-latest', 'open-mistral-nemo'],
    keyUrl: 'https://console.mistral.ai/api-keys',
    keyHost: 'console.mistral.ai',
    icon: 'weather-windy',
    color: '#FA520F',
    blurb: 'Mistral AI',
  },
  {
    id: 'custom',
    label: 'Serveur personnalisé',
    format: 'openai',
    apiBase: '',
    apiPath: '/v1/chat/completions',
    defaultModel: '',
    models: [],
    keyUrl: '',
    keyHost: '',
    icon: 'server-network',
    color: '#6B7280',
    blurb: 'Ollama, vLLM, LM Studio… (API OpenAI)',
  },
];

export function getProvider(id: string): AiProvider | undefined {
  return AI_PROVIDERS.find(p => p.id === id);
}
