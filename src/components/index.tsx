import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Palette, radius, spacing} from '../theme';
import {useSettings} from '../context/SettingsContext';

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
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={{width: 8}} />
      )}
      <Text style={styles.appbarTitle} numberOfLines={1}>
        {title}
      </Text>
      {right}
      {(actions ?? []).map((a, i) => (
        <TouchableOpacity key={i} style={styles.iconBtn} onPress={a.onPress}>
          <Icon name={a.icon} size={23} color={colors.text} />
        </TouchableOpacity>
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
  style?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
}
export function Card({children, style, onPress, onLongPress}: CardProps) {
  const {colors} = useSettings();
  const styles = makeStyles(colors);
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
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
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
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

  return (
    <TouchableOpacity
      style={[styles.btn, btnStyle, {height}, style]}
      onPress={onPress}
      activeOpacity={0.7}>
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
    </TouchableOpacity>
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
    <TouchableOpacity
      style={[styles.chip, on && {backgroundColor: accent, borderColor: accent}]}
      onPress={onPress}
      activeOpacity={0.7}>
      {icon && (
        <Icon
          name={icon}
          size={14}
          color={on ? onAccent : colors.text2}
          style={{marginRight: 4}}
        />
      )}
      <Text style={[styles.chipText, on && {color: onAccent}]}>{children}</Text>
    </TouchableOpacity>
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
    <TouchableOpacity
      style={[styles.fab, {backgroundColor: accent}]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Icon name={icon} size={22} color={onAccent} />
      {label && <Text style={[styles.fabLabel, {color: onAccent}]}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    appbar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
    },
    appbarTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
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
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
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
      borderRadius: radius.md,
      gap: 6,
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
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.text,
      borderRadius: 18,
      paddingHorizontal: 18,
      height: 52,
      gap: 8,
      elevation: 4,
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
