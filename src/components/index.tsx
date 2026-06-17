import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  ImageSourcePropType,
  StyleProp,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  Pressable,
  Image,
  GestureResponderEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Palette, PALETTES, ThemeName, radius, spacing, withAlpha} from '../theme';
import {useSettings} from '../context/SettingsContext';

// ── Touchable (Material) ────────────────────────────────
// Brique tactile « façon Android » : effet ripple natif + animation
// d'enfoncement (scale spring). Remplace TouchableOpacity partout pour
// donner le ressenti Material. Le ripple est clippé aux coins arrondis via
// le borderRadius extrait du style.
interface TouchableProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Couleur du ripple. Défaut : teinte du texte à 12 %. */
  rippleColor?: string;
  /** Ripple non borné (idéal pour les boutons-icônes circulaires). */
  borderless?: boolean;
  /** Échelle cible à l'enfoncement (défaut 0.97). 1 = pas d'animation. */
  scaleTo?: number;
  disabled?: boolean;
}
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Touchable({
  children,
  onPress,
  onLongPress,
  style,
  rippleColor,
  borderless = false,
  scaleTo = 0.97,
  disabled,
}: TouchableProps) {
  const {colors} = useSettings();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (scaleTo === 1) {
      return;
    }
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };
  const pressOut = () => {
    if (scaleTo === 1) {
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  // Le style (largeur, marges, radius, position…) reste sur le Pressable
  // lui-même pour ne pas casser le layout du parent. Le ripple est clippé
  // aux coins arrondis via overflow:'hidden' (sauf ripple borderless).
  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      android_ripple={{
        color: rippleColor ?? withAlpha(colors.text, 0.12),
        borderless,
      }}
      style={[style, {transform: [{scale}]}]}>
      {children}
    </AnimatedPressable>
  );
}

// ── AppBar ──────────────────────────────────────────────
interface AppBarProps {
  title: string;
  onBack?: () => void;
  actions?: {icon: string; onPress: () => void}[];
  right?: React.ReactNode;
}
export function AppBar({title, onBack, actions, right}: AppBarProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.appbar}>
      {onBack ? (
        <Touchable style={styles.iconBtn} onPress={onBack} borderless scaleTo={1}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </Touchable>
      ) : (
        <View style={{width: 8}} />
      )}
      <Text style={styles.appbarTitle} numberOfLines={1}>
        {title}
      </Text>
      {right}
      {(actions ?? []).map((a, i) => (
        <Touchable key={i} style={styles.iconBtn} onPress={a.onPress} borderless scaleTo={1}>
          <Icon name={a.icon} size={23} color={colors.text} />
        </Touchable>
      ))}
    </View>
  );
}

// ── LargeHead ───────────────────────────────────────────
interface LargeHeadProps {
  title: string;
  sub?: string;
}
export function LargeHead({title, sub}: LargeHeadProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.largeHead}>
      <Text style={styles.largeHeadTitle}>{title}</Text>
      {sub && <Text style={styles.largeHeadSub}>{sub}</Text>}
    </View>
  );
}

// ── Card ────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
}
export function Card({children, style, onPress, onLongPress}: CardProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  if (onPress || onLongPress) {
    return (
      <Touchable
        style={[styles.card, style]}
        onPress={onPress}
        onLongPress={onLongPress}>
        {children}
      </Touchable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Row ─────────────────────────────────────────────────
interface RowProps {
  icon?: string;
  title: string;
  subtitle?: string;
  trail?: React.ReactNode;
  onPress?: () => void;
}
export function Row({icon, title, subtitle, trail, onPress}: RowProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  const content = (
    <View style={styles.row}>
      {icon && (
        <View style={styles.rowLead}>
          <Icon name={icon} size={21} color={colors.text2} />
        </View>
      )}
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      <View style={styles.rowTrail}>
        {trail ?? <Icon name="chevron-right" size={20} color={colors.text3} />}
      </View>
    </View>
  );
  if (onPress) {
    return (
      <Touchable onPress={onPress} scaleTo={1}>
        {content}
      </Touchable>
    );
  }
  return content;
}

// ── Btn ─────────────────────────────────────────────────
interface BtnProps {
  children: string;
  onPress?: () => void;
  icon?: string;
  variant?: 'primary' | 'tonal' | 'outline';
  small?: boolean;
  style?: ViewStyle;
  loading?: boolean;
}
export function Btn({
  children,
  onPress,
  icon,
  variant = 'primary',
  small,
  style,
  loading,
}: BtnProps) {
  const {colors, accent, onAccent} = useSettings();
  const styles = makeStyles(colors);
  const btnStyle =
    variant === 'primary'
      ? {backgroundColor: accent}
      : variant === 'tonal'
      ? styles.btnTonal
      : styles.btnOutline;
  const textStyle =
    variant === 'primary' ? {color: onAccent} : styles.btnTextTonal;
  const height = small ? 36 : 44;
  const iconColor = variant === 'primary' ? onAccent : colors.text;
  const ripple =
    variant === 'primary'
      ? withAlpha(onAccent, 0.2)
      : withAlpha(colors.text, 0.12);

  return (
    <Touchable
      style={[styles.btn, btnStyle, {height}, style]}
      onPress={onPress}
      rippleColor={ripple}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? onAccent : colors.text}
        />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={iconColor} />}
          <Text style={[styles.btnText, textStyle]}>{children}</Text>
        </>
      )}
    </Touchable>
  );
}

