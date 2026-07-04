import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft, Mail, Calendar, Shield, Hash, Camera, Trash2,
} from 'lucide-react-native';
import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { colors, spacing, typography, radius } from '@/lib/theme';

export default function AccountInfoScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useTheme();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      // Dynamic import for expo-image-picker
      const ImagePicker = await import('expo-image-picker');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      if (error.message?.includes('expo-image-picker')) {
        Alert.alert('Not Available', 'Photo picker is not available on this platform. Try using the native file picker in your browser.');
      } else {
        Alert.alert('Error', error.message || 'Failed to pick image');
      }
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          upsert: true,
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add timestamp to bust cache
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: cacheBustedUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    Alert.alert('Remove Photo', 'Are you sure you want to remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`]);
            await supabase.storage.from('avatars').remove([`${user.id}/avatar.png`]);
            await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
            await refreshProfile();
          } catch (error: any) {
            Alert.alert('Error', 'Failed to remove photo');
          }
        },
      },
    ]);
  };

  const rows = [
    { icon: <Mail size={18} color={colors.primary} strokeWidth={2} />, label: 'Email address', value: user?.email ?? '—' },
    { icon: <Hash size={18} color={colors.primary} strokeWidth={2} />, label: 'Username', value: profile?.username ?? '—' },
    { icon: <Calendar size={18} color={colors.primary} strokeWidth={2} />, label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
    { icon: <Shield size={18} color={colors.primary} strokeWidth={2} />, label: 'Account status', value: 'Active' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: t.borderSoft }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={t.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.text }]}>Account Information</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable onPress={uploading ? undefined : pickImage} style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <View style={styles.avatarImageWrap}>
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                <View style={styles.avatarOverlay}>
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Camera size={24} color={colors.white} strokeWidth={2} />
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Camera size={28} color={colors.white} strokeWidth={2} />
                )}
              </View>
            )}
          </Pressable>
          <View style={styles.avatarActions}>
            <Pressable
              style={[styles.avatarBtn, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}
              onPress={pickImage}
            >
              {profile?.avatar_url ? (
                <Text style={[styles.avatarBtnText, { color: colors.primary }]}>Change Photo</Text>
              ) : (
                <Text style={[styles.avatarBtnText, { color: colors.primary }]}>Add Photo</Text>
              )}
            </Pressable>
            {profile?.avatar_url && (
              <Pressable
                style={[styles.avatarBtn, styles.avatarBtnDestructive, { backgroundColor: t.isDark ? '#1A0D0D' : '#FFF5F5' }]}
                onPress={removeAvatar}
              >
                <Trash2 size={14} color={colors.error} strokeWidth={2} />
                <Text style={[styles.avatarBtnText, { color: colors.error }]}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Card style={[styles.card, { backgroundColor: t.card, borderColor: t.border }] as any}>
          {rows.map((row, i) => (
            <View
              key={i}
              style={[styles.row, i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.borderSoft }]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                  {row.icon}
                </View>
                <Text style={[styles.rowLabel, { color: t.text }]}>{row.label}</Text>
              </View>
              <Text style={[styles.rowValue, { color: t.textSecondary }]} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>
        <Text style={[styles.note, { color: t.textTertiary }]}>
          Your account information is stored securely via Supabase authentication.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6 },
  headerTitle: { ...typography.h3 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  avatarImageWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  avatarBtnDestructive: {},
  avatarBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  card: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...typography.bodyMedium },
  rowValue: { ...typography.body, flex: 1, textAlign: 'right' },
  note: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
});
