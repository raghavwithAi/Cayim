import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { BrainCircuit } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type LogoProps = { size?: number; animated?: boolean };

// CAYIM logo: brain merged with a dollar accent -> "intelligence creates wealth".
// Soft mint-green glow pulses. Used on splash + headers.
export function Logo({ size = 72, animated = true }: LogoProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.45);

  useEffect(() => {
    if (!animated) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1700 }),
        withTiming(0.4, { duration: 1700 })
      ),
      -1,
      true
    );
  }, [animated]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.9 + glow.value * 0.4 }],
  }));

  return (
    <View style={[{ width: size, height: size }, styles.center]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 1.7,
            height: size * 1.7,
            borderRadius: size,
            backgroundColor: colors.softGreen,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={[styles.center, markStyle]}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.3,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BrainCircuit color={colors.white} size={size * 0.52} strokeWidth={2} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
