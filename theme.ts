// CAYIM design system — white/dark aesthetic + mint green glow.
// Color spec: primary #22C55E, glow #86EFAC, soft #DCFCE7, surface #F0FDF4

export const colors = {
  // ── Core ──
  white: '#FFFFFF',
  background: '#FFFFFF',
  card: '#FAFAFA',
  text: '#111111',
  textSecondary: '#555555',
  textTertiary: '#9AA0A6',

  // ── Brand greens (exact spec) ──
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryDeep: '#15803D',
  softGreen: '#86EFAC',
  glow: '#DCFCE7',
  glowSoft: '#F0FDF4',

  // ── Borders ──
  border: '#EBEBEB',
  borderSoft: '#F2F4F3',

  // ── Semantic ──
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // ── Shadows ──
  shadow: 'rgba(34, 197, 94, 0.14)',
  shadowDark: 'rgba(0, 0, 0, 0.05)',

  // ── Dark mode ──
  darkBg: '#0B0F0C',
  darkCard: '#111827',
  darkCardAlt: '#1A2332',
  darkBorder: '#1F2937',
  darkBorderSoft: '#1A2535',
  darkText: '#F9FAFB',
  darkTextSecondary: '#9CA3AF',
  darkTextTertiary: '#6B7280',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const typography = {
  fontFamilyRegular: 'Inter-Regular',
  fontFamilyMedium: 'Inter-Medium',
  fontFamilySemibold: 'Inter-SemiBold',
  fontFamilyBold: 'Inter-Bold',

  display:     { fontSize: 38, lineHeight: 46, fontFamily: 'Inter-Bold' },
  h1:          { fontSize: 30, lineHeight: 38, fontFamily: 'Inter-Bold' },
  h2:          { fontSize: 24, lineHeight: 32, fontFamily: 'Inter-SemiBold' },
  h3:          { fontSize: 20, lineHeight: 28, fontFamily: 'Inter-SemiBold' },
  h4:          { fontSize: 17, lineHeight: 24, fontFamily: 'Inter-SemiBold' },
  body:        { fontSize: 16, lineHeight: 24, fontFamily: 'Inter-Regular' },
  bodyMedium:  { fontSize: 16, lineHeight: 24, fontFamily: 'Inter-Medium' },
  small:       { fontSize: 14, lineHeight: 20, fontFamily: 'Inter-Regular' },
  smallMedium: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter-Medium' },
  caption:     { fontSize: 12, lineHeight: 16, fontFamily: 'Inter-Regular' },
};
