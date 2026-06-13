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
        model: settings.aiModel || 'llama3.1',
        messages,
        temperature: 0.4,
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

/** Conversation libre. */
export async function chat(
  settings: AppSettings,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const withSystem: ChatMessage[] = [
    {
      role: 'system',
      content:
        'Tu es un assistant de courses et de cuisine. Réponds en français, de façon concise et pratique.',
    },
    ...messages,
  ];
  return postChat(settings, withSystem, signal);
}

/**
 * Génère une liste de courses structurée à partir d'une demande en langage
 * naturel. Demande un JSON strict et le parse de façon robuste.
 */
export async function generateGroceryList(
  settings: AppSettings,
  prompt: string,
  signal?: AbortSignal,
): Promise<GeneratedList> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'Tu génères des listes de courses. Réponds UNIQUEMENT avec un objet JSON ' +
        'valide, sans texte autour, au format : ' +
        '{"name": "nom court de la liste", "items": ["article 1", "article 2"]}. ' +
        'Les articles sont concis (nom + quantité si utile), en français.',
    },
    {role: 'user', content: prompt},
  ];

  const raw = await postChat(settings, messages, signal);

  // Le modèle peut entourer le JSON de texte ou de balises ```json
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new AiError('La réponse de l’IA n’était pas au format attendu.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new AiError('Impossible de lire la liste générée par l’IA.');
  }

  const items: string[] = Array.isArray(parsed.items)
    ? parsed.items.map((i: any) => String(i).trim()).filter(Boolean)
    : [];
  if (items.length === 0) {
    throw new AiError('L’IA n’a renvoyé aucun article.');
  }

  return {
    name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Liste IA',
    items,
  };
}
