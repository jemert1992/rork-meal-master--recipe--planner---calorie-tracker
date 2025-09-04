import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, AccessibilityInfo, findNodeHandle } from 'react-native';

export type AccessibleModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  children: React.ReactNode;
  initialFocus?: 'title' | 'close';
  triggerRef?: React.RefObject<any>;
  testID?: string;
};

export default function AccessibleModal({
  visible,
  onRequestClose,
  title,
  children,
  initialFocus = 'title',
  triggerRef,
  testID,
}: AccessibleModalProps) {
  const titleRef = useRef<Text | null>(null);
  const closeRef = useRef<any | null>(null);

  const focusTargetRef = useMemo(() => (initialFocus === 'close' ? closeRef : titleRef), [initialFocus]);

  const focusNode = useCallback((node: any | null) => {
    try {
      if (!node) return;
      if (Platform.OS === 'web') {
        const el: any = (node as any);
        if (typeof el?.focus === 'function') {
          el.focus();
          return;
        }
      }
      const reactTag = findNodeHandle(node);
      if (reactTag != null) {
        AccessibilityInfo.setAccessibilityFocus(reactTag);
      }
    } catch (e) {
      console.log('[AccessibleModal] focusNode error', e);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => {
        focusNode(focusTargetRef.current);
      }, 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, focusNode, focusTargetRef]);

  const handleClose = useCallback(() => {
    try {
      onRequestClose();
    } finally {
      setTimeout(() => {
        if (triggerRef?.current) {
          focusNode(triggerRef.current);
        }
      }, 60);
    }
  }, [onRequestClose, triggerRef, focusNode]);

  const content = (
    <View
      style={styles.backdrop}
      {...(Platform.OS !== 'web' ? ({ importantForAccessibility: 'yes' } as any) : ({} as any))}
      testID={testID ?? 'accessible-modal'}
      {...(Platform.OS === 'web'
        ? ({ accessibilityRole: 'dialog' } as any)
        : ({ accessibilityViewIsModal: true } as any))}
    >
      <View style={styles.sheet} testID={(testID ? `${testID}-sheet` : 'accessible-modal-sheet')}>
        <View style={styles.header} testID={(testID ? `${testID}-header` : 'accessible-modal-header')}>
          <Text
            ref={titleRef}
            {...(Platform.OS !== 'web' ? ({ accessibilityRole: 'header' } as const) : ({} as const))}
            style={styles.title}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
            testID={(testID ? `${testID}-title` : 'accessible-modal-title')}
          >
            {title}
          </Text>
          <Pressable
            ref={closeRef}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            hitSlop={HIT_SLOP}
            style={styles.close}
            testID={(testID ? `${testID}-close` : 'accessible-modal-close')}
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
        <View
          style={styles.body}
          {...(Platform.OS !== 'web' ? ({ accessibilityRole: 'summary' } as const) : ({} as const))}
          testID={(testID ? `${testID}-body` : 'accessible-modal-body')}
        >
          {children}
        </View>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return visible ? content : null;
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      accessible
      accessibilityViewIsModal
    >
      <View style={{ flex: 1 }}>
        {content}
      </View>
    </Modal>
  );
}

const HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 } as const;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  sheet: {
    marginHorizontal: 16,
    marginVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    paddingRight: 8,
  },
  close: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  closeText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  body: {
    flex: 1,
    padding: 16,
  },
});