// ── Chip ────────────────────────────────────────────────
interface ChipProps {
  children: string;
  on?: boolean;
  onPress?: () => void;
  icon?: string;
}
export function Chip({children, on, onPress, icon}: ChipProps) {
  const {colors, accent, onAccent} = useSettings();
  const styles = makeStyles(colors);
  return (
    <Touchable
      style={[styles.chip, on && {backgroundColor: accent, borderColor: accent}]}
      onPress={onPress}
      rippleColor={on ? withAlpha(onAccent, 0.2) : withAlpha(colors.text, 0.12)}>
      {icon && (
        <Icon
          name={icon}
          size={14}
          color={on ? onAccent : colors.text2}
          style={{marginRight: 4}}
        />
      )}
      <Text style={[styles.chipText, on && {color: onAccent}]}>{children}</Text>
    </Touchable>
  );
}

// ── Progress ────────────────────────────────────────────
interface ProgressProps {
  value: number; // 0-100
}
export function Progress({value}: ProgressProps) {
  const {colors, accent} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.progressTrack}>
      <View
        style={[styles.progressFill, {width: `${value}%`, backgroundColor: accent}]}
      />
    </View>
  );
}

// ── PillTag ─────────────────────────────────────────────
interface PillTagProps {
  children: string;
  icon?: string;
}
export function PillTag({children, icon}: PillTagProps) {
  const {colors, accent, accentSoft} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.pillTag, {backgroundColor: accentSoft, borderColor: 'transparent'}]}>
      {icon && (
        <Icon name={icon} size={13} color={accent} style={{marginRight: 3}} />
      )}
      <Text style={[styles.pillTagText, {color: accent}]}>{children}</Text>
    </View>
  );
}

// ── SectionLabel ────────────────────────────────────────
interface SectionLabelProps {
  label: string;
  action?: string;
  onAction?: () => void;
}
export function SectionLabel({label, action, onAction}: SectionLabelProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.secLabel}>
      <Text style={styles.secLabelText}>{label}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.secLabelAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Divider ─────────────────────────────────────────────
export function Divider() {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  return <View style={styles.divider} />;
}

// ── Fab ─────────────────────────────────────────────────
interface FabProps {
  icon: string;
  label?: string;
  onPress: () => void;
}
export function Fab({icon, label, onPress}: FabProps) {
  const {colors, accent, onAccent} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View style={styles.fabWrap}>
      <Touchable
        style={[styles.fab, {backgroundColor: accent}]}
        onPress={onPress}
        scaleTo={0.93}
        rippleColor={withAlpha(onAccent, 0.2)}>
        <Icon name={icon} size={22} color={onAccent} />
        {label && (
          <Text style={[styles.fabLabel, {color: onAccent}]}>{label}</Text>
        )}
      </Touchable>
    </View>
  );
}

