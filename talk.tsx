import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/themeContext';
import { colors, spacing, typography } from '@/lib/theme';

export default function TalkScreen() {
  const { t } = useTheme();

  useEffect(() => {
    // Redirect to the new mentor chat
    const timeout = setTimeout(() => {
      router.replace('/mentor');
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: t.textSecondary }]}>Opening AI Mentor...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    ...typography.body,
  },
});
