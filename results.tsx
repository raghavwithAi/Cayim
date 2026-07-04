import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, Alert, LayoutAnimation, Platform, StyleProp, ViewStyle,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, BookmarkPlus, Sparkles, Target, TrendingUp,
  Users, DollarSign, Calendar, ListChecks, Shield,
  Check, AlertTriangle, Rocket, Lightbulb, FileText, Wand2,
  Building2, ScrollText, Receipt, BadgeCheck, Image as ImageIcon, Globe,
  Copy, ExternalLink,
} from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ListCard, Row, SectionTitle } from '@/components/ReportBits';
import { getReport } from '@/lib/reportStore';
import { type StartupReport } from '@/lib/supabase';
import { saveToVault } from '@/lib/ai';
import { useTheme } from '@/lib/themeContext';
import { colors, spacing, typography, radius } from '@/lib/theme';

const TABS = [
  { key: 'overview',    label: 'Overview',  icon: Sparkles },
  { key: 'business',   label: 'Business',  icon: Target },
  { key: 'marketing',  label: 'Marketing', icon: TrendingUp },
  { key: 'swot',       label: 'SWOT',      icon: Users },
  { key: 'revenue',    label: 'Revenue',   icon: DollarSign },
  { key: 'roadmap',    label: 'Roadmap',   icon: Calendar },
  { key: 'risks',      label: 'Risks',     icon: AlertTriangle },
  { key: 'launch',     label: 'Launch Plan', icon: Rocket },
  { key: 'inspo',      label: 'Inspo',     icon: Lightbulb },
  { key: 'docs',       label: 'Docs',      icon: FileText },
  { key: 'prompts',    label: 'Prompt',    icon: Wand2 },
] as const;

const { width: W } = Dimensions.get('window');

