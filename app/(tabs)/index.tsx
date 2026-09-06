import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AboutModal } from '@/components/AboutModal';
import { BuddyDecisionGate } from '@/components/BuddyDecisionGate';
import { ConfessionModal } from '@/components/ConfessionModal';
import { CravingSOSModal } from '@/components/CravingSOSModal';
import { DrawerMenu } from '@/components/DrawerMenu';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ForfeitModal } from '@/components/ForfeitModal';
import { NotificationsModal } from '@/components/NotificationsModal';
import { StakeEditorModal } from '@/components/StakeEditorModal';
import { StreakTree } from '@/components/StreakTree';
import { TrophyWallModal } from '@/components/TrophyWallModal';
import { QuietTheme, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { generateHypeMessage } from '@/services/ai';
import {
  checkMissedCheckin,
  getTodayLocal,
  isNudgedToday,
  recordCravingSurvived,
  resolveConfessionAllow,
  resolveConfessionEndStreak,
  sendCravingSupport,
  sendNudge,
  submitCheckin,
  submitConfession,
  updateCurrentStake,
  updateNotificationPrefs,
  updateUserProfile,
} from '@/services/firestore';
import type { NotificationPrefs, UserData } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, userData, buddyData, forfeitEvent, clearForfeitEvent, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isStakeEditorOpen, setIsStakeEditorOpen] = useState(false);
  const [isTrophyWallOpen, setIsTrophyWallOpen] = useState(false);
  const [isConfessionOpen, setIsConfessionOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const [nudging, setNudging] = useState(false);
  const [nudgeOptimistic, setNudgeOptimistic] = useState(false);
  const [hypeMessage, setHypeMessage] = useState<string | null>(null);

  const hypeOpacity = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);

  const today = getTodayLocal();
  const alreadyCheckedIn = userData?.lastCheckInDate === today;
  const buddyCheckedInToday = buddyData?.lastCheckInDate === today;
  const buddyIsNudgedToday =
    nudgeOptimistic || (buddyData ? isNudgedToday(buddyData.lastNudgedAt) : false);

  // Check for missed check-ins on mount
  useEffect(() => {
    if (user && userData) {
      checkMissedCheckin(user.uid, userData, buddyData?.pushToken).catch((err) => {
        console.warn('Missed check-in check on mount failed:', err);
      });
    }
  }, [user?.uid, userData?.lastCheckInDate]);

  // AppState listener for foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user && userData) {
        checkMissedCheckin(user.uid, userData, buddyData?.pushToken).catch((err) => {
          console.warn('Missed check-in check on foreground failed:', err);
        });
      }
    });
    return () => subscription.remove();
  }, [user, userData, buddyData?.pushToken]);

  // Listen for notification taps to deep-link to target page
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const targetPage = response.notification.request.content.data?.targetPage;
      if (typeof targetPage === 'number') {
        goToPage(targetPage);
      } else {
        goToPage(0);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function handleCheckin() {
    if (!user || alreadyCheckedIn || checkingIn) return;
    setCheckingIn(true);
    setCheckInError('');
    try {
      await submitCheckin(user.uid);
      // Non-blocking fetch of AI hype line right after check-in
      const nextStreak = (userData?.currentStreak ?? 0) + 1;
      generateHypeMessage(nextStreak)
        .then((msg) => {
          setHypeMessage(msg);
          hypeOpacity.value = withTiming(1, { duration: 450 });
        })
        .catch(() => {
          // silently ignored, UI shows standard watered state
        });
    } catch (e: any) {
      setCheckInError('Check-in failed. Please try again.');
      console.error('Check-in error:', e);
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleNudge() {
    if (!userData?.buddyId || nudging || buddyIsNudgedToday) return;
    setNudging(true);
    setNudgeOptimistic(true);
    try {
      await sendNudge(userData.buddyId, buddyData?.pushToken);
    } catch (e: any) {
      console.warn('Nudge dispatch failed:', e);
    } finally {
      setNudging(false);
    }
  }

  async function handleSosResolved() {
    if (!user) return;
    try {
      await recordCravingSurvived(user.uid);
    } catch (e: any) {
      console.warn('Failed to record craving survived:', e);
    }
  }

  async function handleSosNeedSupport() {
    if (!user || !userData) return;
    try {
      await sendCravingSupport(user.uid, userData.displayName, userData.buddyId, buddyData?.pushToken);
    } catch (e: any) {
      console.warn('Failed to send craving support:', e);
    }
  }

  async function handleSaveProfile(newName: string) {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, newName);
    } catch (e: any) {
      console.warn('Failed to update profile:', e);
    }
  }

  async function handleSaveNotificationPrefs(prefs: NotificationPrefs) {
    if (!user) return;
    try {
      await updateNotificationPrefs(user.uid, prefs);
    } catch (e: any) {
      console.warn('Failed to update notification prefs:', e);
    }
  }

  async function handleSaveStake(stake: string | null) {
    if (!user) return;
    try {
      await updateCurrentStake(user.uid, stake);
    } catch (e: any) {
      console.warn('Failed to update forfeit stake:', e);
    }
  }

  async function handleConfessionSubmit(food: string) {
    if (!user || !userData) return;
    try {
      await submitConfession(
        user.uid,
        food,
        userData.displayName,
        userData.buddyId,
        buddyData?.pushToken,
      );
    } catch (e: any) {
      console.warn('Failed to submit slip confession:', e);
    }
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex !== currentPage && (pageIndex === 0 || pageIndex === 1)) {
      setCurrentPage(pageIndex);
    }
  }

  function goToPage(pageIndex: number) {
    scrollRef.current?.scrollTo({
      x: pageIndex * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPage(pageIndex);
  }

  const animatedHypeStyle = useAnimatedStyle(() => ({
    opacity: hypeOpacity.value,
  }));

  if (!userData) {
    return (
      <View style={[styles.centeredRoot, { backgroundColor: QuietTheme.background }]}>
        <ActivityIndicator size="large" color={QuietTheme.accentGrowth} />
        <Text style={styles.loadingText}>Tending to your space…</Text>
      </View>
    );
  }

  const buddyFirstName =
    buddyData?.displayName?.trim().split(' ')[0] || buddyData?.displayName || 'Buddy';

// 1. ROOT BLOCKING DECISION GATE:
  // If buddy has an unresolved slip confession, render decision screen in place of normal navigation
  if (buddyData?.pendingConfession) {
    return (
      <BuddyDecisionGate
        buddyName={buddyFirstName}
        food={buddyData.pendingConfession.food}
        onAllow={async () => {
          if (!userData.buddyId) return;
          await resolveConfessionAllow(
            userData.buddyId,
            userData.displayName,
            buddyData.pushToken,
          );
        }}
        onEndStreak={async () => {
          if (!userData.buddyId) return;
          await resolveConfessionEndStreak(
            userData.buddyId,
            userData.displayName,
            buddyData.pushToken,
          );
        }}
      />
    );
  }

  // Calculate tree visual size so it fills the screen comfortably
  const treeSize = Math.min(SCREEN_WIDTH * 0.82, SCREEN_HEIGHT * 0.44, 320);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedState]}
          onPress={() => setIsDrawerOpen(true)}
          hitSlop={12}
          accessibilityLabel="Open navigation menu"
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </Pressable>

        <Text style={styles.wordmark}>NoSlip</Text>

        {/* Balance layout on the right */}
        <View style={styles.iconButtonPlaceholder} />
      </View>

      {/* Swipeable Pager for Tree Views */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pagerScrollView}
      >
        {/* Page 0: User's Tree ("You") */}
        <View style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
          {/* Craving SOS Trigger Pill */}
          <View style={styles.sosTriggerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.sosPillButton,
                pressed && styles.pressedState,
              ]}
              onPress={() => setIsSosOpen(true)}
              hitSlop={8}
              accessibilityLabel="Need a moment? Craving support"
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12"
                  stroke={QuietTheme.accentBuddy}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <Path
                  d="M8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16"
                  stroke={QuietTheme.accentBuddy}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.sosPillText}>Need a moment?</Text>
            </Pressable>
          </View>

          <View style={styles.treeHeroContainer}>
            <StreakTree streak={userData.currentStreak} size={treeSize} variant="growth" />
          </View>

          {/* Lower Third Info */}
          <View style={styles.lowerThirdSection}>
            <View style={styles.dayStatusRow}>
              <Text style={styles.dayNumber}>
                Day {userData.currentStreak}
              </Text>
              <Text style={styles.dayStatusText}>
                {userData.currentStreak > 0 ? ' · unbroken' : ' · start fresh'}
              </Text>
            </View>

            <Text style={styles.bestRecordText}>
              Best: {userData.longestStreak} {userData.longestStreak === 1 ? 'day' : 'days'}
            </Text>

            {/* AI Hype Line (Fades in non-blocking after check-in) */}
            {hypeMessage ? (
              <Animated.View style={[styles.hypeMessageWrap, animatedHypeStyle]}>
                <Text style={styles.hypeMessageText}>"{hypeMessage}"</Text>
              </Animated.View>
            ) : null}

            {/* Stake Display / Setup Line near check-in button */}
            <Pressable
              style={({ pressed }) => [
                styles.stakePressArea,
                pressed && styles.pressedState,
              ]}
              onPress={() => setIsStakeEditorOpen(true)}
              hitSlop={8}
            >
              {userData.currentStake ? (
                <View style={styles.stakeContentRow}>
                  <Text style={styles.stakeLabelText} numberOfLines={1}>
                    Stake: {userData.currentStake}
                  </Text>
                  <Text style={styles.stakeEditIcon}>✎</Text>
                </View>
              ) : (
                <Text style={styles.setStakePromptText}>+ Set a stake</Text>
              )}
            </Pressable>

            {/* Check-in CTA Button or Waiting indicator pill */}
            <View style={styles.ctaContainer}>
              {userData.pendingConfession ? (
                <View style={styles.waitingPill}>
                  <Text style={styles.waitingPillText}>
                    {userData.pendingConfession.food
                      ? `Waiting for ${buddyFirstName} to decide`
                      : `You missed a check-in — waiting for ${buddyFirstName} to decide.`}
                  </Text>
                </View>
              ) : alreadyCheckedIn ? (
                <View style={styles.wateredBanner}>
                  <Text style={styles.wateredBannerText}>No Slip ✓</Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.waterButton,
                    (checkingIn || pressed) && styles.waterButtonPressed,
                  ]}
                  onPress={handleCheckin}
                  disabled={checkingIn}
                >
                  {checkingIn ? (
                    <ActivityIndicator color={QuietTheme.surface} />
                  ) : (
                    <Text style={styles.waterButtonText}>No Slip Today</Text>
                  )}
                </Pressable>
              )}

              {checkInError ? (
                <Text style={styles.errorCaption}>{checkInError}</Text>
              ) : null}
            </View>

            {/* Secondary Link: "I slipped today" (visible if not checked in & no pending confession) */}
            {!alreadyCheckedIn && !userData.pendingConfession ? (
              <Pressable
                style={({ pressed }) => [
                  styles.slipLinkContainer,
                  pressed && styles.pressedState,
                ]}
                onPress={() => setIsConfessionOpen(true)}
                hitSlop={10}
              >
                <Text style={styles.slipLinkText}>I slipped today</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Page 1: Buddy's Tree */}
        <View style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
          {buddyData ? (
            <>
              {/* Invisible spacer to balance layout with page 0 */}
              <View style={styles.sosTriggerRowPlaceholder} />

              <View style={styles.treeHeroContainer}>
                <StreakTree streak={buddyData.currentStreak} size={treeSize} variant="buddy" />
              </View>

              {/* Lower Third Info for Buddy */}
              <View style={styles.lowerThirdSection}>
                <Text style={styles.buddyOwnerName}>{buddyData.displayName}</Text>

                {/* Day status row: switches to growth-accent 'watered today' when checked in */}
                <View style={styles.dayStatusRow}>
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: buddyCheckedInToday
                          ? QuietTheme.accentGrowth
                          : QuietTheme.accentBuddy,
                      },
                    ]}
                  >
                    Day {buddyData.currentStreak}
                  </Text>
                  <Text
                    style={[
                      styles.dayStatusText,
                      buddyCheckedInToday && { color: QuietTheme.accentGrowth },
                    ]}
                  >
                    {buddyCheckedInToday
                      ? ' · no slip ✓'
                      : buddyData.currentStreak > 0
                        ? ' · unbroken'
                        : ' · start fresh'}
                  </Text>
                </View>

                <Text style={styles.bestRecordText}>
                  Best: {buddyData.longestStreak} {buddyData.longestStreak === 1 ? 'day' : 'days'}
                </Text>

                {/* Buddy's Stake (read-only) */}
                <View style={styles.buddyStakeRow}>
                  <Text style={styles.stakeLabelText} numberOfLines={1}>
                    {buddyData.currentStake
                      ? `Stake: ${buddyData.currentStake}`
                      : 'No stake set'}
                  </Text>
                </View>

                {/* Nudge Control Area */}
                <View style={styles.ctaContainer}>
                  {buddyCheckedInToday ? (
                    // State 1: Buddy already checked in today -> No nudge control at all
                    <View style={styles.emptyNudgeSpacer} />
                  ) : buddyIsNudgedToday ? (
                    // State 2: Buddy has not checked in & already nudged today -> Disabled muted text, no button
                    <View style={styles.nudgedTodayContainer}>
                      <Text style={styles.nudgedTodayText}>Nudged today ✓</Text>
                    </View>
                  ) : (
                    // State 3: Buddy has not checked in & not nudged today -> Active Nudge button
                    <Pressable
                      style={({ pressed }) => [
                        styles.nudgeButton,
                        (nudging || pressed) && styles.nudgeButtonPressed,
                      ]}
                      onPress={handleNudge}
                      disabled={nudging}
                    >
                      {nudging ? (
                        <ActivityIndicator color={QuietTheme.surface} />
                      ) : (
                        <Text style={styles.nudgeButtonText}>
                          Nudge {buddyFirstName}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyBuddyContainer}>
              <Text style={styles.emptyBuddyTitle}>No Buddy Linked</Text>
              <Text style={styles.emptyBuddySubtitle}>
                Add your buddy's ID in Firestore to view their growing tree here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pager Dots Navigation */}
      <View style={styles.pagerDotsContainer}>
        <Pressable
          onPress={() => goToPage(0)}
          hitSlop={12}
          style={styles.dotTouchArea}
        >
          <View
            style={[
              styles.pagerDot,
              currentPage === 0
                ? [styles.activeDot, { backgroundColor: QuietTheme.accentGrowth }]
                : styles.inactiveDot,
            ]}
          />
        </Pressable>

        <Pressable
          onPress={() => goToPage(1)}
          hitSlop={12}
          style={styles.dotTouchArea}
        >
          <View
            style={[
              styles.pagerDot,
              currentPage === 1
                ? [styles.activeDot, { backgroundColor: QuietTheme.accentBuddy }]
                : styles.inactiveDot,
            ]}
          />
        </Pressable>
      </View>

      {/* Slip Confession Modal ("What did you have?") */}
      <ConfessionModal
        isOpen={isConfessionOpen}
        onClose={() => setIsConfessionOpen(false)}
        onSubmit={handleConfessionSubmit}
      />

      {/* Craving SOS Breathing Overlay */}
      <CravingSOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onResolved={handleSosResolved}
        onNeedSupport={handleSosNeedSupport}
        buddyFirstName={buddyFirstName}
      />

      {/* Stake Editor Modal */}
      <StakeEditorModal
        isOpen={isStakeEditorOpen}
        onClose={() => setIsStakeEditorOpen(false)}
        initialStake={userData.currentStake}
        onSave={handleSaveStake}
      />

      {/* Forfeit Broken Streak Overlay */}
      <ForfeitModal
        isOpen={forfeitEvent?.isForfeit ?? false}
        stake={forfeitEvent?.brokenStake}
        previousStreak={userData.longestStreak || 1}
        onDismiss={clearForfeitEvent}
      />

      {/* Trophy Wall */}
      <TrophyWallModal
        isOpen={isTrophyWallOpen}
        onClose={() => setIsTrophyWallOpen(false)}
        userData={userData}
        buddyData={buddyData}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentName={userData.displayName}
        email={userData.email}
        onSave={handleSaveProfile}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        initialPrefs={userData.notificationPrefs}
        onSavePrefs={handleSaveNotificationPrefs}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Slide-in Left Drawer Navigation */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSignOut={logout}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenTrophyWall={() => setIsTrophyWallOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        displayName={userData.displayName}
        email={userData.email}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: QuietTheme.background,
  },
  centeredRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Typography.sansRegular,
    fontSize: 14,
    color: QuietTheme.inkLight,
  },

  // Top Header Bar
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  hamburgerIcon: {
    fontFamily: Typography.sansMedium,
    fontSize: 22,
    color: QuietTheme.ink,
    lineHeight: 24,
  },
  wordmark: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 20,
    color: QuietTheme.ink,
    letterSpacing: -0.4,
  },
  pressedState: {
    opacity: 0.6,
  },

  // Pager Scroll Area
  pagerScrollView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 12,
  },

  // SOS Trigger Row
  sosTriggerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 40,
    alignItems: 'center',
  },
  sosTriggerRowPlaceholder: {
    width: '100%',
    height: 40,
  },
  sosPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(107, 91, 115, 0.35)',
    backgroundColor: 'rgba(107, 91, 115, 0.08)',
  },
  sosPillText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12.5,
    color: QuietTheme.accentBuddy,
    letterSpacing: 0.15,
  },

  // Tree Hero Art
  treeHeroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: '56%',
  },

  // Lower Third Section
  lowerThirdSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 2,
  },
  buddyOwnerName: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 16,
    color: QuietTheme.accentBuddy,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  dayStatusRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dayNumber: {
    fontFamily: Typography.display,
    fontSize: 26,
    color: QuietTheme.accentGrowth,
    letterSpacing: -0.5,
  },
  dayStatusText: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.inkLight,
  },
  bestRecordText: {
    fontFamily: Typography.sansRegular,
    fontSize: 13,
    color: QuietTheme.muted,
    marginBottom: 6,
  },
  hypeMessageWrap: {
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  hypeMessageText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: QuietTheme.accentGrowth,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Stake Display Line
  stakePressArea: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stakeContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 280,
  },
  stakeLabelText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: QuietTheme.muted,
  },
  stakeEditIcon: {
    fontFamily: Typography.sansRegular,
    fontSize: 13,
    color: QuietTheme.muted,
  },
  setStakePromptText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: QuietTheme.muted,
  },
  buddyStakeRow: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 280,
  },

  // Primary Check-in CTA
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  waterButton: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    backgroundColor: QuietTheme.accentGrowth,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentGrowth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  waterButtonPressed: {
    backgroundColor: QuietTheme.accentGrowthHover,
    opacity: 0.88,
  },
  waterButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 16,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  wateredBanner: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    backgroundColor: QuietTheme.surface,
    borderColor: QuietTheme.border,
    borderWidth: 1.5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wateredBannerText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 15,
    color: QuietTheme.accentGrowth,
  },
  waitingPill: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    backgroundColor: 'rgba(107, 91, 115, 0.1)',
    borderColor: 'rgba(107, 91, 115, 0.25)',
    borderWidth: 1.5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  waitingPillText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 14,
    color: QuietTheme.accentBuddy,
    letterSpacing: 0.1,
  },
  errorCaption: {
    fontFamily: Typography.sansRegular,
    color: QuietTheme.danger,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  // Secondary "I slipped today" link
  slipLinkContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
    alignItems: 'center',
  },
  slipLinkText: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: QuietTheme.muted,
    textDecorationLine: 'underline',
  },

  // Buddy Nudge Buttons & Badges
  nudgeButton: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    backgroundColor: QuietTheme.accentBuddy,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QuietTheme.accentBuddy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  nudgeButtonPressed: {
    backgroundColor: QuietTheme.accentBuddyHover,
    opacity: 0.88,
  },
  nudgeButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: 16,
    color: QuietTheme.surface,
    letterSpacing: 0.2,
  },
  nudgedTodayContainer: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgedTodayText: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.muted,
  },
  emptyNudgeSpacer: {
    height: 20,
  },

  // Empty Buddy State
  emptyBuddyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyBuddyTitle: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 20,
    color: QuietTheme.ink,
    marginBottom: 8,
  },
  emptyBuddySubtitle: {
    fontFamily: Typography.sansRegular,
    fontSize: 14,
    color: QuietTheme.inkLight,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bottom Pager Dots
  pagerDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  dotTouchArea: {
    padding: 6,
  },
  pagerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    width: 18,
    borderRadius: 4,
  },
  inactiveDot: {
    backgroundColor: QuietTheme.muted,
    opacity: 0.5,
  },
});
