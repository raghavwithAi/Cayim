import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Lightbulb, MessageSquareText, FolderHeart,
  ClipboardList, Sparkles, TrendingUp, Rocket,
} from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSpring, withSequence, Easing,
} from 'react-native-reanimated';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { Sparkles as SparklesIcon } from 'lucide-react-native';
import { useTheme } from '@/lib/themeContext';
import { colors, spacing, typography, radius } from '@/lib/theme';
import { listVault } from '@/lib/ai';

const { width: W } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { label: 'AI Mentor',     sub: 'Chat with your advisor', icon: MessageSquareText, route: '/mentor' as const,    featured: true },
  { label: 'My Own Idea',   sub: 'Bring your idea to life', icon: Rocket,           route: '/my-idea' as const },
  { label: 'Quick Survey',  sub: '6 questions',           icon: ClipboardList,     route: '/survey' as const },
  { label: 'Generate Ideas', sub: '5 tailored startups',   icon: Lightbulb,         route: '/mentor' as const },
] as const;

function QuickActionCard({
  label, sub, icon: Icon, route, featured, onVault, delay,
}: {
  label: string; sub: string; icon: any; route: string | null;
  featured?: boolean; onVault?: () => void; delay: number;
}) {
  const { t } = useTheme();
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 160 }));
  }, []);

  const cardAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  function press() {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 300 }),
      withSpring(1,    { damping: 12, stiffness: 200 }),
    );
    if (route) router.push(route);
    else onVault?.();
  }

  return (
    <Animated.View style={[cardAnim, styles.qaWrap]}>
      <Pressable onPress={press} style={styles.qaPress}>
        <Card glow={featured} style={[
          styles.qaCard,
          featured && styles.qaCardFeatured,
          { borderColor: featured ? colors.primary : (t.isDark ? colors.primaryDeep : colors.glow) }
        ]}>
          <View style={styles.qaIconRow}>
            <View style={[styles.qaIconBg, {
              backgroundColor: featured ? colors.primary : (t.isDark ? '#0F2018' : colors.glow)
            }]}>
              <Icon size={22} color={featured ? colors.white : colors.primary} strokeWidth={2} />
            </View>
          </View>
          <Text style={[styles.qaLabel, { color: t.text }]}>{label}</Text>
          <Text style={[styles.qaSub, { color: t.textSecondary }]}>{sub}</Text>
          {featured && <Text style={styles.qaFeatured}>Recommended</Text>}
        </Card>
      </Pressable>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const { profile, isGuest, exitGuestMode } = useAuth();
  const { t } = useTheme();
  const username = isGuest ? 'Guest' : (profile?.username ?? 'Founder');
  const [vaultCount, setVaultCount] = useState(0);

  const heroOpacity  = useSharedValue(0);
  const heroY        = useSharedValue(22);
  const badgeOpacity = useSharedValue(0);
  const cardOpacity  = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value  = withTiming(1, { duration: 550, easing: Easing.out(Easing.ease) });
    heroY.value        = withTiming(0, { duration: 550, easing: Easing.out(Easing.ease) });
    badgeOpacity.value = withDelay(350, withTiming(1, { duration: 450 }));
    cardOpacity.value  = withDelay(200, withTiming(1, { duration: 500 }));
    listVault().then((r) => setVaultCount(r.length)).catch(() => {});
  }, []);

  const heroStyle  = useAnimatedStyle(() => ({ opacity: heroOpacity.value, transform: [{ translateY: heroY.value }] }));
  const badgeStyle = useAnimatedStyle(() => ({ opacity: badgeOpacity.value }));
  const cardStyle  = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Logo size={38} animated={false} />
          <Text style={[styles.brand, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>CAYIM</Text>
          <Animated.View style={[styles.badge, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }, badgeStyle]}>
            <Sparkles size={12} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.badgeText, { color: colors.primaryDeep }]}>AI</Text>
          </Animated.View>
        </View>

        {/* Hero */}
        <Animated.View style={[styles.hero, heroStyle]}>
          <Text style={[styles.welcomeLabel, { color: t.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.username, { color: t.text }]}>{username} 👋</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            Let's build your next startup today.
          </Text>
        </Animated.View>

        {isGuest && (
          <Pressable
            onPress={() => router.push('/auth')}
            style={[styles.guestBanner, { backgroundColor: t.isDark ? '#0F2018' : colors.glow, borderColor: colors.primary }]}
          >
            <SparklesIcon size={16} color={colors.primaryDeep} strokeWidth={2} />
            <Text style={[styles.guestBannerText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>
              You're in Guest Mode. Create an account to save your data permanently.
            </Text>
          </Pressable>
        )}

        {/* AI intro card */}
        <Animated.View style={cardStyle}>
          <Card glow style={styles.introBanner}>
            <View style={styles.introRow}>
              <TrendingUp color={colors.primary} size={22} strokeWidth={2} />
              <Text style={[styles.introText, { color: t.text }]}>
                Chat naturally with me like a business consultant. I'll understand your goals, skills, and budget before generating 5 tailored startup ideas with complete market research, branding, and viral marketing strategies.
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Actions grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: t.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.qaGrid}>
          {QUICK_ACTIONS.map((qa, i) => (
            <QuickActionCard
              key={qa.label}
              {...qa}
              delay={i * 60 + 100}
              onVault={() => {/* vault tab handled by swipe */}}
            />
          ))}
        </View>

        {/* Stats row */}
        <Animated.View style={[styles.statsRow, badgeStyle]}>
          <StatBox label="Saved Ideas" value={String(vaultCount)} dark={t.isDark} />
          <StatBox label="Report Tabs" value="13" dark={t.isDark} />
          <StatBox label="Expert AI" value="Mentor" dark={t.isDark} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  const { t } = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

const CARD_W = (W - spacing.lg * 2 - spacing.md) / 2;

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md, marginBottom: spacing.lg },
  brand:   { ...typography.h3, letterSpacing: 1, flex: 1 },
  badge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: colors.primaryDeep },

  hero:          { marginTop: spacing.md, marginBottom: spacing.lg },
  welcomeLabel:  { ...typography.body, marginBottom: 2 },
  guestBanner:   {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    marginBottom: spacing.lg,
  },
  guestBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter-Medium', lineHeight: 18 },
  username:      { ...typography.display, marginTop: 2 },
  subtitle:      { ...typography.body, marginTop: 8 },

  introBanner:   { marginBottom: spacing.xl },
  introRow:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  introText:     { ...typography.body, lineHeight: 22, flex: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionLabel:  { ...typography.h4 },

  qaGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  qaWrap:  { width: CARD_W },
  qaPress: { flex: 1 },
  qaCard:  { padding: spacing.md, minHeight: 130, justifyContent: 'space-between' },
  qaCardFeatured: {
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  qaIconRow: { marginBottom: spacing.sm },
  qaIconBg:  { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  qaLabel:   { ...typography.h4, marginBottom: 2 },
  qaSub:     { ...typography.caption },
  qaFeatured: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox:  {
    flex: 1, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 1,
  },
  statValue: { ...typography.h2, fontSize: 20 },
  statLabel: { ...typography.caption, marginTop: 4, textAlign: 'center' },
});
