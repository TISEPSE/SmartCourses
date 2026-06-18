import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Palette, spacing} from '../theme';
import {AppBar, Card} from '../components';
import {useSettings} from '../context/SettingsContext';

interface Section {
  title: string;
  body: string;
}

const UPDATED = '19 juin 2026';

const SECTIONS: Section[] = [
  {
    title: 'En résumé',
    body: "Smart Courses ne possède aucun serveur et ne collecte aucune donnée vous concernant. Toutes vos informations restent sur votre téléphone. Aucun compte, aucune publicité, aucun traceur, aucun outil d'analyse.",
  },
  {
    title: 'Données sur votre appareil',
    body: 'Sont enregistrés localement : votre prénom et nom (facultatifs), vos listes de courses, vos recettes et favoris, vos achats terminés et leurs montants, et vos préférences (thème, haptique…). Rien n’est transmis. Vous pouvez tout effacer dans Paramètres → Données → Tout réinitialiser.',
  },
  {
    title: 'Assistant IA (facultatif)',
    body: "L'assistant est désactivé par défaut. Si vous l'activez avec votre propre clé d'API, cette clé est stockée de façon chiffrée sur votre téléphone (trousseau sécurisé du système, jamais en texte brut) pour éviter de la ressaisir à chaque ouverture. Vos messages sont envoyés directement au fournisseur que vous choisissez (Anthropic, OpenAI, Google, Mistral ou serveur personnel). Smart Courses ne reçoit ni ne stocke ces échanges ; ils sont régis par la politique du fournisseur.",
  },
  {
    title: 'Permissions',
    body: 'Internet : uniquement pour communiquer avec le fournisseur d’IA que vous configurez (aucune connexion sans IA activée). Vibration : pour le retour haptique. Aucun accès à la localisation, la caméra, les contacts, les fichiers ou le micro.',
  },
  {
    title: 'Enfants',
    body: 'Smart Courses ne s’adresse pas spécifiquement aux enfants et ne collecte sciemment aucune donnée les concernant.',
  },
  {
    title: 'Contact',
    body: 'Pour toute question concernant cette politique de confidentialité, ouvrez une demande (issue) sur le dépôt GitHub du projet : https://github.com/TISEPSE/SmartCourses/issues',
  },
];

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {colors} = useSettings();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Confidentialité" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Politique de confidentialité · mise à jour le {UPDATED}
        </Text>
        {SECTIONS.map(s => (
          <Card key={s.title} style={styles.card}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </Card>
        ))}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    scroll: {flex: 1},
    content: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm},
    intro: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text3,
      marginBottom: spacing.md,
    },
    card: {padding: spacing.lg, marginBottom: spacing.md},
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    body: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 21,
      color: colors.text2,
    },
    bottomSpace: {height: 32},
  });