// ── ThemePicker ─────────────────────────────────────────
// Sélecteur de thème partagé (onboarding + paramètres) : grandes cartes avec
// aperçu de l'ambiance et coche, pour un rendu identique partout.
export function ThemePicker() {
  const {settings, setSetting, colors, haptic} = useSettings();
  const styles = makeStyles(colors);
  return (
    <View>
      {(Object.keys(PALETTES) as ThemeName[]).map(name => {
        const p = PALETTES[name];
        const on = settings.theme === name;
        return (
          <Touchable
            key={name}
            scaleTo={0.98}
            rippleColor={withAlpha(p.accent, 0.16)}
            style={[
              styles.themeCard,
              {backgroundColor: p.card, borderColor: on ? p.accent : p.border},
            ]}
            onPress={() => {
              haptic();
              setSetting('theme', name);
            }}>
            <View style={[styles.themePreview, {backgroundColor: p.bg, borderColor: p.border}]}>
              <View style={[styles.themePreviewDot, {backgroundColor: p.accent}]} />
              <View style={[styles.themePreviewBar, {backgroundColor: p.cardHi, width: 34}]} />
              <View style={[styles.themePreviewBar, {backgroundColor: p.cardHi, width: 22}]} />
            </View>
            <Text style={[styles.themeName, {color: p.text}]}>{p.label}</Text>
            <View
              style={[
                styles.themeCheck,
                {
                  borderColor: on ? p.accent : p.border,
                  backgroundColor: on ? p.accent : 'transparent',
                },
              ]}>
              {on && <Icon name="check" size={16} color={p.onAccent} />}
            </View>
          </Touchable>
        );
      })}
    </View>
  );
}

