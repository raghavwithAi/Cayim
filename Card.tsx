import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { ReactNode } from 'react';
import { useTheme } from '@/lib/themeContext';
import { colors, radius, spacing } from '@/lib/theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  glass?: boolean;
};

export function Card({ children, style, glow, glass }: CardProps) {
  const { t } = useTheme();

  const shadow: ViewStyle = Platform.select({
    web: { boxShadow: glow ? `0 4px 24px ${colors.shadow}` : `0 2px 12px ${t.isDark ? 'rgba(0,0,0,0.3)' : colors.shadowDark}` } as ViewStyle,
    default: glow
      ? { elevation: 3, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 16 }
      : { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  })!;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: glass
            ? t.isDark ? 'rgba(17,24,39,0.75)' : 'rgba(255,255,255,0.76)'
            : glow
            ? t.isDark ? '#0F1F14' : colors.glowSoft
            : t.card,
          borderColor: glass
            ? t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)'
            : glow
            ? t.isDark ? colors.primaryDeep : colors.glow
            : t.border,
        },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
});
