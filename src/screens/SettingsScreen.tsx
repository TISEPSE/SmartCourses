import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList} from '../types';
import {colors, spacing} from '../theme';
import {AppBar, Card, Divider, SectionLabel, Row} from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState(true);
  const [haptics, setHaptics] = useState(true);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <AppBar title="Paramètres" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}>

        <SectionLabel label="Navigation" />
        <Card>
          <Row
            icon="fridge"
            title="Garde-manger"
            subtitle="Gérer les stocks"
            onPress={() => navigation.navigate('Pantry')}
          />
          <Divider />
          <Row
            icon="history"
            title="Historique"
            subtitle="Courses terminées"
            onPress={() => navigation.navigate('History')}
          />
          <Divider />
          <Row
            icon="tune"
            title="Préférences"
            subtitle="Régime, budget"
            onPress={() => navigation.navigate('Preferences')}
          />
        </Card>

        <SectionLabel label="Notifications" />
        <Card>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Rappels de courses</Text>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              thumbColor={notifs ? colors.bg : colors.text3}
              trackColor={{true: colors.text, false: colors.cardHi}}
            />
          </View>
        </Card>

        <SectionLabel label="Application" />
        <Card>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Retour haptique</Text>
            <Switch
              value={haptics}
              onValueChange={setHaptics}
              thumbColor={haptics ? colors.bg : colors.text3}
              trackColor={{true: colors.text, false: colors.cardHi}}
            />
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </Card>

        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  scroll: {flex: 1},
  content: {paddingHorizontal: spacing.lg},
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  toggleLabel: {fontSize: 15, fontWeight: '700', color: colors.text},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  infoLabel: {fontSize: 15, fontWeight: '700', color: colors.text},
  infoValue: {fontSize: 14, fontWeight: '600', color: colors.text2},
});
