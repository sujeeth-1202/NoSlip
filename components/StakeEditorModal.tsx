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

interface StakeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStake?: string | null;
  onSave: (stake: string | null) => Promise<void>;
}

export function StakeEditorModal({
  isOpen,
  onClose,
  initialStake,
  onSave,
}: StakeEditorModalProps) {
  const insets = useSafeAreaInsets();
  const [stakeText, setStakeText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStakeText(initialStake || '');
      setIsSaving(false);
    }
  }, [isOpen, initialStake]);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(stakeText.trim() || null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

  const charCount = stakeText.length;

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
            <Text style={styles.sheetTitle}>Set a Forfeit Stake</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressedState]}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.description}>
            What do you owe your buddy if your streak breaks?
          </Text>

          {/* Single-line Text Input with 40-char cap */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Buy bubble tea, 50 pushups"
              placeholderTextColor={QuietTheme.muted}
              value={stakeText}
              onChangeText={(t) => setStakeText(t.slice(0, 40))}
              maxLength={40}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              editable={!isSaving}
            />
            <Text style={styles.counterText}>{charCount}/40</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {initialStake ? (
              <Pressable
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.pressedState,
                ]}
                onPress={handleClear}
                disabled={isSaving}
              >
                <Text style={styles.clearButtonText}>Remove</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressedState,
                !initialStake && { flex: 1 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={QuietTheme.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Save Stake</Text>
              )}
            </Pressable>
          </View>
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
    marginBottom: 6,
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
    fontFamily: Typography.sansRegular,
    fontSize: 14,
    color: QuietTheme.inkLight,
    marginBottom: 18,
    lineHeight: 20,
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
  counterText: {
    fontFamily: Typography.sansRegular,
    fontSize: 12,
    color: QuietTheme.muted,
    textAlign: 'right',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: QuietTheme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 15,
    color: QuietTheme.danger,
  },
  saveButton: {
    flex: 2,
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
  saveButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 15,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  pressedState: {
    opacity: 0.75,
  },
});
