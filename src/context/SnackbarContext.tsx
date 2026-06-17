import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {withAlpha} from '../theme';
import {useSettings} from './SettingsContext';

interface SnackbarOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Durée d'affichage en ms (défaut 4000). */
  duration?: number;
}

interface SnackbarContextValue {
  show: (options: SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({show: () => {}});

// Snackbar Material 3 : barre sombre flottante en bas avec un message et une
// action optionnelle (« Annuler »). Affichée par-dessus toute l'app via le
// provider, donc accessible depuis n'importe quel écran.
export function SnackbarProvider({children}: {children: React.ReactNode}) {
  const {accent, haptic} = useSettings();
  const insets = useSafeAreaInsets();
  const [opts, setOpts] = useState<SnackbarOptions | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setOpts(null);
      }
    });
  }, [anim]);

  const show = useCallback(
    (options: SnackbarOptions) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      setOpts(options);
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 6,
        speed: 14,
      }).start();
      timer.current = setTimeout(hide, options.duration ?? 4000);
    },
    [anim, hide],
  );

  return (
    <SnackbarContext.Provider value={{show}}>
      {children}
      {opts && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            {
              bottom: insets.bottom + 16,
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.bar}>
            <Text style={styles.message} numberOfLines={2}>
              {opts.message}
            </Text>
            {opts.actionLabel && (
              <Pressable
                android_ripple={{color: withAlpha(accent, 0.24), borderless: false}}
                style={styles.action}
                onPress={() => {
                  haptic();
                  opts.onAction?.();
                  if (timer.current) {
                    clearTimeout(timer.current);
                  }
                  hide();
                }}>
                <Text style={[styles.actionText, {color: accent}]}>
                  {opts.actionLabel}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B2B2E',
    borderRadius: 12,
    minHeight: 52,
    paddingLeft: 16,
    paddingRight: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
  },
  message: {
    flex: 1,
    color: '#F2F2F2',
    fontSize: 14.5,
    fontWeight: '600',
    paddingVertical: 14,
  },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 4,
    overflow: 'hidden',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
