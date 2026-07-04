import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LogOut, User as UserIcon, Mail, Settings,
  ChevronRight, Shield, Edit3, Star, Moon, Sun, X, Sparkles, Heart, Globe,
} from 'lucide-react-native';
import { Image } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { listVault } from '@/lib/ai';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/Card';
import { colors, spacing, typography, radius } from '@/lib/theme';

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const { t, mode, setMode } = useTheme();
  const [vaultCount, setVaultCount] = useState(0);
  const [showAbout, setShowAbout] = useState(false);

  const headerY  = useSharedValue(14);
  const headerOp = useSharedValue(0);
  const cardsOp  = useSharedValue(0);

  useEffect(() => {
    headerOp.value = withTiming(1, { duration: 480 });
    headerY.value  = withTiming(0, { duration: 480 });
    cardsOp.value  = withDelay(200, withTiming(1, { duration: 480 }));
    if (user) listVault().then((r) => setVaultCount(r.length)).catch(() => {});
  }, [user]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOp.value, transform: [{ translateY: headerY.value }],
  }));
  const cardsStyle = useAnimatedStyle(() => ({ opacity: cardsOp.value }));

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not sign out');
          }
        },
      },
    ]);
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Brand bar */}
        <View style={styles.topRow}>
          <Logo size={32} animated={false} />
          <Text style={[styles.brandText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>
            Profile
          </Text>
          {/* Dark mode quick toggle */}
          <Pressable
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            style={[styles.themeToggle, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}
            hitSlop={8}
          >
            {t.isDark
              ? <Sun size={16} color={colors.primary} strokeWidth={2} />
              : <Moon size={16} color={colors.primaryDeep} strokeWidth={2} />
            }
          </Pressable>
        </View>

        {/* Profile hero card */}
        <Animated.View style={headerStyle}>
          <Card glow style={styles.profileCard}>
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
              ) : (
                <UserIcon size={30} color={colors.white} strokeWidth={2} />
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: t.text }]}>
                {profile?.username ?? profile?.full_name ?? 'Founder'}
              </Text>
              {user?.email ? (
                <Text style={[styles.profileEmail, { color: t.textSecondary }]}>{user.email}</Text>
              ) : null}
              {memberSince ? (
                <Text style={[styles.profileSince, { color: t.textTertiary }]}>Member since {memberSince}</Text>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        {/* Menu groups */}
        <Animated.View style={cardsStyle}>
          <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>MY ACCOUNT</Text>

          <ProfileMenuRow
            icon={<Shield size={18} color={colors.primary} strokeWidth={2} />}
            label="Saved Startups"
            value={vaultCount > 0 ? `${vaultCount} saved` : 'View vault'}
            t={t}
            onPress={() => router.push('/(tabs)/vault')}
          />
          <ProfileMenuRow
            icon={<Mail size={18} color={colors.primary} strokeWidth={2} />}
            label="Account Information"
            value={user?.email ?? '—'}
            t={t}
            onPress={() => router.push('/account-info')}
          />
          <ProfileMenuRow
            icon={<Edit3 size={18} color={colors.primary} strokeWidth={2} />}
            label="Edit Profile"
            value="Update your info"
            t={t}
            onPress={() => router.push('/edit-profile')}
          />

          <Text style={[styles.sectionLabel, { color: t.textTertiary, marginTop: spacing.lg }]}>
            PREFERENCES
          </Text>
          <ProfileMenuRow
            icon={<Settings size={18} color={colors.primary} strokeWidth={2} />}
            label="Settings"
            value="App preferences"
            t={t}
            onPress={() => router.push('/settings')}
          />
          <ProfileMenuRow
            icon={<Star size={18} color={colors.primary} strokeWidth={2} />}
            label="About CAYIM"
            value="v1.0 · by Young Minds"
            t={t}
            onPress={() => setShowAbout(true)}
          />

          {/* Sign out */}
          <Pressable onPress={handleSignOut} style={[styles.signOutBtn, { backgroundColor: t.isDark ? '#1A0D0D' : '#FFF5F5', borderColor: t.isDark ? '#4B1010' : '#FFE0E0' }]}>
            <LogOut size={18} color={colors.error} strokeWidth={2} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </Animated.View>

        <Text style={[styles.footer, { color: t.textTertiary }]}>
          CAYIM · Cash Made With AI by Young Intelligent Minds
        </Text>
      </ScrollView>

      {/* About CAYIM Modal */}
      <Modal
        visible={showAbout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.card }]}>
            <View style={styles.modalHeader}>
              <Logo size={36} animated={false} />
              <Pressable onPress={() => setShowAbout(false)} hitSlop={12}>
                <X size={24} color={t.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent} showsVerticalScrollIndicator>
              <Text style={[styles.modalTitle, { color: t.text }]}>CAYIM</Text>
              <Text style={[styles.modalSubtitle, { color: colors.primary }]}>AI Business Mentor</Text>

              <View style={styles.aboutSection}>
                <View style={[styles.aboutCard, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                  <Sparkles size={20} color={colors.primary} strokeWidth={2} />
                  <View style={styles.aboutCardContent}>
                    <Text style={[styles.aboutCardTitle, { color: t.text }]}>What is CAYIM?</Text>
                    <Text style={[styles.aboutCardText, { color: t.textSecondary }]}>
                      CAYIM (Cash Made With AI by Young Intelligent Minds) is your personal AI Business Mentor. We help aspiring entrepreneurs discover, validate, and build the right startup for them through natural conversation and comprehensive business planning.
                    </Text>
                  </View>
                </View>

                <View style={[styles.aboutCard, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                  <Heart size={20} color={colors.error} strokeWidth={2} />
                  <View style={styles.aboutCardContent}>
                    <Text style={[styles.aboutCardTitle, { color: t.text }]}>Built for Founders</Text>
                    <Text style={[styles.aboutCardText, { color: t.textSecondary }]}>
                      Whether you're exploring your first side hustle or building a full-scale startup, CAYIM provides expert guidance, market research, branding resources, and viral marketing strategies tailored to your unique goals and constraints.
                    </Text>
                  </View>
                </View>

                <View style={[styles.aboutCard, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                  <Globe size={20} color={colors.primary} strokeWidth={2} />
                  <View style={styles.aboutCardContent}>
                    <Text style={[styles.aboutCardTitle, { color: t.text }]}>Powered By</Text>
                    <Text style={[styles.aboutCardText, { color: t.textSecondary }]}>
                      Gemini 2.0 Flash AI for intelligent conversations and idea generation. Built with Expo, React Native, and Supabase for a fast, secure, and reliable experience.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.versionInfo}>
                <Text style={[styles.versionText, { color: t.textTertiary }]}>Version 1.0.0</Text>
                <Text style={[styles.versionText, { color: t.textTertiary }]}>© 2025 CAYIM</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileMenuRow({ icon, label, value, onPress, t }: {
  icon: React.ReactNode; label: string; value: string;
  onPress: () => void; t: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { backgroundColor: t.card, borderColor: t.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIcon, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
          {icon}
        </View>
        <View>
          <Text style={[styles.menuLabel, { color: t.text }]}>{label}</Text>
          <Text style={[styles.menuValue, { color: t.textSecondary }]} numberOfLines={1}>{value}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={t.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  brandText: { ...typography.h3, flex: 1 },
  themeToggle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginHorizontal: spacing.lg, padding: spacing.lg,
  },
  avatar: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%', height: '100%', borderRadius: 31,
  },
  profileMeta: { flex: 1 },
  profileName:  { ...typography.h2 },
  profileEmail: { ...typography.small, marginTop: 2 },
  profileSince: { ...typography.caption, marginTop: 4 },

  sectionLabel: {
    ...typography.caption, fontFamily: 'Inter-SemiBold', letterSpacing: 0.8,
    marginBottom: spacing.sm, marginLeft: spacing.lg + 4, marginTop: spacing.xl,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.xl, padding: spacing.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1,
  },
  menuLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...typography.bodyMedium },
  menuValue: { ...typography.caption, marginTop: 2, maxWidth: 200 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: spacing.md, marginHorizontal: spacing.lg,
    marginTop: spacing.md, borderRadius: radius.xl, borderWidth: 1,
  },
  signOutText: { color: colors.error, fontFamily: 'Inter-SemiBold', fontSize: 16 },

  footer: {
    ...typography.caption, textAlign: 'center',
    paddingHorizontal: spacing.xl, marginTop: spacing.xl,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  modalTitle: {
    ...typography.h1,
    fontSize: 28,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  aboutSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  aboutCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  aboutCardContent: {
    flex: 1,
  },
  aboutCardTitle: {
    ...typography.bodyMedium,
    marginBottom: 4,
  },
  aboutCardText: {
    ...typography.small,
    lineHeight: 18,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 4,
  },
  versionText: {
    ...typography.caption,
  },
});
