export interface UserData {
  displayName: string;
  email: string;
  currentStreak: number;
  longestStreak: number;
  /** YYYY-MM-DD string in the device's local timezone, or null before first check-in. */
  lastCheckInDate: string | null;
  buddyId: string;
}
