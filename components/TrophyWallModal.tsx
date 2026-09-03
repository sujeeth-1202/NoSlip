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
import type { UserData } from '@/types';

interface TrophyWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData | null;
  buddyData: UserData | null;
}

interface Milestone {
  id: string;
  name: string;
  threshold: number;
  icon: string;
}

const MILESTONES: Milestone[] = [
  { id: '7day', name: '7-Day', threshold: 7, icon: '🌱' },
  { id: '30day', name: '30-Day', threshold: 30, icon: '🌳' },
  { id: '100day', name: '100-Day', threshold: 100, icon: '🏆' },
];

export function TrophyWallModal({
  isOpen,
  onClose,
  userData,
  buddyData,
}: TrophyWallModalProps) {
  const insets = useSafeAreaInsets();

  if (!isOpen || !userData) return null;

  const buddyFirstName =
    buddyData?.displayName?.trim().split(' ')[0] || buddyData?.displayName || 'Buddy';

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
          <Text style={styles.headerTitle}>Trophy Wall</Text>
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
          {/* Section 1: Head-to-Head Stat Comparison Table */}
          <View style={styles.cardContainer}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={styles.metricHeaderLabel}>Metrics</Text>
              <View style={styles.columnsHeaderWrap}>
                <Text style={styles.userColumnHeader}>You</Text>
                <Text style={styles.buddyColumnHeader}>{buddyFirstName}</Text>
              </View>
            </View>

            <View style={styles.tableDivider} />

            {/* Row 1: Current Streak */}
            <StatRow
              label="Streak"
              youValue={userData.currentStreak}
              buddyValue={buddyData?.currentStreak ?? 0}
            />

            {/* Row 2: Best / Longest Streak */}
            <StatRow
              label="Best"
              youValue={userData.longestStreak}
              buddyValue={buddyData?.longestStreak ?? 0}
            />

            {/* Row 3: Survived Cravings */}
            <StatRow
              label="Survived"
              youValue={userData.cravingsSurvived ?? 0}
              buddyValue={buddyData?.cravingsSurvived ?? 0}
            />

            {/* Row 4: Forfeits */}
            <StatRow
              label="Forfeits"
              youValue={userData.forfeitsCount ?? 0}
              buddyValue={buddyData?.forfeitsCount ?? 0}
              isLast
            />
          </View>

          {/* Section 2: Milestone Badges */}
          <View style={styles.milestonesSection}>
            <Text style={styles.sectionHeading}>Milestones</Text>

            {/* Your Milestones */}
            <View style={styles.userMilestoneCard}>
              <Text style={styles.milestoneUserLabel}>Your Badges</Text>
              <View style={styles.badgesRow}>
                {MILESTONES.map((milestone) => {
                  const isUnlocked = userData.longestStreak >= milestone.threshold;
                  return (
                    <MilestoneBadge
                      key={milestone.id}
                      milestone={milestone}
                      isUnlocked={isUnlocked}
                    />
                  );
                })}
              </View>
            </View>

            {/* Buddy's Milestones */}
            {buddyData ? (
              <View style={styles.userMilestoneCard}>
                <Text style={styles.milestoneUserLabel}>
                  {buddyFirstName}'s Badges
                </Text>
                <View style={styles.badgesRow}>
                  {MILESTONES.map((milestone) => {
                    const isUnlocked =
                      (buddyData.longestStreak ?? 0) >= milestone.threshold;
                    return (
                      <MilestoneBadge
                        key={milestone.id}
                        milestone={milestone}
                        isUnlocked={isUnlocked}
                        variant="buddy"
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function StatRow({
  label,
  youValue,
  buddyValue,
  isLast = false,
}: {
  label: string;
  youValue: number;
  buddyValue: number;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.statRow, !isLast && styles.statRowBorder]}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.valuesRow}>
        <Text style={styles.youStatValue}>{youValue}</Text>
        <Text style={styles.buddyStatValue}>{buddyValue}</Text>
      </View>
    </View>
  );
}

function MilestoneBadge({
  milestone,
  isUnlocked,
  variant = 'growth',
}: {
  milestone: Milestone;
  isUnlocked: boolean;
  variant?: 'growth' | 'buddy';
}) {
  const activeColor =
    variant === 'buddy' ? QuietTheme.accentBuddy : QuietTheme.accentGrowth;

  return (
    <View
      style={[
        styles.badgeContainer,
        isUnlocked
          ? [styles.badgeUnlocked, { backgroundColor: activeColor }]
          : styles.badgeLocked,
      ]}
    >
      <Text style={styles.badgeIcon}>{milestone.icon}</Text>
      <Text
        style={[
          styles.badgeName,
          isUnlocked ? styles.badgeTextUnlocked : styles.badgeTextLocked,
        ]}
      >
        {milestone.name}
      </Text>
      <Text
        style={[
          styles.badgeStatus,
          isUnlocked ? styles.badgeStatusUnlocked : styles.badgeStatusLocked,
        ]}
      >
        {isUnlocked ? 'Unlocked' : 'Locked'}
      </Text>
    </View>
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
    gap: 20,
  },

  // Stat Comparison Table
  cardContainer: {
    backgroundColor: QuietTheme.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: QuietTheme.border,
    shadowColor: QuietTheme.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  metricHeaderLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 13,
    color: QuietTheme.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  columnsHeaderWrap: {
    flexDirection: 'row',
    width: 140,
    justifyContent: 'space-between',
  },
  userColumnHeader: {
    width: 65,
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: QuietTheme.accentGrowth,
    textAlign: 'center',
  },
  buddyColumnHeader: {
    width: 65,
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: QuietTheme.accentBuddy,
    textAlign: 'center',
  },
  tableDivider: {
    height: 1,
    backgroundColor: QuietTheme.border,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  statRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221, 213, 197, 0.45)',
  },
  statLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 15,
    color: QuietTheme.ink,
  },
  valuesRow: {
    flexDirection: 'row',
    width: 140,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  youStatValue: {
    width: 65,
    fontFamily: Typography.display,
    fontSize: 20,
    color: QuietTheme.ink,
    textAlign: 'center',
  },
  buddyStatValue: {
    width: 65,
    fontFamily: Typography.display,
    fontSize: 20,
    color: QuietTheme.inkLight,
    textAlign: 'center',
  },

  // Milestones Section
  milestonesSection: {
    gap: 12,
  },
  sectionHeading: {
    fontFamily: Typography.displaySemiBold,
    fontSize: 20,
    color: QuietTheme.ink,
    letterSpacing: -0.3,
  },
  userMilestoneCard: {
    backgroundColor: QuietTheme.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: QuietTheme.border,
  },
  milestoneUserLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 14,
    color: QuietTheme.inkLight,
    marginBottom: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  badgeContainer: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeUnlocked: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeLocked: {
    backgroundColor: 'rgba(231, 223, 206, 0.4)',
    borderWidth: 1.2,
    borderColor: QuietTheme.muted,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeName: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    marginBottom: 2,
  },
  badgeTextUnlocked: {
    color: QuietTheme.surface,
  },
  badgeTextLocked: {
    color: QuietTheme.muted,
  },
  badgeStatus: {
    fontFamily: Typography.sansRegular,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeStatusUnlocked: {
    color: 'rgba(246, 241, 228, 0.85)',
  },
  badgeStatusLocked: {
    color: QuietTheme.muted,
  },
});
