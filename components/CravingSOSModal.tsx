import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuietTheme, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_BASE_SIZE = Math.min(SCREEN_WIDTH * 0.52, 220);

interface CravingSOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => Promise<void>;
  onNeedSupport: () => Promise<void>;
  buddyFirstName: string;
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale';
type Step = 'initial_choice' | 'breathing' | 'sent_confirmation' | 'post_choice';

export function CravingSOSModal({
  isOpen,
  onClose,
  onResolved,
  onNeedSupport,
  buddyFirstName,
}: CravingSOSModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('initial_choice');
  const [cycle, setCycle] = useState(1);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [actionLoading, setActionLoading] = useState<'notify' | 'okay' | 'tough' | null>(null);

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0.7);
  const ringScale = useSharedValue(0.7);

  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timerRef.current.forEach((t) => clearTimeout(t));
    timerRef.current = [];
  }

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      setStep('initial_choice');
      setCycle(1);
      setPhase('inhale');
      setActionLoading(null);
      scale.value = 0.7;
      ringScale.value = 0.7;
      opacity.value = 0.7;
      return;
    }

    setStep('initial_choice');
    setActionLoading(null);

    return () => {
      clearTimers();
    };
  }, [isOpen]);

  function startBreathingSequence() {
    setStep('breathing');
    clearTimers();
    setCycle(1);

    const CYCLE_DURATION = 12000;
    const INHALE_DURATION = 4000;
    const HOLD_DURATION = 4000;
    const EXHALE_DURATION = 4000;

    function runCycle(cycleIndex: number) {
      if (cycleIndex > 3) {
        setStep('post_choice');
        return;
      }

      setCycle(cycleIndex);

      // 1. Inhale (0s -> 4s)
      setPhase('inhale');
      scale.value = withTiming(1.2, {
        duration: INHALE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      ringScale.value = withTiming(1.35, {
        duration: INHALE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      opacity.value = withTiming(1, { duration: INHALE_DURATION });

      // 2. Hold (4s -> 8s)
      const holdTimer = setTimeout(() => {
        setPhase('hold');
        scale.value = withSequence(
          withTiming(1.24, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        );
      }, INHALE_DURATION);
      timerRef.current.push(holdTimer);

      // 3. Exhale (8s -> 12s)
      const exhaleTimer = setTimeout(() => {
        setPhase('exhale');
        scale.value = withTiming(0.7, {
          duration: EXHALE_DURATION,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        ringScale.value = withTiming(0.7, {
          duration: EXHALE_DURATION,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        opacity.value = withTiming(0.65, { duration: EXHALE_DURATION });
      }, INHALE_DURATION + HOLD_DURATION);
      timerRef.current.push(exhaleTimer);

      // Next cycle
      const nextCycleTimer = setTimeout(() => {
        runCycle(cycleIndex + 1);
      }, CYCLE_DURATION);
      timerRef.current.push(nextCycleTimer);
    }

    runCycle(1);
  }

  // Option 1 from Initial Choice: Direct Notify
  async function handleImmediateNotify() {
    if (actionLoading) return;
    setActionLoading('notify');
    try {
      await onNeedSupport();
      setStep('sent_confirmation');
      const closeTimer = setTimeout(() => {
        onClose();
      }, 1400);
      timerRef.current.push(closeTimer);
    } catch (e) {
      console.warn('Failed to notify buddy:', e);
    } finally {
      setActionLoading(null);
    }
  }

  // Post-breathing Choice: "I'm okay now"
  async function handleOkayPress() {
    if (actionLoading) return;
    setActionLoading('okay');
    try {
      await onResolved();
      onClose();
    } catch (e) {
      console.warn('Failed to resolve craving:', e);
    } finally {
      setActionLoading(null);
    }
  }

  // Post-breathing Choice: "Still tough — notify {buddy}"
  async function handleStillToughPress() {
    if (actionLoading) return;
    setActionLoading('tough');
    try {
      await onNeedSupport();
      onClose();
    } catch (e) {
      console.warn('Failed to send support request:', e);
    } finally {
      setActionLoading(null);
    }
  }

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedOuterRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: opacity.value * 0.35,
  }));

  const phaseText =
    phase === 'inhale'
      ? 'Breathe in...'
      : phase === 'hold'
        ? 'Hold...'
        : 'Breathe out...';

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Top Header with Close Button */}
        <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
          <Text style={styles.calmHeaderTitle}>Pause</Text>
          <Pressable
            onPress={onClose}
            hitSlop={16}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressedState]}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {/* STEP 1: INITIAL CHOICE */}
        {step === 'initial_choice' && (
          <View style={styles.choiceContainer}>
            <View style={styles.choiceCard}>
              <Text style={styles.choiceTitle}>What do you need right now?</Text>
              <Text style={styles.choiceSubtitle}>
                Take space to ground yourself, or let your buddy know.
              </Text>

              <View style={styles.choiceButtonsGroup}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryChoiceButton,
                    pressed && styles.pressedState,
                  ]}
                  onPress={startBreathingSequence}
                >
                  <Text style={styles.primaryChoiceButtonText}>
                    Breathing exercise
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryChoiceButton,
                    pressed && styles.pressedState,
                    actionLoading === 'notify' && styles.disabledButton,
                  ]}
                  onPress={handleImmediateNotify}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'notify' ? (
                    <ActivityIndicator color={QuietTheme.surface} />
                  ) : (
                    <Text style={styles.secondaryChoiceButtonText}>
                      Notify {buddyFirstName}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: BREATHING EXERCISE */}
        {step === 'breathing' && (
          <View style={styles.centerContainer}>
            <View style={styles.circleWrap}>
              <Animated.View style={[styles.outerRing, animatedOuterRingStyle]} />
              <Animated.View style={[styles.breathingCircle, animatedCircleStyle]}>
                <View style={styles.innerOrbGlow} />
              </Animated.View>
            </View>

            <Text style={styles.phaseGuidanceText}>{phaseText}</Text>

            <View style={styles.cycleDotsRow}>
              {[1, 2, 3].map((stepNumber) => (
                <View
                  key={stepNumber}
                  style={[
                    styles.cycleDot,
                    stepNumber === cycle
                      ? styles.activeCycleDot
                      : stepNumber < cycle
                        ? styles.completedCycleDot
                        : styles.inactiveCycleDot,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: POST-BREATHING CHOICE ("Feeling better?") */}
        {step === 'post_choice' && (
          <View style={styles.choiceContainer}>
            <View style={styles.choiceCard}>
              <Text style={styles.choiceTitle}>Feeling better?</Text>
              <Text style={styles.choiceSubtitle}>
                You took a moment to breathe. Choose how to move forward.
              </Text>

              <View style={styles.choiceButtonsGroup}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryChoiceButton,
                    pressed && styles.pressedState,
                    actionLoading === 'okay' && styles.disabledButton,
                  ]}
                  onPress={handleOkayPress}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'okay' ? (
                    <ActivityIndicator color={QuietTheme.surface} />
                  ) : (
                    <Text style={styles.primaryChoiceButtonText}>
                      I'm okay now
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryChoiceButton,
                    pressed && styles.pressedState,
                    actionLoading === 'tough' && styles.disabledButton,
                  ]}
                  onPress={handleStillToughPress}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'tough' ? (
                    <ActivityIndicator color={QuietTheme.surface} />
                  ) : (
                    <Text style={styles.secondaryChoiceButtonText}>
                      Still tough — notify {buddyFirstName}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: SENT CONFIRMATION */}
        {step === 'sent_confirmation' && (
          <View style={styles.choiceContainer}>
            <View style={styles.confirmationCard}>
              <View style={styles.checkIconBadge}>
                <Text style={styles.checkIconText}>✓</Text>
              </View>
              <Text style={styles.confirmationTitle}>Sent — hang in there.</Text>
              <Text style={styles.confirmationSubtitle}>
                {buddyFirstName} has been notified.
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 43, 46, 0.94)',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  calmHeaderTitle: {
    fontFamily: Typography.display,
    fontSize: 20,
    color: '#DCE4E3',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontFamily: Typography.sansRegular,
    fontSize: 16,
    color: '#DCE4E3',
  },
  pressedState: {
    opacity: 0.75,
  },

  // Choice Cards (State A & State B)
  choiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  choiceCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: QuietTheme.surface,
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  choiceTitle: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 22,
    color: QuietTheme.ink,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  choiceSubtitle: {
    fontFamily: Typography.sansRegular,
    fontSize: 14,
    color: QuietTheme.inkLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  choiceButtonsGroup: {
    width: '100%',
    gap: 12,
  },
  primaryChoiceButton: {
    width: '100%',
    height: 52,
    backgroundColor: QuietTheme.accentGrowth,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentGrowth,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryChoiceButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 15,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  secondaryChoiceButton: {
    width: '100%',
    height: 52,
    backgroundColor: QuietTheme.accentBuddy,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentBuddy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryChoiceButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 15,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Sent Confirmation Card
  confirmationCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: QuietTheme.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: QuietTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  checkIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(62, 92, 67, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkIconText: {
    fontFamily: Typography.sansBold,
    fontSize: 20,
    color: QuietTheme.accentGrowth,
  },
  confirmationTitle: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 20,
    color: QuietTheme.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmationSubtitle: {
    fontFamily: Typography.sansRegular,
    fontSize: 14,
    color: QuietTheme.inkLight,
    textAlign: 'center',
  },

  // Breathing View
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleWrap: {
    width: CIRCLE_BASE_SIZE * 1.5,
    height: CIRCLE_BASE_SIZE * 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_BASE_SIZE * 1.3,
    height: CIRCLE_BASE_SIZE * 1.3,
    borderRadius: (CIRCLE_BASE_SIZE * 1.3) / 2,
    borderWidth: 2,
    borderColor: '#98B3A8',
  },
  breathingCircle: {
    width: CIRCLE_BASE_SIZE,
    height: CIRCLE_BASE_SIZE,
    borderRadius: CIRCLE_BASE_SIZE / 2,
    backgroundColor: 'rgba(103, 143, 126, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(195, 222, 212, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerOrbGlow: {
    width: CIRCLE_BASE_SIZE * 0.45,
    height: CIRCLE_BASE_SIZE * 0.45,
    borderRadius: (CIRCLE_BASE_SIZE * 0.45) / 2,
    backgroundColor: 'rgba(235, 245, 241, 0.35)',
  },
  phaseGuidanceText: {
    fontFamily: Typography.sansMedium,
    fontSize: 22,
    color: '#DCE4E3',
    letterSpacing: 0.3,
    marginTop: 24,
    textAlign: 'center',
  },
  cycleDotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    alignItems: 'center',
  },
  cycleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeCycleDot: {
    backgroundColor: QuietTheme.surface,
    width: 20,
  },
  completedCycleDot: {
    backgroundColor: '#8BA59B',
  },
  inactiveCycleDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
