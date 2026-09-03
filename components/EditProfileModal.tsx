import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  email: string;
  onSave: (newName: string) => Promise<void>;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentName,
  email,
  onSave,
}: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setSaving(false);
      setSuccessMessage('');
    }
  }, [isOpen, currentName]);

  async function handleSave() {
    if (saving || !name.trim()) return;
    setSaving(true);
    setSuccessMessage('');
    try {
      await onSave(name.trim());
      setSuccessMessage('Profile updated successfully ✓');
      setTimeout(() => {
        onClose();
      }, 1100);
    } catch (e: any) {
      console.warn('Failed to update profile:', e);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      transparent={false}
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: Math.max(insets.top, 24) + 8,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Pressable
              onPress={onClose}
              hitSlop={14}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressedState]}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Form Card */}
            <View style={styles.card}>
              {/* Display Name Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    setSuccessMessage('');
                  }}
                  placeholder="Your Name"
                  placeholderTextColor={QuietTheme.muted}
                  maxLength={35}
                  editable={!saving}
                />
              </View>

              {/* Email Field (Read-only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyText}>{email || 'No email'}</Text>
                </View>
                <Text style={styles.helperText}>
                  Tied to your login and cannot be changed here.
                </Text>
              </View>

              {/* Success Message Banner */}
              {successMessage ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* Save Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  (!name.trim() || saving) && styles.disabledButton,
                  pressed && styles.pressedState,
                ]}
                onPress={handleSave}
                disabled={!name.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color={QuietTheme.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: QuietTheme.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: Typography.display,
    fontSize: 28,
    color: QuietTheme.ink,
    letterSpacing: -0.6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 241, 228, 0.6)',
  },
  closeIcon: {
    fontFamily: Typography.sansMedium,
    fontSize: 18,
    color: QuietTheme.ink,
  },
  pressedState: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: QuietTheme.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    shadowColor: QuietTheme.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 14,
    color: QuietTheme.ink,
    letterSpacing: -0.1,
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
  readOnlyBox: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(221, 213, 197, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(231, 223, 206, 0.4)',
  },
  readOnlyText: {
    fontFamily: Typography.sansRegular,
    fontSize: 15,
    color: QuietTheme.muted,
  },
  helperText: {
    fontFamily: Typography.sansRegular,
    fontSize: 12,
    color: QuietTheme.muted,
  },
  successBanner: {
    backgroundColor: 'rgba(62, 92, 67, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  successText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 13,
    color: QuietTheme.accentGrowth,
  },
  saveButton: {
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
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 15,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
});
