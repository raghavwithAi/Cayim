import { View, Text, StyleSheet, Platform, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { Check, X, Sparkles, TrendingUp, Users, Target, Calendar, ListChecks } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function SectionTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      {icon}
      <Text style={styles.sectionTitleText}>{children}</Text>
    </View>
  );
}

export function Row({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ListCard({
  title,
  items,
  variant = 'plain',
  icon,
  style,
}: {
  title: string;
  items: string[];
  variant?: 'plain' | 'pos' | 'neg';
  icon?: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.listCard, variant === 'pos' && styles.posCard, variant === 'neg' && styles.negCard, style]}>
      <View style={styles.listTitleRow}>
        {icon}
        <Text style={styles.listTitle}>{title}</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          {variant === 'pos' ? (
            <Check color={colors.primary} size={16} strokeWidth={2.5} />
          ) : variant === 'neg' ? (
            <X color={colors.error} size={16} strokeWidth={2.5} />
          ) : (
            <View style={styles.bulletDot} />
          )}
          <Text style={styles.bulletText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

export const tabIcons = {
  overview: <Sparkles size={16} strokeWidth={2} color={colors.text} />,
  business: <Target size={16} strokeWidth={2} color={colors.text} />,
  marketing: <TrendingUp size={16} strokeWidth={2} color={colors.text} />,
  swot: <Users size={16} strokeWidth={2} color={colors.text} />,
  revenue: <View style={{ width: 16, alignItems: 'center' }}><Text style={{ fontSize: 14, color: colors.text }}>₹</Text></View>,
  competitors: <Users size={16} strokeWidth={2} color={colors.text} />,
  roadmap: <Calendar size={16} strokeWidth={2} color={colors.text} />,
  tracker: <ListChecks size={16} strokeWidth={2} color={colors.text} />,
};

const styles = StyleSheet.create({
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionTitleText: { ...typography.h3, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: spacing.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.bodyMedium, color: colors.text, flex: 1, textAlign: 'right' },

  listCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  posCard: { backgroundColor: colors.glowSoft, borderColor: colors.glow },
  negCard: { backgroundColor: '#FFFAFA', borderColor: '#FFE3E1' },
  listTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  listTitle: { ...typography.h4, color: colors.text },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingRight: spacing.sm },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7 },
  bulletText: { ...typography.body, color: colors.text, flex: 1, lineHeight: 22 },
});
