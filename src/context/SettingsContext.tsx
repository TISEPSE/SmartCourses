import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Vibration} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {PALETTES, Palette, ThemeName} from '../theme';

export type {ThemeName} from '../theme';

export interface AppSettings {
  haptics: boolean;
  notifications: boolean;
  theme: ThemeName;
  autoHideChecked: boolean;
  sortCheckedBottom: boolean;
  confirmDelete: boolean;
  onboarded: boolean;
  firstName: string;
  lastName: string;
  userName: string;
  /** Identifiant du fournisseur d'IA (voir config/providers.ts). '' = sans IA. */
  aiProvider: string;
  /** URL d'un serveur personnalisé (fournisseur « custom » uniquement). */
  aiBaseUrl: string;
  /**
   * Stockée chiffrée dans le trousseau du système (Keychain iOS / Keystore
   * Android via react-native-keychain) — jamais en clair dans le JSON de
   * réglages persisté par AsyncStorage.
   */
  aiApiKey: string;
  aiModel: string;
}

const DEFAULTS: AppSettings = {
  haptics: true,
  notifications: true,
  theme: 'nuit',
  autoHideChecked: false,
  sortCheckedBottom: false,
  confirmDelete: true,
  onboarded: false,
  firstName: '',
  lastName: '',
  userName: '',
  aiProvider: '',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: '',
};

const STORAGE_KEY = '@sc_settings';
const MIGRATION_KEY = '@sc_migration';
// Incrémenter à chaque migration ponctuelle des réglages persistés.
const CURRENT_MIGRATION = 4;

// Espace de nommage dédié dans le trousseau système, pour ne pas entrer en
// collision avec d'autres secrets génériques d'une même app.
const KEYCHAIN_SERVICE = 'com.smartcourses.aiApiKey';

async function saveApiKey(value: string) {
  try {
    if (value) {
      await Keychain.setGenericPassword('aiApiKey', value, {
        service: KEYCHAIN_SERVICE,
      });
    } else {
      await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
    }
  } catch {
    // Trousseau indisponible sur cet appareil : on ignore silencieusement,
    // la clé reste utilisable pour la session en cours (state React).
  }
}

async function loadApiKey(): Promise<string> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    return creds ? creds.password : '';
  } catch {
    return '';
  }
}

// La clé API IA n'est jamais écrite dans le JSON de réglages : elle vit
// uniquement dans le trousseau chiffré (cf. saveApiKey/loadApiKey ci-dessus).
function persistSettings(settings: AppSettings) {
  const {aiApiKey: _aiApiKey, ...persistable} = settings;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
}

interface SettingsContextValue {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  /** true une fois les réglages chargés depuis le stockage (évite le flash). */
  hydrated: boolean;
  /** Palette complète du thème courant. */
  colors: Palette;
  accent: string;
  onAccent: string;
  accentSoft: string;
  haptic: () => void;
  /**
   * Remet tous les réglages (prénom/nom, thème, clé API IA, préférences…) à
   * leur valeur par défaut et efface leur persistance. Utilisé par
   * « Paramètres → Données → Tout réinitialiser », qui doit effacer *toutes*
   * les données décrites dans la politique de confidentialité — pas
   * uniquement les listes/recettes.
   */
  resetSettings: () => Promise<void>;
}

function paletteFor(theme: ThemeName): Palette {
  return PALETTES[theme] ?? PALETTES.nuit;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  setSetting: () => {},
  hydrated: false,
  colors: PALETTES.nuit,
  accent: PALETTES.nuit.accent,
  onAccent: PALETTES.nuit.onAccent,
  accentSoft: PALETTES.nuit.accentSoft,
  haptic: () => {},
  resetSettings: async () => {},
});

export function SettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        let merged: AppSettings = DEFAULTS;
        if (raw) {
          const stored = JSON.parse(raw);
          // Migration des anciens noms de thème vers les nouvelles ambiances.
          if (!(stored.theme in PALETTES)) {
            const legacy: Record<string, ThemeName> = {
              blanc: 'nuit',
              bleu: 'ocean',
              vert: 'foret',
              violet: 'amethyste',
              ambre: 'braise',
            };
            stored.theme = legacy[stored.theme] ?? 'nuit';
          }

          // Migrations ponctuelles des réglages déjà persistés.
          const migRaw = await AsyncStorage.getItem(MIGRATION_KEY);
          const mig = migRaw ? parseInt(migRaw, 10) : 1;
          if (mig < 3 && stored.aiProvider == null) {
            // L'ancien modèle « IA intégrée » (un serveur unique fourni par le
            // développeur) a été remplacé par le schéma multi-fournisseurs où
            // l'utilisateur fournit sa propre clé. On repart sans IA configurée
            // plutôt que de conserver une configuration désormais obsolète.
            stored.aiProvider = '';
            stored.aiBaseUrl = '';
            stored.aiApiKey = '';
            stored.aiModel = '';
          }

          if (mig < 4 && stored.aiApiKey) {
            // La clé était jusqu'ici stockée en clair dans le JSON de
            // réglages : on la déplace une seule fois vers le trousseau
            // chiffré du système, puis on l'efface du JSON ci-dessous.
            await saveApiKey(stored.aiApiKey);
          }

          merged = {...DEFAULTS, ...stored};

          if (mig < CURRENT_MIGRATION) {
            persistSettings(merged);
            AsyncStorage.setItem(MIGRATION_KEY, String(CURRENT_MIGRATION));
          }
        } else {
          // Install neuve : pas de migration à rejouer plus tard.
          AsyncStorage.setItem(MIGRATION_KEY, String(CURRENT_MIGRATION));
        }

        // La clé API IA est restaurée depuis le trousseau chiffré, jamais
        // depuis le JSON de réglages.
        const aiApiKey = await loadApiKey();
        setSettings({...merged, aiApiKey});
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      if (key === 'aiApiKey') {
        saveApiKey((value as string) ?? '');
      }
      setSettings(prev => {
        const next = {...prev, [key]: value};
        persistSettings(next);
        return next;
      });
    },
    [],
  );

  const haptic = useCallback(() => {
    if (settings.haptics) {
      Vibration.vibrate(12);
    }
  }, [settings.haptics]);

  const resetSettings = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(MIGRATION_KEY);
    await saveApiKey('');
    setSettings(DEFAULTS);
  }, []);

  const palette = paletteFor(settings.theme);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSetting,
        hydrated,
        colors: palette,
        accent: palette.accent,
        onAccent: palette.onAccent,
        accentSoft: palette.accentSoft,
        haptic,
        resetSettings,
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