export default function ResultsScreen() {
  const { vaultId } = useLocalSearchParams<{ vaultId?: string }>();
  const [report]  = useState<StartupReport | null>(getReport());
  const [tab, setTab]   = useState(0);
  const [saved, setSaved]   = useState(!!vaultId);
  const [saving, setSaving] = useState(false);
  const pagerRef  = useRef<ScrollView>(null);
  const tabBarRef = useRef<ScrollView>(null);
  const { t } = useTheme();

  useEffect(() => { if (vaultId) setSaved(true); }, [vaultId]);

  function onPagerEnd(e: any) {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / W);
    if (i !== tab && i >= 0 && i < TABS.length) {
      setTab(i);
      tabBarRef.current?.scrollTo({ x: Math.max(0, i * 84 - 40), animated: true });
    }
  }

  function selectTab(i: number) {
    setTab(i);
    pagerRef.current?.scrollTo({ x: i * W, animated: true });
    tabBarRef.current?.scrollTo({ x: Math.max(0, i * 84 - 40), animated: true });
  }

  async function handleSave() {
    if (!report) return;
    setSaving(true);
    try {
      await saveToVault(report, '');
      setSaved(true);
      Alert.alert('Saved!', 'Your startup plan is now in your Vault.');
    } catch {
      Alert.alert('Sign in required', 'Create an account to save to your Vault.');
    } finally {
      setSaving(false);
    }
  }

  if (!report) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: t.text }]}>No report yet</Text>
          <Text style={[styles.emptySub, { color: t.textSecondary }]}>Generate a plan first.</Text>
          <Button onPress={() => router.replace('/(tabs)')}>Go home</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.borderSoft }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={t.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.text }]} numberOfLines={1}>
          {report.overview.title}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saved || saving}
          style={[styles.saveBtn, { backgroundColor: saved ? colors.primary : t.isDark ? '#0F2018' : colors.glow }]}
          hitSlop={12}
        >
          <BookmarkPlus size={20} color={saved ? colors.white : colors.primaryDeep} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Sticky tab bar at TOP */}
      <View style={[styles.tabBarWrap, { backgroundColor: t.bg, borderBottomColor: t.borderSoft }]}>
        <ScrollView
          ref={tabBarRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {TABS.map(({ key, label, icon: Icon }, i) => {
            const active = i === tab;
            return (
              <Pressable key={key} onPress={() => selectTab(i)} style={styles.pillWrap}>
                <View style={[
                  styles.pill,
                  {
                    backgroundColor: active ? colors.primary : t.isDark ? '#1A2332' : colors.white,
                    borderColor: active ? colors.primary : t.border,
                  },
                ]}>
                  <Icon size={13} color={active ? colors.white : t.textSecondary} strokeWidth={2} />
                  <Text style={[styles.pillText, { color: active ? colors.white : t.textSecondary }]}>
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Pager */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerEnd}
        scrollEventThrottle={16}
        nestedScrollEnabled
        style={styles.pager}
        decelerationRate="fast"
      >
        {TABS.map(({ key }, i) => (
          <View key={key} style={[styles.page, { width: W }]}>
            <ScrollView
              contentContainerStyle={styles.pageContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {i === 0 && <OverviewTab report={report} t={t} />}
              {i === 1 && <BusinessTab report={report} t={t} />}
              {i === 2 && <MarketingTab report={report} t={t} />}
              {i === 3 && <SwotTab report={report} t={t} />}
              {i === 4 && <RevenueTab report={report} t={t} />}
              {i === 5 && <RoadmapTab report={report} t={t} />}
              {i === 6 && <RisksTab report={report} t={t} />}
              {i === 7 && <LaunchPlanTab report={report} t={t} />}
              {i === 8 && <InspoTab report={report} t={t} />}
              {i === 9 && <DocsTab report={report} t={t} />}
              {i === 10 && <PromptsTab report={report} t={t} />}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tab components ───────────────────────────────────────────

type TabProps = { report: StartupReport; t: any };

function OverviewTab({ report, t }: TabProps) {
  return (
    <>
      <Card glow>
        <Row2 eyebrow="AI-GENERATED SUMMARY" icon={<Sparkles size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        <Text style={[s.overviewTitle, { color: t.text }]}>{report.overview.title}</Text>
        <Text style={[s.body, { color: t.text }]}>{report.overview.summary}</Text>
        <TagRow tags={report.overview.tags ?? []} t={t} />
      </Card>
      <Card>
        <Row2 eyebrow="METRICS" icon={<DollarSign size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        <MetricRow label="Difficulty"     value={report.business.difficulty}      t={t} />
        <MetricRow label="Startup Cost"   value={report.business.startupCost}     t={t} />
        <MetricRow label="Earnings"       value={report.business.potentialEarnings} t={t} />
      </Card>
      <Card>
        <Row2 eyebrow="BUSINESS SCORE" t={t} />
        <ScoreBar score={85} t={t} />
      </Card>
    </>
  );
}

function BusinessTab({ report, t }: TabProps) {
  const b = report.business;
  return (
    <>
      <Card>
        <Row2 eyebrow="BUSINESS IDEA" icon={<Target size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        <Text style={[s.h3, { color: t.text }]}>{b.idea}</Text>
        <Text style={[s.body, { color: t.text }]}>{b.description}</Text>
      </Card>
      <Card>
        <Text style={[s.sectionTitle, { color: t.text }]}>Why it fits you</Text>
        <Text style={[s.body, { color: t.text }]}>{b.whyItFits}</Text>
      </Card>
      <Card>
        <MetricRow label="Potential Earnings" value={b.potentialEarnings} t={t} />
        <MetricRow label="Difficulty"         value={b.difficulty}        t={t} />
        <MetricRow label="Startup Cost"       value={b.startupCost}       t={t} />
      </Card>
    </>
  );
}

function MarketingTab({ report, t }: TabProps) {
  const m = report.marketing;
  const sections = [
    { title: 'Instagram Strategy',    text: m.instagram },
    { title: 'YouTube Strategy',      text: m.youtube },
    { title: 'Community Strategy',    text: m.community },
    { title: 'Customer Acquisition',  text: m.acquisition },
    { title: 'Growth Strategy',       text: m.growth },
  ];
  return (
    <>
      {sections.map(({ title, text }, i) => (
        <Card key={i}>
          <Text style={[s.sectionTitle, { color: t.text }]}>{title}</Text>
          <Text style={[s.body, { color: t.text }]}>{text}</Text>
        </Card>
      ))}
    </>
  );
}

function SwotTab({ report, t }: TabProps) {
  const sw = report.swot;
  return (
    <>
      <SwotCard title="Strengths"    items={sw.strengths}    color={colors.primary} positive t={t} />
      <SwotCard title="Weaknesses"   items={sw.weaknesses}   color={colors.error}   positive={false} t={t} />
      <SwotCard title="Opportunities" items={sw.opportunities} color={colors.primary} positive t={t} />
      <SwotCard title="Threats"      items={sw.threats}      color={colors.error}   positive={false} t={t} />
    </>
  );
}

function SwotCard({ title, items, color, positive, t }: {
  title: string; items: string[]; color: string; positive: boolean; t: any;
}) {
  return (
    <Card style={{
      backgroundColor: positive
        ? t.isDark ? '#0A1C10' : colors.glowSoft
        : t.isDark ? '#1A0D0D' : '#FFF8F8',
      borderColor: positive
        ? t.isDark ? colors.primaryDeep : colors.glow
        : t.isDark ? '#4B1010' : '#FFE0E0',
    } as any}>
      <Text style={[s.sectionTitle, { color: t.text, marginBottom: spacing.md }]}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow}>
          <View style={[s.bulletDot, { backgroundColor: color }]} />
          <Text style={[s.body, { color: t.text, flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </Card>
  );
}

function RevenueTab({ report, t }: TabProps) {
  const r = report.revenue;
  return (
    <>
      <Card>
        <Row2 eyebrow="REVENUE STREAMS" icon={<DollarSign size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        {(r.sources ?? []).map((src, i) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{src}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <MetricRow label="Pricing Model"   value={r.pricingModel}    t={t} />
        <MetricRow label="Profit Potential" value={r.profitPotential} t={t} />
      </Card>
      <Card glow>
        <Row2 eyebrow="MONTHLY ESTIMATE" t={t} />
        <Text style={[s.bigEst, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>
          {r.monthlyEstimate}
        </Text>
      </Card>
    </>
  );
}

function RoadmapTab({ report, t }: TabProps) {
  return (
    <>
      {(report.roadmap ?? []).map((wk, i) => (
        <Card key={i}>
          <View style={s.weekRow}>
            <View style={[s.weekBadge, { backgroundColor: colors.primary }]}>
              <Calendar size={14} color={colors.white} strokeWidth={2} />
            </View>
            <Text style={[s.h3, { color: t.text }]}>{wk.week}</Text>
          </View>
          {(wk.steps ?? []).map((step, j) => (
            <View key={j} style={s.bulletRow}>
              <View style={[s.stepNum, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
                <Text style={[s.stepNumText, { color: colors.primaryDeep }]}>{j + 1}</Text>
              </View>
              <Text style={[s.body, { color: t.text, flex: 1 }]}>{step}</Text>
            </View>
          ))}
        </Card>
      ))}
    </>
  );
}

function RisksTab({ report, t }: TabProps) {
  const risks = [
    report.business.riskAnalysis,
    ...(report.swot.threats ?? []),
    ...(report.swot.weaknesses ?? []),
  ];
  return (
    <>
      <Card>
        <Row2 eyebrow="RISK ANALYSIS" icon={<Shield size={15} color={colors.warning} strokeWidth={2} />} t={t} />
        <Text style={[s.body, { color: t.text }]}>{report.business.riskAnalysis}</Text>
      </Card>
      <Card style={{
        backgroundColor: t.isDark ? '#1A1208' : '#FFFBF0',
        borderColor: t.isDark ? '#3D2D05' : '#FEF3C7',
      } as any}>
        <Row2 eyebrow="THREATS & WEAKNESSES" icon={<AlertTriangle size={15} color={colors.warning} strokeWidth={2} />} t={t} />
        {[...(report.swot.threats ?? []), ...(report.swot.weaknesses ?? [])].map((item, i) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colors.warning }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{item}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}

function LaunchPlanTab({ report, t }: TabProps) {
  const [steps, setSteps] = useState(report.tracker ?? []);
  const done = steps.filter((s) => s.done).length;
  const pct  = steps.length ? Math.round((done / steps.length) * 100) : 0;

  function toggle(i: number) {
    if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSteps((prev) => prev.map((st, idx) => idx === i ? { ...st, done: !st.done } : st));
  }

  return (
    <>
      <Card glow>
        <Row2 eyebrow="LAUNCH TRACKER" icon={<Rocket size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        <Text style={[s.pctText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>{pct}%</Text>
        <View style={[s.progressTrack, { backgroundColor: t.isDark ? '#1A2535' : colors.borderSoft }]}>
          <View style={[s.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={[s.body, { color: t.textSecondary }]}>{done} of {steps.length} complete</Text>
      </Card>
      {steps.map((st, i) => (
        <Pressable key={i} onPress={() => toggle(i)}>
          <Card style={[
            s.stepCard,
            st.done && {
              backgroundColor: t.isDark ? '#0A1C10' : colors.glowSoft,
              borderColor: t.isDark ? colors.primaryDeep : colors.glow,
            },
          ] as StyleProp<ViewStyle>}>
            <View style={[s.stepCheck, {
              borderColor: st.done ? colors.primary : t.border,
              backgroundColor: st.done ? colors.primary : 'transparent',
            }]}>
              {st.done && <Check size={14} color={colors.white} strokeWidth={3} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.stepLabel, { color: st.done ? t.textSecondary : t.text },
                st.done && { textDecorationLine: 'line-through' },
              ]}>
                {st.label}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <Card>
        <Row2 eyebrow="30-DAY ROADMAP" icon={<Calendar size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        {(report.roadmap ?? []).slice(0, 1).map((wk, i) =>
          (wk.steps ?? []).map((step, j) => (
            <View key={`${i}-${j}`} style={s.bulletRow}>
              <View style={[s.bulletDot, { backgroundColor: colors.primary }]} />
              <Text style={[s.body, { color: t.text, flex: 1 }]}>{step}</Text>
            </View>
          ))
        )}
      </Card>
    </>
  );
}

// ─── Inspo Tab ──────────────────────────────────────────────────
function InspoTab({ report, t }: TabProps) {
  const companies = report.inspo ?? [];
  if (!companies.length) {
    return <EmptyTab icon={<Lightbulb size={32} color={colors.primary} strokeWidth={2} />} message="Inspiration companies will appear here once generated." t={t} />;
  }
  return (
    <>
      <Card glow>
        <Row2 eyebrow="REAL-WORLD INSPIRATION" icon={<Lightbulb size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        <Text style={[s.body, { color: t.textSecondary }]}>
          {companies.length} companies relevant to your idea. Study how they built, marketed, and scaled.
        </Text>
      </Card>
      {companies.map((c, i) => (
        <Card key={i} style={s.inspoCard}>
          <View style={s.inspoHeader}>
            {c.logoUrl ? (
              <RNImage source={{ uri: c.logoUrl }} style={s.inspoLogo} />
            ) : (
              <View style={[s.inspoLogoPlaceholder, { backgroundColor: t.isDark ? '#1A2535' : colors.glow }]}>
                <Building2 size={18} color={colors.primary} strokeWidth={2} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[s.inspoName, { color: t.text }]}>{c.name}</Text>
              <Text style={[s.inspoModel, { color: t.textSecondary }]}>{c.businessModel}</Text>
            </View>
          </View>
          <Text style={[s.body, { color: t.text, marginBottom: 6 }]}>{c.description}</Text>
          <View style={[s.inspoRelevant, { backgroundColor: t.isDark ? '#0F2018' : colors.glowSoft }]}>
            <Text style={[s.inspoRelevantLabel, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>Why it's relevant</Text>
            <Text style={[s.body, { color: t.textSecondary }]}>{c.whyRelevant}</Text>
          </View>
          <Text style={[s.inspoLessonsLabel, { color: t.text }]}>Key Lessons</Text>
          {c.keyLessons.map((l, j) => (
            <View key={j} style={s.bulletRow}>
              <View style={[s.bulletDot, { backgroundColor: colors.primary }]} />
              <Text style={[s.body, { color: t.text, flex: 1 }]}>{l}</Text>
            </View>
          ))}
        </Card>
      ))}
    </>
  );
}

// ─── Docs Tab ───────────────────────────────────────────────────
function DocsTab({ report, t }: TabProps) {
  const docs = report.docs;
  if (!docs || (!docs.registrations?.length && !docs.licenses?.length && !docs.taxes?.length && !docs.compliance?.length && !docs.certifications?.length)) {
    return <EmptyTab icon={<FileText size={32} color={colors.primary} strokeWidth={2} />} message="Legal requirements will appear here once generated." t={t} />;
  }
  return (
    <>
      <Card glow>
        <Row2 eyebrow="LEGAL & COMPLIANCE" icon={<FileText size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        <Text style={[s.body, { color: t.textSecondary }]}>
          Everything you need to legally start and run your business. Explained in simple language.
        </Text>
      </Card>
      {docs.registrations?.length > 0 && (
        <DocsSection title="Registrations" icon={<ScrollText size={15} color={colors.primary} strokeWidth={2} />} items={docs.registrations.map((r) => ({ name: r.name, desc: r.description, cost: r.cost, url: r.url }))} t={t} />
      )}
      {docs.licenses?.length > 0 && (
        <DocsSection title="Licenses" icon={<BadgeCheck size={15} color={colors.primary} strokeWidth={2} />} items={docs.licenses.map((r) => ({ name: r.name, desc: r.description, cost: r.cost }))} t={t} />
      )}
      {docs.taxes?.length > 0 && (
        <DocsSection title="Taxes" icon={<Receipt size={15} color={colors.primary} strokeWidth={2} />} items={docs.taxes.map((r) => ({ name: r.name, desc: r.description, cost: r.rate }))} t={t} />
      )}
      {docs.compliance?.length > 0 && (
        <DocsSection title="Compliance" icon={<Shield size={15} color={colors.primary} strokeWidth={2} />} items={docs.compliance.map((r) => ({ name: r.name, desc: r.description }))} t={t} />
      )}
      {docs.certifications?.length > 0 && (
        <DocsSection title="Certifications" icon={<BadgeCheck size={15} color={colors.primary} strokeWidth={2} />} items={docs.certifications.map((r) => ({ name: r.name, desc: r.description, tag: r.optional ? 'Optional' : undefined }))} t={t} />
      )}
    </>
  );
}

function DocsSection({ title, icon, items, t }: { title: string; icon: React.ReactNode; items: { name: string; desc: string; cost?: string; url?: string; tag?: string }[]; t: any }) {
  return (
    <Card>
      <Row2 eyebrow={title.toUpperCase()} icon={icon} t={t} />
      {items.map((item, i) => (
        <View key={i} style={[s.docItem, { borderBottomColor: t.borderSoft }]}>
          <View style={s.docItemHeader}>
            <Text style={[s.docItemName, { color: t.text }]}>{item.name}</Text>
            {item.tag && <View style={[s.docTag, { backgroundColor: t.isDark ? '#1A2535' : colors.glow }]}><Text style={[s.docTagText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>{item.tag}</Text></View>}
          </View>
          <Text style={[s.body, { color: t.textSecondary, marginBottom: 4 }]}>{item.desc}</Text>
          {item.cost && <Text style={[s.docCost, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>Cost: {item.cost}</Text>}
          {item.url && <Pressable onPress={() => { if (Platform.OS === 'web') window.open(item.url, '_blank'); }} style={s.docLink}>
            <ExternalLink size={12} color={colors.primary} strokeWidth={2} />
            <Text style={[s.docLinkText, { color: colors.primary }]}>{item.url}</Text>
          </Pressable>}
        </View>
      ))}
    </Card>
  );
}

// ─── Prompts Tab ────────────────────────────────────────────────
function PromptsTab({ report, t }: TabProps) {
  const prompts = report.prompts;
  const [copiedIdx, setCopiedIdx] = useState(-1);
  if (!prompts || (!prompts.aiPrompts?.length && !prompts.businessNames?.length)) {
    return <EmptyTab icon={<Wand2 size={32} color={colors.primary} strokeWidth={2} />} message="AI prompts and business names will appear here once generated." t={t} />;
  }
  function copyPrompt(text: string, idx: number) {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(-1), 2000);
    }
  }
  return (
    <>
      <Card glow>
        <Row2 eyebrow="AI CREATION PROMPTS" icon={<Wand2 size={15} color={colors.primary} strokeWidth={2} />} t={t} />
        <Text style={[s.body, { color: t.textSecondary }]}>
          Ready-to-use prompts for AI image generators and branding. Tap to copy.
        </Text>
      </Card>
      {prompts.aiPrompts?.map((p, i) => (
        <Card key={i} style={s.promptCard}>
          <View style={s.promptHeader}>
            <View style={[s.promptIconBg, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
              <ImageIcon size={14} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[s.promptCategory, { color: t.text }]}>{p.category}</Text>
            <Pressable onPress={() => copyPrompt(p.prompt, i)} hitSlop={8} style={s.copyBtn}>
              {copiedIdx === i ? (
                <Check size={14} color={colors.primary} strokeWidth={2.5} />
              ) : (
                <Copy size={14} color={t.textTertiary} strokeWidth={2} />
              )}
            </Pressable>
          </View>
          <Text style={[s.promptText, { color: t.textSecondary }]}>{p.prompt}</Text>
        </Card>
      ))}
      {prompts.businessNames?.length > 0 && (
        <Card>
          <Row2 eyebrow="BUSINESS NAME IDEAS" icon={<Globe size={15} color={colors.primary} strokeWidth={2} />} t={t} />
          {prompts.businessNames.map((n, i) => (
            <View key={i} style={[s.nameRow, { borderBottomColor: t.borderSoft }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.nameText, { color: t.text }]}>{n.name}</Text>
                <Text style={[s.nameDomain, { color: colors.primary }]}>{n.domainSuggestion}</Text>
                <Text style={[s.nameRationale, { color: t.textSecondary }]}>{n.rationale}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

function EmptyTab({ icon, message, t }: { icon: React.ReactNode; message: string; t: any }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
      <View style={[s.emptyIconBg, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>{icon}</View>
      <Text style={[s.body, { color: t.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>{message}</Text>
    </Card>
  );
}

// ─── Shared sub-components ────────────────────────────────────

function Row2({ eyebrow, icon, t }: { eyebrow: string; icon?: React.ReactNode; t: any }) {
  return (
    <View style={s.eyebrowRow}>
      {icon}
      <Text style={[s.eyebrow, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>{eyebrow}</Text>
    </View>
  );
}

function MetricRow({ label, value, t }: { label: string; value: string; t: any }) {
  return (
    <View style={[s.metricRow, { borderBottomColor: t.borderSoft }]}>
      <Text style={[s.metricLabel, { color: t.textSecondary }]}>{label}</Text>
      <Text style={[s.metricValue, { color: t.text }]}>{value}</Text>
    </View>
  );
}

function TagRow({ tags, t }: { tags: string[]; t: any }) {
  return (
    <View style={s.tagRow}>
      {tags.map((tag, i) => (
        <View key={i} style={[s.tag, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
          <Text style={[s.tagText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function ScoreBar({ score, t }: { score: number; t: any }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(score, { duration: 900 }); }, []);
  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value}%` as any }));
  return (
    <View>
      <View style={[s.scoreBg, { backgroundColor: t.isDark ? '#1A2535' : colors.borderSoft }]}>
        <Animated.View style={[s.scoreFill, fillStyle]} />
      </View>
      <Text style={[s.scoreText, { color: t.textSecondary }]}>Business viability score: {score}/100</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    gap: 8, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:     { padding: 6 },
  headerTitle: { flex: 1, ...typography.h4, marginHorizontal: 4 },
  saveBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  tabBarWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBarScroll: { paddingHorizontal: spacing.md, paddingVertical: 8, gap: 6 },
  pillWrap: {},
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },

  pager: { flex: 1 },
  page:  { flex: 1 },
  pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 80, gap: spacing.md },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 12 },
  emptyTitle: { ...typography.h2 },
  emptySub:   { ...typography.body },
});

const s = StyleSheet.create({
  eyebrowRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  eyebrow:     { fontSize: 11, fontFamily: 'Inter-SemiBold', letterSpacing: 0.7 },
  overviewTitle: { ...typography.h2, fontSize: 22, marginBottom: spacing.sm },
  h3:          { ...typography.h3, marginBottom: 8 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  body:        { ...typography.body, lineHeight: 23 },

  tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  tag:     { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 8, flexShrink: 0 },
  stepNum:   { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },

  weekRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  weekBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  metricRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  metricLabel: { ...typography.body },
  metricValue: { ...typography.bodyMedium, flex: 1, textAlign: 'right' },

  bigEst:      { ...typography.h2, fontSize: 26, marginTop: spacing.sm },

  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden', marginVertical: spacing.sm },
  progressFill:  { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  pctText:       { fontSize: 42, fontFamily: 'Inter-Bold', marginBottom: 4 },

  stepCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, marginBottom: 0 },
  stepCheck: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepLabel: { ...typography.bodyMedium },

  scoreBg:   { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
  scoreFill: { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  scoreText: { ...typography.caption },

  // ── Inspo tab ──
  inspoCard:  { padding: spacing.lg, gap: 8 },
  inspoHeader:{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  inspoLogo:  { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f0f0f0' },
  inspoLogoPlaceholder: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inspoName:  { ...typography.h4, fontSize: 16 },
  inspoModel: { ...typography.small, fontFamily: 'Inter-Medium' },
  inspoRelevant: { borderRadius: radius.lg, padding: spacing.md, marginBottom: 8 },
  inspoRelevantLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', marginBottom: 4 },
  inspoLessonsLabel: { ...typography.smallMedium, marginBottom: 6, marginTop: 4 },

  // ── Docs tab ──
  docItem:    { paddingVertical: 12, borderBottomWidth: 1 },
  docItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  docItemName:{ ...typography.bodyMedium, fontSize: 15 },
  docTag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  docTagText: { fontSize: 11, fontFamily: 'Inter-Medium' },
  docCost:    { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  docLink:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  docLinkText:{ fontSize: 12, fontFamily: 'Inter-Medium' },

  // ── Prompts tab ──
  promptCard:   { padding: spacing.lg },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  promptIconBg: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  promptCategory:{ ...typography.h4, fontSize: 14, flex: 1 },
  copyBtn:      { padding: 6 },
  promptText:   { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 20 },
  nameRow:      { paddingVertical: 12, borderBottomWidth: 1 },
  nameText:     { ...typography.h4, fontSize: 16 },
  nameDomain:   { fontSize: 13, fontFamily: 'Inter-SemiBold', marginTop: 2 },
  nameRationale:{ ...typography.small, marginTop: 4 },

  // ── Empty tab ──
  emptyIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
