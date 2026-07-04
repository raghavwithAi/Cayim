import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors, radius, typography } from '@/lib/theme';

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isSecondary && styles.textSecondary,
            isGhost && styles.textGhost,
            isDisabled && styles.textDisabled,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.glow,
    borderWidth: 1,
    borderColor: colors.softGreen,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  text: {
    ...typography.bodyMedium,
    fontSize: 16,
  },
  textPrimary: {
    color: colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  textSecondary: {
    color: colors.primaryDeep,
    fontFamily: 'Inter-SemiBold',
  },
  textGhost: {
    color: colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  textDisabled: {
    color: colors.textTertiary,
  },
  disabled: {
    backgroundColor: colors.borderSoft,
    opacity: 0.7,
  },
});
