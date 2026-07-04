import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Save } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, typography, radius } from '@/lib/theme';

export default function EditProfileScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const { t } = useTheme();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function save() {
    if (!username.trim()) { setError('Username is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ username: username.trim(), full_name: fullName.trim() })
        .eq('id', user!.id);
      if (err) throw err;
      await refreshProfile();
      Alert.alert('Saved!', 'Your profile has been updated.');
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: t.borderSoft }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={t.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.text }]}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <User size={32} color={colors.white} strokeWidth={2} />
          </View>
          <Text style={[styles.avatarHint, { color: t.textTertiary }]}>
            Tap to change photo (coming soon)
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: t.card, borderColor: t.border }] as any}>
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={[styles.label, { color: t.textSecondary }]}>Username</Text>
          <TextInput
            style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
            value={username} onChangeText={setUsername}
            autoCapitalize="none" placeholder="your_username"
            placeholderTextColor={t.textTertiary}
          />

          <Text style={[styles.label, { color: t.textSecondary }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
            value={fullName} onChangeText={setFullName}
            placeholder="Your full name" placeholderTextColor={t.textTertiary}
          />

          <Text style={[styles.label, { color: t.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: t.isDark ? '#1A2535' : '#F5F5F5', borderColor: t.border, color: t.textSecondary }]}
            value={user?.email ?? ''} editable={false}
          />
          <Text style={[styles.hint, { color: t.textTertiary }]}>Email cannot be changed here.</Text>
        </Card>

        <Button onPress={save} loading={saving} style={styles.saveBtn}>
          <View style={styles.saveRow}>
            <Save size={18} color={colors.white} strokeWidth={2} />
            <Text style={styles.saveText}>Save changes</Text>
          </View>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:     { padding: 6 },
  headerTitle: { ...typography.h3 },
  scroll:      { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  avatarWrap:  { alignItems: 'center', paddingVertical: spacing.lg },
  avatar:      { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarHint:  { ...typography.caption, marginTop: 8 },
  card:        { gap: 0 },
  error:       { color: colors.error, ...typography.small, marginBottom: spacing.md },
  label:       { ...typography.smallMedium, marginBottom: 6, marginTop: spacing.sm },
  input:       {
    borderWidth: 1, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    ...typography.body, marginBottom: 4,
  },
  hint:     { ...typography.caption, marginBottom: spacing.sm },
  saveBtn:  { marginTop: spacing.sm },
  saveRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveText: { color: colors.white, fontFamily: 'Inter-SemiBold', fontSize: 16 },
});
