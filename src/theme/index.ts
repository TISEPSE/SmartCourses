// Palettes complètes : chaque thème teinte TOUTE l'app (fond, surfaces, cartes,
// bordures, textes, accent), pas seulement les boutons.

export type ThemeName = 'nuit' | 'ocean' | 'foret' | 'amethyste' | 'braise';

export interface Palette {
  label: string;
  bg: string;
  surface: string;
  card: string;
  cardHi: string;
  border: string;
  borderSoft: string;
  text: string;
  text2: string;
  text3: string;
  text4: string;
  primary: string;
  accent: string;
  onAccent: string;
  /** Accent translucide pour les fonds teintés (badges, bulles, surfaces). */
  accentSoft: string;
}

export const PALETTES: Record<ThemeName, Palette> = {
  nuit: {
    label: 'Nuit',
    bg: '#000000',
    surface: '#111111',
    card: '#1A1A1A',
    cardHi: '#222222',
    border: '#2A2A2A',
    borderSoft: '#1E1E1E',
    text: '#FFFFFF',
    text2: '#888888',
    text3: '#555555',
    text4: '#333333',
    primary: '#FFFFFF',
    accent: '#FFFFFF',
    onAccent: '#000000',
    accentSoft: 'rgba(255,255,255,0.12)',
  },
  ocean: {
    label: 'Océan',
    bg: '#07090F',
    surface: '#0E1320',
    card: '#141A2A',
    cardHi: '#1C2740',
    border: '#243049',
    borderSoft: '#161D2E',
    text: '#EDF1F8',
    text2: '#8A93A8',
    text3: '#555F73',
    text4: '#333A47',
    primary: '#4F8EF7',
    accent: '#4F8EF7',
    onAccent: '#FFFFFF',
    accentSoft: 'rgba(79,142,247,0.18)',
  },
  foret: {
    label: 'Forêt',
    bg: '#060B08',
    surface: '#0D1511',
    card: '#121C16',
    cardHi: '#18261D',
    border: '#213027',
    borderSoft: '#14201A',
    text: '#ECF3EE',
    text2: '#87968C',
    text3: '#535F58',
    text4: '#323A35',
    primary: '#34C759',
    accent: '#34C759',
    onAccent: '#04140A',
    accentSoft: 'rgba(52,199,89,0.18)',
  },
  amethyste: {
    label: 'Améthyste',
    bg: '#0A070F',
    surface: '#130E1C',
    card: '#1A1326',
    cardHi: '#251A36',
    border: '#2E2342',
    borderSoft: '#1D1430',
    text: '#F0ECF8',
    text2: '#918AA8',
    text3: '#5A5273',
    text4: '#383347',
    primary: '#A78BFA',
    accent: '#A78BFA',
    onAccent: '#1B1030',
    accentSoft: 'rgba(167,139,250,0.20)',
  },
  braise: {
    label: 'Braise',
    bg: '#0B0805',
    surface: '#15100A',
    card: '#1E1610',
    cardHi: '#2A1F14',
    border: '#352819',
    borderSoft: '#1F1810',
    text: '#F6F0E8',
    text2: '#9C9082',
    text3: '#635A4C',
    text4: '#3C352B',
    primary: '#F5A623',
    accent: '#F5A623',
    onAccent: '#1A1206',
    accentSoft: 'rgba(245,166,35,0.18)',
  },
};

/**
 * Palette statique par défaut (thème Nuit). Sert de repli ; en pratique l'app
 * lit la palette du thème courant via `useSettings().colors`.
 */
export const colors = PALETTES.nuit;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const font = {
  regular: 400,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;
