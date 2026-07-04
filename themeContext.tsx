import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './theme';

type ThemeMode = 'light' | 'dark' | 'auto';

type ThemeColors = {
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderSoft: string;
  inputBg: string;
  isDark: boolean;
};

function buildTheme(isDark: boolean): ThemeColors {
  return isDark
    ? {
        bg: colors.darkBg,
        card: colors.darkCard,
        cardAlt: colors.darkCardAlt,
        text: colors.darkText,
        textSecondary: colors.darkTextSecondary,
        textTertiary: colors.darkTextTertiary,
        border: colors.darkBorder,
        borderSoft: colors.darkBorderSoft,
        inputBg: colors.darkCardAlt,
        isDark: true,
      }
    : {
        bg: colors.white,
        card: colors.card,
        cardAlt: '#F5F7F5',
        text: colors.text,
        textSecondary: colors.textSecondary,
        textTertiary: colors.textTertiary,
        border: colors.border,
        borderSoft: colors.borderSoft,
        inputBg: '#FAFAFA',
        isDark: false,
      };
}

const ThemeContext = createContext<{
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  t: ThemeColors;
}>({
  mode: 'auto',
  setMode: () => {},
  t: buildTheme(false),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('auto');

  const isDark =
    mode === 'dark' ? true : mode === 'light' ? false : systemScheme === 'dark';

  const t = buildTheme(isDark);

  return (
    <ThemeContext.Provider value={{ mode, setMode, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
