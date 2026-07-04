import { useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, Alert, TextInput, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FolderHeart, Trash2, Sparkles, ChevronRight,
  Bookmark, Star, Search, SortDesc, X, Filter,
} from 'lucide-react-native';
import Animated, {
  FadeInDown, FadeOutLeft, useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { type StartupVaultRow, supabase } from '@/lib/supabase';
import { listVault, deleteFromVault } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { setReport } from '@/lib/reportStore';
import { getGuestVault } from '@/lib/guest';
import { colors, spacing, typography, radius } from '@/lib/theme';
import type { StartupReport } from '@/lib/supabase';

function rowToReport(row: StartupVaultRow): StartupReport {
  return {
    overview:    row.overview!,
    business:    row.business!,
    marketing:   row.marketing!,
    swot:        row.swot!,
    revenue:     row.revenue!,
    competitors: row.competitors!,
    roadmap:     row.roadmap!,
    tracker:     row.tracker ?? [],
    inspo:       row.inspo ?? [],
    docs:        row.docs ?? { registrations: [], licenses: [], taxes: [], compliance: [], certifications: [] },
    prompts:     row.prompts ?? { aiPrompts: [], businessNames: [] },
  };
}

type SortMode = 'newest' | 'oldest' | 'az';
const FILTER_TAGS = ['All', 'AI', 'SaaS', 'Ecommerce', 'Agency', 'Marketing'] as const;

function AnimatedVaultCard({ item, onOpen, onDelete, onFavorite, t }: {
  item: StartupVaultRow;
  onOpen: () => void;
  onDelete: () => void;
  onFavorite: () => void;
  t: any;
}) {
  return (
    <Pressable onPress={onOpen}>
      <Card style={[styles.rowCard, { backgroundColor: t.card, borderColor: t.border }] as any}>
        <View style={styles.rowTop}>
          <View style={[styles.rowIcon, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
            <Sparkles size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.rowMain}>
            <Text style={[styles.rowTitle, { color: t.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.rowDate, { color: t.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.rowActions}>
            <Pressable onPress={onFavorite} hitSlop={10} style={styles.actionBtn}>
              <Star
                size={16}
                color={item.is_favorite ? colors.warning : t.textTertiary}
                fill={item.is_favorite ? colors.warning : 'none'}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={10} style={styles.actionBtn}>
              <Trash2 size={15} color={colors.error} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {item.overview?.summary ? (
          <Text style={[styles.rowSummary, { color: t.textSecondary }]} numberOfLines={2}>
            {item.overview.summary}
          </Text>
        ) : null}

        <View style={styles.rowFooter}>
          {(item.overview?.tags ?? []).slice(0, 3).map((tag, i) => (
            <View key={i} style={[styles.chip, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}>
              <Text style={[styles.chipText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>{tag}</Text>
            </View>
          ))}
          <View style={styles.openBtn}>
            <Text style={[styles.openText, { color: colors.primary }]}>Open</Text>
            <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function VaultScreen() {
  const { user, isGuest } = useAuth();
  const { t } = useTheme();
  const [rows, setRows]         = useState<StartupVaultRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState<SortMode>('newest');
  const [activeFilter, setActiveFilter] = useState('All');

  const load = useCallback(async () => {
    try {
      const data = await listVault();
      setRows(data as StartupVaultRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user || isGuest) load();
    else setLoading(false);
  }, [user, isGuest, load]);

  const [confirmDeleteRow, setConfirmDeleteRow] = useState<StartupVaultRow | null>(null);

  function openRow(row: StartupVaultRow) {
    setReport(rowToReport(row), row.input_summary ?? '');
    router.push({ pathname: '/results', params: { vaultId: row.id } });
  }

  async function performDelete() {
    if (!confirmDeleteRow) return;
    const rowId = confirmDeleteRow.id;
    setConfirmDeleteRow(null);
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    try {
      await deleteFromVault(rowId);
    } catch {
      load();
    }
  }

  async function toggleFavorite(row: StartupVaultRow) {
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, is_favorite: !r.is_favorite } : r));
    if (!isGuest) {
      await supabase.from('startup_vault').update({ is_favorite: !row.is_favorite }).eq('id', row.id);
    }
  }

  // Sort + filter pipeline
  const processed = [...rows]
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return a.title.localeCompare(b.title);
    })
    .filter((r) => activeFilter === 'All' || (r.overview?.tags ?? []).some(
      (tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()),
    ))
    .filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  const sortLabel = sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : 'A–Z';

  if (!user && !isGuest) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
        <Header t={t} />
        <View style={styles.emptyState}>
          <Bookmark size={44} color={t.textTertiary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: t.text }]}>Sign in to save startups</Text>
          <Text style={[styles.emptySub, { color: t.textSecondary }]}>
            Your Vault stores every AI-generated plan so you can revisit it anytime.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={['top']}>
      <Header t={t} />

      {/* Search + sort */}
      <View style={styles.controlBar}>
        <View style={[styles.searchWrap, { backgroundColor: t.card, borderColor: t.border }]}>
          <Search size={16} color={t.textTertiary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: t.text }]}
            placeholder="Search your vault..."
            placeholderTextColor={t.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <X size={14} color={t.textTertiary} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setSort((s) => s === 'newest' ? 'oldest' : s === 'oldest' ? 'az' : 'newest')}
          style={[styles.sortBtn, { backgroundColor: t.isDark ? '#0F2018' : colors.glow }]}
        >
          <SortDesc size={15} color={colors.primaryDeep} strokeWidth={2} />
          <Text style={[styles.sortText, { color: colors.primaryDeep }]}>{sortLabel}</Text>
        </Pressable>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTER_TAGS.map((f) => {
          const active = f === activeFilter;
          return (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? colors.primary : t.isDark ? '#1A2332' : colors.white,
                  borderColor: active ? colors.primary : t.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? colors.white : t.textSecondary }]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptySub, { color: t.textSecondary }]}>Loading vault…</Text>
        </View>
      ) : (
        <FlatList
          data={processed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            processed.length === 0 && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FolderHeart size={48} color={t.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: t.text }]}>
                {search ? 'No results found' : 'Your vault is empty'}
              </Text>
              <Text style={[styles.emptySub, { color: t.textSecondary }]}>
                {search
                  ? 'Try a different search term.'
                  : 'Save startup ideas to build your collection.'}
              </Text>
              {!search && (
                <Pressable
                  onPress={() => router.push('/survey')}
                  style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.exploreBtnText}>Explore Ideas</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(280)} exiting={FadeOutLeft.duration(250)}>
              <AnimatedVaultCard
                item={item}
                t={t}
                onOpen={() => openRow(item)}
                onDelete={() => setConfirmDeleteRow(item)}
                onFavorite={() => toggleFavorite(item)}
              />
            </Animated.View>
          )}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal visible={!!confirmDeleteRow} transparent animationType="fade" onRequestClose={() => setConfirmDeleteRow(null)}>
        <Pressable style={delStyles.overlay} onPress={() => setConfirmDeleteRow(null)}>
          <Pressable style={[delStyles.sheet, { backgroundColor: t.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[delStyles.iconWrap, { backgroundColor: t.isDark ? '#2A1010' : '#FFF0F0' }]}>
              <Trash2 size={28} color={colors.error} strokeWidth={2} />
            </View>
            <Text style={[delStyles.title, { color: t.text }]}>Delete startup?</Text>
            <Text style={[delStyles.message, { color: t.textSecondary }]}>
              Remove "{confirmDeleteRow?.title}" from your vault? This can't be undone.
            </Text>
            <View style={delStyles.btnRow}>
              <Pressable
                style={[delStyles.cancelBtn, { borderColor: t.border }]}
                onPress={() => setConfirmDeleteRow(null)}
              >
                <Text style={[delStyles.cancelText, { color: t.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[delStyles.deleteBtn, { backgroundColor: colors.error }]}
                onPress={performDelete}
              >
                <Text style={delStyles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ t }: { t: any }) {
  return (
    <View style={styles.topBar}>
      <Logo size={32} animated={false} />
      <Text style={[styles.brandText, { color: t.isDark ? colors.softGreen : colors.primaryDeep }]}>
        Startup Vault
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  topBar:  {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  brandText: { ...typography.h3 },

  controlBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.xl, borderWidth: 1, paddingHorizontal: spacing.md, height: 46,
  },
  searchInput: { flex: 1, ...typography.body, paddingVertical: 0 },
  sortBtn:     {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.xl, paddingHorizontal: 12, height: 46,
  },
  sortText: { ...typography.smallMedium, fontFamily: 'Inter-SemiBold' },

  filters: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.sm },
  filterPill: {
    borderRadius: radius.pill, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  filterText: { fontSize: 13, fontFamily: 'Inter-Medium' },

  list:      { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl, gap: spacing.md },
  emptyList: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 10 },
  emptyTitle: { ...typography.h2 },
  emptySub:   { ...typography.body, textAlign: 'center' },
  exploreBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: 14, borderRadius: radius.pill },
  exploreBtnText: { color: colors.white, fontFamily: 'Inter-SemiBold', fontSize: 16 },

  rowCard:    { padding: spacing.md },
  rowTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowMain:    { flex: 1, gap: 2 },
  rowTitle:   { ...typography.h4 },
  rowDate:    { ...typography.caption },
  rowActions: { flexDirection: 'row', gap: 4 },
  actionBtn:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowSummary: { ...typography.small, marginTop: 8, lineHeight: 20 },
  rowFooter:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip:       { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText:   { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  openBtn:    { marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 2 },
  openText:   { ...typography.smallMedium, fontFamily: 'Inter-SemiBold' },
});

const delStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  sheet: { borderRadius: radius.xl, padding: spacing.xl, width: '100%', maxWidth: 360, alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3, textAlign: 'center' },
  message: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, width: '100%' },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'Inter-SemiBold', fontSize: 15 },
  deleteBtn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.white, fontFamily: 'Inter-SemiBold', fontSize: 15 },
});
