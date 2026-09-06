export interface ConfessionData {
  food: string | null;
  confessedAt: any;
}

export interface NotificationPrefs {
  nudges: boolean;
  support: boolean;
  streakUpdates: boolean;
}

export interface UserData {
  displayName: string;
  email: string;
  currentStreak: number;
  longestStreak: number;
  /** YYYY-MM-DD string in the device's local timezone, or null before first check-in. */
  lastCheckInDate: string | null;
  buddyId: string;
  /** Expo push notification token captured on login. */
  pushToken?: string | null;
  /** Timestamp of when this user was last nudged by their buddy. */
  lastNudgedAt?: any | null;
  /** Total count of cravings survived through the Craving SOS feature. */
  cravingsSurvived?: number;
  /** What this user forfeits if their streak breaks (null if no stake is set). */
  currentStake?: string | null;
  /** Total count of streak forfeits incurred. */
  forfeitsCount?: number;
  /** Active slip confession awaiting buddy decision, or null. */
  pendingConfession?: ConfessionData | null;
  /** Notification category preferences. */
  notificationPrefs?: NotificationPrefs;
}
