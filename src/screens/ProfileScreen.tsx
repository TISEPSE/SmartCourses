import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList} from '../types';
import {colors, spacing} from '../theme';
import {AppBar, Card, Row, SectionLabel, Btn, Divider} from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const sections: {label: string; rows: {icon: string; title: string; sub?: string; onPress?: () => void}[]}[] = [
    {
      label: 'Compte',
      rows: [
        {icon: 'account', title: 'Informations personnelles', sub: 'Nom, photo'},
        {icon: 'tune', title: 'Préférences', sub: 'Régime, budget', onPress: () => navigation.navigate('Settings')},
        {icon: 'fridge', title: 'Mon garde-manger', sub: '0 articles', onPress: () => navigation.navigate('Pantry')},
      ],
    },
    {
      label: 'Application',
      rows: [
        {icon: 'bell', title: 'Notifications', sub: 'Rappels'},
        {icon: 'storefront', title: 'Magasin par défaut', sub: 'Non défini'},
      ],
    },
    {
      label: 'Support',
      rows: [
        {icon: 'help-circle', title: 'Aide & retours'},
        {icon: 'shield', title: 'Confidentialité'},
      ],
    },
  ];

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Profil" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SC</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Smart Courses</Text>
            <Text style={styles.profileEmail}>Application locale</Text>
          </View>
        </Card>

        {sections.map(sec => (
          <View key={sec.label}>
            <SectionLabel label={sec.label} />
            <Card>
              {sec.rows.map((r, i) => (
                <React.Fragment key={r.title}>
                  {i > 0 && <Divider />}
                  <Row
                    icon={r.icon}
                    title={r.title}
                    subtitle={r.sub}
                    onPress={r.onPress}
                  />
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {paddingHorizontal: spacing.lg},
  profileCard: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.cardHi,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 18, fontWeight: '800', color: colors.text},
  profileInfo: {flex: 1},
  profileName: {fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3},
  profileEmail: {fontSize: 13.5, color: colors.text2, fontWeight: '600', marginTop: 2},
});
