import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Shield, Info, Moon, Sun, Volume2 } from 'lucide-react-native';
import { useTheme } from '@/lib/themeContext';
import { Card } from '@/components/Card';
import { colors, spacing, typography, radius } from '@/lib/theme';

export default function SettingsScreen() {
  const { t, mode, setMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects,  setSoundEffects]  = useState(true);
  const [analytics,     setAnalytics]     = useState(false);

  const isDark = t.isDark;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: t.borderSoft }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={t.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Label label="APPEARANCE" t={t} />
        <Card style={[styles.card, { backgroundColor: t.card, borderColor: t.border }] as any}>
          {/* Dark mode row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? '#0F2018' : colors.glow }]}>
                {isDark
                  ? <Sun size={18} color={colors.primary} strokeWidth={2} />
                  : <Moon size={18} color={colors.primaryDeep} strokeWidth={2} />
                }
              </View>
              <View>
                <Text style={[styles.rowLabel, { color: t.text }]}>Dark Mode</Text>
                <Text style={[styles.rowSub, { color: t.textSecondary }]}>
                  {mode === 'auto' ? 'Follows system' : isDark ? 'On' : 'Off'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
              trackColor={{ false: t.border, true: colors.softGreen }}
              thumbColor={isDark ? colors.primary : t.textTertiary}
            />
          </View>
          <Pressable
            onPress={() => setMode('auto')}
            style={[styles.autoRow, { borderTopColor: t.borderSoft }]}
          >
            <Text style={[styles.rowSub, { color: t.textSecondary }]}>
              Auto (follow system)
            </Text>
            <Text style={[styles.autoActive, { color: mode === 'auto' ? colors.primary : t.textTertiary }]}>
              {mode === 'auto' ? 'Active' : 'Use auto'}
            </Text>
          </Pressable>
        </Card>

        <Label label="NOTIFICATIONS" t={t} />
        <Card style={[styles.card, { backgroundColor: t.card, borderColor: t.border }] as any}>
          <ToggleRow
            icon={<Bell size={18} color={colors.primary} strokeWidth={2} />}
            label="Push notifications"
            sub="Get reminders to work on your startup"
            value={notifications}
            onChange={setNotifications}
            t={t}
          />
        </Card>

        <Label label="SOUND & HAPTICS" t={t} />
        <Card style={[styles.card, { backgroundColor: t.card, borderColor: t.border }] as any}>
          <ToggleRow
            icon={<Volume2 size={18} color={colors.primary} strokeWidth={2} />}
            label="Sound Effects"
            sub="Soft sounds for saves, deletes, taps"
            value={soundEffects}
            onChange={setSoundEffects}
            t={t}
          />
        </Card>

        <Label label="PRIVACY" t={t} />
        <Card style={[styles.card, { backgroundColor: t.card, borderColor: t.border }] as any}>
          <ToggleRow
            icon={<Shield size={18} color={colors.primary} strokeWidth={2} />}
            label="Share analytics"
            sub="Help improve CAYIM (anonymous)"
            value={analytics}
            onChange={setAnalytics}
            t={t}
          />
        </Card>

        <Label label="ABOUT" t={t} />
        <Card style={[styles.card, { backgroundColor: t.card, borderColor: t.border }] as any}>
          <InfoRow label="App Version"   value="1.0.0"              border t={t} />
          <InfoRow label="AI Engine"     value="Gemini 2.0 Flash"   border t={t} />
          <InfoRow label="Database"      value="Supabase"           border t={t} />
          <InfoRow label="Build"         value="Expo Router 4"      border={false} t={t} />
        </Card>

        <Text style={[styles.footerNote, { color: t.textTertiary }]}>
          CAYIM — Cash Made With AI by Young Intelligent Minds.{'\n'}
          Settings are saved locally on your device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ label, t }: { label: string; t: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>{label}</Text>
  );
}

function ToggleRow({ icon, label, sub, value, onChange, t }: {
  icon: React.ReactNode; label: string; sub: string;
  value: boolean; onChange: (v: boolean) => void; t: any;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>{icon}</View>
        <View>
          <Text style={[styles.rowLabel, { color: t.text }]}>{label}</Text>
          <Text style={[styles.rowSub, { color: t.textSecondary }]}>{sub}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: t.border, true: colors.softGreen }}
        thumbColor={value ? colors.primary : t.textTertiary}
      />
    </View>
  );
}

function InfoRow({ label, value, border, t }: { label: string; value: string; border: boolean; t: any }) {
  return (
    <View style={[styles.infoRow, border && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.borderSoft }]}>
      <Text style={[styles.rowLabel, { color: t.text }]}>{label}</Text>
      <Text style={[styles.rowSub, { color: t.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:     { padding: 6 },
  headerTitle: { ...typography.h3 },
  scroll:      { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: {
    ...typography.caption, fontFamily: 'Inter-SemiBold', letterSpacing: 0.8,
    marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: 4,
  },
  card: { padding: 0, marginBottom: 0 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  autoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  rowLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel:    { ...typography.bodyMedium },
  rowSub:      { ...typography.caption, marginTop: 1 },
  autoActive:  { ...typography.smallMedium, fontFamily: 'Inter-Medium' },
  footerNote:  {
    ...typography.caption, textAlign: 'center',
    marginTop: spacing.xl, paddingHorizontal: spacing.md, lineHeight: 18,
  },
});
