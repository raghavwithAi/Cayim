import { useState } from 'react';
import { router } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Lightbulb, Sparkles, Rocket, TrendingUp,
  Target, DollarSign, Users, Zap, ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/lib/themeContext';
import { setReport } from '@/lib/reportStore';
import { generateStartupReport } from '@/lib/ai';
import { colors, spacing, typography, radius } from '@/lib/theme';

const EXAMPLE_IDEAS = [
  'A subscription box for eco-friendly skincare products',
  'An AI-powered study planner for college students',
  'A marketplace connecting home cooks with local customers',
  'A mobile app for booking neighborhood sports courts',
  'A freelance platform for video editors',
];

const RESOURCE_TIPS = [
  { icon: Target, label: 'Market Analysis', desc: 'Get a breakdown of market size, growth, and key trends for your idea' },
  { icon: Users, label: 'Competitor Research', desc: 'See who else is doing this and how to differentiate yourself' },
  { icon: DollarSign, label: 'Revenue Model', desc: 'Discover pricing strategies and realistic earning estimates' },
  { icon: Rocket, label: '30-Day Roadmap', desc: 'A week-by-week action plan to go from idea to launch' },
  { icon: TrendingUp, label: 'Marketing Strategy', desc: 'Instagram, YouTube, and community growth tactics' },
  { icon: Zap, label: 'SWOT Analysis', desc: 'Strengths, weaknesses, opportunities, and threats at a glance' },
];

export default function MyIdeaScreen() {
  const { t } = useTheme();
  const [idea, setIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const trimmed = idea.trim();
    if (trimmed.length < 10) {
      setError('Please describe your idea in at least a sentence.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const report = await generateStartupReport(trimmed);
      setReport(report, trimmed);
      router.replace('/loading');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate. Try again.');
      setGenerating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { borderBottomColor: t.borderSoft }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={22} color={t.text} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.text }]}>My Own Idea</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Card glow style={styles.heroCard}>
              <View style={styles.heroIconRow}>
                <View style={[styles.heroIconBg, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                  <Lightbulb size={26} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.heroBadge}>
                  <Sparkles size={12} color={colors.primaryDeep} strokeWidth={2} />
                  <Text style={styles.heroBadgeText}>AI-Powered</Text>
                </View>
              </View>
              <Text style={[styles.heroTitle, { color: t.text }]}>Bring Your Idea to Life</Text>
              <Text style={[styles.heroSub, { color: t.textSecondary }]}>
                Describe any business idea you have in mind. Our AI will generate a complete
                startup plan with market research, competitors, revenue model, marketing
                strategy, and a 30-day roadmap.
              </Text>
            </Card>
          </Animated.View>

          {/* Input */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Card style={styles.inputCard}>
              <Text style={[styles.inputLabel, { color: t.text }]}>Describe your idea</Text>
              <TextInput
                style={[styles.textArea, {
                  backgroundColor: t.inputBg,
                  borderColor: t.border,
                  color: t.text,
                }]}
                placeholder="e.g. A platform that connects college students with part-time tutoring jobs in their city..."
                placeholderTextColor={t.textTertiary}
                value={idea}
                onChangeText={(v) => { setIdea(v); setError(null); }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={500}
              />
              <View style={styles.charRow}>
                <Text style={[styles.charText, { color: t.textTertiary }]}>{idea.length}/500</Text>
              </View>

              {/* Example chips */}
              <Text style={[styles.examplesLabel, { color: t.textSecondary }]}>
                Need inspiration? Try one:
              </Text>
              <View style={styles.chipRow}>
                {EXAMPLE_IDEAS.map((ex, i) => (
                  <Pressable
                    key={i}
                    onPress={() => { setIdea(ex); setError(null); }}
                    style={[styles.chip, { backgroundColor: t.isDark ? '#0F2018' : colors.glow, borderColor: colors.primaryDeep }]}
                  >
                    <Text style={styles.chipText} numberOfLines={1}>{ex}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </Animated.View>

          {/* What you'll get */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={[styles.sectionHeader, { color: t.text }]}>What you'll get</Text>
            <View style={styles.resourceGrid}>
              {RESOURCE_TIPS.map((r, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(350 + i * 60).duration(400)}>
                  <Card style={styles.resourceCard}>
                    <View style={[styles.resourceIconBg, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                      <r.icon size={18} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={[styles.resourceLabel, { color: t.text }]}>{r.label}</Text>
                    <Text style={[styles.resourceDesc, { color: t.textSecondary }]}>{r.desc}</Text>
                  </Card>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Error */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: t.isDark ? '#2A1010' : '#FFF0F0' }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Generate button */}
          <View style={styles.actionRow}>
            <Button
              onPress={handleGenerate}
              loading={generating}
              disabled={generating || idea.trim().length < 10}
              style={styles.generateBtn}
            >
              <View style={styles.btnContent}>
                {generating ? (
                  <Text style={styles.btnText}>Generating your plan...</Text>
                ) : (
                  <>
                    <Rocket size={18} color={colors.white} strokeWidth={2} />
                    <Text style={styles.btnText}>Generate Startup Plan</Text>
                  </>
                )}
              </View>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    gap: 8, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, ...typography.h4, textAlign: 'center', marginRight: 40 },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.md },

  heroCard: { padding: spacing.lg, gap: spacing.sm },
  heroIconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  heroIconBg: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: colors.glow,
  },
  heroBadgeText: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: colors.primaryDeep },
  heroTitle: { ...typography.h2, fontSize: 22 },
  heroSub: { ...typography.body, lineHeight: 22 },

  inputCard: { padding: spacing.lg, gap: spacing.sm },
  inputLabel: { ...typography.h4, fontSize: 15 },
  textArea: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
    lineHeight: 22,
  },
  charRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  charText: { fontSize: 12, fontFamily: 'Inter-Medium' },

  examplesLabel: { fontSize: 13, fontFamily: 'Inter-Medium', marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: radius.pill, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter-Medium', color: colors.primaryDeep },

  sectionHeader: { ...typography.h4, marginTop: spacing.sm, marginBottom: spacing.xs },
  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  resourceCard: {
    width: '48%',
    padding: spacing.md,
    gap: 6,
  },
  resourceIconBg: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  resourceLabel: { ...typography.h4, fontSize: 14 },
  resourceDesc: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 17 },

  errorBox: { borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.sm },
  errorText: { color: colors.error, fontFamily: 'Inter-Medium', fontSize: 14 },

  actionRow: { marginTop: spacing.lg, alignItems: 'center' },
  generateBtn: { width: '100%' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  btnText: { color: colors.white, fontFamily: 'Inter-SemiBold', fontSize: 16 },
});
