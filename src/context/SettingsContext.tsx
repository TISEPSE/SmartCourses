import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Vibration} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'blanc' | 'bleu' | 'vert' | 'violet' | 'ambre';

export interface AppSettings {
  haptics: boolean;
  notifications: boolean;
  theme: ThemeName;
  autoHideChecked: boolean;
  sortCheckedBottom: boolean;
  confirmDelete: boolean;
  userName: string;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
}

interface Theme {
  accent: string;
  onAccent: string;
  /** Accent translucide pour les fonds teintés (badges, surfaces). */
  accentSoft: string;
  label: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  blanc: {accent: '#FFFFFF', onAccent: '#000000', accentSoft: 'rgba(255,255,255,0.12)', label: 'Blanc'},
  bleu: {accent: '#4F8EF7', onAccent: '#FFFFFF', accentSoft: 'rgba(79,142,247,0.18)', label: 'Bleu'},
  vert: {accent: '#34C759', onAccent: '#FFFFFF', accentSoft: 'rgba(52,199,89,0.18)', label: 'Vert'},
  violet: {accent: '#A78BFA', onAccent: '#FFFFFF', accentSoft: 'rgba(167,139,250,0.20)', label: 'Violet'},
  ambre: {accent: '#F5A623', onAccent: '#000000', accentSoft: 'rgba(245,166,35,0.18)', label: 'Ambre'},
};

const DEFAULTS: AppSettings = {
  haptics: true,
  notifications: true,
  theme: 'blanc',
  autoHideChecked: false,
  sortCheckedBottom: false,
  confirmDelete: true,
  userName: '',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: 'llama3.1',
};

const STORAGE_KEY = '@sc_settings';

interface SettingsContextValue {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  accent: string;
  onAccent: string;
  accentSoft: string;
  haptic: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  setSetting: () => {},
  accent: THEMES.blanc.accent,
  onAccent: THEMES.blanc.onAccent,
  accentSoft: THEMES.blanc.accentSoft,
  haptic: () => {},
});

export function SettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({...DEFAULTS, ...JSON.parse(raw)});
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

  const theme = THEMES[settings.theme] ?? THEMES.blanc;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSetting,
        accent: theme.accent,
        onAccent: theme.onAccent,
        accentSoft: theme.accentSoft,
        haptic,
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
