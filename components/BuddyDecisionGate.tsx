import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';

interface BuddyDecisionGateProps {
  buddyName: string;
  food?: string | null;
  onAllow: () => Promise<void>;
  onEndStreak: () => Promise<void>;
}

export function BuddyDecisionGate({
  buddyName,
  food,
  onAllow,
  onEndStreak,
}: BuddyDecisionGateProps) {
  const insets = useSafeAreaInsets();
  const [acting, setActing] = useState<'allow' | 'end' | null>(null);

  async function handleAllow() {
    if (acting) return;
    setActing('allow');
    try {
      await onAllow();
    } finally {
      setActing(null);
    }
  }

  async function handleEndStreak() {
    if (acting) return;
    setActing('end');
    try {
      await onEndStreak();
    } finally {
      setActing(null);
    }
  }

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
      {/* Top Brand Wordmark */}
      <View style={styles.topHeader}>
        <Text style={styles.wordmark}>NoSlip</Text>
      </View>

      {/* Center Decision Card */}
      <View style={styles.cardContainer}>
        <View style={styles.tagWrap}>
          <Text style={styles.tagText}>{food ? 'Slip Confession' : 'Missed Check-in'}</Text>
        </View>

        {food ? (
          <>
            <Text style={styles.confessionHeadline}>
              {buddyName} says they had
            </Text>

            <View style={styles.foodHighlightBox}>
              <Text style={styles.foodText}>"{food}"</Text>
            </View>
          </>
        ) : (
          <Text style={styles.confessionHeadline}>
            {buddyName} missed their check-in.
          </Text>
        )}

        <Text style={[styles.questionText, !food && { marginTop: 8 }]}>
          Let their streak continue?
        </Text>
      </View>

      {/* Two Equal-Weight Action Buttons */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.allowButton,
            pressed && styles.pressedState,
            acting && styles.disabledButton,
          ]}
          onPress={handleAllow}
          disabled={acting !== null}
        >
          {acting === 'allow' ? (
            <ActivityIndicator color={QuietTheme.surface} />
          ) : (
            <Text style={styles.allowButtonText}>Allow</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.endStreakButton,
            pressed && styles.pressedState,
            acting && styles.disabledButton,
          ]}
          onPress={handleEndStreak}
          disabled={acting !== null}
        >
          {acting === 'end' ? (
            <ActivityIndicator color={QuietTheme.surface} />
          ) : (
            <Text style={styles.endStreakButtonText}>End Streak</Text>
          )}
        </Pressable>
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
    paddingVertical: 28,
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
  tagWrap: {
    backgroundColor: 'rgba(107, 91, 115, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  tagText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 12,
    color: QuietTheme.accentBuddy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  confessionHeadline: {
    fontFamily: Typography.display,
    fontSize: 22,
    color: QuietTheme.ink,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
  },
  foodHighlightBox: {
    backgroundColor: QuietTheme.background,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  foodText: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 18,
    color: QuietTheme.ink,
    textAlign: 'center',
  },
  questionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: QuietTheme.inkLight,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  allowButton: {
    width: '100%',
    height: 54,
    backgroundColor: QuietTheme.accentGrowth,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentGrowth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  allowButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 16,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  endStreakButton: {
    width: '100%',
    height: 54,
    backgroundColor: QuietTheme.accentBuddy,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentBuddy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  endStreakButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 16,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressedState: {
    opacity: 0.82,
  },
});
