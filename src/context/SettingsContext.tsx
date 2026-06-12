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
}

export const THEMES: Record<ThemeName, {accent: string; onAccent: string; label: string}> = {
  blanc: {accent: '#FFFFFF', onAccent: '#000000', label: 'Blanc'},
  bleu: {accent: '#4F8EF7', onAccent: '#FFFFFF', label: 'Bleu'},
  vert: {accent: '#34C759', onAccent: '#FFFFFF', label: 'Vert'},
  violet: {accent: '#A78BFA', onAccent: '#FFFFFF', label: 'Violet'},
  ambre: {accent: '#F5A623', onAccent: '#000000', label: 'Ambre'},
};

const DEFAULTS: AppSettings = {
  haptics: true,
  notifications: true,
  theme: 'blanc',
  autoHideChecked: false,
  sortCheckedBottom: false,
  confirmDelete: true,
  userName: '',
};

const STORAGE_KEY = '@sc_settings';

interface SettingsContextValue {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  accent: string;
  onAccent: string;
  haptic: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  setSetting: () => {},
  accent: THEMES.blanc.accent,
  onAccent: THEMES.blanc.onAccent,
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
        haptic,
      }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
