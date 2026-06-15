import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Vibration} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
const CURRENT_MIGRATION = 3;

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
});

export function SettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
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
          if (mig < 3) {
            // Bascule du modèle « IA intégrée » (VPS supprimé) vers le nouveau
            // schéma multi-fournisseurs : l'utilisateur fournit sa propre clé.
            const OLD_VPS = 'https://example.com';
            if (stored.aiProvider == null) {
              if (!stored.aiBaseUrl || stored.aiBaseUrl === OLD_VPS) {
                // Anciennement sur l'IA intégrée (disparue) : repart sans IA.
                stored.aiProvider = '';
                stored.aiBaseUrl = '';
                stored.aiApiKey = '';
                stored.aiModel = '';
              } else {
                // Serveur personnalisé déjà saisi : on le conserve en « custom ».
                stored.aiProvider = 'custom';
              }
            }
          }

          const merged = {...DEFAULTS, ...stored};
          setSettings(merged);

          if (mig < CURRENT_MIGRATION) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            AsyncStorage.setItem(MIGRATION_KEY, String(CURRENT_MIGRATION));
          }
        } else {
          // Install neuve : pas de migration à rejouer plus tard.
          AsyncStorage.setItem(MIGRATION_KEY, String(CURRENT_MIGRATION));
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings(prev => {
        const next = {...prev, [key]: value};
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
