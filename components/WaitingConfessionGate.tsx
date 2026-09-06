import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';

interface WaitingConfessionGateProps {
  buddyName: string;
  food?: string | null;
}

export function WaitingConfessionGate({
  buddyName,
  food,
}: WaitingConfessionGateProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 24) + 20,
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.wordmark}>NoSlip</Text>
      </View>

      {/* Center Waiting Card */}
      <View style={styles.cardContainer}>
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="small" color={QuietTheme.accentBuddy} />
        </View>

        <Text style={styles.headline}>
          Waiting for {buddyName} to decide
        </Text>

        {food ? (
          <View style={styles.foodHighlightBox}>
            <Text style={styles.confessedLabel}>You confessed to having</Text>
            <Text style={styles.foodText}>"{food}"</Text>
          </View>
        ) : (
          <View style={styles.foodHighlightBox}>
            <Text style={styles.confessedLabel}>Status</Text>
            <Text style={styles.foodText}>Missed check-in</Text>
          </View>
        )}

        <Text style={styles.explanationText}>
          Your check-ins and tree are paused while your buddy considers whether your streak continues.
        </Text>
      </View>

      {/* Bottom Quiet Note */}
      <View style={styles.bottomNoteWrap}>
        <Text style={styles.bottomNote}>
          This screen will automatically update as soon as your buddy responds.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: QuietTheme.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topHeader: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 22,
    color: QuietTheme.ink,
    letterSpacing: -0.4,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: QuietTheme.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    alignItems: 'center',
    shadowColor: QuietTheme.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  spinnerWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107, 91, 115, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontFamily: Typography.display,
    fontSize: 22,
    color: QuietTheme.ink,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  foodHighlightBox: {
    backgroundColor: QuietTheme.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  confessedLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: QuietTheme.muted,
    marginBottom: 4,
  },
  foodText: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 17,
    color: QuietTheme.ink,
    textAlign: 'center',
  },
  explanationText: {
    fontFamily: Typography.sansRegular,
    fontSize: 14,
    color: QuietTheme.inkLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomNoteWrap: {
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  bottomNote: {
    fontFamily: Typography.sansRegular,
    fontSize: 13,
    color: QuietTheme.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
