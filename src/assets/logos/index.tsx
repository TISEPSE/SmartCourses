import React from 'react';
import {View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SvgProps} from 'react-native-svg';

import ClaudeLogo from './claude.svg';
import OpenaiLogo from './openai.svg';
import GeminiLogo from './gemini.svg';
import MistralLogo from './mistral.svg';

// Logos officiels des fournisseurs (SVG vectoriels, hors-ligne).
const LOGOS: Record<string, React.FC<SvgProps>> = {
  claude: ClaudeLogo,
  openai: OpenaiLogo,
  gemini: GeminiLogo,
  mistral: MistralLogo,
};

interface ProviderBadgeProps {
  /** Identifiant du fournisseur (cf. config/providers.ts). */
  id: string;
  /** Icône MaterialCommunityIcons de repli (fournisseurs sans logo, ex. custom). */
  fallbackIcon: string;
  /** Couleur de fond de repli (fournisseurs sans logo). */
  fallbackColor: string;
  size?: number;
}

/**
 * Badge carré du fournisseur : logo officiel sur fond clair, ou icône de repli
 * sur fond coloré pour les fournisseurs sans logo (serveur personnalisé).
 */
export function ProviderBadge({
  id,
  fallbackIcon,
  fallbackColor,
  size = 38,
}: ProviderBadgeProps) {
  const Logo = LOGOS[id];
  if (Logo) {
    return (
      <View style={[styles.badge, styles.badgeLight, {width: size, height: size}]}>
        <Logo width={size * 0.62} height={size * 0.62} />
      </View>
    );
  }
  return (
    <View
      style={[styles.badge, {width: size, height: size, backgroundColor: fallbackColor}]}>
      <Icon name={fallbackIcon} size={size * 0.52} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLight: {
    backgroundColor: '#FFFFFF',
  },
});
