import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';
import type { NotificationPrefs } from '@/types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrefs?: NotificationPrefs;
  onSavePrefs: (prefs: NotificationPrefs) => Promise<void>;
}

export function NotificationsModal({
  isOpen,
  onClose,
  initialPrefs,
  onSavePrefs,
}: NotificationsModalProps) {
  const insets = useSafeAreaInsets();
  const [nudges, setNudges] = useState(initialPrefs?.nudges ?? true);
  const [support, setSupport] = useState(initialPrefs?.support ?? true);
  const [streakUpdates, setStreakUpdates] = useState(
    initialPrefs?.streakUpdates ?? true,
  );

  useEffect(() => {
    if (isOpen) {
      setNudges(initialPrefs?.nudges ?? true);
      setSupport(initialPrefs?.support ?? true);
      setStreakUpdates(initialPrefs?.streakUpdates ?? true);
    }
  }, [isOpen, initialPrefs]);

  async function handleToggleNudges(val: boolean) {
    setNudges(val);
    await onSavePrefs({
      nudges: val,
      support,
      streakUpdates,
    });
  }

  async function handleToggleSupport(val: boolean) {
    setSupport(val);
    await onSavePrefs({
      nudges,
      support: val,
      streakUpdates,
    });
  }

  async function handleToggleStreakUpdates(val: boolean) {
    setStreakUpdates(val);
    await onSavePrefs({
      nudges,
      support,
      streakUpdates: val,
    });
  }

  if (!isOpen) return null;

  return (
    <Modal
      transparent={false}
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: Math.max(insets.top, 24) + 8,
            paddingBottom: Math.max(insets.bottom, 24) + 12,
          },
        ]}
      >
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
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
          <View style={styles.card}>
            {/* Toggle 1: Nudges */}
            <View style={styles.toggleRow}>
              <View style={styles.textWrap}>
                <Text style={styles.toggleLabel}>Nudges from buddy</Text>
                <Text style={styles.toggleDesc}>
                  Daily reminders when you haven't checked in yet.
                </Text>
              </View>
              <Switch
                value={nudges}
                onValueChange={handleToggleNudges}
                trackColor={{
                  false: 'rgba(184, 174, 156, 0.4)',
                  true: QuietTheme.accentGrowth,
                }}
                thumbColor={QuietTheme.surface}
              />
            </View>

            <View style={styles.divider} />

            {/* Toggle 2: Support Requests */}
            <View style={styles.toggleRow}>
              <View style={styles.textWrap}>
                <Text style={styles.toggleLabel}>Support requests</Text>
                <Text style={styles.toggleDesc}>
                  Alerts when your buddy triggers Craving SOS and asks for help.
                </Text>
              </View>
              <Switch
                value={support}
                onValueChange={handleToggleSupport}
                trackColor={{
                  false: 'rgba(184, 174, 156, 0.4)',
                  true: QuietTheme.accentGrowth,
                }}
                thumbColor={QuietTheme.surface}
              />
            </View>

            <View style={styles.divider} />

            {/* Toggle 3: Streak Updates */}
            <View style={styles.toggleRow}>
              <View style={styles.textWrap}>
                <Text style={styles.toggleLabel}>Streak updates</Text>
                <Text style={styles.toggleDesc}>
                  Streak forfeits, stakes owed, and slip confession alerts.
                </Text>
              </View>
              <Switch
                value={streakUpdates}
                onValueChange={handleToggleStreakUpdates}
                trackColor={{
                  false: 'rgba(184, 174, 156, 0.4)',
                  true: QuietTheme.accentGrowth,
                }}
                thumbColor={QuietTheme.surface}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: QuietTheme.background,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    shadowColor: QuietTheme.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 16,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 15,
    color: QuietTheme.ink,
  },
  toggleDesc: {
    fontFamily: Typography.sansRegular,
    fontSize: 13,
    color: QuietTheme.inkLight,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(221, 213, 197, 0.5)',
  },
});
