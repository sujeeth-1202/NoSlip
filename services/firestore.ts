import {
  doc,
  getDoc,
  addDoc,
  collection,
  increment,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { sendExpoPushNotification } from './notifications';
import type { NotificationPrefs, UserData } from '../types';

export interface ForfeitResult {
  isForfeit: boolean;
  brokenStake: string | null;
}

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
 * Fetches a user document once by ID. Returns null if it doesn't exist.
 */
export async function fetchUserDoc(userId: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return snap.data() as UserData;
}

/**
 * Shared Forfeit Execution Function (Step 4 & Step 7):
 * - Atomically resets currentStreak to 0
 * - Increments forfeitsCount by 1
 * - Clears currentStake to null
 * - Clears pendingConfession to null
 * - Checks recipient notificationPrefs before dispatching push notification
 */
export async function forfeitUserStreak(
  userId: string,
  options?: {
    recipientUserId?: string | null;
    customPushToken?: string | null;
    customPushTitle?: string;
    customPushBody?: string;
    targetPage?: number;
  },
): Promise<{ previousStreak: number; previousStake: string | null }> {
  const userRef = doc(db, 'users', userId);
  let previousStreak = 0;
  let previousStake: string | null = null;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;

    const currentData = snap.data() as UserData;
    previousStreak = currentData.currentStreak || 0;
    previousStake = currentData.currentStake ?? null;

    tx.update(userRef, {
      currentStreak: 0,
      forfeitsCount: increment(1),
      currentStake: null,
      pendingConfession: null,
    });
  });

  if (options?.customPushBody) {
    try {
      let allowPush = true;
      let targetToken = options.customPushToken;

      if (options.recipientUserId) {
        const recipient = await fetchUserDoc(options.recipientUserId);
        if (recipient) {
          allowPush = recipient.notificationPrefs?.streakUpdates ?? true;
          if (recipient.pushToken) {
            targetToken = recipient.pushToken;
          }
        }
      }

      if (allowPush && targetToken) {
        await sendExpoPushNotification(
          targetToken,
          options.customPushTitle || 'NoSlip',
          options.customPushBody,
          { targetPage: options.targetPage ?? 0 },
        );
      }
    } catch (err) {
      console.warn('Failed to send forfeit push notification:', err);
    }
  }

  return { previousStreak, previousStake };
}

/**
 * Passive missed-check-in detection:
 * Unifies passive missed-check-in detection with the buddy-decision system.
 * When passive detection fires (streak was >0, now calculates to 0):
 * - Do NOT immediately reset the streak or call forfeit.
 * - Write to pendingConfession with food left null (distinguishes missed check-in from explicit confession).
 * - Leave currentStreak untouched until the buddy decides.
 * - Dispatches push to buddy: "{name} missed their check-in. Decide what happens to their streak."
 */
export async function checkMissedCheckin(
  userId: string,
  userData: UserData,
  buddyPushToken?: string | null,
): Promise<void> {
  const today = getTodayLocal();
  const last = userData.lastCheckInDate;

  if (!last || daysBetween(last, today) <= 1) {
    return;
  }

  if (userData.currentStreak <= 0 || userData.pendingConfession) {
    return;
  }

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const currentData = userSnap.data() as UserData;
  const serverLast: string | null = currentData.lastCheckInDate ?? null;

  if (
    serverLast &&
    daysBetween(serverLast, today) > 1 &&
    currentData.currentStreak > 0 &&
    !currentData.pendingConfession
  ) {
    await submitConfession(
      userId,
      null, // food: null distinguishes missed check-in
      currentData.displayName,
      currentData.buddyId,
      buddyPushToken,
    );
  }
}

/** Legacy alias for backwards compatibility */
export const checkAndResetStreak = checkMissedCheckin;

/**
 * Submits a slip confession or records a missed check-in for a user.
 * Writes { food, confessedAt: serverTimestamp() } to pendingConfession.
 * Notifies the buddy with food-specific or missed-check-in copy.
 */
export async function submitConfession(
  userId: string,
  food: string | null,
  userName?: string,
  buddyId?: string | null,
  buddyPushToken?: string | null,
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const cleanFood = food && food.trim().length > 0 ? food.trim() : null;

  await updateDoc(userRef, {
    pendingConfession: {
      food: cleanFood,
      confessedAt: serverTimestamp(),
    },
  });

  try {
    let targetToken = buddyPushToken;
    let allowPush = true;

    if (buddyId) {
      const buddy = await fetchUserDoc(buddyId);
      if (buddy) {
        allowPush = buddy.notificationPrefs?.streakUpdates ?? true;
        if (buddy.pushToken) {
          targetToken = buddy.pushToken;
        }
      }
    }

    if (allowPush && targetToken) {
      const body = cleanFood
        ? `${userName || 'Your buddy'} says they had "${cleanFood}". Decide what happens to their streak.`
        : `${userName || 'Your buddy'} missed their check-in. Decide what happens to their streak.`;

      await sendExpoPushNotification(
        targetToken,
        'NoSlip',
        body,
        { targetPage: 1 },
      );
    }
  } catch (err) {
    console.warn('Failed to send confession push notification:', err);
  }
}

/**
 * Resolves a buddy's slip confession: ALLOW
 * - Clears pendingConfession on the confessor's doc
 * - Leaves currentStreak untouched
 * - Treats the day as checked in (sets lastCheckInDate to today)
 * - Checks recipient notificationPrefs before push-notifying confessor
 */
