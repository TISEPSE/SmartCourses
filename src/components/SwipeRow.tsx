import React, {forwardRef, useCallback, useImperativeHandle, useRef} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {colors, radius} from '../theme';

export interface SwipeAction {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

interface SwipeRowProps {
  actions: SwipeAction[];
  children: React.ReactNode;
  enabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  cardStyle?: ViewStyle;
}

export interface SwipeRowHandle {
  close: () => void;
}

const ACTION_WIDTH = 56;
const ACTION_GAP = 8;

/**
 * Rangée swipeable (glisser vers la gauche pour révéler des actions).
 * Basée sur l'API Gesture de gesture-handler : les gestes se négocient
 * nativement avec le scroll et le geste retour du stack — contrairement
 * à PanResponder qui se faisait annuler en plein mouvement.
 * Expose close() via ref pour refermer après une action (ex: renommage).
 */
export const SwipeRow = forwardRef<SwipeRowHandle, SwipeRowProps>(function SwipeRow(
  {actions, children, enabled = true, onPress, style, cardStyle},
  ref,
) {
  const totalWidth = (ACTION_WIDTH + ACTION_GAP) * actions.length;
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const settle = useCallback(
    (open: boolean) => {
      isOpen.current = open;
      Animated.spring(translateX, {
        toValue: open ? -totalWidth : 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    },
    [translateX, totalWidth],
  );

  useImperativeHandle(ref, () => ({close: () => settle(false)}), [settle]);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate(e => {
      const base = isOpen.current ? -totalWidth : 0;
      const next = Math.min(0, Math.max(-totalWidth, base + e.translationX));
      translateX.setValue(next);
    })
    .onEnd(e => {
      const base = isOpen.current ? -totalWidth : 0;
      const pos = base + e.translationX;
      settle(pos < -totalWidth / 2);
    })
    .runOnJS(true);

  const handlePress = () => {
    if (isOpen.current) {
      settle(false);
    } else {
      onPress?.();
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.actionsContainer}>
        {actions.map(a => (
          <TouchableOpacity
            key={a.label}
            accessibilityLabel={a.label}
            style={[styles.actionBtn, {backgroundColor: a.color}]}
            // Pas de settle(false) : la rangée reste ouverte pendant que
            // le modal/l'alerte s'affiche, rien ne bouge derrière
            onPress={a.onPress}>
            <Icon name={a.icon} size={22} color={colors.text} />
          </TouchableOpacity>
        ))}
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[cardStyle, {transform: [{translateX}]}]}>
          {/* Pressable sans feedback d'opacité : la carte translucide
              révélerait les boutons d'action rendus derrière */}
          <Pressable onPress={handlePress}>{children}</Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionBtn: {
    width: ACTION_WIDTH,
    marginLeft: ACTION_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
});
