import { useEffect, useState, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, ActivityIndicator, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Sparkles, Target, Users, TrendingUp, DollarSign,
  Calendar, Zap, Award, Globe, BookOpen, Rocket, BookmarkPlus,
  ChevronRight, Instagram, Youtube, Film, Hash, Camera, Clock,
  Copy, Image, Video, Share2, Check,
} from 'lucide-react-native';
import Animated, {
  FadeInUp, SlideInRight,
} from 'react-native-reanimated';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/lib/themeContext';
import { supabase, GeneratedIdea } from '@/lib/supabase';
import { colors, spacing, typography, radius } from '@/lib/theme';

const { width: W, height: H } = Dimensions.get('window');

const IDEA_COLORS = [
  { bg: '#0F2018', text: colors.softGreen, accent: '#22C55E' },
  { bg: '#1A0F2E', text: '#A78BFA', accent: '#8B5CF6' },
  { bg: '#0F1A2E', text: '#60A5FA', accent: '#3B82F6' },
  { bg: '#2E1A0F', text: '#F59E0B', accent: '#D97706' },
  { bg: '#1A0F1F', text: '#EC4899', accent: '#DB2777' },
];

type TabKey = 'overview' | 'market' | 'audience' | 'competitors' | 'revenue' |
  'roadmap' | 'skills' | 'funding' | 'communities' | 'branding' | 'landing' |
  'instagram' | 'reels' | 'ai_prompts';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Sparkles },
  { key: 'market', label: 'Market', icon: TrendingUp },
  { key: 'audience', label: 'Audience', icon: Users },
  { key: 'competitors', label: 'Competitors', icon: Target },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'roadmap', label: 'Roadmap', icon: Calendar },
  { key: 'skills', label: 'Skills', icon: BookOpen },
  { key: 'funding', label: 'Funding', icon: Zap },
  { key: 'communities', label: 'Communities', icon: Globe },
  { key: 'branding', label: 'Branding', icon: Award },
  { key: 'landing', label: 'Landing Page', icon: Rocket },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'reels', label: 'Viral Reels', icon: Film },
  { key: 'ai_prompts', label: 'AI Prompts', icon: Image },
];

