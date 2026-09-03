import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const insets = useSafeAreaInsets();

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
          <Text style={styles.headerTitle}>About</Text>
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
          {/* Section 1: About the app */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About the app</Text>
            <Text style={styles.bodyText}>
              NoSlip is a two-person accountability app — built to make cutting sugar something you don't have to do alone. Your tree grows with every clean day; your buddy sees it too.
            </Text>
          </View>

          {/* Section 2: About the creator */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About the creator</Text>
            <Text style={styles.bodyText}>
              Built by Sujeeth, to make quitting sugar a little less lonely. ❤️
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footerWrap}>
            <Text style={styles.footerText}>
              Built with Expo, Firebase, and a bit of Gemini.
            </Text>
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
    paddingBottom: 28,
    gap: 16,
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
  },
  sectionTitle: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 18,
    color: QuietTheme.ink,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  bodyText: {
    fontFamily: Typography.sansRegular,
    fontSize: 15,
    color: QuietTheme.inkLight,
    lineHeight: 23,
  },
  footerWrap: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  footerText: {
    fontFamily: Typography.sansRegular,
    fontSize: 13,
    color: QuietTheme.muted,
    textAlign: 'center',
  },
});
