import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet} from 'react-native';

import {useSettings} from '../context/SettingsContext';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 28;
const PADDING = 2;

/** Switch style iOS : large piste arrondie, gros pouce blanc animé. */
export function AppSwitch({value, onValueChange}: AppSwitchProps) {
  const {accent, onAccent, haptic} = useSettings();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 22,
    }).start();
  }, [value, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#39393D', accent],
  });

  // Pouce blanc piste éteinte ; sur piste accent, onAccent garantit le
  // contraste (thème blanc : pouce noir sur piste blanche)
  const thumbColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', onAccent === '#000000' ? '#000000' : '#FFFFFF'],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, TRACK_WIDTH - THUMB_SIZE - PADDING],
  });

  return (
    <Pressable
      onPress={() => {
        haptic();
        onValueChange(!value);
      }}
      hitSlop={8}>
      <Animated.View style={[styles.track, {backgroundColor: trackColor}]}>
        <Animated.View
          style={[styles.thumb, {backgroundColor: thumbColor, transform: [{translateX}]}]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