export async function resolveConfessionAllow(
  confessorUserId: string,
  buddyDisplayName: string,
  confessorPushToken?: string | null,
): Promise<void> {
  const today = getTodayLocal();
  const userRef = doc(db, 'users', confessorUserId);

  await updateDoc(userRef, {
    pendingConfession: null,
    lastCheckInDate: today,
  });

  try {
    await addDoc(collection(db, 'checkins'), {
      userId: confessorUserId,
      date: today,
      timestamp: serverTimestamp(),
      status: 'allowed_slip',
    });
  } catch (e) {
    console.warn('Failed to append confession checkin:', e);
  }

  try {
    const confessor = await fetchUserDoc(confessorUserId);
    const allowPush = confessor?.notificationPrefs?.streakUpdates ?? true;
    const targetToken = confessor?.pushToken || confessorPushToken;

    if (allowPush && targetToken) {
      await sendExpoPushNotification(
        targetToken,
        'NoSlip',
        `${buddyDisplayName} let it slide — keep going.`,
        { targetPage: 0 },
      );
    }
  } catch (err) {
    console.warn('Failed to send confession allow push:', err);
  }
}

/**
 * Resolves a buddy's slip confession: END STREAK
 * - Calls shared forfeitUserStreak on the confessor
 * - Clears pendingConfession, resets streak to 0, increments forfeitsCount, clears currentStake
 * - Push-notifies confessor "{buddy} ended your streak." (guarded by confessor's notificationPrefs)
 */
export async function resolveConfessionEndStreak(
  confessorUserId: string,
  buddyDisplayName: string,
  confessorPushToken?: string | null,
): Promise<void> {
  await forfeitUserStreak(confessorUserId, {
    recipientUserId: confessorUserId,
    customPushToken: confessorPushToken,
    customPushTitle: 'NoSlip',
    customPushBody: `${buddyDisplayName} ended your streak.`,
    targetPage: 0,
  });
}

/**
 * Updates the user's declared forfeit stake.
 * Passing null or empty string clears the stake.
 */
export async function updateCurrentStake(
  userId: string,
  stake: string | null,
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const cleanStake = stake && stake.trim().length > 0 ? stake.trim().slice(0, 40) : null;
  await updateDoc(userRef, {
    currentStake: cleanStake,
  });
}

/**
 * Updates the user's display name in Firestore.
 */
export async function updateUserProfile(
  userId: string,
  displayName: string,
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    displayName: displayName.trim(),
  });
}

/**
 * Updates the user's notification preferences in Firestore.
 */
export async function updateNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs,
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    notificationPrefs: prefs,
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
 * Updates the user's Expo push notification token in Firestore.
 */
export async function updateUserPushToken(
  userId: string,
  pushToken: string,
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken,
    });
  } catch (error: any) {
    console.error(
      `Failed to write push token to Firestore (users/${userId}):`,
      error?.message || error,
    );
    throw error;
  }
}

/**
 * Checks if a user was already nudged today based on their lastNudgedAt timestamp.
 * Returns true if lastNudgedAt is on today's local calendar date.
 */
export function isNudgedToday(lastNudgedAt: any): boolean {
  if (!lastNudgedAt) return false;

  let dateObj: Date;
  if (typeof lastNudgedAt.toDate === 'function') {
    dateObj = lastNudgedAt.toDate();
  } else if (typeof lastNudgedAt.seconds === 'number') {
    dateObj = new Date(lastNudgedAt.seconds * 1000);
  } else if (lastNudgedAt instanceof Date) {
    dateObj = lastNudgedAt;
  } else {
    dateObj = new Date(lastNudgedAt);
  }

  if (isNaN(dateObj.getTime())) return false;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const nudgeDate = `${year}-${month}-${day}`;

  return nudgeDate === getTodayLocal();
}

/**
 * Sends a nudge to the buddy:
 * 1. Sets `lastNudgedAt: serverTimestamp()` on the buddy's user document.
 * 2. Checks buddy's notificationPrefs.nudges before dispatching push notification.
 */
export async function sendNudge(
  buddyId: string,
  buddyPushToken?: string | null,
): Promise<void> {
  const buddyRef = doc(db, 'users', buddyId);
  await updateDoc(buddyRef, {
    lastNudgedAt: serverTimestamp(),
  });

  try {
    const buddy = await fetchUserDoc(buddyId);
    const allowNudge = buddy?.notificationPrefs?.nudges ?? true;
    const targetToken = buddy?.pushToken || buddyPushToken;

    if (allowNudge && targetToken) {
      await sendExpoPushNotification(
        targetToken,
        'NoSlip',
        "Your tree's thirsty — check in today.",
        { targetPage: 0 },
      );
    }
  } catch (err) {
    console.warn('Failed to send nudge push notification:', err);
  }
}

/**
 * Records an incremental craving survived for the user.
 */
export async function recordCravingSurvived(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    cravingsSurvived: increment(1),
  });
}

/**
 * Records a craving survived and sends a support request push notification to the buddy.
 * Checks buddy's notificationPrefs.support before dispatching push.
 */
export async function sendCravingSupport(
  userId: string,
  senderName: string,
  buddyId?: string | null,
  buddyPushToken?: string | null,
): Promise<void> {
  await recordCravingSurvived(userId);

  try {
    let allowSupport = true;
    let targetToken = buddyPushToken;

    if (buddyId) {
      const buddy = await fetchUserDoc(buddyId);
      if (buddy) {
        allowSupport = buddy.notificationPrefs?.support ?? true;
        if (buddy.pushToken) {
          targetToken = buddy.pushToken;
        }
      }
    }

    if (allowSupport && targetToken) {
      await sendExpoPushNotification(
        targetToken,
        'NoSlip',
        `${senderName} could use a bit of support right now.`,
        { targetPage: 1 },
      );
    }
  } catch (err) {
    console.warn('Failed to send craving support push notification:', err);
  }
}
