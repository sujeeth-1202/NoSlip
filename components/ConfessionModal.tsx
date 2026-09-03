import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';

interface ConfessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (food: string) => Promise<void>;
}

export function ConfessionModal({
  isOpen,
  onClose,
  onSubmit,
}: ConfessionModalProps) {
  const insets = useSafeAreaInsets();
  const [foodText, setFoodText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFoodText('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  async function handleSend() {
    if (isSubmitting || !foodText.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(foodText.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Slip Confession</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressedState]}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.description}>
            What did you have?
          </Text>

          {/* Text Input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. A slice of birthday cake, ice cream"
              placeholderTextColor={QuietTheme.muted}
              value={foodText}
              onChangeText={setFoodText}
              maxLength={60}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSend}
              editable={!isSubmitting}
            />
          </View>

          {/* Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!foodText.trim() || isSubmitting) && styles.disabledButton,
              pressed && styles.pressedState,
            ]}
            onPress={handleSend}
            disabled={!foodText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={QuietTheme.surface} />
            ) : (
              <Text style={styles.sendButtonText}>Send to Buddy</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46, 43, 36, 0.45)',
  },
  sheetContainer: {
    backgroundColor: QuietTheme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 20,
    color: QuietTheme.ink,
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 6,
  },
  closeIcon: {
    fontFamily: Typography.sansMedium,
    fontSize: 18,
    color: QuietTheme.inkLight,
  },
  description: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.inkLight,
    marginBottom: 16,
  },
  inputWrap: {
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: QuietTheme.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.ink,
    backgroundColor: QuietTheme.background,
  },
  sendButton: {
    width: '100%',
    height: 52,
    backgroundColor: QuietTheme.accentGrowth,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentGrowth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 15,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  pressedState: {
    opacity: 0.75,
  },
});
