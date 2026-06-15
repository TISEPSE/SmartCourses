import {AppSettings} from '../context/SettingsContext';
import {AiFormat, getProvider} from '../config/providers';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeneratedList {
  name: string;
  items: string[];
}

/** Erreur lisible côté UI (réseau, config manquante, réponse invalide). */
export class AiError extends Error {}

interface Resolved {
  format: AiFormat;
  url: string;
  model: string;
  apiKey: string;
}

/** true si une IA est configurée et utilisable (fournisseur + infos requises). */
export function isAiConfigured(settings: AppSettings): boolean {
  const provider = getProvider(settings.aiProvider);
  if (!provider) return false; // '' (sans IA) ou inconnu
  if (provider.id === 'custom') {
    return settings.aiBaseUrl.trim().length > 0;
  }
  // Fournisseurs cloud : une clé API est nécessaire.
  return settings.aiApiKey.trim().length > 0;
}

function resolveConfig(settings: AppSettings): Resolved {
  const provider = getProvider(settings.aiProvider);
  if (!provider) {
    throw new AiError(
      'Aucune IA configurée. Choisis un fournisseur dans Paramètres → Assistant IA.',
    );
  }
  const base =
    provider.id === 'custom'
      ? settings.aiBaseUrl.trim().replace(/\/$/, '')
      : provider.apiBase;
  if (!base) {
    throw new AiError(
      'Adresse du serveur IA manquante. Renseigne l’URL dans Paramètres → IA.',
    );
  }
  return {
    format: provider.format,
    url: base + provider.apiPath,
    model: settings.aiModel.trim() || provider.defaultModel,
    apiKey: settings.aiApiKey.trim(),
  };
}

const SYSTEM_PROMPT =
  'Tu es un assistant de courses et de cuisine. Réponds en français, de façon concise et pratique. ' +
  'Si l’utilisateur demande de créer/générer une liste de courses ou de planifier des repas, ' +
  'réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte ni balise autour, au format : ' +
  '{"name":"nom court","items":["ingrédient avec quantité","..."]}. ' +
  'IMPORTANT — identifie d’abord PRÉCISÉMENT le plat demandé avant de lister, y compris les plats ' +
  'régionaux ou composés. Exemples : une « galette complète » bretonne = galette de SARRASIN (blé noir) ' +
  'garnie de jambon, œuf et fromage râpé (emmental) — ce n’est PAS une simple pâte à crêpe ; ' +
  'un « croque-monsieur » = pain de mie, jambon, fromage, beurre, béchamel. ' +
  'Liste uniquement les ingrédients RÉELLEMENT nécessaires à CE plat précis, garniture comprise. ' +
  'Règles strictes : inclure TOUS les ingrédients (rien d’oublié), chacun avec une quantité réaliste ' +
  'adaptée au nombre de personnes indiqué (ex. "6 œufs", "300 g de farine de sarrasin", "200 g de jambon"). ' +
  'Orthographe française correcte et noms d’ingrédients exacts ; aucun article inventé, en double, ni "facultatif". ' +
  'Si le plat est ambigu, inconnu ou que tu n’es pas sûr de la recette, ne devine PAS : demande une ' +
  'précision à l’utilisateur en texte clair (sans JSON). ' +
  'Pour toute autre demande (salutation, question, conseil), réponds normalement en texte clair, sans JSON.';

const MAX_TOKENS = 2048;

/**
 * Tente d'extraire une liste de courses d'une réponse brute du modèle.
 * Renvoie null si la réponse n'est pas une liste JSON exploitable.
 */
export function extractGroceryList(raw: string): GeneratedList | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const items: string[] = Array.isArray(parsed?.items)
    ? parsed.items.map((i: any) => String(i).trim()).filter(Boolean)
    : [];
  if (items.length === 0) return null;
  return {
    name:
      typeof parsed.name === 'string' && parsed.name.trim()
        ? parsed.name.trim()
        : 'Liste',
    items,
  };
}

