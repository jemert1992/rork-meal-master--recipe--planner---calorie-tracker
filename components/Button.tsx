import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

function ButtonCmp({ title, onPress, variant = 'primary', disabled = false, loading = false, style, textStyle, testID, leftIcon, rightIcon }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [styles.base, styles[variant], isDisabled && styles.disabled, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
    >
      {({ pressed }) => (
        <>
          {leftIcon}
          {loading ? (
            <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white} style={styles.loader} />
          ) : null}
          <Text style={[styles.text, styles[`${variant}Text` as const], textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

export const Button = memo(ButtonCmp);

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryText: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  secondaryText: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineText: {
    color: Colors.text,
    fontWeight: '700' as const,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  dangerText: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  text: {
    fontSize: 15,
  },
  loader: {
    marginRight: 8,
  },
});