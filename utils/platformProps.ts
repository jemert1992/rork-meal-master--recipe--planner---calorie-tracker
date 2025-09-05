import { Platform } from 'react-native';

export type A11yStrippableProps = {
  accessible?: boolean;
  accessibilityViewIsModal?: boolean;
  importantForAccessibility?: string;
  accessibilityStates?: unknown;
  accessibilityTraits?: unknown;
  [key: string]: unknown;
};

export function webSafeA11yProps<T extends A11yStrippableProps>(props: T): Omit<T, 'accessible' | 'accessibilityViewIsModal' | 'importantForAccessibility' | 'accessibilityStates' | 'accessibilityTraits'> {
  console.log('[platformProps] webSafeA11yProps called. Platform:', Platform.OS);
  if (Platform.OS === 'web') {
    const {
      accessible,
      accessibilityViewIsModal,
      importantForAccessibility,
      accessibilityStates,
      accessibilityTraits,
      ...rest
    } = props ?? ({} as T);
    return rest as Omit<T, 'accessible' | 'accessibilityViewIsModal' | 'importantForAccessibility' | 'accessibilityStates' | 'accessibilityTraits'>;
  }
  return props as Omit<T, 'accessible' | 'accessibilityViewIsModal' | 'importantForAccessibility' | 'accessibilityStates' | 'accessibilityTraits'>;
}

export function nativeOnly<T extends object>(nativeProps: T): T | Record<string, never> {
  console.log('[platformProps] nativeOnly called. Platform:', Platform.OS);
  return Platform.OS !== 'web' ? nativeProps : {};
}
