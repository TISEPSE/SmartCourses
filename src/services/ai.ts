import {AppSettings} from '../context/SettingsContext';

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

function requireConfig(settings: AppSettings): string {
  const base = settings.aiBaseUrl.trim().replace(/\/$/, '');
  if (!base) {
    throw new AiError(
      'Aucun serveur IA configuré. Renseigne l’URL dans Paramètres → IA.',
    );
  }
  return base;
}

async function postChat(
  settings: AppSettings,
  messages: ChatMessage[],
  signal?: AbortSignal,
  temperature = 0.4,
): Promise<string> {
  const base = requireConfig(settings);
  const url = `${base}/v1/chat/completions`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.aiApiKey.trim()
          ? {Authorization: `Bearer ${settings.aiApiKey.trim()}`}
          : {}),
      },
      body: JSON.stringify({
        model: settings.aiModel || 'qwen2.5:3b',
        messages,
        temperature,
        stream: false,
      }),
      signal,
    });
  } catch {
    throw new AiError(
      `Impossible de joindre le serveur IA (${base}). Vérifie l’URL et que le serveur est accessible depuis le téléphone.`,
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AiError(`Le serveur IA a répondu ${res.status}. ${text.slice(0, 200)}`);
  }

  const data = await res.json().catch(() => null);
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiError('Réponse du serveur IA vide ou invalide.');
  }
  return content.trim();
}

const CHAT_SYSTEM: ChatMessage = {
  role: 'system',
  content:
    'Tu es un assistant de courses et de cuisine. Réponds en français, de façon concise et pratique. ' +
    'Si l’utilisateur demande de créer/générer une liste de courses ou de planifier des repas, ' +
    'réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte ni balise autour, au format : ' +
    '{"name":"nom court","items":["ingrédient avec quantité","..."]}. ' +
    'Règles strictes pour la liste : inclure TOUS les ingrédients réellement nécessaires à la recette ' +
    'demandée (rien d’oublié), chacun avec une quantité réaliste adaptée au nombre de personnes indiqué ' +
    '(ex. "6 œufs", "500 g de farine de blé", "1 L de lait", "100 g de beurre"). ' +
    'Orthographe française correcte et noms d’ingrédients exacts ; aucun article inventé, en double, ' +
    'ni marqué "facultatif". ' +
    'Pour toute autre demande (salutation, question, conseil), réponds normalement en texte clair, sans JSON.',
};

/**
 * Tente d'extraire une liste de courses d'une réponse brute du modèle.
 * Renvoie null si la réponse n'est pas une liste JSON exploitable
 * (ex. une réponse conversationnelle en texte).
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

/** Conversation libre (réponse complète, non-streaming). */
export async function chat(
  settings: AppSettings,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  return postChat(settings, [CHAT_SYSTEM, ...messages], signal);
}

export interface StreamHandle {
  /** Interrompt le flux en cours. */
  abort: () => void;
}

/**
 * Conversation en streaming (SSE). React Native ne sait pas lire un corps de
 * réponse en flux via fetch, mais XMLHttpRequest expose le texte accumulé au
 * fil des onprogress — on y parse les chunks `data: {...}` au format OpenAI.
 * `onToken` reçoit le texte complet accumulé à chaque nouveau morceau.
 */
export function chatStream(
  settings: AppSettings,
  messages: ChatMessage[],
  onToken: (fullText: string) => void,
): {promise: Promise<string>} & StreamHandle {
  const base = requireConfig(settings);
  const url = `${base}/v1/chat/completions`;
  const xhr = new XMLHttpRequest();

  const promise = new Promise<string>((resolve, reject) => {
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (settings.aiApiKey.trim()) {
      xhr.setRequestHeader('Authorization', `Bearer ${settings.aiApiKey.trim()}`);
    }

    let full = '';
    let consumed = 0;
    let buffer = '';

    xhr.onprogress = () => {
      // Nouveau texte depuis le dernier événement
      buffer += xhr.responseText.substring(consumed);
      consumed = xhr.responseText.length;

      // On ne traite que les lignes complètes ; on garde le reste en buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta: string | undefined = json?.choices?.[0]?.delta?.content;
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
          `Impossible de joindre le serveur IA (${base}). Vérifie l’URL et l’accès réseau.`,
        ),
      );
    };

    xhr.send(
      JSON.stringify({
        model: settings.aiModel || 'qwen2.5:3b',
        messages: [CHAT_SYSTEM, ...messages],
        temperature: 0.4,
        stream: true,
      }),
    );
  });

  return {promise, abort: () => xhr.abort()};
}
