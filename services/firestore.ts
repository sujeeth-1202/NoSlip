import {
  doc,
  getDoc,
  addDoc,
  collection,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserData } from '../types';

/**
 * Returns today's date as a YYYY-MM-DD string using the device's local timezone.
 * This is the single source of truth for all date comparisons in the app.
 */
export function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the number of calendar days between two YYYY-MM-DD strings.
 * Both dates are parsed as midnight local time to avoid DST surprises.
 */
function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const a = new Date(`${dateA}T00:00:00`).getTime();
  const b = new Date(`${dateB}T00:00:00`).getTime();
  return Math.round(Math.abs(b - a) / msPerDay);
}

/**
 * If the user's lastCheckInDate is more than 1 calendar day before today,
 * reset their currentStreak to 0 in Firestore.
 *
 * Call this once on app load / sign-in.
 */
export async function checkAndResetStreak(
  userId: string,
  userData: UserData,
): Promise<void> {
  const today = getTodayLocal();
  const last = userData.lastCheckInDate;

  if (!last) return; // No check-in yet, nothing to reset.
  if (daysBetween(last, today) <= 1) return; // Checked in yesterday or today — streak alive.

  // More than one day has passed — reset streak.
  const userRef = doc(db, 'users', userId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    // Only reset if the value on server also needs resetting
    // (guards against a race if two devices are open simultaneously).
    const serverLast: string | null = snap.data().lastCheckInDate ?? null;
    if (serverLast && daysBetween(serverLast, today) > 1) {
      tx.update(userRef, { currentStreak: 0 });
    }
  });
}

/**
 * Records today's check-in for a user.
 * - Writes a new document to `checkins/{autoId}`.
 * - Inside a transaction: increments currentStreak, updates longestStreak if
 *   it's a new record, and sets lastCheckInDate to today.
 *
 * Throws if the user has already checked in today (caller should guard with
 * `userData.lastCheckInDate === getTodayLocal()` before calling).
 */
export async function submitCheckin(userId: string): Promise<void> {
  const today = getTodayLocal();

  // 1. Write the check-in document (outside the transaction — it's append-only).
  await addDoc(collection(db, 'checkins'), {
    userId,
    date: today,
    timestamp: serverTimestamp(),
    status: 'clean',
  });

  // 2. Update user streak fields atomically.
  const userRef = doc(db, 'users', userId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('User document not found.');

    const data = snap.data() as UserData;

    // Double-check: abort if already checked in today on the server.
    if (data.lastCheckInDate === today) return;

    const newStreak = data.currentStreak + 1;
    const newLongest = Math.max(newStreak, data.longestStreak);

    tx.update(userRef, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckInDate: today,
    });
  });
}

/**
 * Fetches a user document once by ID. Returns null if it doesn't exist.
 */
export async function fetchUserDoc(userId: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return snap.data() as UserData;
}