// ── Construction des requêtes par format ───────────────────────────────────
function buildHeaders(cfg: Resolved): Record<string, string> {
  const h: Record<string, string> = {'Content-Type': 'application/json'};
  if (cfg.format === 'anthropic') {
    h['x-api-key'] = cfg.apiKey;
    h['anthropic-version'] = '2023-06-01';
    // React Native n'est pas un navigateur, mais ce drapeau évite tout blocage
    // « direct browser access » côté SDK/proxys.
    h['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (cfg.apiKey) {
    h.Authorization = `Bearer ${cfg.apiKey}`;
  }
  return h;
}

function buildBody(
  cfg: Resolved,
  messages: ChatMessage[],
  stream: boolean,
): string {
  if (cfg.format === 'anthropic') {
    // Claude : le prompt système est un champ de premier niveau, et les rôles
    // user/assistant consécutifs sont fusionnés automatiquement par l'API.
    return JSON.stringify({
      model: cfg.model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: messages.map(m => ({role: m.role, content: m.content})),
      stream,
    });
  }
  // Compatible OpenAI : le prompt système est un message en tête.
  return JSON.stringify({
    model: cfg.model,
    messages: [{role: 'system', content: SYSTEM_PROMPT}, ...messages],
    temperature: 0.4,
    stream,
  });
}

function parseFullResponse(cfg: Resolved, data: any): string {
  if (cfg.format === 'anthropic') {
    const block = Array.isArray(data?.content)
      ? data.content.find((b: any) => b?.type === 'text')
      : null;
    return (block?.text ?? '').trim();
  }
  return (data?.choices?.[0]?.message?.content ?? '').trim();
}

/** Extrait le texte d'un chunk SSE selon le format. */
function parseStreamChunk(cfg: Resolved, json: any): string | undefined {
  if (cfg.format === 'anthropic') {
    if (json?.type === 'content_block_delta' && json?.delta?.type === 'text_delta') {
      return json.delta.text;
    }
    return undefined;
  }
  return json?.choices?.[0]?.delta?.content;
}

/** Conversation libre (réponse complète, non-streaming). */
export async function chat(
  settings: AppSettings,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const cfg = resolveConfig(settings);
  let res: Response;
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      headers: buildHeaders(cfg),
      body: buildBody(cfg, messages, false),
      signal,
    });
  } catch {
    throw new AiError(
      `Impossible de joindre le serveur IA. Vérifie ta connexion et ta configuration.`,
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AiError(`Le serveur IA a répondu ${res.status}. ${text.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => null);
  const content = parseFullResponse(cfg, data);
  if (!content) {
    throw new AiError('Réponse du serveur IA vide ou invalide.');
  }
  return content;
}

export interface StreamHandle {
  abort: () => void;
}

/**
 * Conversation en streaming (SSE). React Native ne sait pas lire un corps de
 * réponse en flux via fetch, mais XMLHttpRequest expose le texte accumulé au
 * fil des onprogress — on y parse les chunks `data: {...}`.
 * `onToken` reçoit le texte complet accumulé à chaque nouveau morceau.
 */
export function chatStream(
  settings: AppSettings,
  messages: ChatMessage[],
  onToken: (fullText: string) => void,
): {promise: Promise<string>} & StreamHandle {
  const cfg = resolveConfig(settings);
  const xhr = new XMLHttpRequest();

  const promise = new Promise<string>((resolve, reject) => {
    xhr.open('POST', cfg.url);
    const headers = buildHeaders(cfg);
    Object.keys(headers).forEach(k => xhr.setRequestHeader(k, headers[k]));

    let full = '';
    let consumed = 0;
    let buffer = '';

    xhr.onprogress = () => {
      buffer += xhr.responseText.substring(consumed);
      consumed = xhr.responseText.length;

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = parseStreamChunk(cfg, json);
          if (delta) {
            full += delta;
            onToken(full);
          }
        } catch {
          // chunk partiel ou ligne non-JSON : ignorer
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(full);
      } else {
        reject(
          new AiError(
            `Le serveur IA a répondu ${xhr.status}. ${xhr.responseText.slice(0, 200)}`,
          ),
        );
      }
    };
    xhr.onerror = () => {
      reject(
        new AiError(
          'Impossible de joindre le serveur IA. Vérifie ta connexion et ta configuration.',
        ),
      );
    };

    xhr.send(buildBody(cfg, messages, true));
  });

  return {promise, abort: () => xhr.abort()};
}
