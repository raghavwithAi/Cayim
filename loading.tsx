import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withSequence, Easing, withRepeat,
} from 'react-native-reanimated';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/lib/themeContext';
import { getReport } from '@/lib/reportStore';
import { colors, spacing, typography } from '@/lib/theme';

const CAPTIONS = [
  'Analysing your profile...',
  'Building your business plan...',
  'Writing marketing strategy...',
  'Crafting your roadmap...',
];

export default function LoadingScreen() {
  const { t } = useTheme();
  const [captionIdx, setCaptionIdx] = useState(0);

  const glow    = useSharedValue(0.3);
  const stage   = useSharedValue(0);
  const captionOp = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true,
    );
    stage.value = 0;
    const t1 = setTimeout(() => { stage.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }); }, 400);
    const t2 = setTimeout(() => { stage.value = withTiming(2, { duration: 900, easing: Easing.out(Easing.back(1.2)) }); }, 1300);
    captionOp.value = withTiming(1, { duration: 500 });

    const interval = setInterval(() => {
      setCaptionIdx((i) => (i + 1) % CAPTIONS.length);
      captionOp.value = 0;
      setTimeout(() => { captionOp.value = withTiming(1, { duration: 500 }); }, 150);
    }, 1500);

    const done = setTimeout(() => {
      const r = getReport();
      router.replace(r ? '/results' : '/(tabs)');
    }, 3400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(done); clearInterval(interval); };
  }, []);

  const glowStyle  = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.8 + glow.value * 0.5 }] }));
  const plantStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.4 + stage.value * 0.35 }] }));
  const stemStyle  = useAnimatedStyle(() => ({ height: 10 + stage.value * 70, opacity: stage.value > 0 ? 1 : 0 }));
  const leafStyle  = useAnimatedStyle(() => ({ opacity: stage.value > 1 ? 1 : 0, transform: [{ scale: stage.value > 1 ? 1 : 0 }] }));
  const capStyle   = useAnimatedStyle(() => ({ opacity: captionOp.value }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.scene}>
          <Animated.View style={[styles.glowOrb, { backgroundColor: t.isDark ? '#0F2018' : colors.softGreen }, glowStyle]} />
          <View style={[styles.pot, { backgroundColor: t.isDark ? colors.primaryDark : colors.primaryDeep }]} />
          <Animated.View style={[styles.stem, stemStyle]} />
          <Animated.View style={[styles.tier, plantStyle]}>
            <View style={[styles.seedCircle, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
              <Logo size={56} animated={false} />
            </View>
          </Animated.View>
          <Animated.View style={[styles.leafLeft,  { backgroundColor: t.isDark ? colors.primaryDeep : colors.softGreen }, leafStyle]} />
          <Animated.View style={[styles.leafRight, { backgroundColor: t.isDark ? colors.primaryDeep : colors.softGreen }, leafStyle]} />
        </View>

        <Text style={[styles.title, { color: t.text }]}>Growing your business idea...</Text>
        <Animated.Text style={[styles.caption, { color: t.textSecondary }, capStyle]}>
          {CAPTIONS[captionIdx]}
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  scene:     { width: 240, height: 280, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  glowOrb:   { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: 20 },
  pot:       { width: 90, height: 44, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  stem:      { position: 'absolute', width: 8, backgroundColor: colors.primary, bottom: 36, borderRadius: 4 },
  tier:      { position: 'absolute', bottom: 90, alignItems: 'center' },
  seedCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  leafLeft:  { position: 'absolute', bottom: 70, left: 50, width: 44, height: 26, borderRadius: 26, transform: [{ rotate: '-30deg' }] },
  leafRight: { position: 'absolute', bottom: 70, right: 50, width: 44, height: 26, borderRadius: 26, transform: [{ rotate: '30deg' }] },
  title:     { ...typography.h2, marginTop: spacing.xxl, textAlign: 'center' },
  caption:   { ...typography.body, marginTop: spacing.sm },
});
