import { useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Plus } from 'lucide-react-native';
import Animated, { SlideInRight, SlideOutLeft, Easing } from 'react-native-reanimated';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/lib/themeContext';
import { SurveyAnswers } from '@/lib/supabase';
import { setReport } from '@/lib/reportStore';
import { generateStartupReport } from '@/lib/ai';
import { colors, spacing, typography, radius } from '@/lib/theme';

type Q = {
  key: keyof SurveyAnswers;
  title: string;
  subtitle: string;
  options: string[];
  multi?: boolean;
  allowCustom?: boolean;
};

const QUESTIONS: Q[] = [
  { key: 'describes',    title: 'What describes you best?',          subtitle: 'Helps tailor the plan to your situation.',       options: ['Student', 'College Student', 'Employee', 'Business Owner', 'Other'],                          allowCustom: true },
  { key: 'budget',       title: 'What is your budget?',              subtitle: 'We will keep the plan realistic for you.',       options: ['₹0–1,000', '₹1,000–5,000', '₹5,000–25,000', '₹25,000+'] },
  { key: 'business_type', title: 'What business type interests you?', subtitle: 'Pick the path that excites you most.',           options: ['AI', 'SaaS', 'Ecommerce', 'Agency', 'Physical Product', 'Real Estate', 'Other'],               allowCustom: true },
  { key: 'skills',       title: 'What are your skills?',             subtitle: 'Select all that apply — be honest!',             options: ['Marketing', 'Coding', 'Writing', 'Design', 'Sales', 'Other'], multi: true,                     allowCustom: true },
  { key: 'timeAvailable', title: 'How much time can you give?',      subtitle: 'Daily commitment you can realistically keep.',   options: ['1 hour/day', '2–3 hours/day', '5+ hours/day'] },
  { key: 'goal',         title: 'What is your goal?',                subtitle: 'What success looks like for you.',               options: ['Side Income', 'Full Business', 'Learning', 'Startup'],                                       allowCustom: true },
];

const DEFAULTS: SurveyAnswers = {
  describes: '', budget: '', business_type: '',
  skills: [], timeAvailable: '', goal: '',
};

export default function SurveyScreen() {
  const { t } = useTheme();
  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState<SurveyAnswers>({ ...DEFAULTS });
  const [customText, setCustom] = useState('');
  const [generating, setGen]    = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const q      = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  function toggle(option: string) {
    setAnswers((prev) => {
      if (q.multi) {
        const list = prev[q.key] as string[];
        return { ...prev, [q.key]: list.includes(option) ? list.filter((o) => o !== option) : [...list, option] };
      }
      return { ...prev, [q.key]: option };
    });
    setCustom('');
  }

  function addCustom() {
    const v = customText.trim();
    if (!v) return;
    if (q.multi) {
      setAnswers((prev) => ({ ...prev, [q.key]: [...(prev[q.key] as string[]), v] }));
    } else {
      setAnswers((prev) => ({ ...prev, [q.key]: v }));
    }
    setCustom('');
  }

  function canProceed() {
    const val = answers[q.key];
    if (q.multi) return Array.isArray(val) && val.length > 0;
    return !!val;
  }

  function next() {
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  }

  async function finish() {
    setError(null);
    setGen(true);
    try {
      const report = await generateStartupReport(answers);
      setReport(report, answers);
      router.replace('/loading');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate. Try again.');
      setGen(false);
    }
  }

  const progress = ((step + (canProceed() ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      {/* Header with progress bar */}
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={t.text} strokeWidth={2} />
        </Pressable>
        <View style={[styles.progressTrack, { backgroundColor: t.isDark ? '#1A2535' : colors.borderSoft }]}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <Text style={[styles.stepCount, { color: t.textSecondary }]}>{step + 1}/{QUESTIONS.length}</Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={step}
            entering={SlideInRight.duration(260).easing(Easing.out(Easing.ease))}
            exiting={SlideOutLeft.duration(200)}
          >
            <Text style={[styles.qTitle, { color: t.text }]}>{q.title}</Text>
            <Text style={[styles.qSub, { color: t.textSecondary }]}>{q.subtitle}</Text>

            <View style={styles.options}>
              {q.options.map((opt) => {
                const sel = q.multi
                  ? (answers[q.key] as string[]).includes(opt)
                  : answers[q.key] === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => toggle(opt)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: sel ? colors.primary : t.card,
                        borderColor: sel ? colors.primary : t.border,
                      },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: sel ? colors.white : t.text }]}>{opt}</Text>
                    {sel && <Check size={18} color={colors.white} strokeWidth={2.5} />}
                  </Pressable>
                );
              })}

              {/* Selected chips for multi */}
              {q.multi && (answers[q.key] as string[]).filter((s) => !q.options.includes(s)).length > 0 && (
                <View style={styles.chips}>
                  {(answers[q.key] as string[]).filter((s) => !q.options.includes(s)).map((s) => (
                    <View key={s} style={[styles.chip, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                      <Text style={[styles.chipText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>{s}</Text>
                      <Pressable onPress={() => toggle(s)} hitSlop={8}>
                        <Text style={{ color: colors.primaryDeep, fontSize: 16, lineHeight: 16 }}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Custom answer input */}
              {q.allowCustom && (
                <View style={styles.customRow}>
                  <TextInput
                    style={[styles.customInput, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
                    placeholder="Add your own answer"
                    placeholderTextColor={t.textTertiary}
                    value={customText}
                    onChangeText={setCustom}
                    onSubmitEditing={addCustom}
                  />
                  <Pressable onPress={addCustom} style={[styles.customAdd, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                    <Plus size={18} color={colors.primaryDeep} strokeWidth={2.5} />
                  </Pressable>
                </View>
              )}
            </View>
          </Animated.View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: t.bg }]}>
          {isLast ? (
            <Button onPress={finish} loading={generating} disabled={!canProceed()}>
              Generate my startup plan
            </Button>
          ) : (
            <Button onPress={next} disabled={!canProceed()}>Continue</Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  flex:  { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 10,
  },
  backBtn:       { padding: 6 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  stepCount:     { ...typography.smallMedium, minWidth: 32, textAlign: 'right' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  qTitle: { ...typography.h1, marginBottom: 8 },
  qSub:   { ...typography.body, marginBottom: spacing.xl },
  options: { gap: spacing.md },
  option:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56,
  },
  optionText: { ...typography.bodyMedium, flex: 1 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText:   { ...typography.smallMedium },
  customRow:  { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  customInput: {
    flex: 1, borderWidth: 1.5, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, minHeight: 50, ...typography.body,
  },
  customAdd: { width: 50, height: 50, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  footer:    { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  error:     { color: colors.error, ...typography.small, marginTop: spacing.md },
});
