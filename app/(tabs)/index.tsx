import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getTodayLocal, submitCheckin } from '@/services/firestore';
import type { UserData } from '@/types';

export default function HomeScreen() {
  const { user, userData, buddyData, logout } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState('');

  const today = getTodayLocal();
  const alreadyCheckedIn = userData?.lastCheckInDate === today;
  const buddyCheckedInToday = buddyData?.lastCheckInDate === today;

  async function handleCheckin() {
    if (!user || alreadyCheckedIn) return;
    setCheckingIn(true);
    setCheckInError('');
    try {
      await submitCheckin(user.uid);
    } catch (e: any) {
      setCheckInError('Check-in failed. Please try again.');
      console.error('Check-in error:', e);
    } finally {
      setCheckingIn(false);
    }
  }

  if (!userData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading your data…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NoSlip 🚫🍩</Text>
        <Pressable onPress={logout} hitSlop={12}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Date */}
      <Text style={styles.dateText}>{formatDate(today)}</Text>

      {/* Streak cards */}
      <View style={styles.cardsRow}>
        <StreakCard
          label="You"
          name={userData.displayName}
          currentStreak={userData.currentStreak}
          longestStreak={userData.longestStreak}
          checkedInToday={alreadyCheckedIn}
          isYou
        />
        <View style={styles.cardDivider} />
        {buddyData ? (
          <StreakCard
            label="Buddy"
            name={buddyData.displayName}
            currentStreak={buddyData.currentStreak}
            longestStreak={buddyData.longestStreak}
            checkedInToday={buddyCheckedInToday}
          />
        ) : (
          <View style={[styles.card, styles.cardFlex]}>
            <Text style={styles.buddyMissingText}>No buddy linked yet.</Text>
          </View>
        )}
      </View>

      {/* Check-in button */}
      <View style={styles.checkinSection}>
        {alreadyCheckedIn ? (
          <View style={styles.checkedInBanner}>
            <Text style={styles.checkedInText}>
              ✅ You're clean today. Keep it up!
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.checkinButton,
                (checkingIn || pressed) && styles.checkinButtonPressed,
              ]}
              onPress={handleCheckin}
              disabled={checkingIn}
            >
              {checkingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkinButtonText}>
                  I stayed clean today ✅
                </Text>
              )}
            </Pressable>
            {checkInError ? (
              <Text style={styles.errorText}>{checkInError}</Text>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StreakCardProps {
  label: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  checkedInToday: boolean;
  isYou?: boolean;
}

function StreakCard({
  label,
  name,
  currentStreak,
  longestStreak,
  checkedInToday,
  isYou = false,
}: StreakCardProps) {
  return (
    <View style={[styles.card, styles.cardFlex]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardName} numberOfLines={1}>
        {name}
      </Text>

      <View style={styles.statRow}>
        <Text style={styles.statEmoji}>🔥</Text>
        <View>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statEmoji}>🏆</Text>
        <View>
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
      </View>

      <View style={styles.todayBadge}>
        <Text style={styles.todayBadgeText}>
          {checkedInToday
            ? isYou
              ? '✅ Done today'
              : '✅ Checked in'
            : isYou
              ? '⏳ Not yet'
              : '⏳ Waiting…'}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD; parse as local midnight to avoid UTC drift.
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F5F8',
  },
  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#687076',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
  },
  signOutText: {
    fontSize: 13,
    color: '#687076',
  },
  dateText: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 20,
  },

  // Cards row
  cardsRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 24,
  },
  cardDivider: {
    width: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFlex: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0a7ea4',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    color: '#687076',
  },
  todayBadge: {
    marginTop: 6,
    backgroundColor: '#F2F5F8',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  todayBadgeText: {
    fontSize: 12,
    color: '#11181C',
    fontWeight: '500',
  },
  buddyMissingText: {
    fontSize: 13,
    color: '#687076',
    textAlign: 'center',
    marginTop: 8,
  },

  // Check-in section
  checkinSection: {
    marginTop: 4,
  },
  checkinButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  checkinButtonPressed: {
    opacity: 0.78,
  },
  checkinButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  checkedInBanner: {
    backgroundColor: '#E6F9F0',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  checkedInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A8A4A',
  },
  errorText: {
    color: '#D93025',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
});