export default function IdeasScreen() {
  const { conversation_id } = useLocalSearchParams<{ conversation_id: string }>();
  const { t } = useTheme();
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const tabScrollRef = useRef<ScrollView>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    loadIdeas();
  }, [conversation_id]);

  useEffect(() => {
    // Update tab scroll position when activeTab changes
    const tabIndex = TABS.findIndex(t => t.key === activeTab);
    if (tabIndex >= 0) {
      tabScrollRef.current?.scrollTo({
        x: Math.max(0, tabIndex * 85 - 40),
        animated: true
      });
    }
  }, [activeTab]);

  async function loadIdeas() {
    if (!conversation_id) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('generated_ideas')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('idea_index', { ascending: true });

    if (error) {
      Alert.alert('Error', 'Could not load ideas');
      setLoading(false);
      return;
    }
    setIdeas(data || []);
    setLoading(false);
  }

  async function handleSave() {
    if (saved || saving || ideas.length === 0) return;
    const idea = ideas[selectedIdea];
    setSaving(true);
    try {
      const { error } = await supabase.from('startup_vault').insert({
        title: idea.title,
        input_summary: idea.summary,
        overview: { title: idea.title, summary: idea.summary, tags: [idea.idea_type] },
        business: {
          idea: idea.title,
          description: idea.summary,
          whyItFits: '',
          potentialEarnings: idea.roi_estimate?.year_1_revenue_potential || 'N/A',
          difficulty: idea.funding_options?.bootstrappable ? 'Low' : 'Medium',
          startupCost: idea.funding_options?.estimated_startup_cost || 'N/A',
          riskAnalysis: '',
        },
        marketing: {
          instagram: idea.instagram_strategy ? JSON.stringify(idea.instagram_strategy) : '',
          youtube: '',
          community: idea.communities?.map(c => c.name).join(', ') || '',
          acquisition: idea.target_audience?.where_to_find_them || '',
          growth: '',
        },
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        revenue: {
          sources: idea.revenue_model?.secondary_streams || [],
          pricingModel: idea.revenue_model?.pricing_strategy || '',
          profitPotential: idea.roi_estimate?.year_3_revenue_potential || '',
          monthlyEstimate: idea.roi_estimate?.year_1_revenue_potential || '',
        },
        competitors: idea.competitor_analysis || [],
        roadmap: [],
        tracker: [],
        market_research: idea.market_research,
        target_audience: idea.target_audience,
        usp: idea.usp,
        roi_estimate: idea.roi_estimate,
        startup_roadmap: idea.startup_roadmap,
        required_skills: idea.required_skills,
        funding_options: idea.funding_options,
        hackathons: idea.hackathons,
        communities: idea.communities,
        branding: idea.branding,
        landing_page: idea.landing_page,
        instagram_strategy: idea.instagram_strategy,
        viral_reels: idea.viral_reels,
      });
      if (error) throw error;
      setSaved(true);
      Alert.alert('Saved!', 'This idea is now in your Vault.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await Share.share({ message: text });
      setCopiedPrompt(id);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (err) {
      Alert.alert('Error', 'Could not copy');
    }
  }

  async function shareIdea() {
    if (ideas.length === 0) return;
    const idea = ideas[selectedIdea];
    try {
      await Share.share({
        message: `${idea.title}\n\n${idea.summary}\n\nMarket: ${idea.idea_type}\n\nGenerated by CAYIM - AI Business Mentor`,
      });
    } catch (err) {
      // User cancelled
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: t.textSecondary }]}>
            Loading your personalized ideas...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (ideas.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.emptyContainer}>
          <Sparkles size={48} color={colors.primary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: t.text }]}>No ideas generated</Text>
          <Text style={[styles.emptySub, { color: t.textSecondary }]}>
            Start a new conversation with the AI Mentor.
          </Text>
          <Button onPress={() => router.replace('/mentor')}>Start Conversation</Button>
        </View>
      </SafeAreaView>
    );
  }

  const idea = ideas[selectedIdea];
  const colorScheme = IDEA_COLORS[selectedIdea % IDEA_COLORS.length];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.borderSoft }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={t.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.text }]}>Generated Ideas</Text>
        <View style={styles.headeractions}>
          <Pressable
            onPress={shareIdea}
            style={[styles.iconBtn, { backgroundColor: t.isDark ? '#1A2535' : colors.white }]}
            hitSlop={8}
          >
            <Share2 size={18} color={t.textSecondary} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saved || saving}
            style={[styles.saveBtn, { backgroundColor: saved ? colors.primary : colorScheme.bg }]}
            hitSlop={8}
          >
            <BookmarkPlus size={18} color={saved ? colors.white : colorScheme.accent} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Idea Selector */}
      <View style={styles.ideaSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideaSelectorContent}>
          {ideas.map((i, idx) => (
            <Pressable
              key={i.id}
              onPress={() => setSelectedIdea(idx)}
              style={[
                styles.ideaChip,
                {
                  backgroundColor: selectedIdea === idx ? colorScheme.bg : t.isDark ? '#1A2535' : colors.white,
                  borderColor: selectedIdea === idx ? colorScheme.accent : t.border,
                },
              ]}
            >
              <Text style={[
                styles.ideaChipText,
                { color: selectedIdea === idx ? colorScheme.text : t.textSecondary },
              ]}>
                {idx + 1}. {i.idea_type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Idea Title Card */}
      <Animated.View entering={FadeInUp.springify()} style={styles.titleCard}>
        <View style={[styles.ideaHeader, { backgroundColor: colorScheme.bg }]}>
          <Text style={[styles.ideaNumber, { color: colorScheme.accent }]}>Idea {selectedIdea + 1}</Text>
          <Text style={[styles.ideaTitle, { color: colorScheme.text }]}>{idea.title}</Text>
          <Text style={[styles.ideaType, { color: colorScheme.accent }]}>{idea.idea_type}</Text>
        </View>
      </Animated.View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: t.borderSoft }]}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = key === activeTab;
            return (
              <Pressable
                key={key}
                onPress={() => setActiveTab(key)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? colorScheme.bg : 'transparent',
                    borderColor: active ? colorScheme.accent : t.border,
                  },
                ]}
              >
                <Icon size={14} color={active ? colorScheme.text : t.textSecondary} strokeWidth={2} />
                <Text style={[
                  styles.tabPillText,
                  { color: active ? colorScheme.text : t.textSecondary },
                ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && <OverviewTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'market' && <MarketTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'audience' && <AudienceTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'competitors' && <CompetitorsTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'revenue' && <RevenueTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'roadmap' && <RoadmapTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'skills' && <SkillsTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'funding' && <FundingTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'communities' && <CommunitiesTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'branding' && <BrandingTab idea={idea} t={t} colorScheme={colorScheme} copyToClipboard={copyToClipboard} copiedPrompt={copiedPrompt} />}
        {activeTab === 'landing' && <LandingTab idea={idea} t={t} colorScheme={colorScheme} copyToClipboard={copyToClipboard} copiedPrompt={copiedPrompt} />}
        {activeTab === 'instagram' && <InstagramTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'reels' && <ReelsTab idea={idea} t={t} colorScheme={colorScheme} />}
        {activeTab === 'ai_prompts' && <AIPromptsTab idea={idea} t={t} colorScheme={colorScheme} copyToClipboard={copyToClipboard} copiedPrompt={copiedPrompt} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tab Components ─────────────────────────────────────

type TabProps = { idea: GeneratedIdea; t: any; colorScheme: typeof IDEA_COLORS[0] };
type CopyProps = { copyToClipboard: (text: string, id: string) => void; copiedPrompt: string | null };

function OverviewTab({ idea, t, colorScheme }: TabProps) {
  return (
    <>
      <Card>
        <SectionTitle icon={Sparkles} label="Summary" color={colorScheme.accent} />
        <Text style={[s.body, { color: t.text }]}>{idea.summary}</Text>
      </Card>
      <Card>
        <SectionTitle icon={Target} label="Unique Value Proposition" color={colorScheme.accent} />
        <Text style={[s.body, { color: t.text }]}>{idea.usp?.value_proposition || 'N/A'}</Text>
        {idea.usp?.differentiation && (
          <Text style={[s.body, { color: t.textSecondary, marginTop: 8 }]}>
            Differentiation: {idea.usp.differentiation}
          </Text>
        )}
      </Card>
    </>
  );
}

function MarketTab({ idea, t, colorScheme }: TabProps) {
  const mr = idea.market_research;
  if (!mr) return <EmptyState label="Market research not available" t={t} />;
  return (
    <>
      <Card>
        <SectionTitle icon={TrendingUp} label="Market Size" color={colorScheme.accent} />
        <MetricRow label="Market Size" value={mr.market_size} t={t} />
        <MetricRow label="Growth Rate" value={mr.growth_rate} t={t} />
      </Card>
      <Card>
        <SectionTitle icon={TrendingUp} label="Key Trends" color={colorScheme.accent} />
        {(mr.trends || []).map((trend: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colorScheme.accent }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{trend}</Text>
          </View>
        ))}
      </Card>
      <Card glow>
        <SectionTitle icon={Sparkles} label="Key Insights" color={colorScheme.accent} />
        <Text style={[s.body, { color: t.text }]}>{mr.key_insights}</Text>
      </Card>
    </>
  );
}

function AudienceTab({ idea, t, colorScheme }: TabProps) {
  const ta = idea.target_audience;
  if (!ta) return <EmptyState label="Target audience not available" t={t} />;
  return (
    <>
      <Card>
        <SectionTitle icon={Users} label="Primary Audience" color={colorScheme.accent} />
        <Text style={[s.body, { color: t.text }]}>{ta.primary}</Text>
        <MetricRow label="Demographics" value={ta.demographics} t={t} />
      </Card>
      <Card>
        <SectionTitle icon={Target} label="Pain Points" color={colorScheme.accent} />
        {(ta.pain_points || []).map((pp: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colors.error }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{pp}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <SectionTitle icon={Globe} label="Where to Find Them" color={colorScheme.accent} />
        <Text style={[s.body, { color: t.text }]}>{ta.where_to_find_them}</Text>
      </Card>
    </>
  );
}

function CompetitorsTab({ idea, t, colorScheme }: TabProps) {
  const competitors = idea.competitor_analysis;
  if (!competitors || competitors.length === 0) return <EmptyState label="Competitor analysis not available" t={t} />;
  return (
    <>
      {competitors.map((comp: any, i: number) => (
        <Card key={i}>
          <Text style={[s.cardTitle, { color: colorScheme.accent }]}>{comp.name}</Text>
          <View style={s.competitorRow}>
            <View style={s.competitorCol}>
              <Text style={[s.metricLabel, { color: t.textSecondary }]}>Strengths</Text>
              <Text style={[s.body, { color: colors.primary }]}>{comp.strengths}</Text>
            </View>
            <View style={s.competitorCol}>
              <Text style={[s.metricLabel, { color: t.textSecondary }]}>Weaknesses</Text>
              <Text style={[s.body, { color: colors.error }]}>{comp.weaknesses}</Text>
            </View>
          </View>
          <Text style={[s.metricLabel, { color: t.textSecondary }]}>Market Position</Text>
          <Text style={[s.body, { color: t.text }]}>{comp.market_position}</Text>
        </Card>
      ))}
    </>
  );
}

function RevenueTab({ idea, t, colorScheme }: TabProps) {
  const rm = idea.revenue_model;
  const roi = idea.roi_estimate;
  return (
    <>
      <Card>
        <SectionTitle icon={DollarSign} label="Revenue Model" color={colorScheme.accent} />
        <MetricRow label="Primary Stream" value={rm?.primary_stream || 'N/A'} t={t} />
        <MetricRow label="Pricing Strategy" value={rm?.pricing_strategy || 'N/A'} t={t} />
        <MetricRow label="Unit Economics" value={rm?.unit_economics || 'N/A'} t={t} />
      </Card>
      <Card>
        <SectionTitle icon={TrendingUp} label="Secondary Revenue Streams" color={colorScheme.accent} />
        {(rm?.secondary_streams || []).map((s: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colorScheme.accent }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{s}</Text>
          </View>
        ))}
      </Card>
      <Card glow>
        <SectionTitle icon={DollarSign} label="ROI Estimate" color={colorScheme.accent} />
        <MetricRow label="Initial Investment" value={roi?.initial_investment || 'N/A'} t={t} />
        <MetricRow label="Break-even" value={roi?.break_even_timeline || 'N/A'} t={t} />
        <MetricRow label="Year 1 Potential" value={roi?.year_1_revenue_potential || 'N/A'} t={t} />
        <MetricRow label="Year 3 Potential" value={roi?.year_3_revenue_potential || 'N/A'} t={t} />
      </Card>
    </>
  );
}

function RoadmapTab({ idea, t, colorScheme }: TabProps) {
  const roadmap = idea.startup_roadmap;
  if (!roadmap) return <EmptyState label="Startup roadmap not available" t={t} />;
  const phases = [roadmap.phase_1, roadmap.phase_2, roadmap.phase_3, roadmap.phase_4].filter(Boolean);
  return (
    <>
      {phases.map((phase: any, i: number) => (
        <Card key={i}>
          <View style={s.phaseHeader}>
            <View style={[s.phaseBadge, { backgroundColor: colorScheme.accent }]}>
              <Text style={s.phaseBadgeText}>{i + 1}</Text>
            </View>
            <Text style={[s.phaseTitle, { color: t.text }]}>{phase.timeline}</Text>
          </View>
          {(phase.steps || []).map((step: string, j: number) => (
            <View key={j} style={s.bulletRow}>
              <View style={[s.stepNum, { backgroundColor: colorScheme.bg }]}>
                <Text style={[s.stepNumText, { color: colorScheme.accent }]}>{j + 1}</Text>
              </View>
              <Text style={[s.body, { color: t.text, flex: 1 }]}>{step}</Text>
            </View>
          ))}
        </Card>
      ))}
    </>
  );
}

function SkillsTab({ idea, t, colorScheme }: TabProps) {
  const skills = idea.required_skills;
  if (!skills) return <EmptyState label="Skills information not available" t={t} />;
  return (
    <>
      <Card>
        <SectionTitle icon={BookOpen} label="Must-Have Skills" color={colorScheme.accent} />
        {(skills.must_have || []).map((s: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colors.error }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{s}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <SectionTitle icon={BookOpen} label="Nice-to-Have Skills" color={colorScheme.accent} />
        {(skills.nice_to_have || []).map((s: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colorScheme.accent }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{s}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <SectionTitle icon={Zap} label="Tools Needed" color={colorScheme.accent} />
        {(skills.tools_needed || []).map((tool: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colorScheme.accent }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{tool}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <SectionTitle icon={Globe} label="Learning Resources" color={colorScheme.accent} />
        {(skills.learning_resources || []).map((r: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{r}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}

function FundingTab({ idea, t, colorScheme }: TabProps) {
  const funding = idea.funding_options;
  const hackathons = idea.hackathons;
  return (
    <>
      <Card>
        <SectionTitle icon={Zap} label="Funding Overview" color={colorScheme.accent} />
        <MetricRow label="Startup Cost" value={funding?.estimated_startup_cost || 'N/A'} t={t} />
        <MetricRow label="Bootstrappable" value={funding?.bootstrappable ? 'Yes' : 'No' } t={t} />
      </Card>
      <Card>
        <SectionTitle icon={DollarSign} label="Funding Sources" color={colorScheme.accent} />
        {(funding?.funding_sources || []).map((s: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colorScheme.accent }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{s}</Text>
          </View>
        ))}
      </Card>
      {(hackathons || []).length > 0 && (
        <Card>
          <SectionTitle icon={Award} label="Relevant Hackathons" color={colorScheme.accent} />
          {hackathons.map((h: any, i: number) => (
            <View key={i} style={s.hackathonItem}>
              <Text style={[s.cardTitle, { color: colorScheme.accent }]}>{h.name}</Text>
              <Text style={[s.body, { color: t.textSecondary }]}>{h.timeline}</Text>
              <Text style={[s.body, { color: t.text }]}>{h.relevance}</Text>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

function CommunitiesTab({ idea, t, colorScheme }: TabProps) {
  const communities = idea.communities;
  if (!communities || communities.length === 0) return <EmptyState label="No communities listed" t={t} />;
  return (
    <>
      {communities.map((c: any, i: number) => (
        <Card key={i}>
          <View style={s.communityHeader}>
            <Globe size={18} color={colorScheme.accent} strokeWidth={2} />
            <Text style={[s.cardTitle, { color: t.text, marginLeft: 8 }]}>{c.name}</Text>
          </View>
          <MetricRow label="Platform" value={c.platform} t={t} />
          <MetricRow label="Size" value={c.size} t={t} />
          <Text style={[s.body, { color: t.textSecondary, marginTop: 8 }]}>
            {c.why_join}
          </Text>
        </Card>
      ))}
    </>
  );
}

function BrandingTab({ idea, t, colorScheme, copyToClipboard, copiedPrompt }: TabProps & CopyProps) {
  const branding = idea.branding;
  if (!branding) return <EmptyState label="Branding suggestions not available" t={t} />;
  return (
    <>
      <Card>
        <SectionTitle icon={Award} label="Name Suggestions" color={colorScheme.accent} />
        <View style={s.nameGrid}>
          {(branding.name_suggestions || []).map((name: string, i: number) => (
            <View key={i} style={[s.nameChip, { backgroundColor: colorScheme.bg }]}>
              <Text style={[s.nameChipText, { color: colorScheme.accent }]}>{name}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <SectionTitle icon={Award} label="Brand Voice" color={colorScheme.accent} />
        <MetricRow label="Tone of Voice" value={branding.tone_of_voice || 'N/A'} t={t} />
        <Text style={[s.body, { color: t.text, marginTop: 8 }]}>{branding.visual_identity}</Text>
      </Card>
      {branding.logo_prompt && (
        <Card glow>
          <View style={s.promptHeader}>
            <SectionTitle icon={Image} label="Logo Generation Prompt" color={colorScheme.accent} />
            <Pressable
              onPress={() => copyToClipboard(branding.logo_prompt, 'logo')}
              style={[s.copyBtn, { backgroundColor: colorScheme.bg }]}
            >
              {copiedPrompt === 'logo' ? (
                <Check size={16} color={colorScheme.accent} strokeWidth={2} />
              ) : (
                <Copy size={16} color={colorScheme.accent} strokeWidth={2} />
              )}
            </Pressable>
          </View>
          <View style={[s.promptBox, { backgroundColor: t.isDark ? '#0A1219' : colors.glowSoft }]}>
            <Text style={[s.promptText, { color: t.text }]}>{branding.logo_prompt}</Text>
          </View>
        </Card>
      )}
    </>
  );
}

function LandingTab({ idea, t, colorScheme, copyToClipboard, copiedPrompt }: TabProps & CopyProps) {
  const lp = idea.landing_page;
  if (!lp) return <EmptyState label="Landing page details not available" t={t} />;
  return (
    <>
      <Card>
        <SectionTitle icon={Rocket} label="Hero Section" color={colorScheme.accent} />
        <Text style={[s.heroText, { color: t.text }]}>{lp.headline}</Text>
        <Text style={[s.body, { color: t.textSecondary }]}>{lp.subheadline}</Text>
        <Text style={[s.body, { color: t.text, marginTop: 12 }]}>{lp.hero_copy}</Text>
      </Card>
      <Card>
        <SectionTitle icon={Zap} label="Key Features" color={colorScheme.accent} />
        {(lp.features || []).map((f: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colorScheme.accent }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{f}</Text>
          </View>
        ))}
      </Card>
      <Card glow>
        <Text style={[s.metricLabel, { color: t.textSecondary }]}>Call to Action</Text>
        <View style={[s.ctaBox, { backgroundColor: colorScheme.bg }]}>
          <Text style={[s.ctaText, { color: colorScheme.text }]}>{lp.cta}</Text>
        </View>
      </Card>
      {lp.design_prompt && (
        <Card glow>
          <View style={s.promptHeader}>
            <SectionTitle icon={Camera} label="Design Prompt" color={colorScheme.accent} />
            <Pressable
              onPress={() => copyToClipboard(lp.design_prompt, 'landing')}
              style={[s.copyBtn, { backgroundColor: colorScheme.bg }]}
            >
              {copiedPrompt === 'landing' ? (
                <Check size={16} color={colorScheme.accent} strokeWidth={2} />
              ) : (
                <Copy size={16} color={colorScheme.accent} strokeWidth={2} />
              )}
            </Pressable>
          </View>
          <View style={[s.promptBox, { backgroundColor: t.isDark ? '#0A1219' : colors.glowSoft }]}>
            <Text style={[s.promptText, { color: t.text }]}>{lp.design_prompt}</Text>
          </View>
        </Card>
      )}
    </>
  );
}

function InstagramTab({ idea, t, colorScheme }: TabProps) {
  const ig = idea.instagram_strategy;
  if (!ig) return <EmptyState label="Instagram strategy not available" t={t} />;
  return (
    <>
      <Card>
        <SectionTitle icon={Instagram} label="Profile Setup" color={colorScheme.accent} />
        <MetricRow label="Handle" value={ig.handle_suggestion} t={t} />
        <View style={s.bioBox}>
          <Text style={[s.body, { color: t.text }]}>{ig.bio}</Text>
        </View>
      </Card>
      <Card>
        <SectionTitle icon={Hash} label="Content Pillars" color={colorScheme.accent} />
        {(ig.content_pillars || []).map((p: string, i: number) => (
          <View key={i} style={s.bulletRow}>
            <View style={[s.bulletDot, { backgroundColor: colorScheme.accent }]} />
            <Text style={[s.body, { color: t.text, flex: 1 }]}>{p}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <SectionTitle icon={Clock} label="Posting Frequency" color={colorScheme.accent} />
        <Text style={[s.body, { color: t.text }]}>{ig.posting_frequency}</Text>
      </Card>
      <Card>
        <SectionTitle icon={Hash} label="Hashtag Strategy" color={colorScheme.accent} />
        <Text style={[s.metricLabel, { color: t.textSecondary }]}>Primary</Text>
        <View style={s.hashtagRow}>
          {(ig.hashtag_strategy?.primary || []).map((h: string, i: number) => (
            <View key={i} style={[s.hashtagChip, { backgroundColor: colorScheme.bg }]}>
              <Text style={[s.hashtagText, { color: colorScheme.accent }]}>{h}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.metricLabel, { color: t.textSecondary, marginTop: 8 }]}>Niche</Text>
        <View style={s.hashtagRow}>
          {(ig.hashtag_strategy?.niche || []).map((h: string, i: number) => (
            <View key={i} style={[s.hashtagChip, { backgroundColor: colorScheme.bg }]}>
              <Text style={[s.hashtagText, { color: colorScheme.accent }]}>{h}</Text>
            </View>
          ))}
        </View>
      </Card>
    </>
  );
}

function ReelsTab({ idea, t, colorScheme }: TabProps) {
  const reels = idea.viral_reels;
  if (!reels || reels.length === 0) return <EmptyState label="Viral Reel ideas not available" t={t} />;
  return (
    <>
      {reels.map((reel, i: number) => (
        <Card key={i} style={s.reelCard}>
          <View style={[s.reelHeader, { backgroundColor: colorScheme.bg }]}>
            <Film size={20} color={colorScheme.text} strokeWidth={2} />
            <Text style={[s.reelTitle, { color: colorScheme.text }]}>{reel.title}</Text>
          </View>
          <View style={s.reelSection}>
            <Text style={[s.reelLabel, { color: colorScheme.accent }]}>HOOK (0-3s)</Text>
            <Text style={[s.body, { color: t.text }]}>{reel.hook}</Text>
          </View>
          <View style={s.reelSection}>
            <Text style={[s.reelLabel, { color: colorScheme.accent }]}>BODY (3-20s)</Text>
            <Text style={[s.body, { color: t.text }]}>{reel.body}</Text>
          </View>
          <View style={s.reelSection}>
            <Text style={[s.reelLabel, { color: colorScheme.accent }]}>CTA (20-30s)</Text>
            <Text style={[s.body, { color: t.text }]}>{reel.cta}</Text>
          </View>
          <View style={s.reelMeta}>
            <View style={s.reelMetaRow}>
              <Camera size={14} color={t.textSecondary} />
              <Text style={[s.reelMetaText, { color: t.textSecondary }]}>{reel.camera_setup}</Text>
            </View>
            <View style={s.reelMetaRow}>
              <Clock size={14} color={t.textSecondary} />
              <Text style={[s.reelMetaText, { color: t.textSecondary }]}>{reel.best_time_to_post}</Text>
            </View>
          </View>
          <View style={s.hashtagRow}>
            {(reel.hashtags || []).map((h: string, j: number) => (
              <View key={j} style={[s.hashtagChip, { backgroundColor: colorScheme.bg }]}>
                <Text style={[s.hashtagText, { color: colorScheme.accent }]}>{h}</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}
    </>
  );
}

function AIPromptsTab({ idea, t, colorScheme, copyToClipboard, copiedPrompt }: TabProps & CopyProps) {
  const fullReport = idea.full_report;
  const imagePrompts = fullReport?.ai_image_prompts;
  const videoPrompts = fullReport?.ai_video_prompts;

  return (
    <>
      <View style={s.promptSectionHeader}>
        <Image size={20} color={colorScheme.accent} strokeWidth={2} />
        <Text style={[s.promptSectionTitle, { color: colorScheme.accent }]}>AI Image Prompts</Text>
      </View>
      <Text style={[s.promptSectionSub, { color: t.textSecondary }]}>
        Copy and use these prompts in Midjourney, DALL-E, or any AI image generator
      </Text>

      {imagePrompts ? (
        <>
          <PromptCard
            title="Logo Prompt"
            prompt={imagePrompts.logo}
            icon={Award}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="img_logo"
          />
          <PromptCard
            title="Product Mockup"
            prompt={imagePrompts.product_mockup}
            icon={Package}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="img_product"
          />
          <PromptCard
            title="Social Media Post"
            prompt={imagePrompts.social_media_post}
            icon={Instagram}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="img_social"
          />
          <PromptCard
            title="Website Hero"
            prompt={imagePrompts.website_hero}
            icon={Rocket}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="img_web"
          />
          <PromptCard
            title="Ad Creative"
            prompt={imagePrompts.ad_creative}
            icon={Zap}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="img_ad"
          />
        </>
      ) : (
        <Card>
          <Text style={[s.body, { color: t.textSecondary }]}>Image prompts not available for this idea.</Text>
        </Card>
      )}

      <View style={[s.promptSectionHeader, { marginTop: spacing.xl }]}>
        <Video size={20} color={colorScheme.accent} strokeWidth={2} />
        <Text style={[s.promptSectionTitle, { color: colorScheme.accent }]}>AI Video Prompts</Text>
      </View>
      <Text style={[s.promptSectionSub, { color: t.textSecondary }]}>
        Use these prompts for AI video tools like Runway, Pika, or Sora
      </Text>

      {videoPrompts ? (
        <>
          <PromptCard
            title="Commercial (30s)"
            prompt={videoPrompts.commercial}
            icon={Film}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="vid_commercial"
          />
          <PromptCard
            title="Product Demo"
            prompt={videoPrompts.product_demo}
            icon={Camera}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="vid_demo"
          />
          <PromptCard
            title="Reel Template"
            prompt={videoPrompts.reel_template}
            icon={Instagram}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="vid_reel"
          />
          <PromptCard
            title="YouTube Short"
            prompt={videoPrompts.youtube_short}
            icon={Youtube}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="vid_yt"
          />
          <PromptCard
            title="Explainer Video"
            prompt={videoPrompts.explainer}
            icon={BookOpen}
            colorScheme={colorScheme}
            t={t}
            copyToClipboard={copyToClipboard}
            copiedPrompt={copiedPrompt}
            id="vid_explain"
          />
        </>
      ) : (
        <Card>
          <Text style={[s.body, { color: t.textSecondary }]}>Video prompts not available for this idea.</Text>
        </Card>
      )}
    </>
  );
}

function PromptCard({ title, prompt, icon: Icon, colorScheme, t, copyToClipboard, copiedPrompt, id }: {
  title: string;
  prompt: string;
  icon: any;
  colorScheme: typeof IDEA_COLORS[0];
  t: any;
  copyToClipboard: (text: string, id: string) => void;
  copiedPrompt: string | null;
  id: string;
}) {
  if (!prompt) return null;
  return (
    <Card glow>
      <View style={s.promptCardHeader}>
        <View style={s.promptCardTitle}>
          <Icon size={16} color={colorScheme.accent} strokeWidth={2} />
          <Text style={[s.promptCardLabel, { color: t.text }]}>{title}</Text>
        </View>
        <Pressable
          onPress={() => copyToClipboard(prompt, id)}
          style={[s.copyBtnLarge, { backgroundColor: colorScheme.bg }]}
        >
          {copiedPrompt === id ? (
            <>
              <Check size={16} color={colorScheme.accent} strokeWidth={2} />
              <Text style={[s.copyBtnText, { color: colorScheme.accent }]}>Copied!</Text>
            </>
          ) : (
            <>
              <Copy size={16} color={colorScheme.accent} strokeWidth={2} />
              <Text style={[s.copyBtnText, { color: colorScheme.accent }]}>Copy</Text>
            </>
          )}
        </Pressable>
      </View>
      <View style={[s.promptBox, { backgroundColor: t.isDark ? '#0A1219' : colors.glowSoft }]}>
        <Text style={[s.promptText, { color: t.text }]}>{prompt}</Text>
      </View>
    </Card>
  );
}

function Package({ size, color, strokeWidth }: { size: number; color: string; strokeWidth: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.8, height: size * 0.6, borderWidth: strokeWidth, borderColor: color, borderRadius: 3 }} />
    </View>
  );
}

// ─── Shared Components ─────────────────────────────────────

function SectionTitle({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <View style={s.sectionTitleRow}>
      <Icon size={16} color={color} strokeWidth={2} />
      <Text style={[s.sectionTitle, { color }]}>{label}</Text>
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

function EmptyState({ label, t }: { label: string; t: any }) {
  return (
    <Card>
      <Text style={[s.body, { color: t.textSecondary, textAlign: 'center' }]}>{label}</Text>
    </Card>
  );
}

// ─── Styles ─────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, ...typography.h4 },
  headeractions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { ...typography.body },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 12,
  },
  emptyTitle: { ...typography.h2 },
  emptySub: { ...typography.body },
  ideaSelector: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  ideaSelectorContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  ideaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  ideaChipText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  titleCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  ideaHeader: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  ideaNumber: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ideaTitle: {
    ...typography.h2,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 4,
  },
  ideaType: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginTop: 6,
  },
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBarContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  tabPillText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  contentScroll: { flex: 1 },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.md,
  },
});

const s = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: { ...typography.body, lineHeight: 22 },
  cardTitle: { ...typography.h4, marginBottom: 8 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 8,
    flexShrink: 0,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metricLabel: { ...typography.small, color: '#666' },
  metricValue: { ...typography.bodyMedium, flex: 1, textAlign: 'right' },
  heroText: { ...typography.h3, fontSize: 20 },
  promptBox: {
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: 8,
  },
  promptText: {
    ...typography.small,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  ctaBox: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  nameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  nameChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  nameChipText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  bioBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  hashtagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  hashtagText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  phaseBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  phaseTitle: { ...typography.h4 },
  competitorRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 12,
  },
  competitorCol: { flex: 1 },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hackathonItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  reelCard: {
    overflow: 'hidden',
  },
  reelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  reelTitle: {
    ...typography.h4,
  },
  reelSection: {
    marginBottom: 12,
  },
  reelLabel: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  reelMeta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 6,
  },
  reelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reelMetaText: {
    ...typography.small,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  promptSectionTitle: {
    ...typography.h4,
  },
  promptSectionSub: {
    ...typography.small,
    marginBottom: spacing.md,
  },
  promptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  promptCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptCardLabel: {
    ...typography.bodyMedium,
  },
  copyBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  copyBtnText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});
