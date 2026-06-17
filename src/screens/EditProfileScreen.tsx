import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Palette, spacing} from '../theme';
import {AppBar, Btn, Field} from '../components';
import {useSettings} from '../context/SettingsContext';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {settings, setSetting, colors, accent, onAccent, haptic} = useSettings();
  const styles = makeStyles(colors);
  const [firstName, setFirstName] = useState(settings.firstName);
  const [lastName, setLastName] = useState(settings.lastName);

  const fullName = `${firstName} ${lastName}`.trim();
  const initials = fullName
    ? fullName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SC';

  const save = () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    setSetting('firstName', fn);
    setSetting('lastName', ln);
    setSetting('userName', `${fn} ${ln}`.trim());
    haptic();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {paddingTop: insets.top}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AppBar title="Mon profil" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, {backgroundColor: accent}]}>
            <Text style={[styles.avatarText, {color: onAccent}]}>{initials}</Text>
          </View>
        </View>

        <Field
          label="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          autoFocus
          returnKeyType="next"
          containerStyle={styles.fieldSpace}
        />
        <Field
          label="Nom"
          value={lastName}
          onChangeText={setLastName}
          returnKeyType="done"
          onSubmitEditing={save}
          containerStyle={styles.fieldSpace}
        />

        <View style={styles.btnWrap}>
          <Btn icon="check" onPress={save}>
            Enregistrer
          </Btn>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    scroll: {flex: 1},
    content: {padding: spacing.lg, paddingTop: spacing.md},
    avatarWrap: {alignItems: 'center', marginVertical: spacing.xl},
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {fontSize: 32, fontWeight: '800'},
    fieldSpace: {marginTop: spacing.md},
    btnWrap: {marginTop: 36},
  });
