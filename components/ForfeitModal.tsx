import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';
import { generateRoastMessage } from '@/services/ai';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ForfeitModalProps {
  isOpen: boolean;
  stake?: string | null;
  previousStreak?: number;
  onDismiss: () => void;
}

export function ForfeitModal({
  isOpen,
  stake,
  previousStreak = 1,
  onDismiss,
}: ForfeitModalProps) {
  const insets = useSafeAreaInsets();
  const [roast, setRoast] = useState<string | null>(null);
  const roastOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setRoast(null);
      roastOpacity.value = 0;

      // Non-blocking fetch of AI roast line
      generateRoastMessage(previousStreak, stake || null)
        .then((text) => {
          setRoast(text);
          roastOpacity.value = withTiming(1, { duration: 450 });
        })
        .catch(() => {
          // silently ignored, static text is already visible
        });
    }
  }, [isOpen, stake, previousStreak, roastOpacity]);

  const animatedRoastStyle = useAnimatedStyle(() => ({
    opacity: roastOpacity.value,
  }));

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 24) + 20,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
      >
        <View style={styles.topSpacer} />

        {/* Center Card Content */}
        <View style={styles.contentCard}>
          <Text style={styles.title}>Streak broken</Text>

          {stake ? (
            <View style={styles.stakeBox}>
              <Text style={styles.owedLabel}>Owed to your buddy</Text>
              <Text style={styles.stakeText}>{stake}</Text>
            </View>
          ) : (
            <Text style={styles.noStakeMessage}>
              Every day is a clean start. Your tree will begin growing again with your next check-in.
            </Text>
          )}

          {/* AI Roast Message (faded in non-blocking) */}
          {roast ? (
            <Animated.View style={[styles.roastWrap, animatedRoastStyle]}>
              <Text style={styles.roastText}>"{roast}"</Text>
            </Animated.View>
          ) : null}
        </View>

        {/* Single "Start again" Action Button */}
        <View style={styles.bottomActionWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.startAgainButton,
              pressed && styles.pressedState,
            ]}
            onPress={onDismiss}
          >
            <Text style={styles.startAgainButtonText}>Start again</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // Warm growth-accent stone dark tint (different from SOS stormy blue)
    backgroundColor: 'rgba(34, 46, 36, 0.94)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topSpacer: {
    height: 30,
  },
  contentCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.display,
    fontSize: 32,
    color: '#EAF2EE',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 16,
  },
  stakeBox: {
    width: '100%',
    backgroundColor: 'rgba(246, 241, 228, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(221, 213, 197, 0.2)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  owedLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 12,
    color: '#A8C2B0',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  stakeText: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 20,
    color: QuietTheme.surface,
    textAlign: 'center',
    lineHeight: 26,
  },
  noStakeMessage: {
    fontFamily: Typography.sansRegular,
    fontSize: 15,
    color: '#B6C9BD',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  roastWrap: {
    marginTop: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  roastText: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: '#D2E1D7',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomActionWrap: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  startAgainButton: {
    width: '100%',
    height: 54,
    backgroundColor: QuietTheme.accentGrowth,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentGrowth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  startAgainButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 16,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  pressedState: {
    opacity: 0.85,
  },
});
