import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSequence, Easing, withRepeat,
} from 'react-native-reanimated';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { colors, typography } from '@/lib/theme';

export default function Splash() {
  const { session, loading, isGuest } = useAuth();
  const { t } = useTheme();

  const logoOpacity    = useSharedValue(0);
  const logoScale      = useSharedValue(0.8);
  const titleOpacity   = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const tagOpacity     = useSharedValue(0);
  const ringScale      = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
    logoScale.value   = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.4)) });
    ringScale.value   = withRepeat(
      withSequence(
        withTiming(1.28, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 1700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
    titleOpacity.value    = withDelay(450,  withTiming(1, { duration: 600 }));
    subtitleOpacity.value = withDelay(800,  withTiming(1, { duration: 600 }));
    tagOpacity.value      = withDelay(1150, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    if (loading) return;
    const to = setTimeout(() => {
      router.replace(session || isGuest ? '/(tabs)' : '/auth');
    }, 2300);
    return () => clearTimeout(to);
  }, [loading, session, isGuest]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: t.isDark ? 0.25 : 0.4,
  }));

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={styles.markWrap}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={logoStyle}>
          <Logo size={96} animated={false} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.title, { color: t.text, opacity: titleOpacity }]}>
        CAYIM
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { color: colors.primary, opacity: subtitleOpacity }]}>
        Cash Made With AI
      </Animated.Text>
      <Animated.Text style={[styles.tag, { color: t.textSecondary, opacity: tagOpacity }]}>
        by Young Intelligent Minds
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markWrap:  { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ring:      {
    position: 'absolute', width: 220, height: 220,
    borderRadius: 110, backgroundColor: colors.softGreen,
  },
  title:    { ...typography.display, fontSize: 46, letterSpacing: 1.5 },
  subtitle: { ...typography.bodyMedium, marginTop: 8, fontSize: 18 },
  tag:      { ...typography.caption, marginTop: 6, fontSize: 13 },
});