// ── FoodImage ───────────────────────────────────────────
// Photo de plat (locale, hors-ligne) avec repli gracieux : si aucune source
// n'est fournie ou si elle ne charge pas, affiche l'emoji sur fond teinté.
interface FoodImageProps {
  source?: ImageSourcePropType;
  emoji?: string;
  style?: StyleProp<ViewStyle>;
  emojiSize?: number;
}
export function FoodImage({source, emoji, style, emojiSize = 40}: FoodImageProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  const [failed, setFailed] = useState(false);
  if (source && !failed) {
    return (
      <Image
        source={source}
        style={style as StyleProp<ImageStyle>}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={[style, styles.foodFallback]}>
      <Text style={{fontSize: emojiSize}}>{emoji ?? '🍽️'}</Text>
    </View>
  );
}

// ── Select ──────────────────────────────────────────────
// Menu déroulant simple : affiche la valeur courante, ouvre une feuille
// modale listant les options. Utilisé p.ex. pour le choix du modèle IA.
export interface SelectOption {
  label: string;
  value: string;
  sub?: string;
}
interface SelectProps {
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}
export function Select({value, options, placeholder, onChange}: SelectProps) {
  const {colors, accent, haptic} = useSettings();
  const styles = makeStyles(colors);
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);

  return (
    <>
      <Touchable
        style={styles.selectBox}
        scaleTo={1}
        onPress={() => setOpen(true)}>
        <Text
          style={[styles.selectValue, !current && {color: colors.text3}]}
          numberOfLines={1}>
          {current?.label ?? value ?? placeholder ?? 'Choisir…'}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.text3} />
      </Touchable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.selectSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map(o => {
                const on = o.value === value;
                return (
                  <Touchable
                    key={o.value}
                    style={styles.selectOption}
                    scaleTo={1}
                    onPress={() => {
                      haptic();
                      onChange(o.value);
                      setOpen(false);
                    }}>
                    <View style={{flex: 1}}>
                      <Text
                        style={[
                          styles.selectOptionText,
                          on && {color: accent, fontWeight: '800'},
                        ]}>
                        {o.label}
                      </Text>
                      {o.sub && <Text style={styles.selectOptionSub}>{o.sub}</Text>}
                    </View>
                    {on && <Icon name="check" size={20} color={accent} />}
                  </Touchable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── Field (champ Material) ──────────────────────────────
// Champ de saisie « rempli » façon Material 3 : fond teinté, soulignement qui
// passe à l'accent (2 px) au focus, et label qui flotte vers le haut dès qu'on
// tape ou que le champ est rempli.
interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  containerStyle?: StyleProp<ViewStyle>;
}
export function Field({label, value, onFocus, onBlur, containerStyle, ...rest}: FieldProps) {
  const {colors, accent} = useSettings();
  const styles = makeStyles(colors);
  const [focused, setFocused] = useState(false);
  const floated = focused || (value ?? '').length > 0;
  const anim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: floated ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [floated, anim]);

  return (
    <View
      style={[
        styles.fieldBox,
        {
          borderBottomColor: focused ? accent : colors.text3,
          borderBottomWidth: focused ? 2 : 1,
        },
        containerStyle,
      ]}>
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.fieldFloatLabel,
          {
            top: anim.interpolate({inputRange: [0, 1], outputRange: [19, 8]}),
            fontSize: anim.interpolate({inputRange: [0, 1], outputRange: [16, 12]}),
            color: focused ? accent : colors.text2,
          },
        ]}>
        {label}
      </Animated.Text>
      <TextInput
        style={styles.fieldTextInput}
        value={value}
        placeholderTextColor={colors.text3}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    themeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      borderWidth: 2,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    themePreview: {
      width: 76,
      height: 58,
      borderRadius: radius.md,
      borderWidth: 1,
      paddingHorizontal: 10,
      justifyContent: 'center',
      gap: 5,
    },
    themePreviewDot: {width: 16, height: 16, borderRadius: 8, marginBottom: 3},
    themePreviewBar: {height: 5, borderRadius: 3},
    themeName: {flex: 1, fontSize: 17, fontWeight: '800'},
    foodFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardHi,
    },
    fieldBox: {
      backgroundColor: colors.cardHi,
      borderTopLeftRadius: radius.sm,
      borderTopRightRadius: radius.sm,
      paddingHorizontal: spacing.md,
      height: 58,
      justifyContent: 'flex-end',
      paddingBottom: 8,
    },
    fieldFloatLabel: {
      position: 'absolute',
      left: spacing.md,
      fontWeight: '600',
    },
    fieldTextInput: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      padding: 0,
      height: 24,
    },
    selectBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      gap: spacing.sm,
    },
    selectValue: {flex: 1, fontSize: 15, fontWeight: '700', color: colors.text},
    selectOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    selectSheet: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    selectOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
    },
    selectOptionText: {fontSize: 15.5, fontWeight: '700', color: colors.text},
    selectOptionSub: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text3,
      marginTop: 2,
    },
    themeCheck: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appbar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
    },
    appbarTitle: {
      flex: 1,
      fontSize: 20,
      fontFamily: 'sans-serif-medium',
      color: colors.text,
      marginHorizontal: spacing.sm,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    largeHead: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    largeHeadTitle: {
      fontSize: 30,
      fontFamily: 'sans-serif-medium',
      color: colors.text,
      letterSpacing: 0,
    },
    largeHeadSub: {
      fontSize: 14,
      color: colors.text2,
      fontWeight: '600',
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      // Élévation Material : ombre portée douce (très visible en thème clair,
      // discrète sur les thèmes sombres où la couleur de surface fait le relief).
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: {width: 0, height: 2},
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      minHeight: 56,
    },
    rowLead: {
      width: 36,
      alignItems: 'center',
      marginRight: spacing.md,
    },
    rowMain: {flex: 1, minWidth: 0},
    rowTitle: {fontSize: 15, fontWeight: '700', color: colors.text},
    rowSub: {
      fontSize: 12.5,
      color: colors.text2,
      fontWeight: '600',
      marginTop: 2,
    },
    rowTrail: {marginLeft: spacing.sm},
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      gap: 8,
      width: '100%',
    },
    btnPrimary: {backgroundColor: colors.text},
    btnTonal: {backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.border},
    btnOutline: {borderWidth: 1, borderColor: colors.border},
    btnText: {fontSize: 15, fontWeight: '700'},
    btnTextPrimary: {color: colors.bg},
    btnTextTonal: {color: colors.text},
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardHi,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    chipOn: {backgroundColor: colors.text, borderColor: colors.text},
    chipText: {fontSize: 13.5, fontWeight: '700', color: colors.text2},
    chipTextOn: {color: colors.bg},
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.cardHi,
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.text,
    },
    pillTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      height: 26,
      borderRadius: 8,
      backgroundColor: colors.cardHi,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillTagText: {fontSize: 12, fontWeight: '700', color: colors.text2},
    secLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
    secLabelText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text3,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    secLabelAction: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderSoft,
      marginHorizontal: spacing.lg,
    },
    fabWrap: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      borderRadius: 18,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 4},
    },
    fab: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.text,
      borderRadius: 18,
      paddingHorizontal: 18,
      height: 52,
      gap: 8,
    },
    fabLabel: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.bg,
    },
  });

export {SwipeRow} from './SwipeRow';
export type {SwipeAction, SwipeRowHandle} from './SwipeRow';
export {AppSwitch} from './AppSwitch';
